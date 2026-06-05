export interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAssignmentDto {
    title: string;
    description: string;
    dueDate: Date;
}

export interface UpdateAssignmentDto {
    title?: string;
    description?: string;
    dueDate?: Date;
}