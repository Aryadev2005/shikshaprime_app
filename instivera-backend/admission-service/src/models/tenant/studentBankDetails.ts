import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentBankDetailsAttributes {
  id: number;
  student_id?: number | null;
  user_id: number;

  bank_name?: string | null;
  branch_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  micr_code?: string | null;
  account_holder_name?: string | null;

  is_primary_account: boolean;
  is_verified: boolean;

  verified_by?: string | null;
  verified_at?: Date | null;

  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface StudentBankDetailsCreationAttributes
  extends Optional<
    StudentBankDetailsAttributes,
    | "id"
    | "student_id"
    | "bank_name"
    | "branch_name"
    | "account_number"
    | "ifsc_code"
    | "micr_code"
    | "account_holder_name"
    | "verified_by"
    | "verified_at"
    | "created_at"
    | "updated_at"
  > { }

export class StudentBankDetails
  extends Model<
    StudentBankDetailsAttributes,
    StudentBankDetailsCreationAttributes
  >
  implements StudentBankDetailsAttributes {
  public id!: number;
  public student_id!: number | null;
  public user_id!: number;

  public bank_name!: string | null;
  public branch_name!: string | null;
  public account_number!: string | null;
  public ifsc_code!: string | null;
  public micr_code!: string | null;
  public account_holder_name!: string | null;

  public is_primary_account!: boolean;
  public is_verified!: boolean;

  public verified_by!: string | null;
  public verified_at!: Date | null;

  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

export function defineStudentBankDetails(sequelize: Sequelize) {
  StudentBankDetails.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      bank_name: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      branch_name: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      account_number: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      ifsc_code: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      micr_code: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      account_holder_name: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      is_primary_account: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 1
      },
      is_verified: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },
      verified_by: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      }
    },
    {
      sequelize,
      tableName: "student_bank_details",
      timestamps: false,
      underscored: true
    }
  );

  return StudentBankDetails;
}