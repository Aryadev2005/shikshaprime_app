import { DataTypes, Sequelize } from "sequelize";

export default function initNaacAcademicYearModel(sequelize: Sequelize) {
  return sequelize.define(
    "NaacAcademicYear",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      year_label: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      is_current: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      current_year_unique: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
    },
    {
      tableName: "naac_academic_years",
      timestamps: false,
    }
  );
}