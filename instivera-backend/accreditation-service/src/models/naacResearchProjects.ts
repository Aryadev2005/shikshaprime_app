import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacResearchProjectsAttributes {
  id: number;
  tenant_id: number ;
  pi_faculty_id?: number | null;
  co_pi_faculty_ids?: string | null;
  project_title: string;
  funding_agency: string;
  funding_amount?: number | null;
  start_year?: number | null;
  end_year?: number | null;
  status?: string | null;
  outcomes?: string | null;
  sanction_letter_url?: string | null;
  naac_metric_ref?: string | null;
  created_at?: Date;
}

export interface NaacResearchProjectsCreationAttributes
  extends Optional<NaacResearchProjectsAttributes, "id"> {}

class NaacResearchProjects extends Model<
  NaacResearchProjectsAttributes,
  NaacResearchProjectsCreationAttributes
> {
  static initModel(sequelize: Sequelize): typeof NaacResearchProjects {
    NaacResearchProjects.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        pi_faculty_id: { type: DataTypes.BIGINT.UNSIGNED },
        co_pi_faculty_ids: { type: DataTypes.TEXT },
        project_title: { type: DataTypes.TEXT, allowNull: false },
        funding_agency: { type: DataTypes.TEXT, allowNull: false },
        funding_amount: { type: DataTypes.DECIMAL(12, 2) },
        start_year: { type: DataTypes.INTEGER },
        end_year: { type: DataTypes.INTEGER },
        status: { type: DataTypes.STRING(20) },
        outcomes: { type: DataTypes.TEXT },
        sanction_letter_url: { type: DataTypes.TEXT },
        naac_metric_ref: { type: DataTypes.STRING(20) },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: "naac_research_projects",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacResearchProjects;
  }
}

export default NaacResearchProjects;