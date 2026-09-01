import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface SubjectAttributes {
  id: number;
  department_id: number;

  code: string;
  name: string;
  description: string;

  course_type_id: number;
  credit_value: number;

  is_active: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface SubjectCreationAttributes
  extends Optional<
    SubjectAttributes,
    "id" | "created_at" | "updated_at"
  > {}

export class Subject
  extends Model<SubjectAttributes, SubjectCreationAttributes>
  implements SubjectAttributes
{
  public id!: number;
  public department_id!: number;

  public code!: string;
  public name!: string;
  public description!: string;

  public course_type_id!: number;
  public credit_value!: number;

  public is_active!: boolean;

  public created_at!: Date;
  public updated_at!: Date;
}

export function defineSubject(sequelize: Sequelize) {
    Subject.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        department_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        code: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        description: {
          type: DataTypes.STRING(250),
          allowNull: false
        },
        course_type_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        credit_value: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        is_active: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: false,
          defaultValue: 1
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        }
      },
      {
        sequelize,
        tableName: "subjects",
        timestamps: false,
        underscored: true
      }
    );

    return Subject;
  }