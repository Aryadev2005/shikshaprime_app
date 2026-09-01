/**
 * Mappers that normalise Koha REST-API responses into the shapes
 * the ERP frontend/services expect.  Each mapper is defensive —
 * it never throws, always returns a safe default shape.
 */

// ── Biblio / Book ─────────────────────────────────────────────────────────

export interface MappedBook {
  biblio_id: number | string;
  title: string;
  author: string;
  isbn: string;
  publication_year: string;
  publisher: string;
  subject: string;
  availability: boolean;
  location: string;
  items_count: number;
  available_items: number;
  opac_url: string | null;
}

function mapBook(d: any): MappedBook {
  // Koha biblios may nest items array — count available copies
  const items: any[] = d.items || d.item || [];
  const availableItems = items.filter(
    (i: any) =>
      !i.checkout && !i.transfer && i.notforloan !== 1 && i.itemlost !== 1,
  ).length;

  return {
    biblio_id: d.biblio_id ?? d.biblionumber ?? d.id ?? "",
    title: d.title ?? "",
    author: d.author ?? "",
    isbn: d.isbn ?? d.issn ?? "",
    publication_year: d.publication_year ?? d.copyrightdate ?? "",
    publisher: d.publisher ?? d.publishercode ?? "",
    subject: d.subject ?? d.subjects ?? "",
    availability: availableItems > 0 || !!d.availability,
    location: d.location ?? d.homebranch ?? "",
    items_count: items.length || Number(d.items_count ?? 0),
    available_items: availableItems,
    opac_url: d.opac_url ?? null,
  };
}

// ── Patron ─────────────────────────────────────────────────────────────────

export interface MappedPatron {
  patron_id: number | string;
  cardnumber: string;
  firstname: string;
  surname: string;
  name: string;
  email: string;
  category_id: string;
  library_id: string;
  date_enrolled: string;
  expiry_date: string;
}

function mapPatron(d: any): MappedPatron {
  return {
    patron_id: d.patron_id ?? d.borrowernumber ?? d.id ?? "",
    cardnumber: d.cardnumber ?? "",
    firstname: d.firstname ?? d.first_name ?? "",
    surname: d.surname ?? d.last_name ?? "",
    name: `${d.firstname ?? ""} ${d.surname ?? ""}`.trim() || d.name || "",
    email: d.email ?? "",
    category_id: d.category_id ?? d.categorycode ?? "",
    library_id: d.library_id ?? d.branchcode ?? "",
    date_enrolled: d.date_enrolled ?? d.dateenrolled ?? "",
    expiry_date: d.expiry_date ?? d.dateexpiry ?? "",
  };
}

// ── Checkout / Loan ───────────────────────────────────────────────────────

export interface MappedCheckout {
  checkout_id: number | string;
  patron_id: number | string;
  item_id: number | string;
  biblio_id: number | string;
  title: string;
  due_date: string;
  checkout_date: string;
  renewed: boolean;
  renewals_count: number;
  status: "ACTIVE" | "OVERDUE";
  overdue_days: number;
}

function mapCheckout(d: any): MappedCheckout {
  const dueDate = d.due_date ?? d.date_due ?? "";
  const now = new Date();
  const due = dueDate ? new Date(dueDate) : null;
  const isOverdue = due ? due < now : false;
  const overdueDays = due && isOverdue ? Math.ceil((now.getTime() - due.getTime()) / 86_400_000) : 0;

  return {
    checkout_id: d.checkout_id ?? d.issue_id ?? d.id ?? "",
    patron_id: d.patron_id ?? d.borrowernumber ?? "",
    item_id: d.item_id ?? d.itemnumber ?? "",
    biblio_id: d.biblio_id ?? d.biblionumber ?? "",
    title: d.title ?? d.biblio?.title ?? "",
    due_date: dueDate,
    checkout_date: d.checkout_date ?? d.issuedate ?? "",
    renewed: !!d.renewed || (Number(d.renewals_count ?? d.renewals ?? 0) > 0),
    renewals_count: Number(d.renewals_count ?? d.renewals ?? 0),
    status: isOverdue ? "OVERDUE" : "ACTIVE",
    overdue_days: overdueDays,
  };
}

// ── Fine / Account Line ───────────────────────────────────────────────────

export interface MappedFine {
  account_line_id: number | string;
  patron_id: number | string;
  amount: number;
  amount_outstanding: number;
  description: string;
  account_type: string;
  status: "ACTIVE" | "PAID" | "WRITTEN_OFF";
  date: string;
}

function mapFine(d: any): MappedFine {
  const outstanding = Number(d.amount_outstanding ?? d.amountoutstanding ?? 0);
  return {
    account_line_id: d.account_line_id ?? d.accountlines_id ?? d.id ?? "",
    patron_id: d.patron_id ?? d.borrowernumber ?? "",
    amount: Number(d.amount ?? 0),
    amount_outstanding: outstanding,
    description: d.description ?? d.accounttype ?? "",
    account_type: d.account_type ?? d.accounttype ?? "",
    status: outstanding > 0 ? "ACTIVE" : "PAID",
    date: d.date ?? d.timestamp ?? "",
  };
}

// ── Hold / Reservation ────────────────────────────────────────────────────

export interface MappedHold {
  hold_id: number | string;
  patron_id: number | string;
  biblio_id: number | string;
  item_id: number | string | null;
  title: string;
  pickup_library_id: string;
  status: string;
  priority: number;
  hold_date: string;
  expiration_date: string;
  waiting_date: string | null;
}

function mapHold(d: any): MappedHold {
  return {
    hold_id: d.hold_id ?? d.reserve_id ?? d.id ?? "",
    patron_id: d.patron_id ?? d.borrowernumber ?? "",
    biblio_id: d.biblio_id ?? d.biblionumber ?? "",
    item_id: d.item_id ?? d.itemnumber ?? null,
    title: d.title ?? d.biblio?.title ?? "",
    pickup_library_id: d.pickup_library_id ?? d.branchcode ?? "",
    status: d.status ?? "",
    priority: Number(d.priority ?? 0),
    hold_date: d.hold_date ?? d.reservedate ?? "",
    expiration_date: d.expiration_date ?? d.expirationdate ?? "",
    waiting_date: d.waiting_date ?? d.waitingdate ?? null,
  };
}

// ── Export ─────────────────────────────────────────────────────────────────

export const kohaMapper = {
  mapBook,
  mapPatron,
  mapCheckout,
  mapLoan: mapCheckout,       // alias kept for backward compat
  mapFine,
  mapHold,
};
