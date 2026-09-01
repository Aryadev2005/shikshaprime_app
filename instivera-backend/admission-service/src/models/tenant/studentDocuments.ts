import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentDocumentAttributes {
  id: number;
  student_id: number | null;
  user_id: number | null;

  document_type: "AADHAAR" | "BIRTH_CERTIFICATE" | "CASTE_CERTIFICATE" | "PHYSICALLY_CHALLENGED_CERTIFICATE"
  | "TENTH_MARKSHEET" | "TWELFTH_MARKSHEET" | "GRADUATION_MARKSHEET" | "PROFILE_PHOTO" | "SIGNATURE"
  | "INCOME_CERTIFICATE" | "KANYASHREE_ID" | "IDENTITY_PROOF" | "AGE_PROOF" | "BANK_PROOF";
  document_name?: string | null;
  document_path?: string | null;
  file_extension?: string | null;
  file_size_kb?: number | null;

  is_verified: boolean;
  verified_by?: string | null;
  verified_at?: Date | null;
  status?: boolean | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface StudentDocumentCreationAttributes
  extends Optional<
    StudentDocumentAttributes,
    | "id"
    | "student_id"
    | "user_id"
    | "document_name"
    | "document_path"
    | "file_extension"
    | "file_size_kb"
    | "verified_by"
    | "verified_at"
    | "status"
    | "created_at"
    | "updated_at"
  > { }

export class StudentDocuments
  extends Model<StudentDocumentAttributes, StudentDocumentCreationAttributes>
  implements StudentDocumentAttributes {
  public id!: number;
  public student_id!: number | null;
  public user_id!: number | null;

  public document_type!: "AADHAAR" | "BIRTH_CERTIFICATE" | "CASTE_CERTIFICATE" | "PHYSICALLY_CHALLENGED_CERTIFICATE"
    | "TENTH_MARKSHEET" | "TWELFTH_MARKSHEET" | "GRADUATION_MARKSHEET" | "PROFILE_PHOTO" | "SIGNATURE"
    | "INCOME_CERTIFICATE" | "KANYASHREE_ID" | "IDENTITY_PROOF" | "AGE_PROOF" | "BANK_PROOF";
  public document_name!: string | null;
  public document_path!: string | null;
  public file_extension!: string | null;
  public file_size_kb!: number | null;

  public is_verified!: boolean;
  public verified_by!: string | null;
  public verified_at!: Date | null;
  public status!: boolean | null;
  public created_at!: Date | null;
  public updated_at!: Date | null;
}

export function defineStudentDocuments(sequelize: Sequelize) {
  StudentDocuments.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },

      document_type: {
        type: DataTypes.ENUM(
          "AADHAAR",
          "BIRTH_CERTIFICATE",
          "CASTE_CERTIFICATE",
          "PHYSICALLY_CHALLENGED_CERTIFICATE",
          "TENTH_MARKSHEET",
          "TWELFTH_MARKSHEET",
          "GRADUATION_MARKSHEET",
          "PROFILE_PHOTO",
          "SIGNATURE",
          "INCOME_CERTIFICATE",
          "KANYASHREE_ID",
          "IDENTITY_PROOF",
          "BANK_PROOF",
          "AGE_PROOF"
        ),
        allowNull: false
      },
      document_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      document_path: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      file_extension: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      file_size_kb: {
        type: DataTypes.INTEGER,
        allowNull: true
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
      status: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: true,
        defaultValue: 0
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    },
    {
      sequelize,
      tableName: "student_documents",
      timestamps: false,
      underscored: true
    }
  );
  return StudentDocuments;
}
