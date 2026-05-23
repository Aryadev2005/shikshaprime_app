import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import { defineFinancialYear } from "./FinancialYear";
import { defineLedger } from "./Ledger";
import { defineLedgerBalanceCache } from "./LedgerBalanceCache";
import { defineVoucher } from "./Voucher";
import { defineVoucherEntry } from "./VoucherEntry";
import { definePaymentTypeLedgerMapping } from "./PaymentTypeLedgerMapping";
import { defineBank } from "./Bank";
import { defineBankBranch } from "./BankBranch";
import { defineBankAccount } from "./BankAccount";
import { defineChartOfAccountGroup } from "./ChartOfAccountGroup";
import { defineAuditTrail } from "./AuditTrail";
import { defineUser, User } from "./Users";


// Global (shared) Sequelize instance – for system tables, tenant registry, etc.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: Number(config.db.port),
  dialect: "mysql",
});

// Test the global connection
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

// Tenant‑aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  // Step 1: define models
  const FinancialYear = defineFinancialYear(sequelize);
  const Ledger = defineLedger(sequelize);
  const LedgerBalanceCache = defineLedgerBalanceCache(sequelize);
  const Voucher = defineVoucher(sequelize);
  const VoucherEntry = defineVoucherEntry(sequelize);
  const PaymentTypeLedgerMapping = definePaymentTypeLedgerMapping(sequelize);

  const Bank = defineBank(sequelize);
  const BankBranch = defineBankBranch(sequelize);
  const BankAccount = defineBankAccount(sequelize);

  const ChartOfAccountGroup = defineChartOfAccountGroup(sequelize);

  const AuditTrail = defineAuditTrail(sequelize);

  const User = defineUser(sequelize);
  
  // Step 2: define associations
  // ChartOfAccountGroup → Ledgers
  ChartOfAccountGroup.hasMany(Ledger, { foreignKey: "group_id" });
  Ledger.belongsTo(ChartOfAccountGroup, { foreignKey: "group_id", as: "group"});

  // ChartOfAccountGroup → Parent/Child groups
  ChartOfAccountGroup.hasMany(ChartOfAccountGroup, {
    foreignKey: "parent_group_id",
    as: "children",
  });
  ChartOfAccountGroup.belongsTo(ChartOfAccountGroup, {
    foreignKey: "parent_group_id",
    as: "parent",
  });

  // FinancialYear → Vouchers
  FinancialYear.hasMany(Voucher, {
    foreignKey: "financial_year_id",
  });
  Voucher.belongsTo(FinancialYear, {
    foreignKey: "financial_year_id",
  });
  // Voucher → VoucherEntries
  Voucher.hasMany(VoucherEntry, {
    foreignKey: "voucher_id",
    as: "entries"
  });
  VoucherEntry.belongsTo(Voucher, {
    foreignKey: "voucher_id",
    as: "voucher"   
  });
  // Ledger → VoucherEntries
  Ledger.hasMany(VoucherEntry, {
    foreignKey: "ledger_id",
  });
  VoucherEntry.belongsTo(Ledger, { foreignKey: "ledger_id", as: "ledger" });

  // Ledger → LedgerBalanceCache
  Ledger.hasOne(LedgerBalanceCache, {
    foreignKey: "ledger_id",
  });
  LedgerBalanceCache.belongsTo(Ledger, {
    foreignKey: "ledger_id",
  });
   // Ledger → PaymentTypeLedgerMapping
  Ledger.hasMany(PaymentTypeLedgerMapping, {
    foreignKey: "ledger_id",
  });
  PaymentTypeLedgerMapping.belongsTo(Ledger, {
    foreignKey: "ledger_id",
  });

  // Bank → BankBranch
  Bank.hasMany(BankBranch, {
    foreignKey: "bank_id",
  });
  BankBranch.belongsTo(Bank, {
    foreignKey: "bank_id",
  });

  // Bank → BankAccount
  Bank.hasMany(BankAccount, {
    foreignKey: "bank_id",
  });
  BankAccount.belongsTo(Bank, {
    foreignKey: "bank_id",
  });

  // BankBranch → BankAccount
  BankBranch.hasMany(BankAccount, {
    foreignKey: "branch_id",
  });
  BankAccount.belongsTo(BankBranch, {
    foreignKey: "branch_id",
  });

  // Ledger → BankAccount (ledger_id)
  Ledger.hasMany(BankAccount, {
    foreignKey: "ledger_id",
  });
  BankAccount.belongsTo(Ledger, {
    foreignKey: "ledger_id", as: "ledger"
  });
  Voucher.belongsTo(User, { foreignKey: "created_by", as: "createdByUser" });
  
    return {
    FinancialYear,
    Ledger,
    LedgerBalanceCache,
    Voucher,
    VoucherEntry,
    PaymentTypeLedgerMapping,
    Bank,
    BankBranch,
    BankAccount,
    ChartOfAccountGroup,
    AuditTrail,
    User
  };
}