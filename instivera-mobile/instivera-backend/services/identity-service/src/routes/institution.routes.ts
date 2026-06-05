import { Router } from 'express';
import * as institutionController from '../controllers/institutionController';

const router = Router();

/**
 * Institution routes - public, no auth required
 */
router.get('/', institutionController.getInstitutions);
router.get('/:slug', institutionController.getInstitutionBySlug);

export default router;
