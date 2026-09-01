import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentApplicationStatusAttributes {
  id: number;
  user_id: number;
  application_id: number;

  preview_confirmed: number;
  preview_confirmed_at?: Date | null;

  subjects_selected: number;
  subjects_selected_at?: Date | null;

  final_submitted: number;
  final_submitted_at?: Date | null;
  status: "REGISTRATION_COMPLETED" | "PAYMENT_PENDING" | "PAYMENT_COMPLETED" | "ADMITTED";
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface StudentApplicationStatusCreationAttributes
  extends Optional<
    StudentApplicationStatusAttributes,
    | "id"
    | "preview_confirmed"
    | "preview_confirmed_at"
    | "subjects_selected"
    | "subjects_selected_at"
    | "final_submitted"
    | "final_submitted_at"
    | "status"
    | "created_at"
    | "updated_at"
  > { }

export class StudentApplicationStatus
  extends Model<
    StudentApplicationStatusAttributes,
    StudentApplicationStatusCreationAttributes
  >
  implements StudentApplicationStatusAttributes {
  public id!: number;
  public user_id!: number;
  public application_id!: number;

  public preview_confirmed!: number;
  public preview_confirmed_at!: Date | null;

  public subjects_selected!: number;
  public subjects_selected_at!: Date | null;

  public final_submitted!: number;
  public final_submitted_at!: Date | null;
  public status!: "REGISTRATION_COMPLETED" | "PAYMENT_PENDING" | "PAYMENT_COMPLETED" | "ADMITTED";
  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

export function defineStudentApplicationStatus(sequelize: Sequelize) {
  StudentApplicationStatus.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true
      },
      application_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true
      },
      preview_confirmed: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },
      preview_confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      subjects_selected: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },
      subjects_selected_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      final_submitted: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },
      final_submitted_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          "REGISTRATION_COMPLETED",
          "PAYMENT_PENDING",
          "PAYMENT_COMPLETED",
          "ADMITTED"
        ),
        allowNull: false,
        defaultValue: "PAYMENT_PENDING",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: "student_application_status",
      timestamps: false,
      underscored: true
    }
  );

  return StudentApplicationStatus;
}