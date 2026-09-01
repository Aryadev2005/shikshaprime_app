import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import NaacProgram from "./naacProgram";
import NaacCourse from "./naacCourse";
import NaacStudent from "./naacStudent";
import NaacAcademicCalendar from "./naacAcademicCalendar";

import NaacInstitutionProfile from "./naacInstitutionProfile";
import NaacGoverningBody from "./naacGoverningBody";
import NaacCommittee from "./naacCommittee";
import NaacAccreditation from "./naacAccreditation";
import NaacDocument from "./naacDocument";
import NaacAcademicYear from "./NaacAcademicYear";
import NaacFaculty from "./naacFaculty";
import NaacPublications from "./naacPublications";
import NaacFacultyAwards from "./naacFacultyAwards";
import NaacPhdScholars from "./naacPhdScholars";
import NaacResearchProjects from "./naacResearchProjects";
import NaacPatents from "./naacPatents";
import NaacInfrastructureItem from "./naacInfrastructureItems";
import NaacLibraryResource from "./naacLibraryResources";
import NaacItInfrastructure from "./naacItInfrastructure";
import NaacHostel from "./naacHostel";
import NaacStudentActivity from "./naacStudentActivityModel";
import NaacStudentSupport from "./naacStudentSupportModel";
import NaacGrievance from "./naacGrievanceModel";
import NaacAchievement from "./naacAchievementModel";
import NaacAlumni from "./naacAlumniModel";
import NaacBestPractice from "./naacBestPracticeModel";
import NaacDocs from "./naacDocumentModel";
import NaacEvidence from "./naacEvidenceModel";
import NaacExtensionActivity from "./naacExtensionActivityModel";
import NaacFinancialDocument from "./naacFinancialDocumentModel";
import NaacGreenInitiative from "./naacGreenInitiativeModel";
import NaacInstitutionalDistinctiveness from "./naacInstitutionalDistinctivenessModel";
import NaacIqacDocument from "./naacIqacDocumentModel";
import NaacPlacement from "./naacPlacementModel";
import NaacAdmission from "./naacAdmissionModel";
import NaacExamResult from "./naacExamResultModel";



// Global (shared) Sequelize instance – for system tables, tenant registry, etc.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: Number(config.db.port),
  dialect: "mysql",
});

// Test the global connection
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

// Tenant-aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);

  const models = {
    NaacInstitutionProfile: NaacInstitutionProfile.initModel(sequelize),
    NaacInstitution: NaacInstitutionProfile.initModel(sequelize) as any,
    NaacGoverningBody: NaacGoverningBody.initModel(sequelize),
    NaacCommittee: NaacCommittee.initModel(sequelize),
    NaacAccreditation: NaacAccreditation.initModel(sequelize),
    NaacDocument: NaacDocument.initModel(sequelize),
    NaacAcademicYear: NaacAcademicYear.initModel(sequelize),
    NaacProgram: NaacProgram.initModel(sequelize),
    NaacCourse: NaacCourse.initModel(sequelize),
    NaacStudent: NaacStudent.initModel(sequelize),
    NaacAcademicCalendar: NaacAcademicCalendar.initModel(sequelize),
    NaacFaculty: NaacFaculty.initModel(sequelize),
    NaacPublications: NaacPublications.initModel(sequelize),
    NaacFacultyAwards: NaacFacultyAwards.initModel(sequelize),
    NaacPhdScholars: NaacPhdScholars.initModel(sequelize),
    NaacResearchProjects: NaacResearchProjects.initModel(sequelize),
    NaacPatents: NaacPatents.initModel(sequelize),
    NaacInfrastructureItem: NaacInfrastructureItem.initModel(sequelize),
    NaacLibraryResource: NaacLibraryResource.initModel(sequelize),
    NaacItInfrastructure: NaacItInfrastructure.initModel(sequelize),
    NaacHostel: NaacHostel.initModel(sequelize),
    NaacStudentActivity: NaacStudentActivity.initModel(sequelize),
    NaacStudentSupport: NaacStudentSupport.initModel(sequelize),
    NaacGrievance: NaacGrievance.initModel(sequelize),
    NaacAchievement: NaacAchievement.initModel(sequelize),
    NaacAlumni: NaacAlumni.initModel(sequelize),
    NaacBestPractice: NaacBestPractice.initModel(sequelize),
    NaacDocs: NaacDocs.initModel(sequelize),
    NaacEvidence: NaacEvidence.initModel(sequelize),
    NaacExtensionActivity: NaacExtensionActivity.initModel(sequelize),
    NaacFinancialDocument: NaacFinancialDocument.initModel(sequelize),
    NaacGreenInitiative: NaacGreenInitiative.initModel(sequelize),
    NaacInstitutionalDistinctiveness: NaacInstitutionalDistinctiveness.initModel(sequelize),
    NaacIqacDocument: NaacIqacDocument.initModel(sequelize),
    NaacPlacement: NaacPlacement.initModel(sequelize),
    NaacAdmission: NaacAdmission.initModel(sequelize),
    NaacExamResult: NaacExamResult.initModel(sequelize),

  };


  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });

  return {
    sequelize,
    ...models,
  };
}
