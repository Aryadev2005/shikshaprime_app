import cron from 'node-cron';
import { pool } from '../db';
import { getTenantModels } from '../models';

// Helper: fetch with a timeout to prevent hanging
const fetchWithTimeout = async (url: string, timeoutMs = 5000): Promise<any> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

// Helper: Get Page Access Token from a User Access Token (cached)
const workerPageTokenCache: Record<string, string> = {};
const getPageTokenForWorker = async (pageId: string, userToken: string): Promise<string> => {
  if (workerPageTokenCache[pageId]) return workerPageTokenCache[pageId];
  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${userToken}`;
    const data = await fetchWithTimeout(url);
    if (data.access_token) {
      workerPageTokenCache[pageId] = data.access_token;
      return data.access_token;
    }
  } catch (e: any) {
    console.error(`[Cron] Failed to get page token for ${pageId}:`, e.message);
  }
  return userToken;
};

export const initAnalyticsWorker = () => {
  console.log("Initializing Social Media Analytics Worker...");

  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      // Clear token cache each run so tokens stay fresh
      Object.keys(workerPageTokenCache).forEach(k => delete workerPageTokenCache[k]);

      const [rows]: any = await pool.query('SHOW DATABASES LIKE "shikshaprime_%"');
      const tenantDbs = rows
        .map((r: any) => Object.values(r)[0] as string)
        .filter((db: string) => db !== 'shikshaprime_main');
      
      for (const dbName of tenantDbs) {
        const tenant = dbName.replace('shikshaprime_', '');
        const { SocialPostAccount, SocialAccount, SocialPostAnalytics } = getTenantModels(tenant);

        // Get all successfully published post accounts
        const publishedAccounts: any[] = await SocialPostAccount.findAll({
          where: {
            status: 'success'
          },
          include: [{
            model: SocialAccount,
            as: 'social_account',
            where: { is_active: true }
          }]
        });

        for (const pAcc of publishedAccounts) {
          if (!pAcc.platform_post_id) continue;

          const account = pAcc.social_account;
          if (!account || !account.access_token) continue;

          try {
            let likes = 0;
            let comments = 0;
            let shares = 0;
            let impressions = 0;

            if (account.platform === 'facebook') {
              // Convert User Token to Page Token
              const pageId = pAcc.platform_post_id.split('_')[0];
              const pageToken = await getPageTokenForWorker(pageId, account.access_token);

              const url = `https://graph.facebook.com/v19.0/${pAcc.platform_post_id}?fields=likes.summary(true),comments.summary(true),shares&access_token=${pageToken}`;
              const data: any = await fetchWithTimeout(url);

              if (data.error) {
                console.error(`[Cron] FB error for ${pAcc.platform_post_id}:`, data.error.message);
              } else {
                likes = data.likes?.summary?.total_count || 0;
                comments = data.comments?.summary?.total_count || 0;
                shares = data.shares?.count || 0;
              }
              
              // Try to fetch impressions separately (requires read_insights permission)
              try {
                const insightsUrl = `https://graph.facebook.com/v19.0/${pAcc.platform_post_id}/insights?metric=post_impressions&access_token=${pageToken}`;
                const insightsData: any = await fetchWithTimeout(insightsUrl);
                if (!insightsData.error && insightsData.data?.[0]?.values?.[0]?.value) {
                  impressions = insightsData.data[0].values[0].value;
                }
              } catch (_) { /* impressions are optional */ }

            } else if (account.platform === 'instagram') {
              const url = `https://graph.facebook.com/v19.0/${pAcc.platform_post_id}?fields=like_count,comments_count&access_token=${account.access_token}`;
              const data: any = await fetchWithTimeout(url);

              if (data.error) {
                console.error(`[Cron] IG error for ${pAcc.platform_post_id}:`, data.error.message);
              } else {
                likes = data.like_count || 0;
                comments = data.comments_count || 0;
              }
              
              // Try to fetch impressions separately (requires instagram_manage_insights permission)
              try {
                const insightsUrl = `https://graph.facebook.com/v19.0/${pAcc.platform_post_id}/insights?metric=impressions&access_token=${account.access_token}`;
                const insightsData: any = await fetchWithTimeout(insightsUrl);
                if (!insightsData.error && insightsData.data?.[0]?.values?.[0]?.value) {
                  impressions = insightsData.data[0].values[0].value;
                }
              } catch (_) { /* impressions are optional */ }
            }

            // Find or create analytics record
            let analyticsRecord = await SocialPostAnalytics.findOne({
              where: { social_post_account_id: pAcc.id }
            });

            if (analyticsRecord) {
              analyticsRecord.likes = likes;
              analyticsRecord.comments = comments;
              analyticsRecord.shares = shares;
              analyticsRecord.impressions = impressions;
              analyticsRecord.fetched_at = new Date();
              await analyticsRecord.save();
            } else {
              await SocialPostAnalytics.create({
                social_post_account_id: pAcc.id,
                likes,
                comments,
                shares,
                impressions,
                fetched_at: new Date()
              });
            }

            console.log(`[Cron] Analytics synced for tenant ${tenant}, PostAccount ${pAcc.id}`);
          } catch (err: any) {
             console.error(`[Cron] Failed to fetch analytics for PostAccount ${pAcc.id}:`, err.message);
          }
        }
      }
    } catch (error) {
      console.error("[Cron] Error executing analytics worker:", error);
    }
  });
};
