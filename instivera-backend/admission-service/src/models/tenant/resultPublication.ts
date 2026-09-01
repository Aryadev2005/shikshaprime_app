import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface ResultPublicationAttributes {
    id: number;
    semester_id: number;
    program_id: number;
    published_by?: number | null;
    published_at?: Date | null;
    remarks?: string | null;
}

export interface ResultPublicationCreationAttributes
    extends Optional<
        ResultPublicationAttributes,
        | "id"
        | "published_by"
        | "published_at"
        | "remarks"
    > { }

export class ResultPublications
    extends Model<ResultPublicationAttributes, ResultPublicationCreationAttributes>
    implements ResultPublicationAttributes {
    public id!: number;
    public semester_id!: number;
    public program_id!: number;
    public published_by!: number | null;
    public published_at!: Date | null;
    public remarks!: string | null;
}

export function defineResultPublications(sequelize: Sequelize) {
    ResultPublications.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },

            semester_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            program_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            published_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            published_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "result_publications",
            modelName: "ResultPublications",
            timestamps: false,
            underscored: true,
        }
    );

    return ResultPublications;
}