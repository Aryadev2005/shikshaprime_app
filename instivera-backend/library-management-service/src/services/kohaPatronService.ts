import { kohaClient } from "../clients/KohaClient";
import { logger } from "../logs/logger";
import { ApiError } from "../utils/ApiError";

// ─── Koha Borrower shape (normalised from Koha REST) ─────────────────────────

export interface KohaBorrower {
  patron_id: string | number;
  firstname: string;
  surname: string;
  email: string;
  cardnumber: string;
  category_id: string;
  library_id: string;
  phone: string;
  address: string;
  city: string;
  date_of_birth: string;
  expiry_date: string;
  userid?: string;
  checkouts?: any[];
}

// ─── Payload for create / update ─────────────────────────────────────────────

export interface KohaBorrowerPayload {
  firstname: string;
  surname: string;
  cardnumber?: string;
  category_id?: string;
  library_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  date_of_birth?: string;
  expiry_date?: string;
  userid?: string;
  password?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class KohaPatronService {
  /** Normalise a raw Koha patron object into a consistent shape */
  private normalise(p: any): KohaBorrower {
    return {
      patron_id:     p.patron_id ?? p.borrowernumber ?? "",
      firstname:     p.firstname  ?? "",
      surname:       p.surname    ?? p.lastname ?? "",
      email:         p.email      ?? "",
      cardnumber:    p.cardnumber ?? "",
      category_id:   p.category_id ?? p.categorycode ?? "",
      library_id:    p.library_id  ?? p.branchcode ?? p.home_library_id ?? "",
      phone:         p.phone ?? p.mobile ?? "",
      address:       p.address ?? p.streetnumber ? `${p.streetnumber ?? ""} ${p.address ?? ""}`.trim() : (p.address ?? ""),
      city:          p.city ?? "",
      date_of_birth: p.date_of_birth ?? p.dateofbirth ?? "",
      expiry_date:   p.expiry_date  ?? p.dateexpiry ?? "",
      userid:        p.userid ?? "",
    };
  }

  /** Extract a paginated array from various Koha response shapes */
  private toArray(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    for (const k of ["patrons", "items", "data", "results"]) {
      if (Array.isArray(raw?.[k])) return raw[k];
    }
    return [];
  }

  // ── List (paginated + optional search) ─────────────────────────────────────

  async listDefaulters(
    tenant: string,
    daysOverdue = 14,
    page = 1,
    limit = 20,
    q = "",
  ): Promise<{ items: KohaBorrower[]; total: number; page: number; limit: number }> {
    // Fetch all checkouts (assuming a reasonable number for now)
    const checkoutsRaw = await kohaClient.listCheckouts(tenant, { _page: 1, _per_page: 5000 });
    const checkoutsArray = this.toArray(checkoutsRaw);

    const overdueThreshold = new Date();
    overdueThreshold.setDate(new Date().getDate() - daysOverdue);

    // Group overdue checkouts by patron_id
    const overdueCheckouts = checkoutsArray.filter((c: any) => {
        if (!c.due_date) return false;
        const due = new Date(c.due_date);
        return due < overdueThreshold;
    });

    const patronIds = Array.from(new Set(overdueCheckouts.map((c: any) => c.patron_id)));

    // Fetch full patron details and checkouts for each defaulter
    const allDefaulters: KohaBorrower[] = [];
    for (const pid of patronIds) {
        if (!pid) continue;
        try {
            const pRaw = await kohaClient.getPatron(tenant, pid);
            const patron = this.normalise(pRaw);
            
            const patronCheckouts = await kohaClient.getPatronCheckouts(tenant, pid);
            patron.checkouts = Array.isArray(patronCheckouts) ? patronCheckouts
              .filter(c => {
                  if (!c.due_date) return false;
                  return new Date(c.due_date) < overdueThreshold;
              })
              .map(c => ({
                checkout_id: c.checkout_id,
                item_id: c.item_id,
                checkout_date: c.checkout_date,
                due_date: c.due_date,
                auto_renew: c.auto_renew,
                title: c.item?.biblio?.title || 'Unknown Title',
                barcode: c.item?.barcode || 'Unknown Barcode'
              })) : [];

            allDefaulters.push(patron);
        } catch (e) {
            // Patron not found or other error, skip
        }
    }

    // Local filter if a query was passed
    let filteredItems = allDefaulters;
    if (q) {
      const lq = q.toLowerCase();
      filteredItems = filteredItems.filter(
        (b) =>
          b.firstname.toLowerCase().includes(lq) ||
          b.surname.toLowerCase().includes(lq) ||
          b.email.toLowerCase().includes(lq) ||
          b.cardnumber.toLowerCase().includes(lq) ||
          String(b.patron_id).includes(lq),
      );
    }

    const total = filteredItems.length;
    const finalItems = filteredItems.slice((page - 1) * limit, page * limit);

    return {
      items: finalItems,
      total,
      page,
      limit,
    };
  }


  async listKohaBorrowers(
    tenant: string,
    page = 1,
    limit = 20,
    q = "",
    activeOnly = false
  ): Promise<{ items: KohaBorrower[]; total: number; page: number; limit: number }> {
    if (activeOnly) {
      const checkoutsRaw = await kohaClient.listCheckouts(tenant, { _page: 1, _per_page: 5000 });
      const checkoutsArray = this.toArray(checkoutsRaw);
      
      const patronIds = Array.from(new Set(checkoutsArray.map((c: any) => c.patron_id)));
      
      const activeBorrowers: KohaBorrower[] = [];
      for (const pid of patronIds) {
          if (!pid) continue;
          try {
              const pRaw = await kohaClient.getPatron(tenant, pid);
              const patron = this.normalise(pRaw);
              
              const patronCheckouts = await kohaClient.getPatronCheckouts(tenant, pid);
              patron.checkouts = Array.isArray(patronCheckouts) ? patronCheckouts.map(c => ({
                checkout_id: c.checkout_id,
                item_id: c.item_id,
                checkout_date: c.checkout_date,
                due_date: c.due_date,
                auto_renew: c.auto_renew,
                title: c.item?.biblio?.title || 'Unknown Title',
                barcode: c.item?.barcode || 'Unknown Barcode'
              })) : [];

              activeBorrowers.push(patron);
          } catch (e) {
              // Patron not found or other error, skip
          }
      }

      let filteredItems = activeBorrowers;
      if (q) {
        const lq = q.toLowerCase();
        filteredItems = filteredItems.filter(
          (b) =>
            b.firstname.toLowerCase().includes(lq) ||
            b.surname.toLowerCase().includes(lq) ||
            b.email.toLowerCase().includes(lq) ||
            b.cardnumber.toLowerCase().includes(lq) ||
            String(b.patron_id).includes(lq),
        );
      }

      const total = filteredItems.length;
      const finalItems = filteredItems.slice((page - 1) * limit, page * limit);

      return {
        items: finalItems,
        total,
        page,
        limit,
      };
    }

    const params: Record<string, unknown> = {
      _page: page,
      _per_page: limit,
    };

    if (q) {
      // Try Koha server-side q filter first
      params.q = q;
    }

    let raw: any;
    try {
      raw = await kohaClient.listPatrons(tenant, params);
    } catch (err) {
      if (q) {
        logger.warn({ tenant, q, err: err instanceof Error ? err.message : String(err) },
          "Koha q-filter failed on listPatrons, fetching all and filtering locally");
        raw = await kohaClient.listPatrons(tenant, { _page: 1, _per_page: 200 });
      } else {
        throw err;
      }
    }

    let items = this.toArray(raw).map((p: any) => this.normalise(p));

    // Local filter if a query was passed (covers the fallback path)
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter(
        (b) =>
          b.firstname.toLowerCase().includes(lq) ||
          b.surname.toLowerCase().includes(lq) ||
          b.email.toLowerCase().includes(lq) ||
          b.cardnumber.toLowerCase().includes(lq) ||
          String(b.patron_id).includes(lq),
      );
    }

    const total = raw?._total_count ?? raw?.total_count ?? raw?.total ?? raw?.count ?? items.length;

    const finalItems = q
      ? items.slice((page - 1) * limit, (page - 1) * limit + limit)
      : items;

    // Fetch checkouts for the items being returned
    await Promise.allSettled(
      finalItems.map(async (patron) => {
        try {
          const checkoutsRaw = await kohaClient.getPatronCheckouts(tenant, patron.patron_id);
          patron.checkouts = Array.isArray(checkoutsRaw) ? checkoutsRaw.map(c => ({
            checkout_id: c.checkout_id,
            item_id: c.item_id,
            checkout_date: c.checkout_date,
            due_date: c.due_date,
            auto_renew: c.auto_renew,
            title: c.item?.biblio?.title || 'Unknown Title',
            barcode: c.item?.barcode || 'Unknown Barcode'
          })) : [];
        } catch (err) {
          logger.warn({ tenant, patron_id: patron.patron_id, err: err instanceof Error ? err.message : String(err) },
            "Failed to fetch checkouts for patron");
          patron.checkouts = [];
        }
      })
    );

    return {
      items: finalItems,
      total: typeof total === "number" ? total : items.length,
      page,
      limit,
    };
  }

