import { Router } from 'express';
import * as assignmentController from '../controllers/assignment.controller';
import { requireAuth, requireRole } from '../middleware/auth-middleware';
import {
  handleAssignmentUpload,
  handleOptionalAssignmentUpload,
} from '../middleware/upload.middleware';

export const createAssignmentRoutes = (): Router => {
  const router = Router();

  // Role-agnostic list (student → stats, teacher → list)
  router.get('/', requireAuth, assignmentController.getAssignments);

  // /metadata must come before /:id so Express doesn't treat "metadata" as an id
  router.get('/metadata', requireAuth, requireRole('teacher'), assignmentController.getMetadata);

  // Role-agnostic detail
  router.get('/:id', requireAuth, assignmentController.getAssignmentById);

  // Student submits an assignment with a file
  router.post(
    '/submit',
    requireAuth,
    requireRole('student'),
    handleAssignmentUpload,
    assignmentController.submitAssignment,
  );

  // Teacher creates an assignment (optional file attachment)
  router.post(
    '/',
    requireAuth,
    requireRole('teacher'),
    handleOptionalAssignmentUpload,
    assignmentController.createAssignment,
  );

  // Teacher grades a submission
  router.put(
    '/grade/:submissionId',
    requireAuth,
    requireRole('teacher'),
    assignmentController.gradeSubmission,
  );

  return router;
};
