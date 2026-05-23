import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";

import initNaacInstitutionModel from "./naacInstitution";
import initNaacGoverningBodyModel from "./naacGoverningBody";
import initNaacCommitteeModel from "./naacCommittee";
import initNaacAccreditationModel from "./naacAccreditation";
import initNaacDocumentModel from "./naacDocument";
import initNaacAcademicYearModel from "./NaacAcademicYear";

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

  const NaacInstitution = initNaacInstitutionModel(sequelize);
  const NaacGoverningBody = initNaacGoverningBodyModel(sequelize);
  const NaacCommittee = initNaacCommitteeModel(sequelize);
  const NaacAccreditation = initNaacAccreditationModel(sequelize);
  const NaacDocument = initNaacDocumentModel(sequelize);
  const NaacAcademicYear = initNaacAcademicYearModel(sequelize);

  // Institution -> Governing Body
  NaacInstitution.hasMany(NaacGoverningBody, {
    foreignKey: "institution_id",
    as: "governingBodyMembers",
  });

  NaacGoverningBody.belongsTo(NaacInstitution, {
    foreignKey: "institution_id",
    as: "institution",
  });

  // Institution -> Committees
  NaacInstitution.hasMany(NaacCommittee, {
    foreignKey: "institution_id",
    as: "committees",
  });

  NaacCommittee.belongsTo(NaacInstitution, {
    foreignKey: "institution_id",
    as: "institution",
  });

  // Institution -> Accreditations
  NaacInstitution.hasMany(NaacAccreditation, {
    foreignKey: "institution_id",
    as: "accreditations",
  });

  NaacAccreditation.belongsTo(NaacInstitution, {
    foreignKey: "institution_id",
    as: "institution",
  });

  // Institution -> Documents
  NaacInstitution.hasMany(NaacDocument, {
    foreignKey: "institution_id",
    as: "documents",
  });

  NaacDocument.belongsTo(NaacInstitution, {
    foreignKey: "institution_id",
    as: "institution",
  });

  // Academic Year -> Governing Body
  NaacGoverningBody.belongsTo(NaacAcademicYear, {
    foreignKey: "academic_year_id",
    as: "academicYear",
  });

  NaacAcademicYear.hasMany(NaacGoverningBody, {
    foreignKey: "academic_year_id",
    as: "naacGoverningBodyMembers",
  });

  // Academic Year -> Committees
  NaacCommittee.belongsTo(NaacAcademicYear, {
    foreignKey: "academic_year_id",
    as: "academicYear",
  });

  NaacAcademicYear.hasMany(NaacCommittee, {
    foreignKey: "academic_year_id",
    as: "naacCommittees",
  });

  // Academic Year -> Accreditations
  NaacAccreditation.belongsTo(NaacAcademicYear, {
    foreignKey: "academic_year_id",
    as: "academicYear",
  });

  NaacAcademicYear.hasMany(NaacAccreditation, {
    foreignKey: "academic_year_id",
    as: "naacAccreditations",
  });

  // Academic Year -> Documents
  NaacDocument.belongsTo(NaacAcademicYear, {
    foreignKey: "academic_year_id",
    as: "academicYear",
  });

  NaacAcademicYear.hasMany(NaacDocument, {
    foreignKey: "academic_year_id",
    as: "naacDocuments",
  });

  return {
    sequelize,
    NaacInstitution,
    NaacAcademicYear,
    NaacGoverningBody,
    NaacCommittee,
    NaacAccreditation,
    NaacDocument,
  };
}