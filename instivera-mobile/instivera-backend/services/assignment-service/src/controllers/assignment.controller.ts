import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { Assignment } from '../models/assignment.model';

export class AssignmentController {
    private assignmentService: AssignmentService;

    constructor() {
        this.assignmentService = new AssignmentService();
    }

    public async createAssignment(req: Request, res: Response): Promise<void> {
        try {
            const assignmentData: Assignment = req.body;
            const newAssignment = await this.assignmentService.createAssignment(assignmentData);
            res.status(201).json(newAssignment);
        } catch (error) {
            res.status(500).json({ message: 'Error creating assignment', error });
        }
    }

    public async getAssignments(req: Request, res: Response): Promise<void> {
        try {
            const assignments = await this.assignmentService.getAssignments();
            res.status(200).json(assignments);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching assignments', error });
        }
    }

    public async getAssignmentById(req: Request, res: Response): Promise<void> {
        try {
            const assignmentId = req.params.id;
            const assignment = await this.assignmentService.getAssignmentById(assignmentId);
            if (assignment) {
                res.status(200).json(assignment);
            } else {
                res.status(404).json({ message: 'Assignment not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching assignment', error });
        }
    }

    public async updateAssignment(req: Request, res: Response): Promise<void> {
        try {
            const assignmentId = req.params.id;
            const assignmentData: Assignment = req.body;
            const updatedAssignment = await this.assignmentService.updateAssignment(assignmentId, assignmentData);
            if (updatedAssignment) {
                res.status(200).json(updatedAssignment);
            } else {
                res.status(404).json({ message: 'Assignment not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error updating assignment', error });
        }
    }

    public async deleteAssignment(req: Request, res: Response): Promise<void> {
        try {
            const assignmentId = req.params.id;
            const deleted = await this.assignmentService.deleteAssignment(assignmentId);
            if (deleted) {
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Assignment not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error deleting assignment', error });
        }
    }
}