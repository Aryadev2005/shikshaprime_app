import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface KohaSettingsAttributes {
  id: number;

  setting_key: string;
  setting_value?: string | null;

  setting_group?: string | null;

  description?: string | null;

  is_encrypted: number;
  is_active: number;
  is_deleted: number;

  created_at?: Date;
  updated_at?: Date;
}

export interface KohaSettingsCreationAttributes
  extends Optional<
    KohaSettingsAttributes,
    | "id"
    | "setting_value"
    | "setting_group"
    | "description"
    | "created_at"
    | "updated_at"
  > {}

export class KohaSettings
  extends Model<
    KohaSettingsAttributes,
    KohaSettingsCreationAttributes
  >
  implements KohaSettingsAttributes
{
  public id!: number;

  public setting_key!: string;
  public setting_value!: string | null;

  public setting_group!: string | null;

  public description!: string | null;

  public is_encrypted!: number;
  public is_active!: number;
  public is_deleted!: number;

  public created_at!: Date;
  public updated_at!: Date;
}

export function defineKohaSettings(sequelize: Sequelize) {
  class TenantKohaSettings extends KohaSettings {}
  
  TenantKohaSettings.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        comment: "Settings primary key",
      },
      setting_key: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        comment: "Unique configuration key name",
      },
      setting_value: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        comment: "Configuration value",
      },
      setting_group: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Logical grouping for settings like API, AUTH, CACHE, SECURITY",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Setting description or usage note",
      },
      is_encrypted: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: "1 = encrypted sensitive value, 0 = plain text configuration",
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: "1 = active configuration, 0 = inactive",
      },
      is_deleted: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: "Soft delete flag",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Record creation timestamp",
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Last update timestamp",
      },
    },
    {
      sequelize,
      tableName: "koha_settings",
      modelName: "KohaSettings",
      timestamps: false,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ["setting_key"],
          name: "uk_koha_settings_setting_key",
        },
        {
          fields: ["setting_group"],
          name: "idx_koha_settings_setting_group",
        },
        {
          fields: ["is_active"],
          name: "idx_koha_settings_is_active",
        },
        {
          fields: ["is_deleted"],
          name: "idx_koha_settings_is_deleted",
        },
      ],
    }
  );

  return TenantKohaSettings as typeof KohaSettings;
}
