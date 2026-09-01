import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentAttributes {
  id: number;
  user_id: number;
  application_id: string;

  first_name: string;
  middle_name?: string | null;
  last_name: string;

  gender: "MALE" | "FEMALE" | "OTHER" | "";
  student_id: string;
  dob: Date;
  nationality: string;
  state: string;
  district: string;

  social_category:
  | "UNRESERVED"
  | "EWS-WB"
  | "OBC-WB"
  | "SC-WB"
  | "ST"
  | "OBC-CENTRAL"
  | "SC-CENTRAL"
  | "ST-CENTRAL";
  sub_catagory?: string | null;
  catagory_certificate_number?: string | null;
  catagory_certificate_issue_authority?:
  | "sub_divisional_officer"
  | "district_magistrate"
  | "block_development_officer"
  | null;
  catagory_certificate_issue_date?: string | null;

  mobile: string;
  email: string;

  university_registration_number: string;
  scholarship: string;

  hs_year_of_passing: string;
  hs_board: string;
  hs_registration_number: string;
  hs_roll_number: string;
  hs_registration_certificate_path: string;

  // Kept as requested
  semester_id: number;

  created_at?: Date | null;
  created_by?: string | null;
  updated_at?: Date | null;
  updated_by?: string | null;
}

export interface StudentCreationAttributes
  extends Optional<
    StudentAttributes,
    | "id"
    | "middle_name"
    | "sub_catagory"
    | "catagory_certificate_number"
    | "catagory_certificate_issue_authority"
    | "catagory_certificate_issue_date"
    | "created_at"
    | "created_by"
    | "updated_at"
    | "updated_by"
  > { }

export class Student
  extends Model<StudentAttributes, StudentCreationAttributes>
  implements StudentAttributes {
  public id!: number;
  public user_id!: number;
  public application_id!: string;

  public first_name!: string;
  public middle_name!: string | null;
  public last_name!: string;

  public gender!: "MALE" | "FEMALE" | "OTHER" | "";
  public student_id!: string;
  public dob!: Date;
  public nationality!: string;
  public state!: string;
  public district!: string;

  public social_category!:
    | "UNRESERVED"
    | "EWS-WB"
    | "OBC-WB"
    | "SC-WB"
    | "ST"
    | "OBC-CENTRAL"
    | "SC-CENTRAL"
    | "ST-CENTRAL";
  public sub_catagory!: string | null;
  public catagory_certificate_number!: string | null;
  public catagory_certificate_issue_authority!:
    | "sub_divisional_officer"
    | "district_magistrate"
    | "block_development_officer"
    | null;
  public catagory_certificate_issue_date!: string | null;

  public mobile!: string;
  public email!: string;

  public university_registration_number!: string;
  public scholarship!: string;


  public hs_year_of_passing!: string;
  public hs_board!: string;
  public hs_registration_number!: string;
  public hs_roll_number!: string;
  public hs_registration_certificate_path!: string;

  public semester_id!: number;

  public created_at!: Date | null;
  public created_by!: string | null;
  public updated_at!: Date | null;
  public updated_by!: string | null;
}

export function defineStudent(sequelize: Sequelize) {
  Student.init(
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
        allowNull: false
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
        type: DataTypes.ENUM("MALE", "FEMALE", "OTHER", ""),
        allowNull: false
      },
      student_id: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      dob: {
        type: DataTypes.DATEONLY,
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
        type: DataTypes.ENUM(
          "UNRESERVED",
          "EWS-WB",
          "OBC-WB",
          "SC-WB",
          "ST",
          "OBC-CENTRAL",
          "SC-CENTRAL",
          "ST-CENTRAL"
        ),
        allowNull: false
      },
      sub_catagory: {
        type: DataTypes.ENUM(
          "baishya_kapali",
          "bansi_barman",
          "barujibi",
          "brahmin",
          "chasa",
          "goala",
          "kaibarta",
          "kayastha",
          "kurmi",
          "mahishya",
          "namasudra",
          "other_obc",
          "rajput",
          "sadgop",
          "saha",
          "teli"
        ),
        allowNull: true
      },
      catagory_certificate_number: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      catagory_certificate_issue_authority: {
        type: DataTypes.ENUM(
          "sub_divisional_officer",
          "district_magistrate",
          "block_development_officer"
        ),
        allowNull: true
      },
      catagory_certificate_issue_date: {
        type: DataTypes.STRING(100),
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
      university_registration_number: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      scholarship: {
        type: DataTypes.STRING(100),
        allowNull: true
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

      semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_by: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: "students",
      timestamps: false,
      underscored: true
    }
  );

  return Student;
}