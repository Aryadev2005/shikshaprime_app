export interface Teacher {
    id: string;
    name: string;
    subject: string;
    email: string;
    phone: string;
    hireDate: Date;
    isActive: boolean;
}

export interface CreateTeacherDto {
    name: string;
    subject: string;
    email: string;
    phone: string;
}

export interface UpdateTeacherDto {
    name?: string;
    subject?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
}