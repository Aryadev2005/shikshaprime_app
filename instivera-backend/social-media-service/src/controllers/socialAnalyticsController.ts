import { Request, Response } from "express";
import { getTenantModels } from "../models";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPostAnalytics, SocialPostAccount, SocialPost, SocialAccount } = getTenantModels(tenant);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const totalLikes = await SocialPostAnalytics.sum('likes') || 0;
    const totalComments = await SocialPostAnalytics.sum('comments') || 0;
    const totalShares = await SocialPostAnalytics.sum('shares') || 0;
    const totalImpressions = await SocialPostAnalytics.sum('impressions') || 0;

    // Fetch all analytics with joined data to provide post title and platform name
    const { count, rows: analyticsData } = await SocialPostAnalytics.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: SocialPostAccount,
          as: 'social_post_account',
          include: [
            {
              model: SocialPost,
              as: 'post',
              attributes: ['id', 'title', 'content', 'media_url', 'created_at']
            },
            {
              model: SocialAccount,
              as: 'social_account',
              attributes: ['id', 'platform', 'account_name']
            }
          ]
        }
      ],
      order: [['fetched_at', 'DESC']]
    });

    return res.status(200).json({
      status: "success",
      data: analyticsData,
      totals: {
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        impressions: totalImpressions
      },
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error: any) {
    console.error("Error fetching social analytics:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

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

// Helper: Get Page Access Token from a User Access Token (cached per sync run)
const pageTokenCache: Record<string, string> = {};
const getPageToken = async (pageId: string, userToken: string): Promise<string> => {
  if (pageTokenCache[pageId]) return pageTokenCache[pageId];
  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${userToken}`;
    const data = await fetchWithTimeout(url);
    if (data.access_token) {
      pageTokenCache[pageId] = data.access_token;
      return data.access_token;
    }
  } catch (e: any) {
    console.error(`[Analytics] Failed to get page token for ${pageId}:`, e.message);
  }
  return userToken; // fallback to user token
};

export const syncAnalytics = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { SocialPostAccount, SocialAccount, SocialPostAnalytics } = getTenantModels(tenant);

    const publishedAccounts: any[] = await SocialPostAccount.findAll({
      where: { status: 'success' },
      include: [{
        model: SocialAccount,
        as: 'social_account',
        where: { is_active: true }
      }]
    });

    let syncCount = 0;

    // Process all posts in parallel to avoid 504 timeout
    await Promise.allSettled(
      publishedAccounts.map(async (pAcc) => {
        if (!pAcc.platform_post_id) return;

        const account = pAcc.social_account;
        if (!account || !account.access_token) return;

        try {
          let likes = 0;
          let comments = 0;
          let shares = 0;
          let impressions = 0;

          if (account.platform === 'facebook') {
            // Extract page ID from post ID (format: pageId_postId)
            const pageId = pAcc.platform_post_id.split('_')[0];
            const pageToken = await getPageToken(pageId, account.access_token);

            const url = `https://graph.facebook.com/v19.0/${pAcc.platform_post_id}?fields=likes.summary(true),comments.summary(true),shares&access_token=${pageToken}`;
            const data: any = await fetchWithTimeout(url);

            if (data.error) {
              console.error(`FB Analytics Sync Error for post ${pAcc.platform_post_id}:`, data.error.message);
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
              console.error(`IG Analytics Sync Error for post ${pAcc.platform_post_id}:`, data.error.message);
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
          syncCount++;
        } catch (err: any) {
          console.error(`Failed to fetch analytics for ${pAcc.platform_post_id}:`, err.message);
        }
      })
    );

    console.log(`[Analytics Sync] Completed: synced ${syncCount} posts for tenant ${tenant}.`);
    
    return res.status(200).json({
      status: "success",
      message: `Successfully synced analytics for ${syncCount} posts.`,
    });
  } catch (error: any) {
    console.error("Error syncing analytics:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};
