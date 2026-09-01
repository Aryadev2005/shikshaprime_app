import { kohaClient } from "../clients/KohaClient";
import { MappedHold, kohaMapper } from "../mappers/kohaMapper";
import { ApiError } from "../utils/ApiError";

interface HoldsListQuery {
  page?: number | string;
  limit?: number | string;
  patron_id?: string;
  [key: string]: unknown;
}

class HoldsService {
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
    if (Array.isArray(payload?.holds)) {
      return payload.holds;
    }
    if (Array.isArray(payload?.items)) {
      return payload.items;
    }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    return [];
  }

  async listHolds(
    tenant: string,
    query: HoldsListQuery = {},
  ): Promise<{ items: MappedHold[]; pagination: { page: number; limit: number; total: number; total_pages: number } }> {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 20);

    const kohaParams: Record<string, unknown> = {
      _page: page,
      _per_page: limit,
    };

    if (query.patron_id) {
      kohaParams.patron_id = query.patron_id;
    }

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      if (key === "page" || key === "limit" || key === "patron_id") {
        continue;
      }
      kohaParams[key] = value;
    }

    const raw = await kohaClient.listHolds(tenant, kohaParams);
    const items = this.normalizeArray(raw).map((entry) => kohaMapper.mapHold(entry));
    const totalRaw = raw?.total_count ?? raw?.total ?? raw?.count ?? items.length;
    const total = Number.isFinite(Number(totalRaw)) ? Number(totalRaw) : items.length;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getPatronHolds(tenant: string, patronId: string | number): Promise<MappedHold[]> {
    if (!patronId) {
      throw new ApiError(400, "patron_id is required");
    }

    const raw = await kohaClient.getPatronHolds(tenant, patronId);
    return this.normalizeArray(raw).map((entry) => kohaMapper.mapHold(entry));
  }

  async placeHold(
    tenant: string,
    payload: { patron_id: string | number; biblio_id: string | number; pickup_library_id?: string },
  ): Promise<MappedHold> {
    if (!payload?.patron_id || !payload?.biblio_id) {
      throw new ApiError(400, "patron_id and biblio_id are required");
    }

    const raw = await kohaClient.placeHold(tenant, {
      patron_id: payload.patron_id,
      biblio_id: payload.biblio_id,
      pickup_library_id: payload.pickup_library_id,
    });

    return kohaMapper.mapHold(raw);
  }

  async cancelHold(
    tenant: string,
    holdId: string | number,
  ): Promise<{ success: boolean; hold_id: string | number }> {
    if (!holdId) {
      throw new ApiError(400, "hold id is required");
    }

    await kohaClient.cancelHold(tenant, holdId);

    return {
      success: true,
      hold_id: holdId,
    };
  }
}

export const holdsService = new HoldsService();
