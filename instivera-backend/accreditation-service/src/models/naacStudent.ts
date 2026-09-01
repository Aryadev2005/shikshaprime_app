import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacStudentAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  program_id?: number | null;
  name: string;
  enrollment_no: string;
  dob?: string | null;
  gender?: string | null;
  category?: string | null;
  state_of_origin?: string | null;
  is_differently_abled?: boolean | null;
  is_active?: boolean | null;
  status?: 'SAVED' | 'FINAL';
  created_at?: Date;
}

export interface NaacStudentCreationAttributes
  extends Optional<
    NaacStudentAttributes,
    | "id"
    | "academic_year_id"
    | "program_id"
    | "dob"
    | "gender"
    | "category"
    | "state_of_origin"
    | "is_differently_abled"
    | "status"
    | "is_active"
    | "created_at"
  > {}

class NaacStudent
  extends Model<NaacStudentAttributes, NaacStudentCreationAttributes>
  implements NaacStudentAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public program_id?: number | null;
  public name!: string;
  public enrollment_no!: string;
  public dob?: string | null;
  public gender?: string | null;
  public category?: string | null;
  public state_of_origin?: string | null;
  public is_differently_abled?: boolean | null;
  public status: 'SAVED' | 'FINAL';
  public is_active?: boolean | null;
  public created_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacStudent {
    NaacStudent.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        program_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        enrollment_no: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        dob: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        gender: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        category: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        state_of_origin: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        is_differently_abled: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        status: {
          type: DataTypes.ENUM('SAVED', 'FINAL'),
          allowNull: false,
          defaultValue: 'SAVED',
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_students",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacStudent;
  }

  static associate(models: any) {    NaacStudent.belongsTo(models.NaacProgram, {
      foreignKey: "program_id",
      as: "program",
    });
  }
}

export default NaacStudent;
