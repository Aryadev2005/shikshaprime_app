import { DataTypes, Sequelize } from "sequelize";

export default function initNaacCommitteeModel(sequelize: Sequelize) {
  return sequelize.define(
    "NaacCommittee",
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
      committee_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      committee_type: {
        type: DataTypes.ENUM(
          "IQAC",
          "ICC",
          "SC_ST_CELL",
          "ANTI_RAGGING",
          "GRIEVANCE_REDRESSAL",
          "OTHER"
        ),
        allowNull: false,
        defaultValue: "OTHER",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      order_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      tenure_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      tenure_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      document_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("SAVED", "FINAL"),
        allowNull: false,
        defaultValue: "SAVED",
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
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
      tableName: "naac_committees",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}