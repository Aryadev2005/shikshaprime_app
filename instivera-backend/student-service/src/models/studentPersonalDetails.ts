import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentPersonalDetailsAttributes {
  id: number;
  user_id: number;
  student_id?: number | null;

  academic_year_id: number;
  program_id: number;
  class_id: number;

  aadhaar_number: string;
  marital_status: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  blood_group?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null;
  mother_tongue: string;
  religion: string;

  identity_proof_type: "AADHAAR" | "VOTER-ID" | "DRIVING-LICENSE" | "PASSPORT";
  identity_proof_number: string;

  is_physically_challenged: boolean;
  physical_disability_type?: string | null;

  is_sports_person: boolean;

  is_banglar_shikha_id_present?: boolean | null;
  banglar_shikha_id?: string | null;

  nearest_railway_station?: string | null;
  academic_bank_credit_id?: string | null;

  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface StudentPersonalDetailsCreationAttributes
  extends Optional<
    StudentPersonalDetailsAttributes,
    | "academic_year_id"
    | "program_id"
    | "id"
    | "student_id"
    | "class_id"
    | "blood_group"
    | "physical_disability_type"
    | "is_banglar_shikha_id_present"
    | "banglar_shikha_id"
    | "nearest_railway_station"
    | "academic_bank_credit_id"
    | "created_at"
    | "updated_at"
  > { }

export class StudentPersonalDetails
  extends Model<
    StudentPersonalDetailsAttributes,
    StudentPersonalDetailsCreationAttributes
  >
  implements StudentPersonalDetailsAttributes {
  public academic_year_id!: number;
  public program_id!: number;
  public class_id!: number;
  public id!: number;
  public user_id!: number;
  public student_id!: number | null;

  public aadhaar_number!: string;
  public marital_status!: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  public blood_group!: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null;
  public mother_tongue!: string;
  public religion!: string;

  public identity_proof_type!: "AADHAAR" | "VOTER-ID" | "DRIVING-LICENSE" | "PASSPORT";
  public identity_proof_number!: string;

  public is_physically_challenged!: boolean;
  public physical_disability_type!: string | null;

  public is_sports_person!: boolean;

  public is_banglar_shikha_id_present!: boolean | null;
  public banglar_shikha_id!: string | null;

  public nearest_railway_station!: string | null;
  public academic_bank_credit_id!: string | null;

  public created_at!: Date | null;
  public updated_at!: Date | null;
}

export function defineStudentPersonalDetails(sequelize: Sequelize) {
  StudentPersonalDetails.init(
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
      class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: "academic_year_id"
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      aadhaar_number: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      marital_status: {
        type: DataTypes.ENUM("SINGLE", "MARRIED", "DIVORCED", "WIDOWED"),
        allowNull: false
      },
      blood_group: {
        type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
        allowNull: true
      },
      mother_tongue: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      religion: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      identity_proof_type: {
        type: DataTypes.ENUM("AADHAAR", "VOTER-ID", "DRIVING-LICENSE", "PASSPORT"),
        allowNull: false
      },
      identity_proof_number: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      is_physically_challenged: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false
      },
      physical_disability_type: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      is_sports_person: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false
      },

      is_banglar_shikha_id_present: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: true
      },
      banglar_shikha_id: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      nearest_railway_station: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      academic_bank_credit_id: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: "student_personal_details",
      timestamps: false,
      underscored: true
    }
  );
  return StudentPersonalDetails;
}