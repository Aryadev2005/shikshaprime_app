import { DataTypes, Sequelize } from "sequelize";

export default function initNaacGoverningBodyModel(sequelize: Sequelize) {
  return sequelize.define(
    "NaacGoverningBody",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      institution_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      member_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      designation: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      appointment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      tenure_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      qualification: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("SAVED", "FINAL"),
        allowNull: false,
        defaultValue: "SAVED",
      },
      photo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "naac_governing_body",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}