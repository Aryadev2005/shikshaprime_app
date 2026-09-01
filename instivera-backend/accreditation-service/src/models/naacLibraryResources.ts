// ============================================
// Table: naac_library_resources
// File: NaacLibraryResource.ts
// ============================================

import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacLibraryResourceAttributes {
  id: number;

  tenant_id: number ;
  academic_year_id?: number | null;

  total_books?: number | null;
  total_journals_print?: number | null;
  total_ejournals?: number | null;
  total_ebooks?: number | null;

  inflibnet_subscribed?: boolean;
  nlist_subscribed?: boolean;

  annual_additions?: number | null;
  annual_budget?: number | null;

  naac_metric_ref?: string | null;

  created_at?: Date;
}

export interface NaacLibraryResourceCreationAttributes
  extends Optional<
    NaacLibraryResourceAttributes,
    | "id"
    | "academic_year_id"
    | "total_books"
    | "total_journals_print"
    | "total_ejournals"
    | "total_ebooks"
    | "inflibnet_subscribed"
    | "nlist_subscribed"
    | "annual_additions"
    | "annual_budget"
    | "naac_metric_ref"
    | "created_at"
  > {}

class NaacLibraryResource
  extends Model<
    NaacLibraryResourceAttributes,
    NaacLibraryResourceCreationAttributes
  >
  implements NaacLibraryResourceAttributes
{
  public id!: number;

  public tenant_id!: number ;
  public academic_year_id?: number | null;

  public total_books?: number | null;
  public total_journals_print?: number | null;
  public total_ejournals?: number | null;
  public total_ebooks?: number | null;

  public inflibnet_subscribed?: boolean;
  public nlist_subscribed?: boolean;

  public annual_additions?: number | null;
  public annual_budget?: number | null;

  public naac_metric_ref?: string | null;

  public created_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacLibraryResource {
    NaacLibraryResource.init(
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

        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        total_books: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        total_journals_print: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        total_ejournals: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        total_ebooks: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        inflibnet_subscribed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },

        nlist_subscribed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },

        annual_additions: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        annual_budget: {
          type: DataTypes.DECIMAL(12, 2),
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
        tableName: "naac_library_resources",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacLibraryResource;
  }

  static associate(_models: any) {}
}

export default NaacLibraryResource;