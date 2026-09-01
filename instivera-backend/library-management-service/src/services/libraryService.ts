import { kohaClient } from "../clients/KohaClient";
import { logger } from "../logs/logger";
import { kohaMapper } from "../mappers/kohaMapper";
import { getTenantModels } from "../models";
import { ApiError } from "../utils/ApiError";

interface BookSearchQuery {
  q?: string;
  title?: string;
  author?: string;
  isbn?: string;
  page?: number | string;
  limit?: number | string;
}

class LibraryService {
  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  async getStudentLoans(tenant: string, studentId: number) {
    if (!tenant) throw new ApiError(400, "Tenant is required");
    const patron = await this.resolvePatron(tenant, studentId);
    const kohaPatronId = patron.koha_patron_id;
    const checkoutsRaw = await kohaClient.getPatronCheckouts(tenant, kohaPatronId);
    const rawCheckouts = this.normalizeKohaArray(checkoutsRaw, ["checkouts", "items", "data"]);
    return rawCheckouts.map((entry) => kohaMapper.mapCheckout(entry));
  }

  async getStudentFines(tenant: string, studentId: number) {
    if (!tenant) throw new ApiError(400, "Tenant is required");
    const patron = await this.resolvePatron(tenant, studentId);
    const kohaPatronId = patron.koha_patron_id;
    const accountRaw = await kohaClient.getPatronAccount(tenant, kohaPatronId);
    const rawAccountLines = this.normalizeAccountLines(accountRaw);
    return rawAccountLines.map((entry) => kohaMapper.mapFine(entry));
  }

