import { Router } from 'express';
import {
  getAcademicYears,
  getPrograms,
  getDepartments,
  getClasses,
  getFeeStructure,
  submitRegistration,
  getRegistrationStatus,
} from '../controllers/registration.controller';

export const createRegistrationRoutes = (): Router => {
  const router = Router();

  // All public — no requireAuth (user is not logged in during registration)
  router.get('/academic-years', getAcademicYears);
  router.get('/programs', getPrograms);
  router.get('/departments', getDepartments);
  router.get('/classes', getClasses);
  router.get('/fee-structure', getFeeStructure);
  router.post('/submit', submitRegistration);
  router.get('/status/:regId', getRegistrationStatus);

  return router;
};
