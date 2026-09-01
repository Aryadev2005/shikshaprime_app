import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentGuardianAttributes {
  id: number;
  student_id?: number | null;
  user_id: number;

  relationship: "FATHER" | "MOTHER" | "GUARDIAN";
  name?: string | null;
  qualification?: string | null;
  email?: string | null;
  mobile?: string | null;

  is_primary_guardian: boolean;
  status?: boolean | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface StudentGuardianCreationAttributes
  extends Optional<
    StudentGuardianAttributes,
    | "id"
    | "name"
    | "qualification"
    | "email"
    | "mobile"
    | "status"
    | "created_at"
    | "updated_at"
  > { }

export class StudentGuardian
  extends Model<
    StudentGuardianAttributes,
    StudentGuardianCreationAttributes
  >
  implements StudentGuardianAttributes {
  public id!: number;
  public student_id!: number | null;
  public user_id!: number;

  public relationship!: "FATHER" | "MOTHER" | "GUARDIAN";
  public name!: string | null;
  public qualification!: string | null;
  public email!: string | null;
  public mobile!: string | null;

  public is_primary_guardian!: boolean;
  public status!: boolean | null;
  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

export function defineStudentGuardian(sequelize: Sequelize) {
  StudentGuardian.init(
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
        allowNull: false
      },
      relationship: {
        type: DataTypes.ENUM("FATHER", "MOTHER", "GUARDIAN"),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      qualification: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      mobile: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      is_primary_guardian: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: true,
        defaultValue: 0
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
      tableName: "student_guardians",
      timestamps: false,
      underscored: true
    }
  );

  return StudentGuardian;
}