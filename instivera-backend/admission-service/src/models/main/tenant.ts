import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from 'sequelize';

export interface TenantAttributes {
  id: number;
  university_id: number | null;
  name: string;
  subdomain: string | null;
  access_code: string | null;
  registration_code: string | null;
  logo: string | null;
  tagline: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  website: string | null;
  registration_date: Date | null;
  current_admission_year: number | null;
  final_list_uploaded: boolean | null;

  seats_remaining: number | null;
  direct_admission_open: boolean | null;
  current_admission_mode_id: number | null;
  total_seats: number | null;
  admitted_students_count: number | null;
  direct_admission_start_date: Date | null;
  direct_admission_end_date: Date | null;
  admission_cycle_locked: boolean | null;

  status: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
}

export interface TenantCreationAttributes
  extends Optional<
    TenantAttributes,
    | 'id'
    | 'university_id'
    | 'subdomain'
    | 'access_code'
    | 'registration_code'
    | 'logo'
    | 'tagline'
    | 'contact_person'
    | 'email'
    | 'phone'
    | 'address_line'
    | 'city'
    | 'state'
    | 'country'
    | 'pincode'
    | 'website'
    | 'registration_date'
    | 'current_admission_year'
    | 'final_list_uploaded'
    | 'seats_remaining'
    | 'direct_admission_open'
    | 'current_admission_mode_id'
    | 'total_seats'
    | 'admitted_students_count'
    | 'direct_admission_start_date'
    | 'direct_admission_end_date'
    | 'admission_cycle_locked'
    | 'created_at'
    | 'updated_at'
  > {}

export class Tenant
  extends Model<TenantAttributes, TenantCreationAttributes>
  implements TenantAttributes 
{
  public id!: number;
  public university_id!: number | null;
  public name!: string;
  public subdomain!: string | null;
  public access_code!: string | null;
  public registration_code!: string | null;
  public logo!: string | null;
  public tagline!: string | null;
  public contact_person!: string | null;
  public email!: string | null;
  public phone!: string | null;
  public address_line!: string | null;
  public city!: string | null;
  public state!: string | null;
  public country!: string | null;
  public pincode!: string | null;
  public website!: string | null;
  public registration_date!: Date | null;
  public current_admission_year!: number | null;
  public final_list_uploaded!: boolean | null;

  public seats_remaining!: number | null;
  public direct_admission_open!: boolean | null;
  public current_admission_mode_id!: number | null;
  public total_seats!: number | null;
  public admitted_students_count!: number | null;
  public direct_admission_start_date!: Date | null;
  public direct_admission_end_date!: Date | null;
  public admission_cycle_locked!: boolean | null;

  public status!: 'active' | 'inactive';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineTenant(sequelize: Sequelize) {
    Tenant.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        university_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        subdomain: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        access_code: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        registration_code: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        logo: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        tagline: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        contact_person: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        address_line: {
          type: DataTypes.STRING(200),
          allowNull: true
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        state: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        country: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        pincode: {
          type: DataTypes.STRING(10),
          allowNull: true
        },
        website: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        registration_date: {
          type: DataTypes.DATE,
          allowNull: true
        },
        current_admission_year: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        final_list_uploaded: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: true
        },

        seats_remaining: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        direct_admission_open: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: true
        },
        current_admission_mode_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        total_seats: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        admitted_students_count: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        direct_admission_start_date: {
          type: DataTypes.DATE,
          allowNull: true
        },
        direct_admission_end_date: {
          type: DataTypes.DATE,
          allowNull: true
        },
        admission_cycle_locked: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: true
        },

        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          allowNull: false
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      },
      {
        sequelize,
        tableName: 'tenants',
        timestamps: false,
        underscored: true
      }
    );

    return Tenant;
  }

  // Associations (to be wired later)
  // static associate(models: any) {
  //   Tenant.belongsTo(models.University, { foreignKey: 'university_id' });
  //   Tenant.belongsTo(models.AdmissionMode, { foreignKey: 'current_admission_mode_id' });
  // }