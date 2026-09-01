import { Request, Response } from "express";
import { getTenantModels } from "../models";
import path from "path";
import fs from "fs";
import { uploadsDir } from "../middleware/fileUploadMiddleware";

export const createPost = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPost, SocialPostAccount, SocialAccount, AuditLog, SocialPostTag, SocialPublishJob } = getTenantModels(tenant);

    let { title, content, status, scheduled_at, account_ids, tags } = req.body;
    let media_url = req.body.media_url; // fallback if URL is sent instead of file

    // Parse account_ids if sent as JSON string via FormData
    if (typeof account_ids === 'string') {
      try {
        account_ids = JSON.parse(account_ids);
      } catch (e) {
        account_ids = [];
      }
    }

    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = [];
      }
    }

    if (!account_ids || !Array.isArray(account_ids)) {
      return res.status(400).json({ status: "error", message: "account_ids array is required" });
    }

    // Use default values for missing data based on new model requirements
    if (!title) title = 'Untitled';
    if (!content) content = '';
    if (!status) status = 'draft'; // fallback default

    // Append tags as hashtags to the content
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const hashtags = tags.map((tag: string) => `#${tag.replace(/\s+/g, '')}`).join(' ');
      content = content ? `${content}\n\n${hashtags}` : hashtags;
    }

    // Handle file upload
    if (req.file) {
      // In a real application, you'd upload to S3 or similar and get a URL back
      // For this implementation, we store relative path
      media_url = `/uploads/files/${req.file.filename}`;
    }

    // Validate Instagram text-only posts
    if (!media_url && !req.file) {
      const accounts = await SocialAccount.findAll({ where: { id: account_ids, platform: 'instagram' } });
      if (accounts.length > 0) {
        return res.status(400).json({ status: "error", message: "Instagram strictly requires an image or video to publish a post." });
      }
    }

    // 1. Create the Social Post in DB
    const newPost: any = await SocialPost.create({
      title,
      content,
      media_url,
      status,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : null
    });

    if (tags && Array.isArray(tags) && tags.length > 0) {
      const postTags = tags.map((tag: string) => ({
        post_id: newPost.id,
        tag: tag
      }));
      await SocialPostTag.bulkCreate(postTags);
    }

    // 2. Create the Account mappings in social_post_accounts
    const postAccounts = account_ids.map((accountId: number) => ({
      post_id: newPost.id,
      social_account_id: accountId,
      status: req.body.account_status || 'pending'
    }));

    await SocialPostAccount.bulkCreate(postAccounts);

    // 3. Immediate Publishing or Native Scheduling to Facebook
    const fbResponses: any[] = [];
    const isScheduledFb = status === 'scheduled' && scheduled_at;

    let finalMediaUrl = media_url;
    if (finalMediaUrl && finalMediaUrl.startsWith('/')) {
      const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 8080}`;
      finalMediaUrl = `${baseUrl}/api/socialmedia${finalMediaUrl}`;
    }

    if (status === 'published' || isScheduledFb) {
      let allSuccess = true;

      for (const accountId of account_ids) {
        const account: any = await SocialAccount.findByPk(accountId);
        if (!account || !account.is_active || !account.access_token) {
          allSuccess = false;
          continue;
        }

        if (status === 'scheduled') {
          continue; // Skip immediate API call for both FB and IG, the background worker handles it.
        }

        if (account.platform === 'facebook') {
          try {
            let response;

            // Fetch Page Token to avoid (#200) OAuthException
            let pageToken = account.access_token;
            try {
              const url = `https://graph.facebook.com/v19.0/${account.account_id}?fields=access_token&access_token=${account.access_token}`;
              const tRes = await fetch(url);
              const tData: any = await tRes.json();
              if (tData.access_token) pageToken = tData.access_token;
            } catch (e) {
              console.log(`[Controller] Failed to fetch Page Token for ${account.account_id}, using fallback`);
            }

            const fs = require('fs');
            const path = require('path');

            let isLocalFile = false;
            let localFilePath = '';

            if (req.file) {
              isLocalFile = true;
              localFilePath = req.file.path;
            } else if (media_url && media_url.startsWith('/uploads/files/')) {
              isLocalFile = true;
              localFilePath = path.join(__dirname, '../../uploads/files', path.basename(media_url));
            }

            if (isLocalFile && fs.existsSync(localFilePath)) {
              const fileBuffer = fs.readFileSync(localFilePath);

              const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
              const formData = new FormData();
              formData.append('access_token', pageToken);
              formData.append('caption', content);
              formData.append('source', blob, req.file.originalname);
              
              const endpoint = req.file.mimetype.startsWith('video') ? 'videos' : 'photos';
              const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/${endpoint}`;
              
              response = await fetch(fbUrl, { method: 'POST', body: formData });
            } else if (media_url) {
              const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/photos`;
              const fbPayload: any = {
                access_token: pageToken,
                url: finalMediaUrl,
                caption: content,
              };

              response = await fetch(fbUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fbPayload)
              });
            } else {
              const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/feed`;
              const fbPayload: any = {
                access_token: pageToken,
                message: content,
              };
              response = await fetch(fbUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fbPayload)
              });
            }

            const data: any = await response.json();
            console.log(`[FB API Response for Account ${accountId}]:`, JSON.stringify(data, null, 2));
            fbResponses.push({ accountId, platform: 'facebook', response: data });

            if (data.id || data.post_id) {
              await SocialPostAccount.update(
                { status: 'success', platform_post_id: data.post_id || data.id, published_at: new Date() },
                { where: { post_id: newPost.id, social_account_id: accountId } }
              );
            } else {
              allSuccess = false;
              await SocialPostAccount.update(
                { status: 'failed', error_message: data.error?.message || 'Unknown error' },
                { where: { post_id: newPost.id, social_account_id: accountId } }
              );
            }
          } catch (e: any) {
            allSuccess = false;
            console.error(`[FB API Exception for Account ${accountId}]:`, e);
            fbResponses.push({ accountId, platform: 'facebook', error: e.message });
            await SocialPostAccount.update(
              { status: 'failed', error_message: e.message },
              { where: { post_id: newPost.id, social_account_id: accountId } }
            );
          }
        } else if (account.platform === 'instagram') {
          try {
            if (!media_url && !req.file) {
              throw new Error("Instagram strictly requires an image or video");
            }
            if (status === 'scheduled') {
              console.log(`[IG] Post is scheduled. Deferring to cron job for account ${accountId}.`);
              fbResponses.push({ accountId, platform: 'instagram', status: 'deferred_for_scheduling' });
            } else {
              let igMediaUrl = finalMediaUrl;
              if (req.file) {
                igMediaUrl = `${req.protocol}://${req.get('host')}/api/socialmedia/uploads/files/${req.file.filename}`;
              }

              // Check if the URL is local/private. Instagram Graph API cannot download from localhost or .local
              if (igMediaUrl && (igMediaUrl.includes('localhost') || igMediaUrl.includes('.local'))) {
                throw new Error("Instagram API strictly requires a publicly accessible Media URL. It cannot download files from localhost or .local domains. Please use a public URL.");
              }

              const isVideo = req.file ? req.file.mimetype.startsWith('video') : (igMediaUrl ? !!igMediaUrl.match(/\.(mp4|webm|mov)$/i) : false);

              if (!isVideo && igMediaUrl && igMediaUrl.startsWith('http') && !igMediaUrl.includes('localhost') && !igMediaUrl.includes('.local')) {
                // Ensure supported aspect ratio (1:1) using a public image proxy to prevent Instagram API errors
                igMediaUrl = `https://wsrv.nl/?url=${encodeURIComponent(igMediaUrl)}&w=1080&h=1080&fit=contain&bg=white`;
              }

              const mediaParam = isVideo ? `video_url=${encodeURIComponent(igMediaUrl)}&media_type=VIDEO` : `image_url=${encodeURIComponent(igMediaUrl)}`;

              // Step 1: Create Container
              const createContainerUrl = `https://graph.facebook.com/v19.0/${account.account_id}/media?${mediaParam}&caption=${encodeURIComponent(content)}&access_token=${account.access_token}`;
              const containerResponse = await fetch(createContainerUrl, { method: 'POST' });
              const containerData: any = await containerResponse.json();

              if (containerData.error) throw new Error(containerData.error.message);
              const creationId = containerData.id;

              // Step 2: Publish Container
              const publishUrl = `https://graph.facebook.com/v19.0/${account.account_id}/media_publish?creation_id=${creationId}&access_token=${account.access_token}`;
              const publishResponse = await fetch(publishUrl, { method: 'POST' });
              const publishData: any = await publishResponse.json();

              if (publishData.error) throw new Error(publishData.error.message);

              console.log(`[IG API Response for Account ${accountId}]:`, JSON.stringify(publishData, null, 2));
              fbResponses.push({ accountId, platform: 'instagram', response: publishData });

              await SocialPostAccount.update(
                { status: 'success', platform_post_id: publishData.id, published_at: new Date() },
                { where: { post_id: newPost.id, social_account_id: accountId } }
              );
            }
          } catch (e: any) {
            allSuccess = false;
            console.error(`[IG API Exception for Account ${accountId}]:`, e);
            fbResponses.push({ accountId, platform: 'instagram', error: e.message });
            await SocialPostAccount.update(
              { status: 'failed', error_message: e.message },
              { where: { post_id: newPost.id, social_account_id: accountId } }
            );
          }
        } else {
          // Other platforms not implemented in this phase
          allSuccess = false;
        }
      }

      newPost.status = allSuccess ? (isScheduledFb ? 'scheduled' : 'published') : 'failed';
      await newPost.save();

      // Create a background job for our worker queue
      if (newPost.status === 'scheduled') {
        await SocialPublishJob.create({
          post_id: newPost.id,
          run_at: newPost.scheduled_at,
          status: 'pending'
        });
      }
    }

    try {
      await AuditLog.create({
        table_name: 'social_posts',
        record_id: newPost.id,
        action: 'CREATE',
        new_data: newPost.toJSON(),
        performed_by: (req as any).user?.id || 1,
        ip_address: req.ip || '',
        user_agent: (req.headers['user-agent'] as string) || ''
      });
    } catch (auditErr) {
      console.error("Failed to create audit log for createPost:", auditErr);
    }

    return res.status(201).json({
      status: "success",
      message: "Post processed successfully",
      data: newPost,
      facebook_responses: fbResponses
    });
  } catch (error: any) {
    console.error("Error creating social post:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPost, SocialPostAccount, SocialAccount } = getTenantModels(tenant);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Fetch posts ordered by created_at DESC with pagination
    const { count, rows: posts } = await SocialPost.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Extract post IDs to fetch related accounts
    const postIds = posts.map((p: any) => p.id);

    // Fetch all post accounts to map them, including the social account to get platform info
    const postAccounts = await SocialPostAccount.findAll({
      include: [
        {
          model: SocialAccount,
          as: 'social_account',
          attributes: ['platform', 'account_name']
        }
      ],
      where: {
        post_id: postIds
      }
    });

    // Attach accounts to their respective posts
    const postsWithAccounts = posts.map((post: any) => {
      const p = post.toJSON();
      p.accounts = postAccounts.filter((pa: any) => pa.post_id === p.id);
      return p;
    });

    return res.status(200).json({
      status: "success",
      data: postsWithAccounts,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error: any) {
    console.error("Error fetching social posts:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPost, SocialPostAccount, SocialAccount, AuditLog, SocialPublishJob } = getTenantModels(tenant);
    const id = Number(req.params.id);
    const accountId = req.query.accountId ? Number(req.query.accountId) : null;

    let postAccounts: any[] = [];
    if (accountId) {
      postAccounts = await SocialPostAccount.findAll({ where: { post_id: id, social_account_id: accountId } });
    } else {
      postAccounts = await SocialPostAccount.findAll({ where: { post_id: id } });
    }

    // Attempt Facebook deletion first
    for (const pAcc of postAccounts) {
      if (pAcc.platform_post_id) {
        const account: any = await SocialAccount.findByPk(pAcc.social_account_id);
        if (account && account.platform === 'facebook') {
          try {
            const fbUrl = `https://graph.facebook.com/v19.0/${pAcc.platform_post_id}?access_token=${account.access_token}`;
            const response = await fetch(fbUrl, { method: 'DELETE' });

            if (!response.ok) {
              // If there's an HTTP error (like 400 Bad Request) without a proper JSON body sometimes
              if (response.status !== 200) {
                const text = await response.text();
                try {
                  const data = JSON.parse(text);
                  if (data.error) return res.status(400).json({ status: "error", message: data.error.message || "delete faild" });
                } catch (e) { }
                return res.status(400).json({ status: "error", message: "delete faild" });
              }
            } else {
              const data: any = await response.json();
              if (data.error) {
                return res.status(400).json({ status: "error", message: data.error.message || "delete faild" });
              }
            }
          } catch (e: any) {
            console.error(`FB Delete Exception:`, e);
            return res.status(400).json({ status: "error", message: "delete faild" });
          }
        }
      }
    }

    // Delete accounts mappings first
    if (accountId) {
      await SocialPostAccount.destroy({ where: { post_id: id, social_account_id: accountId } });
    } else {
      await SocialPostAccount.destroy({ where: { post_id: id } });
    }

    const remainingAccounts = await SocialPostAccount.count({ where: { post_id: id } });

    let oldData = null;
    if (remainingAccounts === 0 || !accountId) {
      // Fetch post to record old_data in audit log
      const postToDelete: any = await SocialPost.findByPk(id);
      oldData = postToDelete ? postToDelete.toJSON() : null;

      // Delete associated publish jobs
      await SocialPublishJob.destroy({ where: { post_id: id } });

      // Delete post
      const deletedCount = await SocialPost.destroy({ where: { id } });
      if (deletedCount === 0) {
        return res.status(404).json({ status: "error", message: "Post not found" });
      }
    }

    try {
      if (oldData) {
        await AuditLog.create({
          table_name: 'social_posts',
          record_id: Number(id),
          action: 'DELETE',
          old_data: oldData,
          performed_by: (req as any).user?.id || 1,
          ip_address: req.ip || '',
          user_agent: (req.headers['user-agent'] as string) || ''
        });
      }
    } catch (auditErr) {
      console.error("Failed to create audit log for deletePost:", auditErr);
    }

    return res.status(200).json({ status: "success", message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting social post:", error);
    return res.status(500).json({ status: "error", message: "delete faild" });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPost, SocialPostAccount, SocialAccount, AuditLog, SocialPublishJob } = getTenantModels(tenant);
    const id = Number(req.params.id);

    const post: any = await SocialPost.findByPk(id);
    if (!post) {
      return res.status(404).json({ status: "error", message: "Post not found" });
    }
    const oldData = post.toJSON();

    const { title, content, scheduled_at } = req.body;

    // Update DB Post
    if (title !== undefined) post.title = title;
    if (content) post.content = content;
    if (scheduled_at !== undefined) {
      post.scheduled_at = scheduled_at ? new Date(scheduled_at) : null;
      if (post.status === 'scheduled') {
        await SocialPublishJob.update(
          { run_at: post.scheduled_at },
          { where: { post_id: id, status: 'pending' } }
        );
      }
    }
    await post.save();

    try {
      await AuditLog.create({
        table_name: 'social_posts',
        record_id: Number(id),
        action: 'UPDATE',
        old_data: oldData,
        new_data: post.toJSON(),
        performed_by: (req as any).user?.id || 1,
        ip_address: req.ip || '',
        user_agent: (req.headers['user-agent'] as string) || ''
      });
    } catch (auditErr) {
      console.error("Failed to create audit log for updatePost:", auditErr);
    }

    // Sync to Facebook if it was published
    const fbResponses: any[] = [];
    const postAccounts: any[] = await SocialPostAccount.findAll({ where: { post_id: id } });

    for (const pAcc of postAccounts) {
      const account: any = await SocialAccount.findByPk(pAcc.social_account_id);

      if (account && account.platform === 'facebook' && pAcc.platform_post_id) {
        // Facebook Graph API allows updating the message of a published post
        try {
          const fbUrl = `https://graph.facebook.com/v19.0/${pAcc.platform_post_id}`;

          const params = new URLSearchParams();
          params.append('access_token', account.access_token);
          params.append('message', content);

          const response = await fetch(fbUrl, {
            method: 'POST', // FB Graph API uses POST for updates
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
          });

          const data: any = await response.json();
          console.log(`[FB Update Response for ${pAcc.platform_post_id}]:`, JSON.stringify(data, null, 2));
          fbResponses.push({ platform_post_id: pAcc.platform_post_id, response: data });

          if (!data.success && !data.id && data.error) {
            pAcc.error_message = data.error.message;
            pAcc.status = 'failed';
            await pAcc.save();
          } else {
            if (pAcc.error_message || pAcc.status !== 'success') {
              pAcc.error_message = null;
              pAcc.status = 'success';
              await pAcc.save();
            }
          }
        } catch (e: any) {
          console.error(`[FB Update Exception for ${pAcc.platform_post_id}]:`, e);
          fbResponses.push({ platform_post_id: pAcc.platform_post_id, error: e.message });
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Post updated successfully",
      data: post,
      facebook_responses: fbResponses
    });
  } catch (error: any) {
    console.error("Error updating social post:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const retryPost = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPost, SocialPostAccount, SocialAccount } = getTenantModels(tenant);
    const id = Number(req.params.id);

    const post: any = await SocialPost.findByPk(id);
    if (!post) {
      return res.status(404).json({ status: "error", message: "Post not found" });
    }

    const failedAccounts: any[] = await SocialPostAccount.findAll({
      where: { post_id: id, status: 'failed' }
    });

    if (failedAccounts.length === 0) {
      return res.status(400).json({ status: "error", message: "No failed accounts to retry for this post" });
    }

    const fbResponses: any[] = [];
    let allSuccess = true;

    for (const pAcc of failedAccounts) {
      const account: any = await SocialAccount.findByPk(pAcc.social_account_id);

      if (account && account.platform === 'facebook') {
        try {
          let response;
          if (post.media_url) {
            const filename = post.media_url.split('/').pop();
            const filePath = path.join(uploadsDir, filename);

            if (fs.existsSync(filePath)) {
              const fileBuffer = fs.readFileSync(filePath);
              const ext = path.extname(filename).toLowerCase();
              let mimeType = 'image/jpeg';
              if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.gif') mimeType = 'image/gif';
              else if (ext === '.webp') mimeType = 'image/webp';
              else if (ext === '.mp4') mimeType = 'video/mp4';

              const blob = new Blob([fileBuffer], { type: mimeType });
              const formData = new FormData();
              formData.append('access_token', account.access_token);
              formData.append('caption', post.content);
              formData.append('source', blob, filename);

              const endpoint = mimeType.startsWith('video') ? 'videos' : 'photos';
              const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/${endpoint}`;
              response = await fetch(fbUrl, {
                method: 'POST',
                body: formData
              });
            } else {
              // File missing locally, attempt with public URL (may fail if localhost)
              const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/photos`;
              const fbPayload = {
                access_token: account.access_token,
                url: post.media_url,
                caption: post.content,
              };
              response = await fetch(fbUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fbPayload)
              });
            }
          } else {
            const fbUrl = `https://graph.facebook.com/v19.0/${account.account_id}/feed`;
            const fbPayload = {
              access_token: account.access_token,
              message: post.content,
            };
            response = await fetch(fbUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fbPayload)
            });
          }

          const data: any = await response.json();
          console.log(`[FB Retry Response for Account ${account.account_id}]:`, JSON.stringify(data, null, 2));
          fbResponses.push({ accountId: account.account_id, platform: 'facebook', response: data });

          if (data.id || data.post_id) {
            pAcc.status = 'success';
            pAcc.platform_post_id = data.post_id || data.id;
            pAcc.published_at = new Date();
            pAcc.error_message = null;
            await pAcc.save();
          } else {
            allSuccess = false;
            pAcc.error_message = data.error?.message || 'Unknown error';
            await pAcc.save();
          }
        } catch (e: any) {
          allSuccess = false;
          console.error(`[FB Retry Exception for Account ${account.account_id}]:`, e);
          fbResponses.push({ accountId: account.account_id, platform: 'facebook', error: e.message });
          pAcc.error_message = e.message;
          await pAcc.save();
        }
      } else if (account && account.platform === 'instagram') {
        try {
          if (!post.media_url) {
            throw new Error("Instagram strictly requires an image or video");
          }

          let finalMediaUrl = post.media_url;
          if (!finalMediaUrl.startsWith('http')) {
            const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 8080}`;
            finalMediaUrl = `${baseUrl}/api/socialmedia${finalMediaUrl}`;
          }

          if (finalMediaUrl.includes('localhost') || finalMediaUrl.includes('.local')) {
            throw new Error("Instagram API strictly requires a publicly accessible Media URL. Please use a public URL.");
          }

          const isVideo = finalMediaUrl ? !!finalMediaUrl.match(/\.(mp4|webm|mov)$/i) : false;

          if (!isVideo && finalMediaUrl && finalMediaUrl.startsWith('http') && !finalMediaUrl.includes('localhost') && !finalMediaUrl.includes('.local')) {
            // Ensure supported aspect ratio (1:1) using a public image proxy to prevent Instagram API errors
            finalMediaUrl = `https://wsrv.nl/?url=${encodeURIComponent(finalMediaUrl)}&w=1080&h=1080&fit=contain&bg=white`;
          }

          const mediaParam = isVideo ? `video_url=${encodeURIComponent(finalMediaUrl)}&media_type=VIDEO` : `image_url=${encodeURIComponent(finalMediaUrl)}`;

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

          console.log(`[IG Retry API Response for Account ${account.account_id}]:`, JSON.stringify(publishData, null, 2));
          fbResponses.push({ accountId: account.account_id, platform: 'instagram', response: publishData });

          pAcc.status = 'success';
          pAcc.platform_post_id = publishData.id;
          pAcc.published_at = new Date();
          pAcc.error_message = null;
          await pAcc.save();

        } catch (e: any) {
          allSuccess = false;
          console.error(`[IG Retry Exception for Account ${account.account_id}]:`, e);
          fbResponses.push({ accountId: account.account_id, platform: 'instagram', error: e.message });
          pAcc.error_message = e.message;
          await pAcc.save();
        }
      } else {
        allSuccess = false;
      }
    }

    const remainingFailed = await SocialPostAccount.count({ where: { post_id: id, status: 'failed' } });
    if (remainingFailed === 0) {
      post.status = 'published';
      await post.save();
    }

    return res.status(200).json({
      status: "success",
      message: "Retry process completed",
      data: post,
      facebook_responses: fbResponses
    });
  } catch (error: any) {
    console.error("Error retrying social post:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const getTags = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPostTag } = getTenantModels(tenant);

    const tags = await SocialPostTag.findAll({
      attributes: ['tag'],
      group: ['tag'],
      order: [['tag', 'ASC']]
    });

    return res.status(200).json({
      status: "success",
      data: tags.map((t: any) => t.tag)
    });
  } catch (error: any) {
    console.error("Error fetching social post tags:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const syncHistoricalPosts = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPost, SocialPostAccount, SocialAccount } = getTenantModels(tenant);

    const { accountId } = req.body;
    let whereClause: any = { is_active: true };
    if (accountId) {
      whereClause.id = accountId;
    }

    const accounts = await SocialAccount.findAll({ where: whereClause });

    let totalSynced = 0;

    for (const account of accounts) {
      if (!account.access_token) continue;

      try {
        let url = "";
        let posts: any[] = [];

        if (account.platform === 'facebook') {
          url = `https://graph.facebook.com/v19.0/${account.account_id}/published_posts?fields=id,message,created_time,full_picture&access_token=${account.access_token}`;
          const response = await fetch(url);
          const data: any = await response.json();
          if (data.data) {
            posts = data.data.map((p: any) => ({
              platform_id: p.id,
              content: p.message || '',
              media_url: p.full_picture || null,
              created_at: p.created_time ? new Date(p.created_time) : new Date()
            }));
          }
        } else if (account.platform === 'instagram') {
          url = `https://graph.facebook.com/v19.0/${account.account_id}/media?fields=id,caption,timestamp,media_url,media_type&access_token=${account.access_token}`;
          const response = await fetch(url);
          const data: any = await response.json();
          if (data.data) {
            posts = data.data.map((p: any) => ({
              platform_id: p.id,
              content: p.caption || '',
              media_url: p.media_url || null,
              created_at: p.timestamp ? new Date(p.timestamp) : new Date()
            }));
          }
        }

        for (const post of posts) {
          // Check if this post already exists in our DB mapping
          const existingMapping = await SocialPostAccount.findOne({
            where: {
              social_account_id: account.id,
              platform_post_id: post.platform_id
            }
          });

          if (!existingMapping) {
            // Create the local post
            const newPost: any = await SocialPost.create({
              title: post.content ? post.content.substring(0, 50) + '...' : 'Imported Post',
              content: post.content || 'Imported Post',
              media_url: post.media_url,
              status: 'published',
              created_at: post.created_at
            });

            // Create the mapping
            await SocialPostAccount.create({
              post_id: newPost.id,
              social_account_id: account.id,
              platform_post_id: post.platform_id,
              status: 'success',
              published_at: post.created_at,
              created_at: post.created_at
            });

            totalSynced++;
          }
        }

      } catch (err: any) {
        console.error(`Error syncing historical posts for account ${account.id}:`, err);
      }
    }

    return res.status(200).json({
      status: "success",
      message: `Successfully synced ${totalSynced} historical posts`,
      data: { synced_count: totalSynced }
    });

  } catch (error: any) {
    console.error("Error syncing historical posts:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
