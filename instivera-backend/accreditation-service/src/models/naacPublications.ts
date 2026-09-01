import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacPublicationsAttributes {
  id: number;
  tenant_id: number ;
  faculty_id?: number | null;
  academic_year_id?: number | null;
  title: string;
  journal_name?: string | null;
  book_name?: string | null;
  publisher?: string | null;
  pub_type: string;
  index_type?: string | null;
  impact_factor?: number | null;
  issn?: string | null;
  isbn?: string | null;
  doi?: string | null;
  volume?: string | null;
  issue?: string | null;
  page_numbers?: string | null;
  pub_year: number;
  pub_month?: number | null;
  co_authors?: string | null;
  proof_url?: string | null;
  naac_metric_ref?: string | null;
  created_at?: Date;
}

export interface NaacPublicationsCreationAttributes
  extends Optional<NaacPublicationsAttributes, "id"> { }

class NaacPublications
  extends Model<NaacPublicationsAttributes, NaacPublicationsCreationAttributes>
  implements NaacPublicationsAttributes {
  public id!: number;
  public tenant_id!: number ;
  public title!: string;
  public pub_type!: string;
  public pub_year!: number;

  static initModel(sequelize: Sequelize): typeof NaacPublications {
    NaacPublications.init(
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
        faculty_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        title: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        journal_name: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        book_name: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        publisher: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        pub_type: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },
        index_type: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        impact_factor: {
          type: DataTypes.DECIMAL(6, 3),
          allowNull: true,
        },
        issn: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        isbn: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        doi: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        volume: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        issue: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        page_numbers: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        pub_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        pub_month: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        co_authors: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        proof_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        naac_metric_ref: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_publications",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacPublications;
  }

  static associate(models: any) {
    NaacPublications.belongsTo(models.NaacFaculty, {
      foreignKey: "faculty_id",
      as: "faculty",
    });
  }
}

export default NaacPublications;