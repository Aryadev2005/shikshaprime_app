import express from 'express';
import { 
  getStudentAssignmentsAndStats,
  getFilteredAssignments,
  getAssignmentById,
  submitAssignment,
  getSubmittedAssignmentById,
  serveAssignmentFile
} from '../controllers/assignmentController';
import { requireAuth } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

// Get assignment statistics for student
router.get('/stats', requireAuth, getStudentAssignmentsAndStats);

// Filter assignments
router.get('/filter', requireAuth, getFilteredAssignments);

// Get specific assignment data (teacher's assignment)
router.get('/:id', requireAuth, getAssignmentById);

// Submit assignment
router.post('/submit', requireAuth, upload.single('assignmentFile'), submitAssignment);

// View submitted assignment
router.get('/submitted/:id', requireAuth, getSubmittedAssignmentById);

// Serve assignment files - PUBLIC ACCESS (no auth middleware)
router.get('/:assignmentId/files/:filename', serveAssignmentFile);

export default router;