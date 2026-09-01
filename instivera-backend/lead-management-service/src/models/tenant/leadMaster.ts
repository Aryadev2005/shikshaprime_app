import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadMasterAttributes {
  id: number;

  // Student
  name: string;
  phone?: string | null;
  email?: string | null;
  date_of_birth?: Date | null;
  gender?: string | null;
  address?: string | null;

  // Academic
  current_school?: string | null;
  current_class?: string | null;
  marks_cgpa?: string | null;
  preferred_course?: string | null;
  preferred_stream?: string | null;

  // NEW academic fields
  academic_qualification?: string | null;
  passing_year?: string | null;

  // Parent
  parent_name?: string | null;
  parent_mobile?: string | null;
  parent_occupation?: string | null;
  parent_income_range?: string | null;

  // NEW course mode
  preferred_mode?: string | null;

  // NEW communication preference
  communication_preference?: string | null;

  // NEW notes field
  notes?: string | null;

  // Source & campaign
  lead_source: string;
  campaign_id?: number | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;

  // Lifecycle
  lead_stage: string;
  lead_status?: string | null;

  // Assignment
  assigned_to?: number | null;
  territory?: string | null;
  course_category?: string | null;

  // AI insights
  ai_lead_score?: number | null;
  ai_admission_probability?: number | null;
  ai_next_best_action?: string | null;
  ai_sentiment?: string | null;
  ai_dropout_risk?: number | null;
  ai_scholarship_recommendation?: string | null;

  // System
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeadMasterCreationAttributes
  extends Optional<
    LeadMasterAttributes,
    | 'id'
    | 'phone'
    | 'email'
    | 'date_of_birth'
    | 'gender'
    | 'address'
    | 'current_school'
    | 'current_class'
    | 'marks_cgpa'
    | 'preferred_course'
    | 'preferred_stream'
    | 'academic_qualification'
    | 'passing_year'
    | 'parent_name'
    | 'parent_mobile'
    | 'parent_occupation'
    | 'parent_income_range'
    | 'preferred_mode'
    | 'communication_preference'
    | 'notes'
    | 'campaign_id'
    | 'utm_source'
    | 'utm_medium'
    | 'utm_campaign'
    | 'lead_stage'
    | 'lead_status'
    | 'assigned_to'
    | 'territory'
    | 'course_category'
    | 'ai_lead_score'
    | 'ai_admission_probability'
    | 'ai_next_best_action'
    | 'ai_sentiment'
    | 'ai_dropout_risk'
    | 'ai_scholarship_recommendation'
    | 'created_by'
    | 'created_at'
  > {}

export class LeadMaster
  extends Model<LeadMasterAttributes, LeadMasterCreationAttributes>
  implements LeadMasterAttributes
{
  public id!: number;
  public name!: string;
  public phone!: string | null;
  public email!: string | null;
  public date_of_birth!: Date | null;
  public gender!: string | null;
  public address!: string | null;

  public current_school!: string | null;
  public current_class!: string | null;
  public marks_cgpa!: string | null;
  public preferred_course!: string | null;
  public preferred_stream!: string | null;

  public academic_qualification!: string | null;
  public passing_year!: string | null;

  public parent_name!: string | null;
  public parent_mobile!: string | null;
  public parent_occupation!: string | null;
  public parent_income_range!: string | null;

  public preferred_mode!: string | null;
  public communication_preference!: string | null;
  public notes!: string | null;

  public lead_source!: string;
  public campaign_id!: number | null;
  public utm_source!: string | null;
  public utm_medium!: string | null;
  public utm_campaign!: string | null;

  public lead_stage!: string;
  public lead_status!: string | null;

  public assigned_to!: number | null;
  public territory!: string | null;
  public course_category!: string | null;

  public ai_lead_score!: number | null;
  public ai_admission_probability!: number | null;
  public ai_next_best_action!: string | null;
  public ai_sentiment!: string | null;
  public ai_dropout_risk!: number | null;
  public ai_scholarship_recommendation!: string | null;

  public created_by!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLeadMaster(sequelize: Sequelize) {
  LeadMaster.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      // Student
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      gender: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Academic
      current_school: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      current_class: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      marks_cgpa: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      preferred_course: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      preferred_stream: {
        type: DataTypes.STRING(255),
        allowNull: true
      },

      academic_qualification: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      passing_year: {
        type: DataTypes.STRING(10),
        allowNull: true
      },

      // Parent
      parent_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      parent_mobile: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      parent_occupation: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      parent_income_range: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      // NEW fields
      preferred_mode: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      communication_preference: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Source & campaign
      lead_source: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      campaign_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      utm_source: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      utm_medium: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      utm_campaign: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      // Lifecycle
      lead_stage: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'NEW'
      },
      lead_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'ACTIVE'
      },

      // Assignment
      assigned_to: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      territory: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      course_category: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      // AI insights
      ai_lead_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      ai_admission_probability: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      ai_next_best_action: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      ai_sentiment: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      ai_dropout_risk: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      ai_scholarship_recommendation: {
        type: DataTypes.STRING(255),
        allowNull: true
      },

      // System
      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
    },
    {
      sequelize,
      tableName: 'lead_master',
      timestamps: false,
      underscored: true
    }
  );

  return LeadMaster;
}