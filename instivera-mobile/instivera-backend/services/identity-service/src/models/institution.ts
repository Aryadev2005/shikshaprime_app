import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface InstitutionAttributes {
  id: number;
  name: string;
  slug: string;
  type: 'school' | 'college';
  logo_url?: string;
  is_active: number;
  created_at?: Date;
  updated_at?: Date;
}

interface InstitutionCreationAttributes extends Optional<InstitutionAttributes, 'id'> {}

export class Institution extends Model<InstitutionAttributes, InstitutionCreationAttributes>
  implements InstitutionAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public type!: 'school' | 'college';
  public logo_url?: string;
  public is_active!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineInstitution(sequelize: Sequelize): typeof Institution {
  Institution.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM('school', 'college'),
        allowNull: false,
      },
      logo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: 'institutions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Institution;
}
