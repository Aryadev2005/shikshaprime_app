import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from 'sequelize';

export interface StudentPreRegistrationAttributes {
  id: number;
  user_id: number;
  application_id: string;

  first_name: string;
  middle_name?: string | null;
  last_name: string;

  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  dob: Date;

  nationality: string;
  state: string;
  district: string;

  social_category: 'UNRESERVED' | 'EWS-WB' | 'OBCG-WB' | 'SC-WB' | 'S';
  sub_catagory?: string | null;
  catagory_certificate_number?: string | null;
  catagory_certificate_issue_authority?: string | null;
  catagory_certificate_issue_date?: Date | null;


  mobile: string;
  email: string;

  hs_year_of_passing: string;
  hs_board: string;
  hs_registration_number: string;
  hs_roll_number: string;

  hs_registration_certificate_path: string;
  cast_certificate_path?: string | null;

  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | '';

  created_at?: Date;
  updated_at?: Date;
}

export interface StudentPreRegistrationCreationAttributes
  extends Optional<
    StudentPreRegistrationAttributes,
    | 'id'
    | 'middle_name'
    | 'sub_catagory'
    | 'catagory_certificate_number'
    | 'catagory_certificate_issue_authority'
    | 'catagory_certificate_issue_date'
    | 'cast_certificate_path'
    | 'created_at'
    | 'updated_at'
  > { }

export class StudentPreRegistration
  extends Model<
    StudentPreRegistrationAttributes,
    StudentPreRegistrationCreationAttributes
  >
  implements StudentPreRegistrationAttributes {
  public id!: number;
  public user_id!: number;
  public application_id!: string;

  public first_name!: string;
  public middle_name!: string | null;
  public last_name!: string;

  public gender!: 'MALE' | 'FEMALE' | 'OTHER' | '';
  public dob!: Date;

  public nationality!: string;
  public state!: string;
  public district!: string;

  public social_category!: 'UNRESERVED' | 'EWS-WB' | 'OBCG-WB' | 'SC-WB' | 'S';
  public sub_catagory!: string | null;
  public catagory_certificate_number!: string | null;
  public catagory_certificate_issue_authority!: string | null;
  public catagory_certificate_issue_date!: Date | null;

  public mobile!: string;
  public email!: string;

  public hs_year_of_passing!: string;
  public hs_board!: string;
  public hs_registration_number!: string;
  public hs_roll_number!: string;

  public hs_registration_certificate_path!: string;
  public cast_certificate_path!: string | null;

  public status!: 'PENDING' | 'VERIFIED' | 'REJECTED' | '';

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineStudentPreRegistration(sequelize: Sequelize) {
  StudentPreRegistration.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      application_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      middle_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      gender: {
        type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER', ''),
        allowNull: false
      },
      dob: {
        type: DataTypes.DATE,
        allowNull: false
      },
      nationality: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      district: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      social_category: {
        type: DataTypes.ENUM('UNRESERVED', 'EWS-WB', 'OBCG-WB', 'SC-WB', 'S'),
        allowNull: false
      },
      sub_catagory: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      catagory_certificate_number: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      catagory_certificate_issue_authority: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      catagory_certificate_issue_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      mobile: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      hs_year_of_passing: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      hs_board: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      hs_registration_number: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      hs_roll_number: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      hs_registration_certificate_path: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      cast_certificate_path: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED', ''),
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
      tableName: 'student_pre_registration',
      timestamps: false,
      underscored: true
    }
  );

  return StudentPreRegistration;
}