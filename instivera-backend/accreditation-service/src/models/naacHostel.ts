// ============================================
// Table: naac_hostel
// File: NaacHostel.ts
// ============================================

import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacHostelAttributes {
  id: number;

  tenant_id: number ;

  hostel_name: string;
  hostel_type?: string | null;

  total_capacity?: number | null;
  actual_occupancy?: number | null;

  warden_name?: string | null;
  warden_contact?: string | null;

  amenities?: string | null;

  fee_per_year?: number | null;

  photo_url?: string | null;

  naac_metric_ref?: string | null;
  status?: string | null;

  created_at?: Date;
  updated_at?: Date;
}

export interface NaacHostelCreationAttributes
  extends Optional<
    NaacHostelAttributes,
    | "id"
    | "hostel_type"
    | "total_capacity"
    | "actual_occupancy"
    | "warden_name"
    | "warden_contact"
    | "amenities"
    | "fee_per_year"
    | "photo_url"
    | "naac_metric_ref"
    | "status"
    | "created_at"
    | "updated_at"
  > { }

class NaacHostel
  extends Model<NaacHostelAttributes, NaacHostelCreationAttributes>
  implements NaacHostelAttributes {
  public id!: number;

  public tenant_id!: number ;

  public hostel_name!: string;
  public hostel_type?: string | null;

  public total_capacity?: number | null;
  public actual_occupancy?: number | null;

  public warden_name?: string | null;
  public warden_contact?: string | null;

  public amenities?: string | null;

  public fee_per_year?: number | null;

  public photo_url?: string | null;

  public naac_metric_ref?: string | null;
  public status?: string | null;

  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacHostel {
    NaacHostel.init(
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

        hostel_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        hostel_type: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },

        total_capacity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        actual_occupancy: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        warden_name: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        warden_contact: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },

        amenities: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        fee_per_year: {
          type: DataTypes.DECIMAL(10, 2),
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
        status: {
          type: DataTypes.STRING(20),
          allowNull: true,
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
        tableName: "naac_hostel",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacHostel;
  }

  static associate(_models: any) {}
}

export default NaacHostel;