import { Model, DataTypes, Optional, Sequelize} from "sequelize";

export interface StudentProgramChoicesAttributes {
    id: number;
    user_id: number;
    student_id?: string | null;
    major_department_id?: number | null;
    minor_department_id?: string | null;
    mdc_department_id?: number | null;
    created_at?: Date;
    updated_at?: Date;
}


export interface StudentProgramChoicesCreationAttributes extends Optional<StudentProgramChoicesAttributes, "id" | "student_id" | "major_department_id" | "mdc_department_id" | "created_at" | "updated_at"> { }

export class StudentProgramChoices extends Model<StudentProgramChoicesAttributes, StudentProgramChoicesCreationAttributes>
    implements StudentProgramChoicesAttributes {
    public id!: number;
    public user_id!: number;
    public student_id!: string | null;
    public major_department_id!: number | null;
    public minor_department_id!: string | null;
    public mdc_department_id!: number | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export function defineStudentProgramChoices(sequelize: Sequelize) {
    StudentProgramChoices.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },

            user_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            student_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            major_department_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            minor_department_id: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
            },

            mdc_department_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        },
        {
            sequelize,
            tableName: "student_program_choices",
            timestamps: false,
            underscored: true,
        }
    );

    return StudentProgramChoices;
}
