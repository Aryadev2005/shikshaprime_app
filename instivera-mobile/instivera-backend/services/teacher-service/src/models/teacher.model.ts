export interface Teacher {
    id: string;
    name: string;
    subject: string;
    email: string;
    phone: string;
    hireDate: Date;
}

export class TeacherModel {
    constructor(private teacher: Teacher) {}

    getId(): string {
        return this.teacher.id;
    }

    getName(): string {
        return this.teacher.name;
    }

    getSubject(): string {
        return this.teacher.subject;
    }

    getEmail(): string {
        return this.teacher.email;
    }

    getPhone(): string {
        return this.teacher.phone;
    }

    getHireDate(): Date {
        return this.teacher.hireDate;
    }
}