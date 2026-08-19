import { Router } from 'express';
import { getInstitutions, getInstitutionBySlug } from './institutions.controller';

const router = Router();

router.get('/', getInstitutions);
router.get('/:slug', getInstitutionBySlug);

export default router;
