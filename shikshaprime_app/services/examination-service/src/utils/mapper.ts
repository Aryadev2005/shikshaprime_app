export function mapExam(row: any) {
  return {
    id: row.id,
    exam_name: row.exam_name,
    program_id: row.program_id,
    subject_id: row.subject_id,
    semester: row.semester,
    exam_type: row.exam_type,
    total_marks: row.total_marks,
    duration_minutes: row.duration_minutes,
    is_active: row.is_active,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
export function mapExamComponent(row: any) {
  return {
    id: row.id,
    exam_id: row.exam_id,
    component_name: row.component_name,
    component_type: row.component_type,
    max_marks: row.max_marks,
    min_marks: row.min_marks,
    weightage: row.weightage,
    duration_minutes: row.duration_minutes,
    pass_required: row.pass_required,
    sequence: row.sequence,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}