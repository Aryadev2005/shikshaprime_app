import { DataTypes, Sequelize } from "sequelize";

export default function initNaacInstitutionModel(sequelize: Sequelize) {
  return sequelize.define(
    "NaacInstitution",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      short_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      logo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      pincode: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      website_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      year_established: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      university_affiliation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      affiliation_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      naac_grade: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      naac_cgpa: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
      },
      naac_cycle: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      naac_last_visit_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      ugc_2f_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ugc_12b_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vision: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      mission: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      history: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      org_chart_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("SAVED", "FINAL"),
        allowNull: false,
        defaultValue: "SAVED",
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
      tableName: "naac_institutions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}