export type RuleType = "STRING" | "INT" | "BOOL" | "JSON";

export interface RuleRecord {
  id: number;
  tenant_id: number | null;
  university_id: number | null;
  rule_key: string;
  rule_value: string;
  rule_type: RuleType;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}
