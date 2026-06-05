import { Request, Response } from 'express';
import { Assignment } from '../models/assignment.model';
import { sendSuccess, sendError } from '../utils/response';

export const createAssignment = async (req: Request, res: Response) => {
    try {
        const assignmentData = req.body;
        const newAssignment = await Assignment.create(assignmentData);
        sendSuccess(res, newAssignment, 'Assignment created successfully');
    } catch (error) {
        sendError(res, error);
    }
};

export const getAssignments = async (req: Request, res: Response) => {
    try {
        const assignments = await Assignment.findAll();
        sendSuccess(res, assignments, 'Assignments retrieved successfully');
    } catch (error) {
        sendError(res, error);
    }
};

export const getAssignmentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findByPk(id);
        if (!assignment) {
            return sendError(res, 'Assignment not found', 404);
        }
        sendSuccess(res, assignment, 'Assignment retrieved successfully');
    } catch (error) {
        sendError(res, error);
    }
};

export const updateAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const assignmentData = req.body;
        const [updated] = await Assignment.update(assignmentData, {
            where: { id }
        });
        if (!updated) {
            return sendError(res, 'Assignment not found', 404);
        }
        sendSuccess(res, null, 'Assignment updated successfully');
    } catch (error) {
        sendError(res, error);
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await Assignment.destroy({
            where: { id }
        });
        if (!deleted) {
            return sendError(res, 'Assignment not found', 404);
        }
        sendSuccess(res, null, 'Assignment deleted successfully');
    } catch (error) {
        sendError(res, error);
    }
};