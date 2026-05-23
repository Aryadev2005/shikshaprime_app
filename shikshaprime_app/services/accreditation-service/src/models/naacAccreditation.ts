import { DataTypes, Sequelize } from "sequelize";

export default function initNaacAccreditationModel(sequelize: Sequelize) {
  return sequelize.define(
    "NaacAccreditation",
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
      accreditation_type: {
        type: DataTypes.ENUM(
          "UNIVERSITY_AFFILIATION",
          "NAAC",
          "NIRF",
          "AICTE",
          "MCI",
          "BCI",
          "UGC_2F",
          "UGC_12B",
          "OTHER"
        ),
        allowNull: false,
      },
      authority_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      affiliation_number: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      naac_grade: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      naac_cgpa: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
      },
      nirf_rank: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      nirf_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      approval_status: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      valid_from: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      valid_to: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      evidence_document_path: {
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
      tableName: "naac_accreditations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}