import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface AuditTrailAttributes {
  id: number;
  action: string;
  entity: string;
  entity_id: number;
  performed_by: number;
  old_value?: string | null;
  new_value?: string | null;
  timestamp: Date;
}

interface AuditTrailCreationAttributes
  extends Optional<
    AuditTrailAttributes,
    'id' | 'old_value' | 'new_value'
  > {}

export class AuditTrail
  extends Model<AuditTrailAttributes, AuditTrailCreationAttributes>
  implements AuditTrailAttributes {
  public id!: number;
  public action!: string;
  public entity!: string;
  public entity_id!: number;
  public performed_by!: number;
  public old_value!: string | null;
  public new_value!: string | null;
  public timestamp!: Date;
}

export function defineAuditTrail(sequelize: Sequelize) {
  AuditTrail.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Action performed (create/update/delete)',
      },
      entity: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Table affected',
      },
      entity_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      performed_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      old_value: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      new_value: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'audit_trail',
      timestamps: false,
    }
  );

  return AuditTrail;
}