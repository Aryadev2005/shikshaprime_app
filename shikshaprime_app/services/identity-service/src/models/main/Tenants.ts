// src/models/Tenant.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "..";


interface TenantAttributes {
  id: number;
  name: string;
  subdomain: string;
  access_code?: string;
  registration_code?: string;
  logo?: string;
  tagline?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  website?: string;
  registration_date?: Date;
  status: "active" | "inactive";
  created_at?: Date;
  updated_at?: Date;
}

interface TenantCreationAttributes extends Optional<TenantAttributes, "id" | "status"> {}

export class Tenant
  extends Model<TenantAttributes, TenantCreationAttributes>
  implements TenantAttributes {
  public id!: number;
  public name!: string;
  public subdomain!: string;
  public access_code?: string;
  public registration_code?: string;
  public logo?: string;
  public tagline?: string;
  public contact_person?: string;
  public email?: string;
  public phone?: string;
  public address_line?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public pincode?: string;
  public website?: string;
  public registration_date?: Date;
  public status!: "active" | "inactive";
  public created_at?: Date;
  public updated_at?: Date;
}

// Bind model to the global sequelize instance
Tenant.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    subdomain: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    access_code: DataTypes.STRING(100),
    registration_code: DataTypes.STRING(100),
    logo: DataTypes.STRING(255),
    tagline: DataTypes.STRING(255),
    contact_person: DataTypes.STRING(100),
    email: DataTypes.STRING(100),
    phone: DataTypes.STRING(100),
    address_line: DataTypes.STRING(200),
    city: DataTypes.STRING(100),
    state: DataTypes.STRING(100),
    country: DataTypes.STRING(100),
    pincode: DataTypes.STRING(10),
    website: DataTypes.STRING(255),
    registration_date: DataTypes.DATEONLY,
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize, // <-- global instance
    tableName: "tenants",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
export default Tenant;