import { RuleRecord } from "./rules.types";

class RulesService {
  private cache: Map<string, any> = new Map();
  private mainModels: any;
  private Op: any;

  init(mainModels: any, OpRef: any) {
    this.mainModels = mainModels;
    this.Op = OpRef;
  }

  private makeKey(universityId: number, tenantId: number, key: string) {
    return `${universityId}:${tenantId}:${key}`;
  }

  async getRule(
    universityId: number,
    tenantId: number,
    ruleKey: string
  ): Promise<any> {
    if (!this.mainModels) {
      throw new Error("RulesService not initialized with main DB models");
    }

    const cacheKey = this.makeKey(universityId, tenantId, ruleKey);

    // 1️⃣ Cache check
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let rule: RuleRecord | null = null;

    // 2️⃣ Try tenant-level rule first (autonomous colleges)
    if (tenantId) {
      rule = await this.mainModels.Rule.findOne({
        where: {
          rule_key: ruleKey,
          tenant_id: tenantId
        }
      });
    }

    // 3️⃣ If no tenant rule → fallback to university-level rule
    if (!rule) {
      rule = await this.mainModels.Rules.findOne({
        where: {
          rule_key: ruleKey,
          university_id: universityId,
          tenant_id: null
        }
      });
    }

    if (!rule) {
      throw new Error(`Rule not found: ${ruleKey}`);
    }

    // 4️⃣ Parse rule value
    let parsedValue: any;

    switch (rule.rule_type) {
      case "INT":
        parsedValue = parseInt(rule.rule_value, 10);
        break;
      case "BOOL":
        parsedValue = rule.rule_value === "true";
        break;
      case "JSON":
        parsedValue = JSON.parse(rule.rule_value);
        break;
      default:
        parsedValue = rule.rule_value;
    }

    // 5️⃣ Cache
    this.cache.set(cacheKey, parsedValue);

    return parsedValue;
  }

  // -----------------------------------------------------
  // Readmission Rules Loader
  // -----------------------------------------------------
  async getReadmissionRules(universityId: number, tenantId: number) {
    return {
      readmission_required_after_semesters: await this.getJson(
        universityId,
        tenantId,
        "readmission_required_after_semesters"
      ),

      readmission_max_gap_years: await this.getInt(
        universityId,
        tenantId,
        "readmission_max_gap_years"
      ),

      readmission_max_attempts_per_semester: await this.getInt(
        universityId,
        tenantId,
        "readmission_max_attempts_per_semester"
      ),

      readmission_min_attendance_percentage: await this.getInt(
        universityId,
        tenantId,
        "readmission_min_attendance_percentage"
      ),

      readmission_allow_if_backlogs_upto: await this.getInt(
        universityId,
        tenantId,
        "readmission_allow_if_backlogs_upto"
      ),

      readmission_allow_after_dropp: await this.getBool(
        universityId,
        tenantId,
        "readmission_allow_after_dropp"
      ),

      readmission_allow_semester_gap: await this.getBool(
        universityId,
        tenantId,
        "readmission_allow_semester_gap"
      ),

      readmission_block_if_fees_pending: await this.getBool(
        universityId,
        tenantId,
        "readmission_block_if_fees_pending"
      ),

      readmission_block_if_disciplinary_action: await this.getBool(
        universityId,
        tenantId,
        "readmission_block_if_disciplinary_action"
      ),

      readmission_fee_required: await this.getBool(
        universityId,
        tenantId,
        "readmission_fee_required"
      ),

      readmission_fee_amount: await this.getInt(
        universityId,
        tenantId,
        "readmission_fee_amount"
      ),

      readmission_fee_per_semester: await this.getJson(
        universityId,
        tenantId,
        "readmission_fee_per_semester"
      ),

      readmission_fee_before_approval: await this.getInt(
        universityId,
        tenantId,
        "readmission_fee_before_approval"
      ),

      readmission_student_confirmation_required: await this.getInt(
        universityId,
        tenantId,
        "readmission_student_confirmation_required"
      ),

      readmission_fee_head_id: await this.getString(
        universityId,
        tenantId,
        "readmission_fee_head_id"
      ),
    };
  }

  // -----------------------------------------------------
  // Typed Getters
  // -----------------------------------------------------
  async getString(universityId: number, tenantId: number, key: string) {
    return this.getRule(universityId, tenantId, key);
  }

  async getInt(universityId: number, tenantId: number, key: string) {
    return this.getRule(universityId, tenantId, key);
  }

  async getBool(universityId: number, tenantId: number, key: string) {
    return this.getRule(universityId, tenantId, key);
  }

  async getJson(universityId: number, tenantId: number, key: string) {
    return this.getRule(universityId, tenantId, key);
  }

  // Student pass mark rule (INT)
  async getPassMark(universityId: number, tenantId: number) {
    return this.getInt(universityId, tenantId, "PASS_MARK");
  }

  clearCache() {
    this.cache.clear();
  }
}

export const rulesService = new RulesService();