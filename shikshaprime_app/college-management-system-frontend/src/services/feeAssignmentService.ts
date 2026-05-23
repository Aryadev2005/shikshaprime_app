import apiClient from "./apiClient";

/* ============================================================
   GET SEMESTERS (Program + Class)
   ============================================================ */
export async function getSemesters({
    programId,
    classId
}: {
    programId: number;
    classId: number;
}) {
    const { data } = await apiClient.get(
        "/identity/sr/programs/classes/semesters",
        { params: { programId, classId } }
    );

    return { status: data.status, data: data.data, message: data.message };
}

/* ============================================================
   GET FEE PARTICULARS (Program + Year + Semester)
   ============================================================ */
export async function getFeeParticulars({
    program_id,
    academic_year_id,
    semester_id
}: {
    program_id: number;
    academic_year_id: number;
    semester_id: number;
}) {
    const { data } = await apiClient.get(
        `/fees-management/fee-particulars/${program_id}/${academic_year_id}/${semester_id}`
    );

    return { status: data.status, data: data.data, message: data.message };
}

/* ============================================================
   GET STUDENTS (Program + Department + Year + Class)
   ============================================================ */
export async function getStudentsByClass({
    programId,
    departmentId,
    academicYearId,
    classId
}: {
    programId: number;
    departmentId: number;
    academicYearId: number;
    classId: number;
}) {
    const { data } = await apiClient.get(
        `/student/by-class`,
        {
            params: {
                programId,
                departmentId,
                academicYearId,
                classId
            }
        }
    );

    return { status: data.status, data: data.data, message: data.message };
}

/* ============================================================
   ASSIGN FEES (Bulk)
   ============================================================ */
export async function assignFeesBulk(payload: any) {
    const { data } = await apiClient.post(`/fees-management/fee-assignment/assign`, payload);
    return { status: data.status, data: data.data, message: data.message };
}