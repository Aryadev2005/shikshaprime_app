
export interface AccessAuthorizePayload {
    access_code: string;
    user_code: string;
    institute_code: string;
}

export interface Institution {
    brand_name: string;
    brand_email: string;
    brand_phone: string;
    brand_logo: string;
    brand_website: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface AccessDetails {
    institute_code: string;
    user_type: string;
    role: string;
    user_code: string;
    name: string;
    email: string;
    phone: string;
    username: string;
    is_email_verified: boolean;
    is_phone_verified: boolean;
    access_code: string;
    institution: Institution;
}

export interface AcademicYear {
    id: string | number;
    year: string;
    [key: string]: string | number | boolean | null | undefined;
}
export interface Classes {
    id: string | number;
    class: string;
    [key: string]: string | number | boolean | null | undefined;
}
export interface Department {
    id: string | number;
    department: string;
    [key: string]: string | number | boolean | null | undefined;
}
export interface Program {
    id: string | number;
    program: string;
    [key: string]: string | number | boolean | null | undefined;
}
