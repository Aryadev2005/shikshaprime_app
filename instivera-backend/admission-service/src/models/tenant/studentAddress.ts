import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentAddressAttributes {
  id: number;
  student_id?: number | null;
  user_id: number;

  address_type: "PERMANENT" | "PRESENT";
  address_line?: string | null;
  village?: string | null;
  post_office?: string | null;
  police_station?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  municipality_block?: string | null;
  status?: boolean | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface StudentAddressCreationAttributes
  extends Optional<
    StudentAddressAttributes,
    | "id"
    | "address_line"
    | "village"
    | "post_office"
    | "police_station"
    | "district"
    | "state"
    | "pincode"
    | "municipality_block"
    | "status"
    | "created_at"
    | "updated_at"
  > { }

export class StudentAddress
  extends Model<StudentAddressAttributes, StudentAddressCreationAttributes>
  implements StudentAddressAttributes {
  public id!: number;
  public student_id!: number | null;
  public user_id!: number

  public address_type!: "PERMANENT" | "PRESENT";
  public address_line!: string | null;
  public village!: string | null;
  public post_office!: string | null;
  public police_station!: string | null;
  public district!: string | null;
  public state!: string | null;
  public pincode!: string | null;
  public municipality_block!: string | null;
  public status!: boolean | null;
  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

export function defineStudentAddress(sequelize: Sequelize) {
  StudentAddress.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      address_type: {
        type: DataTypes.ENUM("PERMANENT", "PRESENT"),
        allowNull: false
      },
      address_line: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      village: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      post_office: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      police_station: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      district: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      state: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      pincode: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      municipality_block: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      status: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: true,
        defaultValue: 0
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      }
    },
    {
      sequelize,
      tableName: "student_addresses",
      timestamps: false,
      underscored: true
    }
  );

  return StudentAddress;
}