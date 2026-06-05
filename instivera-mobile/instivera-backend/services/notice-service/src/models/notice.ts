import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface NoticeAttributes {
  id: number;
  // Richer-schema columns (may or may not exist depending on deployment)
  notice_id?: string;
  title: string;
  content?: string;          // maps to 'content' if the richer schema is used
  description?: string;      // fallback: shikshaprime uses 'description'
  published_date?: Date;     // richer schema
  from_date?: Date;          // shikshaprime fallback
  to_date?: Date;            // shikshaprime: expiry
  expires_at?: Date;         // richer schema alias
  target_audience?: 'ALL' | 'STUDENT' | 'TEACHER';
  is_active?: number;
  created_by?: string;
  attachment?: string;       // shikshaprime column
  institution_type?: 'school' | 'college';
  created_at?: Date;
  updated_at?: Date;
}

export interface NoticeCreationAttributes extends Optional<NoticeAttributes, 'id'> {}

class Notice extends Model<NoticeAttributes, NoticeCreationAttributes>
  implements NoticeAttributes {
  public id!: number;
  public notice_id?: string;
  public title!: string;
  public content?: string;
  public description?: string;
  public published_date?: Date;
  public from_date?: Date;
  public to_date?: Date;
  public expires_at?: Date;
  public target_audience?: 'ALL' | 'STUDENT' | 'TEACHER';
  public is_active?: number;
  public created_by?: string;
  public attachment?: string;
  public institution_type?: 'school' | 'college';
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineNotice(sequelize: Sequelize) {
  Notice.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      notice_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      published_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      from_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      to_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      target_audience: {
        type: DataTypes.ENUM('ALL', 'STUDENT', 'TEACHER'),
        allowNull: true,
        defaultValue: 'ALL',
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1,
      },
      created_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attachment: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      institution_type: {
        type: DataTypes.ENUM('school', 'college'),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'notices',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return Notice;
}
