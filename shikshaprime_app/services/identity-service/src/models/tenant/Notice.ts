import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from 'sequelize';

interface NoticeAttributes {
  id: number;
  title: string;
  description?: string | null;
  attachment?: string | null;
  from_date: Date;
  to_date: Date;
  created_at: Date;
  updated_at: Date;
}

// For creation, id and timestamps are usually auto-generated
interface NoticeCreationAttributes extends Optional<NoticeAttributes, 'id' | 'description' | 'attachment' | 'created_at' | 'updated_at'> {}

export class Notice extends Model<NoticeAttributes, NoticeCreationAttributes>
  implements NoticeAttributes {
  public id!: number;
  public title!: string;
  public description!: string | null;
  public attachment!: string | null;
  public from_date!: Date;
  public to_date!: Date;
  public created_at!: Date;
  public updated_at!: Date;
}
export function defineNotice(sequelize: Sequelize) {
  Notice.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      attachment: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      from_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      to_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
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
      tableName: 'notices',
      timestamps: false,
      underscored: false,
    }
  );
  return Notice;
}
