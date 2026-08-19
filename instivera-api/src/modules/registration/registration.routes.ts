import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import {
  getAcademicYears, getPrograms, getDepartments, getClasses,
  getFeeStructure, submitRegistration, getRegistrationStatus,
} from './registration.controller';

const router = Router();
router.use(tenantMiddleware);

router.get('/academic-years', getAcademicYears);
router.get('/programs', getPrograms);
router.get('/departments', getDepartments);
router.get('/classes', getClasses);
router.get('/fee-structure', getFeeStructure);
router.post('/submit', submitRegistration);
router.get('/status/:regId', getRegistrationStatus);

export default router;
