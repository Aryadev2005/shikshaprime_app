// ============================================
// Table: naac_infrastructure_items
// File: NaacInfrastructureItem.ts
// ============================================

import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacInfrastructureItemAttributes {
  id: number;
  tenant_id: number ;

  item_type: string;
  item_name: string;

  area_sqft?: number | null;
  capacity?: number | null;

  equipment_details?: string | null;
  photo_url?: string | null;

  naac_metric_ref?: string | null;

  created_at?: Date;
}

export interface NaacInfrastructureItemCreationAttributes
  extends Optional<
    NaacInfrastructureItemAttributes,
    | "id"
    | "area_sqft"
    | "capacity"
    | "equipment_details"
    | "photo_url"
    | "naac_metric_ref"
    | "created_at"
  > {}

class NaacInfrastructureItem
  extends Model<
    NaacInfrastructureItemAttributes,
    NaacInfrastructureItemCreationAttributes
  >
  implements NaacInfrastructureItemAttributes
{
  public id!: number;
  public tenant_id!: number ;

  public item_type!: string;
  public item_name!: string;

  public area_sqft?: number | null;
  public capacity?: number | null;

  public equipment_details?: string | null;
  public photo_url?: string | null;

  public naac_metric_ref?: string | null;

  public created_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacInfrastructureItem {
    NaacInfrastructureItem.init(
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

        item_type: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },

        item_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        area_sqft: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },

        capacity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        equipment_details: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        photo_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        naac_metric_ref: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_infrastructure_items",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacInfrastructureItem;
  }

  static associate(_models: any) {}
}

export default NaacInfrastructureItem;