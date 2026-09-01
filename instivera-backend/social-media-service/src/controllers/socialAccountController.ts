import { Request, Response } from "express";
import { getTenantModels } from "../models";

export const createAccount = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) {
      return res.status(400).json({ status: "error", message: "Tenant missing" });
    }

    const { SocialAccount } = getTenantModels(tenant);

    const { platform, account_name, account_id, access_token, refresh_token, expires_at, is_active } = req.body;

    // Validate required fields
    if (!platform || !account_name || !account_id || !access_token) {
      return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    // Prepare data
    const accountData: any = {
      platform,
      account_name,
      account_id,
      access_token,
      is_active: is_active !== undefined ? is_active : true,
    };

    if (refresh_token) {
      accountData.refresh_token = refresh_token;
    }
    if (expires_at) {
      accountData.expires_at = new Date(expires_at);
    }

    if (accountData.platform === 'facebook' && accountData.is_active) {
      try {
        const fbResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accountData.access_token}`);
        const data: any = await fbResponse.json();
        if (data.error) {
          accountData.is_active = false;
        }
      } catch (e) {
        accountData.is_active = false;
      }
    } else if (accountData.platform === 'instagram' && accountData.is_active) {
      try {
        const igResponse = await fetch(`https://graph.facebook.com/v19.0/${accountData.account_id}?fields=id,username&access_token=${accountData.access_token}`);
        const data: any = await igResponse.json();
        if (data.error) {
          accountData.is_active = false;
        }
      } catch (e) {
        accountData.is_active = false;
      }
    }

    const newAccount = await SocialAccount.create(accountData);

    return res.status(201).json({
      status: "success",
      message: "Social account created successfully",
      data: newAccount,
    });
  } catch (error: any) {
    console.error("Error creating social account:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) {
      return res.status(400).json({ status: "error", message: "Tenant missing" });
    }

    const { SocialAccount } = getTenantModels(tenant);
    
    // Fetch all accounts ordered by newest first
    const accounts = await SocialAccount.findAll({
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: "success",
      data: accounts,
    });
  } catch (error: any) {
    console.error("Error fetching social accounts:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { id } = req.params;
    const { SocialAccount } = getTenantModels(tenant);

    const account = await SocialAccount.findByPk(id as string);
    if (!account) return res.status(404).json({ status: "error", message: "Account not found" });

    const { platform, account_name, account_id, access_token, refresh_token, expires_at, is_active } = req.body;

    if (platform) account.platform = platform;
    if (account_name) account.account_name = account_name;
    if (account_id) account.account_id = account_id;
    if (access_token) account.access_token = access_token;
    if (refresh_token !== undefined) account.refresh_token = refresh_token;
    if (expires_at !== undefined) {
      account.expires_at = expires_at ? new Date(expires_at) : null;
    }
    if (is_active !== undefined) account.is_active = is_active;

    if (account.platform === 'facebook' && account.is_active) {
      try {
        const fbResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${account.access_token}`);
        const data: any = await fbResponse.json();
        if (data.error) {
          account.is_active = false;
        }
      } catch (e) {
        account.is_active = false;
      }
    } else if (account.platform === 'instagram' && account.is_active) {
      try {
        const igResponse = await fetch(`https://graph.facebook.com/v19.0/${account.account_id}?fields=id,username&access_token=${account.access_token}`);
        const data: any = await igResponse.json();
        if (data.error) {
          account.is_active = false;
        }
      } catch (e) {
        account.is_active = false;
      }
    }

    await account.save();

    return res.status(200).json({ status: "success", message: "Account updated successfully", data: account });
  } catch (error: any) {
    console.error("Error updating social account:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const verifyAccount = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { id } = req.params;
    const { SocialAccount } = getTenantModels(tenant);

    const account = await SocialAccount.findByPk(id as string);
    if (!account) return res.status(404).json({ status: "error", message: "Account not found" });

    if (account.platform === 'facebook') {
      // Call Facebook Graph API to check the token
      const fbResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${account.access_token}`);
      const data: any = await fbResponse.json();

      if (data.error) {
        account.is_active = false;
        await account.save();
        return res.status(400).json({ 
          status: "error", 
          message: data.error.message || "Invalid Facebook token" 
        });
      }

      // Update active status on success
      account.is_active = true;
      await account.save();

      return res.status(200).json({ 
        status: "success", 
        message: `Successfully connected to Facebook as: ${data.name || 'Unknown'}`,
        data: data 
      });
    } else if (account.platform === 'instagram') {
      const igResponse = await fetch(`https://graph.facebook.com/v19.0/${account.account_id}?fields=id,username,name&access_token=${account.access_token}`);
      const data: any = await igResponse.json();

      if (data.error) {
        account.is_active = false;
        await account.save();
        return res.status(400).json({ 
          status: "error", 
          message: data.error.message || "Invalid Instagram token or ID" 
        });
      }

      account.is_active = true;
      await account.save();

      return res.status(200).json({ 
        status: "success", 
        message: `Successfully connected to Instagram as: ${data.username || data.name || 'Unknown'}`,
        data: data 
      });
    } else {
      return res.status(400).json({ status: "error", message: "Verification is only implemented for Facebook and Instagram right now" });
    }
  } catch (error: any) {
    console.error("Error verifying social account:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const fetchAvailablePages = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ status: "error", message: "access_token is required" });
    }

    const url = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${access_token}`;
    const fbResponse = await fetch(url);
    const data: any = await fbResponse.json();

    const pages: any[] = [];

    if (data.error) {
      console.log("Failed to fetch /me/accounts, trying /me directly for page token fallback:", data.error.message);
      
      const fallbackUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${access_token}`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData: any = await fallbackResponse.json();

      if (fallbackData.error) {
        return res.status(400).json({ status: "error", message: fallbackData.error.message || "Failed to fetch pages. Invalid token or missing permissions." });
      }

      pages.push({
        platform: 'facebook',
        account_id: fallbackData.id,
        account_name: fallbackData.name,
        access_token: fallbackData.access_token || access_token,
        parent_page: null
      });

      if (fallbackData.instagram_business_account) {
        const ig = fallbackData.instagram_business_account;
        pages.push({
          platform: 'instagram',
          account_id: ig.id,
          account_name: ig.username || ig.name || 'Instagram Account',
          access_token: fallbackData.access_token || access_token,
          parent_page: fallbackData.name
        });
      }
    } else {
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((page: any) => {
          pages.push({
            platform: 'facebook',
            account_id: page.id,
            account_name: page.name,
            access_token: page.access_token,
            parent_page: null
          });

          if (page.instagram_business_account) {
            const ig = page.instagram_business_account;
            pages.push({
              platform: 'instagram',
              account_id: ig.id,
              account_name: ig.username || ig.name || 'Instagram Account',
              access_token: page.access_token,
              parent_page: page.name
            });
          }
        });
      }
    }

    return res.status(200).json({
      status: "success",
      data: pages
    });
  } catch (error: any) {
    console.error("Error fetching pages from Graph API:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { id } = req.params;
    const { SocialAccount } = getTenantModels(tenant);

    const account = await SocialAccount.findByPk(id as string);
    if (!account) return res.status(404).json({ status: "error", message: "Account not found" });

    await account.destroy();

    return res.status(200).json({ status: "success", message: "Account deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting social account:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};
