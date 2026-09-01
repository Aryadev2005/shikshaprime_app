import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryCategoryLedgerMappingAttributes {
  id: number;
  category_id: number;
  ledger_id: number;
  is_consumable: boolean;
  created_at?: Date;
}

export type InventoryCategoryLedgerMappingCreationAttributes = Optional<
  InventoryCategoryLedgerMappingAttributes,
  'id' | 'created_at'
>;

export class InventoryCategoryLedgerMapping
  extends Model<
    InventoryCategoryLedgerMappingAttributes,
    InventoryCategoryLedgerMappingCreationAttributes
  >
  implements InventoryCategoryLedgerMappingAttributes
{
  public id!: number;
  public category_id!: number;
  public ledger_id!: number;
  public is_consumable!: boolean;
  public created_at!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryCategoryLedgerMapping.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        category_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        ledger_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        is_consumable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'inventory_category_ledger_mapping',
        modelName: 'InventoryCategoryLedgerMapping',
        timestamps: false,
      }
    );
  }
}