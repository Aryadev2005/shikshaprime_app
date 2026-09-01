import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from "sequelize";

export interface AcademicYearAttributes {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AcademicYearCreationAttributes
  extends Optional<
    AcademicYearAttributes,
    "id" | "is_active" | "created_at" | "updated_at"
  > { }

export class AcademicYear
  extends Model<AcademicYearAttributes, AcademicYearCreationAttributes>
  implements AcademicYearAttributes {
  public id!: number;
  public name!: string;
  public start_date!: Date;
  public end_date!: Date;
  public is_active?: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineAcademicYear(sequelize: Sequelize): typeof AcademicYear {
  AcademicYear.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      },
    },
    {
      sequelize,
      tableName: "academic_years",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
      indexes: [
        {
          fields: ["is_active"],
        },
      ],
    }
  );

  return AcademicYear;
}

export default AcademicYear;