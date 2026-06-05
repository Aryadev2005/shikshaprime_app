import { Router } from 'express';
import { createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment } from '../controllers/assignment.controller';

const router = Router();

// Route to create a new assignment
router.post('/', createAssignment);

// Route to get all assignments
router.get('/', getAssignments);

// Route to get a specific assignment by ID
router.get('/:id', getAssignmentById);

// Route to update an assignment by ID
router.put('/:id', updateAssignment);

// Route to delete an assignment by ID
router.delete('/:id', deleteAssignment);

export default router;