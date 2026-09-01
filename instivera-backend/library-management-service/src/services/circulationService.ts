import { kohaClient } from "../clients/KohaClient";
import { MappedCheckout, kohaMapper } from "../mappers/kohaMapper";
import { ApiError } from "../utils/ApiError";

interface CheckoutListQuery {
  page?: number | string;
  limit?: number | string;
  patron_id?: string;
  [key: string]: unknown;
}

class CirculationService {
  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private normalizeArray(payload: any): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.checkouts)) {
      return payload.checkouts;
    }
    if (Array.isArray(payload?.items)) {
      return payload.items;
    }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    return [];
  }

  async listCheckouts(tenant: string, params: { 
    page?: number | string; limit?: number | string; patron_id?: string 
  } = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    
    const kohaParams: Record<string, unknown> = {
      _page: page,
      _per_page: limit,
    };
    
    if (params.patron_id) {
      kohaParams.patron_id = params.patron_id;
    }

    const raw = await kohaClient.listCheckouts(tenant, kohaParams);
    const items = Array.isArray(raw) ? raw : (raw?.checkouts || raw?.items || raw?.data || []);
    
    return {
      items: items.map((entry: any) => kohaMapper.mapCheckout(entry)),
      pagination: {
        page,
        limit,
        total: raw?.total_count ?? raw?.total ?? items.length,
        total_pages: Math.max(1, Math.ceil((raw?.total_count ?? items.length) / limit)),
      },
    };
  }

  async getPatronCheckouts(tenant: string, patronId: string | number): Promise<MappedCheckout[]> {
    if (!patronId) {
      throw new ApiError(400, "patron_id is required");
    }
    const raw = await kohaClient.getPatronCheckouts(tenant, patronId);
    return this.normalizeArray(raw).map((entry) => kohaMapper.mapCheckout(entry));
  }

  async issueBook(
    tenant: string,
    payload: { patron_id: string | number; item_id: string | number },
  ): Promise<MappedCheckout> {
    if (!payload?.patron_id || !payload?.item_id) {
      throw new ApiError(400, "patron_id and item_id are required");
    }

    const raw = await kohaClient.issueBook(tenant, {
      patron_id: payload.patron_id,
      item_id: payload.item_id,
    });

    return kohaMapper.mapCheckout(raw);
  }

  async returnBook(
    tenant: string,
    checkoutId: string | number,
  ): Promise<{ success: boolean; checkout_id: string | number }> {
    if (!checkoutId) {
      throw new ApiError(400, "checkout id is required");
    }

    await kohaClient.returnBook(tenant, checkoutId);

    return {
      success: true,
      checkout_id: checkoutId,
    };
  }

  async renewCheckout(tenant: string, checkoutId: string | number): Promise<MappedCheckout> {
    if (!checkoutId) {
      throw new ApiError(400, "checkout id is required");
    }

    const raw = await kohaClient.renewCheckout(tenant, checkoutId);
    return kohaMapper.mapCheckout(raw);
  }
}

export const circulationService = new CirculationService();
