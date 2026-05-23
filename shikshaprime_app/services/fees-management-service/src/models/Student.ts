import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface StudentAttributes {
  id: number;
  user_id: number;
  student_id?: string;
  roll_number?: string;
  university_registration_number?: string;
  department_id: number;
  program_id: number;
  class_id?: number;
  semester_id?: number;
  academic_year_id?: number;
  section_id?: number;
  student_name?: string;
  dob?: Date;
  sex?: string;
  religion?: string;
  is_physically_challenged?: number;
  nationality?: string;
  caste?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  father_name?: string;
  mother_name?: string;
  guardian_name?: string;
  guardian_email?: string;
  guardian_mobile?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  mobile?: string;
  email?: string;
  bank_name?: string;
  branch_name?: string;
  account_no?: string;
  ifsc_code?: string;
  micr_code?: string;
  mother_language?: string;
  created_by?: string;
  updated_by?: string;
  status?: number;
  present_count?: number;
  absent_count?: number;
  attendance_percentage?: number;
  ten_percentage?: string;
  year_of_passing_10th?: string;
  board_university_10th?: string;
  twelve_percentage?: string;
  year_of_passing_12th?: string;
  board_university_12th?: string;
  graduation_percentage?: string;
  year_of_passing_graduation?: string;
  board_university_graduation?: string;
  aadhar_doc?: string;
  birth_certificate_doc?: string;
  ten_marksheet_doc?: string;
  twelve_marksheet_doc?: string;
  graduation_doc?: string;
  profile_img?: string;
  caste_certificate_doc?: string;
  physically_challenged_certificate?: string;
  admission_date?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentCreationAttributes extends Optional<StudentAttributes, "id"> { }

export class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: number;
  public user_id!: number;
  public student_id?: string;
  public roll_number?: string;
  public university_registration_number?: string;
  public department_id!: number;
  public program_id!: number;
  public class_id?: number;
  public semester_id?: number;
  public academic_year_id?: number;
  public section_id?: number;
  public student_name?: string;
  public dob?: Date;
  public sex?: string;
  public religion?: string;
  public is_physically_challenged?: number;
  public nationality?: string;
  public caste?: string;
  public id_proof_type?: string;
  public id_proof_number?: string;
  public father_name?: string;
  public mother_name?: string;
  public guardian_name?: string;
  public guardian_email?: string;
  public guardian_mobile?: string;
  public address_line?: string;
  public city?: string;
  public state?: string;
  public pin_code?: string;
  public mobile?: string;
  public email?: string;
  public bank_name?: string;
  public branch_name?: string;
  public account_no?: string;
  public ifsc_code?: string;
  public micr_code?: string;
  public mother_language?: string;
  public created_by?: string;
  public updated_by?: string;
  public status?: number;
  public present_count?: number;
  public absent_count?: number;
  public attendance_percentage?: number;
  public ten_percentage?: string;
  public year_of_passing_10th?: string;
  public board_university_10th?: string;
  public twelve_percentage?: string;
  public year_of_passing_12th?: string;
  public board_university_12th?: string;
  public graduation_percentage?: string;
  public year_of_passing_graduation?: string;
  public board_university_graduation?: string;
  public aadhar_doc?: string;
  public birth_certificate_doc?: string;
  public ten_marksheet_doc?: string;
  public twelve_marksheet_doc?: string;
  public graduation_doc?: string;
  public profile_img?: string;
  public caste_certificate_doc?: string;
  public physically_challenged_certificate?: string;
  public admission_date?: string;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineStudent(sequelize: Sequelize) {
  Student.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      student_id: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      roll_number: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      department_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      program_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      class_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      semester_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      academic_year_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      section_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      student_name: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      dob: {
        type: DataTypes.DATE,
        allowNull: true
      },
      sex: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      religion: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      is_physically_challenged: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      nationality: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      caste: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      id_proof_type: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      id_proof_number: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      father_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      mother_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      guardian_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      guardian_email: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      guardian_mobile: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      address_line: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      state: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      pin_code: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      mobile: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      branch_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      account_no: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ifsc_code: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      micr_code: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      mother_language: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      created_by: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      updated_by: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1
      },
      present_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      absent_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      attendance_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
      },
      ten_percentage: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      year_of_passing_10th: {
        type: DataTypes.STRING(4),
        allowNull: true
      },
      board_university_10th: {
        type: DataTypes.STRING(128),
        allowNull: true
      },
      twelve_percentage: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      year_of_passing_12th: {
        type: DataTypes.STRING(4),
        allowNull: true
      },
      board_university_12th: {
        type: DataTypes.STRING(128),
        allowNull: true
      },
      graduation_percentage: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      year_of_passing_graduation: {
        type: DataTypes.STRING(4),
        allowNull: true
      },
      board_university_graduation: {
        type: DataTypes.STRING(128),
        allowNull: true
      },
      aadhar_doc: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      birth_certificate_doc: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      ten_marksheet_doc: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      twelve_marksheet_doc: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      graduation_doc: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      profile_img: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      caste_certificate_doc: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      physically_challenged_certificate: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      admission_date: {
        type: DataTypes.TIME,
        allowNull: false
      }
    }, {
      sequelize,
      tableName: "students",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  return Student;
}