  // ── Get single ─────────────────────────────────────────────────────────────

  async getKohaBorrower(tenant: string, patronId: string | number): Promise<KohaBorrower> {
    if (!patronId) throw new ApiError(400, "patron_id is required");
    const raw = await kohaClient.getPatron(tenant, patronId);
    return this.normalise(raw);
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  async createKohaBorrower(tenant: string, payload: KohaBorrowerPayload): Promise<KohaBorrower> {
    if (!payload.firstname) throw new ApiError(400, "firstname is required");
    if (!payload.surname)   throw new ApiError(400, "surname is required");

    // Koha requires category_id and library_id — set sensible defaults if missing
    const body: Record<string, unknown> = {
      firstname:   payload.firstname.trim(),
      surname:     payload.surname.trim(),
      cardnumber:  payload.cardnumber  ?? "",
      category_id: payload.category_id ?? "S",
      library_id:  payload.library_id  ?? "MAIN",
      email:       payload.email        ?? "",
      phone:       payload.phone        ?? "",
      address:     payload.address      ?? "",
      city:        payload.city         ?? "",
    };
    if (payload.date_of_birth) body.date_of_birth = payload.date_of_birth;
    if (payload.expiry_date)   body.expiry_date   = payload.expiry_date;
    if (payload.userid)        body.userid         = payload.userid;
    if (payload.password)      body.password       = payload.password;

    const raw = await kohaClient.createPatron(tenant, body);
    return this.normalise(raw);
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  async updateKohaBorrower(
    tenant: string,
    patronId: string | number,
    payload: Partial<KohaBorrowerPayload>,
  ): Promise<KohaBorrower> {
    if (!patronId) throw new ApiError(400, "patron_id is required");
    const body: Record<string, unknown> = {};
    if (payload.firstname   !== undefined) body.firstname   = payload.firstname;
    if (payload.surname     !== undefined) body.surname     = payload.surname;
    if (payload.cardnumber  !== undefined) body.cardnumber  = payload.cardnumber;
    if (payload.category_id !== undefined) body.category_id = payload.category_id;
    if (payload.library_id  !== undefined) body.library_id  = payload.library_id;
    if (payload.email       !== undefined) body.email       = payload.email;
    if (payload.phone       !== undefined) body.phone       = payload.phone;
    if (payload.address     !== undefined) body.address     = payload.address;
    if (payload.city        !== undefined) body.city        = payload.city;
    if (payload.date_of_birth !== undefined) body.date_of_birth = payload.date_of_birth;
    if (payload.expiry_date   !== undefined) body.expiry_date   = payload.expiry_date;
    if (payload.userid        !== undefined) body.userid         = payload.userid;
    if (payload.password      !== undefined) body.password       = payload.password;

    const raw = await kohaClient.updatePatron(tenant, patronId, body);
    // Some Koha versions return {} on success — fallback to re-fetch
    if (!raw || !raw.patron_id) {
      return this.getKohaBorrower(tenant, patronId);
    }
    return this.normalise(raw);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async deleteKohaBorrower(tenant: string, patronId: string | number): Promise<void> {
    if (!patronId) throw new ApiError(400, "patron_id is required");
    await kohaClient.deletePatron(tenant, patronId);
  }
}

export const kohaPatronService = new KohaPatronService();
