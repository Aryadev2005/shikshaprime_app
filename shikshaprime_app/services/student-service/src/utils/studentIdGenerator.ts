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
  
  static async generateRollNumber(departmentName: string, studentModel: any): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    
    // Get department code for roll number
    const departmentCodes: { [key: string]: string } = {
      'science': 'SC',
      'commerce': 'CM',
      'arts': 'AR',
      'engineering': 'EN',
      'management': 'MG',
      'computer science': 'CS',
      'information technology': 'IT',
      'mathematics': 'MT',
      'physics': 'PH',
      'chemistry': 'CH',
      'biology': 'BI',
      'english': 'EN',
      'hindi': 'HI',
    };
    
    const lowerName = departmentName.toLowerCase();
    const deptCode = departmentCodes[lowerName] || departmentName.substring(0, 2).toUpperCase();
    
    // Get count for this department and year
    const count = await studentModel.count({
      where: {
        roll_number: {
          [require('sequelize').Op.like]: `${yearSuffix}${deptCode}%`
        }
      }
    });
    
    // Format: YY + DEPT + 3-digit serial (e.g., 26SC001, 26SC002)
    const serialNumber = String(count + 1).padStart(3, '0');
    return `${yearSuffix}${deptCode}${serialNumber}`;
  }
}