import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacPatentsAttributes {
  id: number;
  tenant_id: number ;
  faculty_id?: number | null;
  patent_title: string;
  patent_number?: string | null;
  filing_date?: string | null;
  grant_date?: string | null;
  status?: string | null;
  country?: string | null;
  ipr_type?: string | null;
  naac_metric_ref?: string | null;
  created_at?: Date;
}

export interface NaacPatentsCreationAttributes
  extends Optional<NaacPatentsAttributes, "id"> {}

class NaacPatents extends Model<
  NaacPatentsAttributes,
  NaacPatentsCreationAttributes
> {
  static initModel(sequelize: Sequelize): typeof NaacPatents {
    NaacPatents.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        faculty_id: { type: DataTypes.BIGINT.UNSIGNED },
        patent_title: { type: DataTypes.TEXT, allowNull: false },
        patent_number: { type: DataTypes.STRING(100) },
        filing_date: { type: DataTypes.DATEONLY },
        grant_date: { type: DataTypes.DATEONLY },
        status: { type: DataTypes.STRING(30) },
        country: { type: DataTypes.STRING(100) },
        ipr_type: { type: DataTypes.STRING(30) },
        naac_metric_ref: { type: DataTypes.STRING(20) },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: "naac_patents",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacPatents;
  }
}

export default NaacPatents;