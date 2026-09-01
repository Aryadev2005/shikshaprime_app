import { Op, Sequelize } from "sequelize";
import { getTenantModels } from "../models";

export class ReportsService {
  /* ----------------------------------------------------
     1. DAY BOOK
  ---------------------------------------------------- */
  async getDayBook(date: string, tenant: string) {
    const start = new Date(date + " 00:00:00");
    const end = new Date(date + " 23:59:59");

    const models = getTenantModels(tenant);

    const vouchers = await models.Voucher.findAll({
        where: { voucher_date: { [Op.between]: [start, end] } },
        include: [
            {
            model: models.VoucherEntry,
            as: "entries",
            include: [
                {
                model: models.Ledger,
                as: "ledger"
                }
            ]
            },
            {
            model: models.User,
            as: "createdByUser",
            attributes: ["email"]
            }
        ],
        order: [["voucher_no", "ASC"]],
        });

    // Flatten entries for table
    const entries = vouchers.flatMap(v =>
        v.entries.map(e => ({
        voucher_no: v.voucher_no,
        voucher_date: v.voucher_date,
        voucher_type: v.voucher_type,
        ledger_name: e.ledger?.name,
        debit_amount: Number(e.debit_amount || 0),
        credit_amount: Number(e.credit_amount || 0),
        narration: v.narration,
        created_by: v.createdByUser?.email || null
        }))
    );

    // Summary totals
    const totalReceipts = entries
        .filter(e => e.voucher_type === "RECEIPT")
        .reduce((sum, e) => sum + Number(e.debit_amount || 0), 0);

    const totalPayments = entries
        .filter(e => e.voucher_type === "PAYMENT")
        .reduce((sum, e) => sum + Number(e.credit_amount || 0), 0);

    return {
        totalReceipts,
        totalPayments,
        entries
    };
  }

  /* ----------------------------------------------------
     2. LEDGER STATEMENT
  ---------------------------------------------------- */
  async getLedgerStatement(ledger_id: number, from: string, to: string, tenant: string) {
    const models = getTenantModels(tenant);

    const fromDate = new Date(from + " 00:00:00");
    const toDate = new Date(to + " 23:59:59");

    // 1. Fetch opening balance (all entries before "from")
    const opening = await models.VoucherEntry.findAll({
        where: { ledger_id },
        include: [
            {
                model: models.Voucher,
                as: "voucher",
                where: {
                    voucher_date: { [Op.lt]: fromDate }
                }
            }
        ],
        attributes: [
            [Sequelize.fn("SUM", Sequelize.col("debit_amount")), "total_debit"],
            [Sequelize.fn("SUM", Sequelize.col("credit_amount")), "total_credit"]
        ],
        raw: true
    });

    const openingDebit = Number(opening[0]?.total_debit || 0);
    const openingCredit = Number(opening[0]?.total_credit || 0);
    const openingBalance = openingDebit - openingCredit;

    // 2. Fetch all entries within date range
    const entries = await models.VoucherEntry.findAll({
        where: { ledger_id },
        include: [
            {
                model: models.Voucher,
                as: "voucher",
                where: {
                    voucher_date: { [Op.between]: [fromDate, toDate] }
                }
            },
            { model: models.Ledger, as: "ledger" }
        ],
        order: [
            [{ model: models.Voucher, as: "voucher" }, "voucher_date", "ASC"],
            ["id", "ASC"]
        ]
    });

    return {
        openingBalance,
        entries
    };
}

  /* ----------------------------------------------------
     3. TRIAL BALANCE
  ---------------------------------------------------- */
  async getTrialBalance(date: string, tenant: string) {
    const models = getTenantModels(tenant);

    const uptoDate = new Date(date + " 23:59:59");

    // 1. Fetch all active ledgers
    const ledgers = await models.Ledger.findAll({
        where: { is_active: true },
        raw: true
    });

    // 2. Fetch voucher entries up to the date
    const entries = await models.VoucherEntry.findAll({
        include: [
            {
                model: models.Voucher,
                as: "voucher",
                required: false, // ⭐ CRITICAL FIX
                where: {
                    voucher_date: { [Op.lte]: uptoDate }
                }
            }
        ],
        attributes: [
            "ledger_id",
            [Sequelize.fn("SUM", Sequelize.col("debit_amount")), "total_debit"],
            [Sequelize.fn("SUM", Sequelize.col("credit_amount")), "total_credit"]
        ],
        group: ["ledger_id"],
        raw: true
    });

    // Map for fast lookup
    const entryMap = {};
    for (const e of entries) {
        entryMap[e.ledger_id] = {
            total_debit: Number(e.total_debit || 0),
            total_credit: Number(e.total_credit || 0)
        };
    }

    // 3. Build final trial balance
    const trialBalance = ledgers.map((ledger) => {
        const totals = entryMap[ledger.id] || { total_debit: 0, total_credit: 0 };

        const opening = Number(ledger.opening_balance || 0);

        const closing = opening + totals.total_debit - totals.total_credit;

        return {
            ledger_id: ledger.id,
            ledger_name: ledger.name,
            ledger_type: ledger.type,
            opening_balance: opening,
            total_debit: totals.total_debit,
            total_credit: totals.total_credit,
            closing_balance: closing
        };
    });

    return trialBalance;
}


