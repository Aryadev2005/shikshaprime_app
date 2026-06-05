import { Router } from 'express';
import {
  getAcademicYears,
  getPrograms,
  getDepartments,
  getClasses,
  getFeeStructure,
  registerStudent,
  getRegistrationByRegId,
} from '../controllers/studentRegistrationController';

const router = Router();

// All public — student is not logged in yet
router.get('/academic-years', getAcademicYears);
router.get('/programs', getPrograms);
router.get('/departments', getDepartments);
router.get('/classes', getClasses);
router.get('/fee-structure', getFeeStructure);
router.post('/register', registerStudent);
router.get('/registration/:regId', getRegistrationByRegId);

export default router;
