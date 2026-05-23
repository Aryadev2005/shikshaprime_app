import { DataTypes, Sequelize } from "sequelize";

export default function initNaacDocumentModel(sequelize: Sequelize) {
  return sequelize.define(
    "NaacDocument",
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
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      doc_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      file_path: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      file_size_kb: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      file_format: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      uploaded_by: {
        type: DataTypes.BIGINT.UNSIGNED,
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
      tableName: "naac_documents",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}