  /* ----------------------------------------------------
     4. INCOME & EXPENDITURE
  ---------------------------------------------------- */
  async getIncomeExpenditure(from: string, to: string, tenant: string) {
  const models = getTenantModels(tenant);

  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  const entries = await models.VoucherEntry.findAll({
    include: [
      {
        model: models.Voucher,
        as: "voucher",
        required: true,
        where: {
          voucher_date: { [Op.between]: [start, end] }
        }
      },
      {
        model: models.Ledger,
        as: "ledger",
        include: [
          { model: models.ChartOfAccountGroup, as: "group" }
        ]
      }
    ],
    attributes: [
      "ledger_id",
      [Sequelize.fn("SUM", Sequelize.col("debit_amount")), "total_debit"],
      [Sequelize.fn("SUM", Sequelize.col("credit_amount")), "total_credit"]
    ],
    group: ["ledger_id"],
    raw: true
  });

  console.log(entries);

  const income = [];
  const expense = [];

  for (const e of entries) {
    const type = e["ledger.group.root_type"];

    if (type === "INCOME") {
      income.push({
        ledger_id: e.ledger_id,
        ledger_name: e["ledger.name"],
        total: Number(e.total_credit || 0)
      });
    }

    if (type === "EXPENSE") {
      expense.push({
        ledger_id: e.ledger_id,
        ledger_name: e["ledger.name"],
        total: Number(e.total_debit || 0)
      });
    }
  }

  return { income, expense };
}



  /* ----------------------------------------------------
     5. BALANCE SHEET
  ---------------------------------------------------- */
  async getBalanceSheet(date: string, tenant: string) {
  const models = getTenantModels(tenant);

  // Normalize date to end of day
  const upto = new Date(date + " 23:59:59");

  // 1️⃣ Fetch all ledgers with group info
  const ledgers = await models.Ledger.findAll({
    where: { is_active: true },
    include: [
      { model: models.ChartOfAccountGroup, as: "group" }
    ],
    raw: true
  });

  // 2️⃣ Fetch all voucher entries up to the date
  const entries = await models.VoucherEntry.findAll({
    include: [
      {
        model: models.Voucher,
        as: "voucher",
        required: true,
        where: { voucher_date: { [Op.lte]: upto } }
      }
    ],
    attributes: [
      "ledger_id",
      [Sequelize.fn("SUM", Sequelize.col("debit_amount")), "total_debit"],
      [Sequelize.fn("SUM", Sequelize.col("credit_amount")), "total_credit"]
    ],
    group: ["ledger_id"],
    raw: true
  });

  // 3️⃣ Map entries for fast lookup
  const entryMap = {};
  for (const e of entries) {
    entryMap[e.ledger_id] = {
      debit: Number(e.total_debit || 0),
      credit: Number(e.total_credit || 0)
    };
  }

  const assets = [];
  const liabilities = [];
  const capital = [];

  let totalIncome = 0;
  let totalExpense = 0;

  // 4️⃣ Process each ledger
  for (const ledger of ledgers) {
    const totals = entryMap[ledger.id] || { debit: 0, credit: 0 };
    const opening = Number(ledger.opening_balance || 0);

    let closing = 0;
    const type = ledger["group.root_type"];

    // -------------------------
    // ASSET
    // -------------------------
    if (type === "ASSET") {
      closing = opening + totals.debit - totals.credit;

      if (closing !== 0) {
        assets.push({
          ledger_id: ledger.id,
          ledger_name: ledger.name,
          amount: closing
        });
      }
    }

    // -------------------------
    // LIABILITY
    // -------------------------
    if (type === "LIABILITY") {
      closing = opening + totals.credit - totals.debit;

      if (closing !== 0) {
        liabilities.push({
          ledger_id: ledger.id,
          ledger_name: ledger.name,
          amount: closing
        });
      }
    }

    // -------------------------
    // CAPITAL
    // -------------------------
    if (type === "CAPITAL") {
      closing = opening + totals.credit - totals.debit;

      if (closing !== 0) {
        capital.push({
          ledger_id: ledger.id,
          ledger_name: ledger.name,
          amount: closing
        });
      }
    }

    // -------------------------
    // INCOME (for Net Profit)
    // -------------------------
    if (type === "INCOME") {
      totalIncome += totals.credit - totals.debit;
    }

    // -------------------------
    // EXPENSE (for Net Profit)
    // -------------------------
    if (type === "EXPENSE") {
      totalExpense += totals.debit - totals.credit;
    }
  }

  // 5️⃣ Compute Net Profit / Net Loss
  const netProfit = totalIncome - totalExpense;

  if (netProfit !== 0) {
    capital.push({
      ledger_id: 0,
      ledger_name: netProfit > 0 ? "Net Profit" : "Net Loss",
      amount: netProfit
    });
  }

  // 6️⃣ Return final structured Balance Sheet
  return {
    assets,
    liabilities,
    capital
  };
}



