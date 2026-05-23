import apiClient from "./apiClient";

export async function getExamComponents(examId: string) {
    const { data } = await apiClient.get(`/examination/${examId}/components`);
    return { status: data.status, data: data.data, message: data.message };
}
export async function addComponentToExam(selectedExam: string, formData: any) {
    const { data } = await apiClient.post(`/examination/${selectedExam}/components/add`, formData);
    return { status: data.status, data: data.data, message: data.message };
}
export async function reorderComponents(selectedExam: string, payload: any) {
    const { data } = await apiClient.post(`/examination/${selectedExam}/components/reorder`, payload);
    return { status: data.status, data: data.data, message: data.message };
}
export async function updateComponentTemplate(editingId: string, formData: any) {
    const { data } = await apiClient.put(`/examination/components/${editingId}`, formData);
    return { status: data.status, data: data.data, message: data.message };
}
export async function deleteComponentMapping(selectedExam: string, editingId: string) {
    const { data } = await apiClient.delete(`/examination/${selectedExam}/components/${editingId}`);
    return { status: data.status, data: data.data, message: data.message };
}
export async function createExamination(formData: any) {
    const { data } = await apiClient.post(`/examination/create`, formData);
    return { status: data.status, data: data.data, message: data.message };
}
export async function createComponentTemplate(payload: any) {
    const { data } = await apiClient.post(`/examination/template`, payload);
    return { status: data.status, data: data.data, message: data.message };
}
export async function getAllExams() {
    const { data } = await apiClient.get("/examination/all");
    return { status: data.status, data: data.data, message: data.message };
}
export async function getAllTemplates() {
    const { data } = await apiClient.get("/examination/templates/all");
    return { status: data.status, data: data.data, message: data.message };
}
export async function getQuestionsByExam(selectedExamId: string) {
    const { data } = await apiClient.get(`/examination/question/by-exam/${selectedExamId}`);
    return { status: data.status, data: data.data, message: data.message };
}
export async function createQuestion(payload: any) {
    const { data } = await apiClient.post(`/examination/question/create`, payload);
    return { status: data.status, data: data.data, message: data.message };
}
export async function deleteQuestion(questionId: string) {
    const { data } = await apiClient.delete(`/examination/question/${questionId}`);
    return { status: data.status, data: data.data, message: data.message };
}
export async function getResultsForExam(selectedExamId: string) {
    const { data } = await apiClient.get(`/examination/result/by-exam/${selectedExamId}`);
    return { status: data.status, data: data.data, message: data.message };
}
export async function getEligibleExaminers(selectedExamId: string) {
    const { data } = await apiClient.get(`/examination/exams/${selectedExamId}/eligible-examiners`);
    return { status: data.status, data: data.data, message: data.message };
}
export async function assignExaminer(selectedExamId: string, payload: any) {
    const { data } = await apiClient.post(`/examination/exams/${selectedExamId}/assign-examiner`, payload);
    return { status: data.status, data: data.data, message: data.message };
}
export async function getAssignedExaminers(selectedExamId: string) {
    const { data } = await apiClient.get(`/examination/exams/${selectedExamId}/examiners`);
    return { status: data.status, data: data.data, message: data.message };
}

/* -------------------------------------------------------
   GET ALL EXAMS ASSIGNED TO TEACHER
------------------------------------------------------- */
export async function getTeacherExams() {
  const { data } = await apiClient.get(`/examination/teacher/exams/list`);
  return { status: data.status, data: data.data, message: data.message };
}

/* -------------------------------------------------------
   GET STUDENTS FOR AN EXAM
------------------------------------------------------- */
export async function getTeacherExamStudents(payload: any) {
  const { examId } = payload;
  const { data } = await apiClient.get(`/examination/teacher/exams/${examId}/students`);
  return { status: data.status, data: data.data, message: data.message };
}

/* -------------------------------------------------------
   GET COMPONENTS FOR AN EXAM
------------------------------------------------------- */
export async function getTeacherExamComponents(payload: any) {
  const { examId } = payload;
  const { data } = await apiClient.get(`/examination/teacher/exams/${examId}/components`);
  return { status: data.status, data: data.data, message: data.message };
}

/* -------------------------------------------------------
   GET SAVED MARKS FOR AN EXAM
------------------------------------------------------- */
export async function getTeacherExamMarks(payload: any) {
  const { examId } = payload;
  const { data } = await apiClient.get(`/examination/teacher/exams/${examId}/marks`);
  return { status: data.status, data: data.data, message: data.message };
}

/* -------------------------------------------------------
   SAVE DRAFT MARKS
------------------------------------------------------- */
export async function saveTeacherMarks(formData: any) {
  const { data } = await apiClient.post(
    `/examination/teacher/marks/save`,
    formData
  );
  return { status: data.status, data: data.data, message: data.message };
}

/* -------------------------------------------------------
   SUBMIT FINAL MARKS
------------------------------------------------------- */
export async function submitTeacherMarks(formData: any) {
  const { exam_id } = formData;
  const { data } = await apiClient.post(
    `/examination/teacher/${exam_id}/marks/submit`);
  return { status: data.status, data: data.data, message: data.message };
}

/* -------------------------------------------------------
   GET EXAM SUMMARY (REVIEW SCREEN)
------------------------------------------------------- */
export async function getTeacherExamSummary(payload: any) {
  const { examId } = payload;
  const { data } = await apiClient.get(`/examination/teacher/exams/${examId}/summary`);
  return { status: data.status, data: data.data, message: data.message };
}
export async function getAdminExamSummary(formData: any) {
  const { examId } = formData;
  const { data } = await apiClient.get(
    `/examination/admin/exams/${examId}/summary`);
  return { status: data.status, data: data.data, message: data.message };
}
export async function calculateResults(formData: any) {
  const { exam_id } = formData;
  const { data } = await apiClient.post(
    `/examination/admin/exams/${exam_id}/calculate`);
  return { status: data.status, data: data.data, message: data.message };
}
export async function finaliseResults(formData: any) {
  const { exam_id } = formData;
  const { data } = await apiClient.post(
    `/examination/admin/exams/${exam_id}/finalise-results`);
  return { status: data.status, data: data.data, message: data.message };
}
export async function publishResults(formData: any) {
    const { exam_id } = formData;
    const { data } = await apiClient.post(`/examination/admin/exams/${exam_id}/publish`);
    return { status: data.status, data: data.data, message: data.message };
}
export async function getExamResults(formData: any) {
  const { examId } = formData;
  const { data } = await apiClient.get(
    `/examination/admin/exams/${examId}/result`);
  return { status: data.status, data: data.data, message: data.message };
}
export async function getStudentResults() {
  const { data } = await apiClient.get(
    `/examination/student/results`);
  return { status: data.status, data: data.data, message: data.message };
}
export async function getStudentResultDetails(formData: any) {
  const { examId } = formData;
  const { data } = await apiClient.get(
    `/examination/student/results/${examId}`);
  return { status: data.status, data: data.data, message: data.message };
}