  private normalizeKohaArray(payload: any, knownKeys: string[] = []): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    for (const key of knownKeys) {
      if (Array.isArray(payload?.[key])) {
        return payload[key];
      }
    }
    return [];
  }

  private normalizeAccountLines(payload: any): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.outstanding_debits?.lines)) {
      return payload.outstanding_debits.lines;
    }
    if (Array.isArray(payload?.lines)) {
      return payload.lines;
    }
    if (Array.isArray(payload?.items)) {
      return payload.items;
    }
    return [];
  }

  private normalizeFineAmount(value: unknown): number {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return parsed;
  }

  private buildKohaQueryFilter(filters: {
    q?: string;
    title?: string;
    author?: string;
    isbn?: string;
  }): string | undefined {
    const andConditions: Record<string, unknown> = {};

    if (filters.title) {
      andConditions.title = { "-like": `%${filters.title}%` };
    }
    if (filters.author) {
      andConditions.author = { "-like": `%${filters.author}%` };
    }
    if (filters.isbn) {
      andConditions.isbn = { "-like": `%${filters.isbn}%` };
    }

    if (filters.q) {
      andConditions["-or"] = [
        { title: { "-like": `%${filters.q}%` } },
        { author: { "-like": `%${filters.q}%` } },
        { isbn: { "-like": `%${filters.q}%` } },
      ];
    }

    if (Object.keys(andConditions).length === 0) {
      return undefined;
    }

    return JSON.stringify(andConditions);
  }

  private filterBooksLocally(
    items: ReturnType<typeof kohaMapper.mapBook>[],
    filters: { q?: string; title?: string; author?: string; isbn?: string },
  ) {
    const normalize = (value: unknown) => String(value || "").toLowerCase();
    const q = normalize(filters.q);
    const title = normalize(filters.title);
    const author = normalize(filters.author);
    const isbn = normalize(filters.isbn);

    if (!q && !title && !author && !isbn) {
      return items;
    }

    return items.filter((book) => {
      const bTitle = normalize(book.title);
      const bAuthor = normalize(book.author);
      const bIsbn = normalize(book.isbn);

      const titlePass = title ? bTitle.includes(title) : true;
      const authorPass = author ? bAuthor.includes(author) : true;
      const isbnPass = isbn ? bIsbn.includes(isbn) : true;
      const qPass = q ? bTitle.includes(q) || bAuthor.includes(q) || bIsbn.includes(q) : true;

      return titlePass && authorPass && isbnPass && qPass;
    });
  }

  async resolvePatron(tenant: string, studentId: number) {
    const { LibraryPatrons } = getTenantModels(tenant);
    const patron = await LibraryPatrons.findOne({
      where: { student_id: studentId, is_active: 1, is_deleted: 0 },
      order: [["id", "DESC"]],
    });
    if (!patron) {
      throw new ApiError(404, `No library patron mapping found for student ${studentId}`);
    }
    return patron;
  }

  async getStudentLibraryStatus(tenant: string, studentId: number) {
    if (!tenant) {
      throw new ApiError(400, "Tenant is required");
    }
    if (!Number.isFinite(studentId) || studentId <= 0) {
      throw new ApiError(400, "Valid student_id is required");
    }

    const patron = await this.resolvePatron(tenant, studentId);
    const kohaPatronId = patron.koha_patron_id;

    const [kohaPatronRaw, checkoutsRaw, accountRaw, holdsRaw] = await Promise.all([
      kohaClient.getPatron(tenant, kohaPatronId).catch(() => ({ firstname: "Unknown", surname: "Patron" })),
      kohaClient.getPatronCheckouts(tenant, kohaPatronId),
      kohaClient.getPatronAccount(tenant, kohaPatronId),
      kohaClient.getPatronHolds(tenant, kohaPatronId).catch(() => []),
    ]);

    const patronName = `${kohaPatronRaw.firstname || ''} ${kohaPatronRaw.surname || ''}`.trim() || 'Unknown Patron';

    const rawCheckouts = this.normalizeKohaArray(checkoutsRaw, ["checkouts", "items", "data"]);
    const rawHolds = this.normalizeKohaArray(holdsRaw, ["holds", "items", "data"]);
    const rawAccountLines = this.normalizeAccountLines(accountRaw);

    const checkouts = rawCheckouts.map((entry) => kohaMapper.mapCheckout(entry));
    const holds = rawHolds.map((entry) => kohaMapper.mapHold(entry));
    const fines = rawAccountLines.map((entry) => kohaMapper.mapFine(entry));

    const pendingBooksCount = checkouts.length;
    const pendingFineAmount = Number(
      fines
        .reduce((sum, fine) => sum + this.normalizeFineAmount(fine.amount_outstanding), 0)
        .toFixed(2),
    );
    const overdueCount = checkouts.filter((loan) => loan.status === "OVERDUE").length;
    const isClear = pendingBooksCount === 0 && pendingFineAmount <= 0;

    const { LibraryClearanceLogs } = getTenantModels(tenant);
    const checkedAt = new Date();

    await LibraryClearanceLogs.create({
      student_id: studentId,
      koha_patron_id: String(kohaPatronId),
      has_pending_books: pendingBooksCount > 0 ? 1 : 0,
      pending_books_count: pendingBooksCount,
      pending_fine_amount: pendingFineAmount,
      is_clear: isClear ? 1 : 0,
      checked_at: checkedAt,
      context: "MANUAL_CHECK",
      checked_by: null,
      remarks: null,
      is_deleted: 0,
    });

    return {
      student_id: studentId,
      koha_patron_id: kohaPatronId,
      patron_name: patronName,
      has_pending_books: pendingBooksCount > 0,
      pending_books_count: pendingBooksCount,
      pending_fine_amount: pendingFineAmount,
      is_clear: isClear,
      overdue_count: overdueCount,
      loans: checkouts,
      fines,
      holds,
      checked_at: checkedAt.toISOString(),
    };
  }

  async searchBooks(tenant: string, query: BookSearchQuery) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 10);

    const q = String(query.q || "").trim();
    const title = String(query.title || "").trim();
    const author = String(query.author || "").trim();
    const isbn = String(query.isbn || "").trim();
    const hasFilters = !!(q || title || author || isbn);
    const kohaQuery = this.buildKohaQueryFilter({ q, title, author, isbn });

    let raw: any;
    let serverFilterApplied = false;

    const kohaParams: Record<string, unknown> = {
      _page: page,
      _per_page: limit,
    };

    if (kohaQuery) {
      kohaParams.q = kohaQuery;
    }

    try {
      raw = await kohaClient.searchCatalog(tenant, kohaParams);
      serverFilterApplied = !!kohaQuery;
    } catch (error) {
      if (!kohaQuery) {
        throw error;
      }

      logger.warn(
        { tenant, error: error instanceof Error ? error.message : "Unknown search error" },
        "Koha q-filter failed, retrying with local filtering fallback",
      );

      raw = await kohaClient.searchCatalog(tenant, {
        _page: 1,
        _per_page: 200,
      });
      serverFilterApplied = false;
    }

    const itemsPayload = this.normalizeKohaArray(raw, ["biblios", "items", "results", "data"]);
    const mapped = itemsPayload.map((entry) => kohaMapper.mapBook(entry));
    const filtered = this.filterBooksLocally(mapped, { q, title, author, isbn });

    const resolvedItems = serverFilterApplied ? mapped : filtered;
    const items = serverFilterApplied
      ? resolvedItems
      : resolvedItems.slice((page - 1) * limit, (page - 1) * limit + limit);
    const totalRaw = raw?.total_count ?? raw?.total ?? raw?.count ?? items.length;
    const total = serverFilterApplied
      ? Number.isFinite(Number(totalRaw))
        ? Number(totalRaw)
        : resolvedItems.length
      : resolvedItems.length;

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

  async getKohaHealth(tenant: string) {
    const health = await kohaClient.healthCheck(tenant);
    if (health.koha_status === "DOWN") {
      logger.warn({ tenant, health }, "Koha health check is DOWN");
    }
    return health;
  }

  async searchKohaPatrons(tenant: string, query: string) {
    let raw: any;
    try {
      const params: any = { _per_page: 50 };
      if (query) {
        params.q = JSON.stringify({
          "-or": [
            { firstname: { "-like": `%${query}%` } },
            { surname: { "-like": `%${query}%` } },
            { email: { "-like": `%${query}%` } },
            { cardnumber: { "-like": `%${query}%` } },
            { userid: { "-like": `%${query}%` } }
          ]
        });
      }
      raw = await kohaClient.listPatrons(tenant, params);
    } catch (err) {
      logger.warn({ tenant, query, err: err instanceof Error ? err.message : String(err) }, "searchKohaPatrons q-filter failed, fetching all and filtering locally");
      raw = await kohaClient.listPatrons(tenant, { _per_page: 200 });
    }

    const items: any[] = Array.isArray(raw) ? raw : (raw?.patrons || raw?.items || raw?.data || []);
    const normalizedQuery = query.toLowerCase();

    return items
      .map((p: any) => ({
        koha_patron_id: p.patron_id || p.borrowernumber,
        name: `${p.firstname || ""} ${p.surname || ""}`.trim() || p.userid,
        email: p.email || "",
        cardnumber: p.cardnumber || "",
      }))
      .filter((p) => {
        if (!query) return true;
        return (
          p.name.toLowerCase().includes(normalizedQuery) ||
          p.email.toLowerCase().includes(normalizedQuery) ||
          p.cardnumber.toLowerCase().includes(normalizedQuery) ||
          String(p.koha_patron_id).includes(normalizedQuery)
        );
      });
  }
}

export const libraryService = new LibraryService();