  /* ----------------------------------------------------
     6. CASH BOOK
  ---------------------------------------------------- */
  async getCashBook(date: string, tenant: string) {
    const models = getTenantModels(tenant);

    // 1. Find Cash Ledger
    const cashLedger = await models.Ledger.findOne({
        where: {        
        name: { [Op.like]: "%Cash%" }
        }
    });

    if (!cashLedger) {
        return {
        openingBalance: 0,
        totalReceipts: 0,
        totalPayments: 0,
        closingBalance: 0,
        entries: []
        };
    }

    // 2. Opening Balance (before "from" date)
    const openingEntries = await models.VoucherEntry.findAll({
        where: { ledger_id: cashLedger.id },
        include: [{ model: models.Voucher, as: "voucher" }]
    });
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);

    const to = new Date(date);
    to.setHours(23, 59, 59, 999);

    const openingBalance = openingEntries
        .filter(e => new Date(e.voucher.voucher_date) < new Date(date))
        .reduce((sum, e) => sum + (Number(e.debit_amount) - Number(e.credit_amount)), 0);

    // 3. Entries within date range
    const entries = await models.VoucherEntry.findAll({
        where: { ledger_id: cashLedger.id },
        include: [
        {
            model: models.Voucher,
            as: "voucher",
            where: {
            voucher_date: { [Op.between]: [new Date(from), new Date(to)] }
            }
        },
        {
            model: models.Ledger,
            as: "ledger"
        }
        ],
        order: [[{ model: models.Voucher, as: "voucher" }, "voucher_no", "ASC"]]
    });

    // 4. Flatten entries for UI
    const flatEntries = entries.map(e => ({
        voucher_no: e.voucher.voucher_no,
        voucher_date: e.voucher.voucher_date,
        voucher_type: e.voucher.voucher_type,
        ledger_name: e.ledger?.name,
        debit_amount: Number(e.debit_amount || 0),
        credit_amount: Number(e.credit_amount || 0),
        narration: e.voucher.narration
    }));

    // 5. Totals
    const totalReceipts = flatEntries.reduce(
        (sum, e) => sum + e.debit_amount,
        0
    );

    const totalPayments = flatEntries.reduce(
        (sum, e) => sum + e.credit_amount,
        0
    );

    // 6. Closing balance
    const closingBalance = openingBalance + totalReceipts - totalPayments;

    // 7. Return structure matching frontend
    return {
        openingBalance,
        totalReceipts,
        totalPayments,
        closingBalance,
        entries: flatEntries
    };
  }


  /* ----------------------------------------------------
     7. BANK BOOK
  ---------------------------------------------------- */
  async getBankBook(bankAccountId: string, date: string, tenant: string) {
    const models = getTenantModels(tenant);

    // 1. Find the bank account
    const bankAccount = await models.BankAccount.findOne({
        where: { id: bankAccountId },
        include: [{ model: models.Ledger, as: "ledger" }]
    });

    if (!bankAccount) {
        return {
        openingBalance: 0,
        totalReceipts: 0,
        totalPayments: 0,
        closingBalance: 0,
        entries: []
        };
    }

    const ledgerId = bankAccount.ledger_id;

    // 2. Date range
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);

    const to = new Date(date);
    to.setHours(23, 59, 59, 999);

    // 3. Opening balance
    const openingEntries = await models.VoucherEntry.findAll({
        where: { ledger_id: ledgerId },
        include: [{ model: models.Voucher, as: "voucher" }]
    });

    const openingBalance = openingEntries
        .filter(e => new Date(e.voucher.voucher_date) < from)
        .reduce(
        (sum, e) => sum + (Number(e.debit_amount) - Number(e.credit_amount)),
        0
        );

    // 4. Entries for the selected date
    const entries = await models.VoucherEntry.findAll({
        where: { ledger_id: ledgerId },
        include: [
        {
            model: models.Voucher,
            as: "voucher",
            where: {
            voucher_date: { [Op.between]: [from, to] }
            }
        },
        {
            model: models.Ledger,
            as: "ledger"
        }
        ],
        order: [[{ model: models.Voucher, as: "voucher" }, "voucher_no", "ASC"]]
    });

    // 5. Flatten for UI
    const flatEntries = entries.map(e => ({
        voucher_no: e.voucher.voucher_no,
        voucher_date: e.voucher.voucher_date,
        voucher_type: e.voucher.voucher_type,
        ledger_name: e.ledger?.name,
        debit_amount: Number(e.debit_amount || 0),
        credit_amount: Number(e.credit_amount || 0),
        narration: e.voucher.narration
    }));

    // 6. Totals
    const totalReceipts = flatEntries.reduce(
        (sum, e) => sum + e.debit_amount,
        0
    );

    const totalPayments = flatEntries.reduce(
        (sum, e) => sum + e.credit_amount,
        0
    );

    // 7. Closing balance
    const closingBalance = openingBalance + totalReceipts - totalPayments;

    return {
        openingBalance,
        totalReceipts,
        totalPayments,
        closingBalance,
        entries: flatEntries
    };
 }

}
