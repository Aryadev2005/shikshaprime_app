import cron from 'node-cron';
import { pool } from '../db';
import { getTenantModels } from '../models';
import { Op } from 'sequelize';
import { config } from '../config';

export const initScheduleWorker = () => {
  console.log("Initializing Social Media Schedule Worker...");

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Find all tenant databases
      const [rows]: any = await pool.query('SHOW DATABASES LIKE "shikshaprime_%"');
      const tenantDbs = rows
        .map((r: any) => Object.values(r)[0] as string)
        .filter((db: string) => db !== 'shikshaprime_main');

      for (const dbName of tenantDbs) {
        const tenant = dbName.replace('shikshaprime_', '');
        const { SocialPost, SocialPostAccount, SocialAccount, AuditLog, SocialPublishJob } = getTenantModels(tenant);

        // Find pending jobs that are due
        const pendingJobs: any[] = await SocialPublishJob.findAll({
          where: {
            status: 'pending',
            run_at: {
              [Op.lte]: new Date()
            }
          }
        });

        for (const job of pendingJobs) {
          job.status = 'processing';
          await job.save();

          console.log(`[Cron] Processing publish job ${job.id} for post ${job.post_id} on tenant ${tenant}`);

          const post: any = await SocialPost.findByPk(job.post_id);
          if (!post) {
            job.status = 'failed';
            job.error_message = 'Post not found';
            await job.save();
            continue;
          }

          let allSuccess = true;
          const postAccounts: any[] = await SocialPostAccount.findAll({ where: { post_id: post.id } });

          for (const pAcc of postAccounts) {
            const account: any = await SocialAccount.findByPk(pAcc.social_account_id);
            if (!account || !account.is_active || !account.access_token) {
              allSuccess = false;
              continue;
            }

            if (account.platform === 'instagram') {
              try {
                console.log(`[Cron] Publishing post ${post.id} to Instagram account ${account.account_name}`);

                // IG requires media
                if (!post.media_url) {
                  throw new Error("Instagram strictly requires an image or video");
                }

                const baseUrl = process.env.APP_URL || `http://localhost:${config.port}`;
                const finalMediaUrl = post.media_url.startsWith('http')
                  ? post.media_url
                  : `${baseUrl}/api/socialmedia${post.media_url}`;

                let publicMediaUrl = finalMediaUrl;
                if (finalMediaUrl.includes('localhost') || finalMediaUrl.includes('.local')) {
                  console.log(`[Cron] Local domain detected. Uploading ${post.media_url} to temporary public host for Instagram...`);
                  
                  const fs = require('fs');
                  const path = require('path');
                  let localFilePath = '';
                  
                  if (post.media_url.startsWith('/uploads/files/')) {
                      localFilePath = path.join(__dirname, '../../uploads/files', path.basename(post.media_url));
                  } else {
                     throw new Error("Cannot expose local URL to Instagram unless it is an uploaded file in /uploads/files/");
                  }

                  if (fs.existsSync(localFilePath)) {
                    const fileBuffer = fs.readFileSync(localFilePath);
                    let mimeType = 'image/jpeg';
                    if (localFilePath.match(/\.png$/i)) mimeType = 'image/png';
                    else if (localFilePath.match(/\.gif$/i)) mimeType = 'image/gif';
                    else if (localFilePath.match(/\.(mp4|mov|webm)$/i)) mimeType = 'video/mp4';

                    const blob = new Blob([fileBuffer], { type: mimeType });
                    const formData = new FormData();
                    formData.append('file', blob, path.basename(localFilePath));
                    
                    const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
                      method: 'POST',
                      body: formData
                    });
                    const uploadData: any = await uploadRes.json();
                    if (uploadData.status === 'success' && uploadData.data && uploadData.data.url) {
                       publicMediaUrl = uploadData.data.url.replace('.org/', '.org/dl/');
                       console.log(`[Cron] Temporary public URL generated: ${publicMediaUrl}`);
                    } else {
                       throw new Error("Failed to generate temporary public URL for local file.");
                    }
                  } else {
                    throw new Error(`File not found locally: ${localFilePath}`);
                  }
                }

                const isVideo = post.post_type === 'video';
                const mediaParam = isVideo ? `video_url=${encodeURIComponent(publicMediaUrl)}&media_type=VIDEO` : `image_url=${encodeURIComponent(publicMediaUrl)}`;

                // Step 1: Create Container
                const createContainerUrl = `https://graph.facebook.com/v19.0/${account.account_id}/media?${mediaParam}&caption=${encodeURIComponent(post.content || '')}&access_token=${account.access_token}`;
                const containerResponse = await fetch(createContainerUrl, { method: 'POST' });
                const containerData: any = await containerResponse.json();

                if (containerData.error) throw new Error(containerData.error.message);
                const creationId = containerData.id;

                // Step 2: Publish Container
                const publishUrl = `https://graph.facebook.com/v19.0/${account.account_id}/media_publish?creation_id=${creationId}&access_token=${account.access_token}`;
                const publishResponse = await fetch(publishUrl, { method: 'POST' });
                const publishData: any = await publishResponse.json();

                if (publishData.error) throw new Error(publishData.error.message);

                pAcc.status = 'success';
                pAcc.platform_post_id = publishData.id;
                pAcc.published_at = new Date();
                pAcc.error_message = null;
                await pAcc.save();
              } catch (e: any) {
                console.error(`[Cron] IG Publish Error for Account ${account.account_id}:`, e);
                allSuccess = false;
                pAcc.status = 'failed';
                pAcc.error_message = e.message;
                await pAcc.save();
              }
            } else if (account.platform === 'facebook') {
              try {
                console.log(`[Cron] Publishing post ${post.id} to Facebook account ${account.account_name}`);
                
                // Fetch Page Token to avoid (#200) OAuthException
                let pageToken = account.access_token;
                try {
                  const url = `https://graph.facebook.com/v19.0/${account.account_id}?fields=access_token&access_token=${account.access_token}`;
                  const tRes = await fetch(url);
                  const tData: any = await tRes.json();
                  if (tData.access_token) pageToken = tData.access_token;
                } catch (e) {
                  console.log(`[Cron] Failed to fetch Page Token for ${account.account_id}, using fallback`);
                }

                let response;
                const fs = require('fs');
                const path = require('path');

                let isLocalFile = false;
                let localFilePath = '';

                if (post.media_url && post.media_url.startsWith('/uploads/files/')) {
                  isLocalFile = true;
                  localFilePath = path.join(__dirname, '../../uploads/files', path.basename(post.media_url));
                }

                if (isLocalFile && fs.existsSync(localFilePath)) {
                  const fileBuffer = fs.readFileSync(localFilePath);

                  let mimeType = 'image/jpeg';
                  if (localFilePath.match(/\.png$/i)) mimeType = 'image/png';
                  else if (localFilePath.match(/\.gif$/i)) mimeType = 'image/gif';
                  else if (localFilePath.match(/\.(mp4|mov|webm)$/i)) mimeType = 'video/mp4';

                  const blob = new Blob([fileBuffer], { type: mimeType });
                  const formData = new FormData();
                  formData.append('access_token', pageToken);
                  formData.append('caption', post.content || '');
                  formData.append('source', blob, path.basename(localFilePath));

                  const endpoint = mimeType.startsWith('video') ? 'videos' : 'photos';
                  const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/${endpoint}`;
                  response = await fetch(fbUrl, { method: 'POST', body: formData });
                } else if (post.media_url) {
                  const baseUrl = process.env.APP_URL || `http://localhost:${config.port}`;
                  const finalMediaUrl = post.media_url.startsWith('http')
                    ? post.media_url
                    : `${baseUrl}/api/socialmedia${post.media_url}`;

                  const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/photos`;
                  const fbPayload: any = {
                    access_token: pageToken,
                    url: finalMediaUrl,
                    caption: post.content || '',
                  };
                  response = await fetch(fbUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fbPayload) });
                } else {
                  const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/feed`;
                  const fbPayload: any = {
                    access_token: pageToken,
                    message: post.content || '',
                  };
                  response = await fetch(fbUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fbPayload) });
                }

                const data: any = await response.json();
                if (data.error) throw new Error(data.error.message);

                pAcc.status = 'success';
                pAcc.platform_post_id = data.id || data.post_id;
                pAcc.published_at = new Date();
                pAcc.error_message = null;
                await pAcc.save();
              } catch (e: any) {
                console.error(`[Cron] FB Publish Error for Account ${account.account_id}:`, e);
                allSuccess = false;
                pAcc.status = 'failed';
                pAcc.error_message = e.message;
                await pAcc.save();
              }
            }
          }

          const oldData = post.toJSON();
          post.status = allSuccess ? 'published' : 'failed';
          await post.save();

          if (allSuccess) {
            job.status = 'completed';
            job.error_message = null;
          } else {
            job.attempts = (job.attempts || 0) + 1;
            if (job.attempts >= 3) {
              job.status = 'failed';
              job.error_message = 'Max retries reached. Some platforms failed.';
            } else {
              job.status = 'pending';
              job.run_at = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 mins
            }
          }
          await job.save();

          try {
            await AuditLog.create({
              table_name: 'social_posts',
              record_id: post.id,
              action: 'UPDATE',
              old_data: oldData,
              new_data: post.toJSON(),
              performed_by: 1, // System worker
              ip_address: '127.0.0.1',
              user_agent: 'Node-Cron Scheduled Worker'
            });
          } catch (auditErr) {
            console.error("[Cron] Failed to create audit log:", auditErr);
          }
        }
      }
    } catch (error) {
      console.error("[Cron] Error executing scheduled post worker:", error);
    }
  });
};
