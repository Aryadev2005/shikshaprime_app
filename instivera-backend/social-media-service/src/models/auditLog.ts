import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface AuditLogAttributes {
  id: number;
  table_name: string;
  record_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_data?: any | null;
  new_data?: any | null;
  performed_by: number;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: Date;
}

export interface AuditLogCreationAttributes
  extends Optional<
    AuditLogAttributes,
    'id' | 'old_data' | 'new_data' | 'ip_address' | 'user_agent' | 'created_at'
  > {}

class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  public id!: number;
  public table_name!: string;
  public record_id!: number;
  public action!: 'CREATE' | 'UPDATE' | 'DELETE';
  public old_data?: any | null;
  public new_data?: any | null;
  public performed_by!: number;
  public ip_address?: string | null;
  public user_agent?: string | null;
  public created_at?: Date;

  static initModel(sequelize: Sequelize): typeof AuditLog {
    AuditLog.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        table_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        record_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        action: {
          type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
          allowNull: false,
        },
        old_data: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        new_data: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        performed_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        ip_address: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        user_agent: {
          type: DataTypes.TEXT,
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
        tableName: "audit_logs",
        timestamps: false,
        underscored: true,
      }
    );

    return AuditLog;
  }

  static associate(models: any) {
    // Define associations here
  }
}

export default AuditLog;
