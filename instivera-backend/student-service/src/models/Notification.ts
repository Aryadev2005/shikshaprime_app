import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NotificationAttributes {
  id: number;
  user_id?: number | null;
  student_id?: number | null;
  registration_id?: number | null;
  channel?: string;
  to_address?: string | null;
  template_key?: string | null;
  title?: string | null;
  message?: string | null;
  payload?: string | null;
  type?: string;
  link?: string | null;
  is_read?: boolean;
  status?: string;
  error_message?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    | "id"
    | "user_id"
    | "student_id"
    | "registration_id"
    | "channel"
    | "to_address"
    | "template_key"
    | "title"
    | "message"
    | "payload"
    | "type"
    | "link"
    | "is_read"
    | "status"
    | "error_message"
    | "created_at"
    | "updated_at"
  > { }

export class GeneralNotification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes {
  public id!: number;
  public user_id!: number | null;
  public student_id!: number | null;
  public registration_id!: number | null;
  public channel!: string;
  public to_address!: string | null;
  public template_key!: string | null;
  public title!: string | null;
  public message!: string | null;
  public payload!: string | null;
  public type!: string;
  public link!: string | null;
  public is_read!: boolean;
  public status!: string;
  public error_message!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineGeneralNotification(sequelize: Sequelize): typeof GeneralNotification {
  GeneralNotification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      registration_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      channel: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "IN_APP",
      },
      to_address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      template_key: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      payload: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "info",
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "/student/learning-material",
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "SENT",
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: "notifications",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return GeneralNotification;
}


