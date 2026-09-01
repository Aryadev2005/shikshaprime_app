import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from 'sequelize';

export interface AdmissionModeAttributes {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface AdmissionModeCreationAttributes
  extends Optional<AdmissionModeAttributes, 'id' | 'description'> {}

export class AdmissionMode
  extends Model<AdmissionModeAttributes, AdmissionModeCreationAttributes>
  implements AdmissionModeAttributes 
{
  public id!: number;
  public code!: string;
  public name!: string;
  public description!: string | null;
}

export function defineAdmissionMode(sequelize: Sequelize) {
    AdmissionMode.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        description: {
          type: DataTypes.STRING(150),
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'admission_modes',
        timestamps: false,
        underscored: true
      }
    );

    return AdmissionMode;
  }

  // Associations (to be wired later)
  // static associate(models: any) {
  //   AdmissionMode.hasMany(models.University, { foreignKey: 'default_admission_mode_id' });
  //   AdmissionMode.hasMany(models.Tenant, { foreignKey: 'current_admission_mode_id' });
  // }