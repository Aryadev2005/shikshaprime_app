// utils/studentIdGenerator.ts
export class StudentIdGenerator {
  
  static async generateStudentId(departmentName: string, studentModel: any): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // Last 2 digits of year (26 for 2026)
    
    // Get total count of students for this year
    const count = await studentModel.count({
      where: {
        student_id: {
          [require('sequelize').Op.like]: `${yearSuffix}%`
        }
      }
    });
    
    // Format: YY + 5-digit serial (e.g., 2600001, 2600002)
    const serialNumber = String(count + 1).padStart(5, '0');
    return `${yearSuffix}${serialNumber}`;
  }
  
}