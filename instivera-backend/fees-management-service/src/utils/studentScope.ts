import { AppError } from "./appError";
import { getTenantModels } from "../models";

/**
 * Guard for the student-keyed fee routes.
 *
 * `students.id` is a plain incrementing primary key, so a route keyed on it is
 * enumerable. Staff roles are allowed to read any student — that is the whole
 * point of the fee desk — but a caller whose role is `student` may only read
 * their own row, and the id in the URL is checked against the identity in the
 * token rather than trusted.
 *
 * Throws 403 when the caller is a student asking for someone else, or when the
 * token claims the student role but identifies nobody.
 */
export async function assertCanReadStudent(
  user: any,
  studentId: number,
  tenant: string,
): Promise<void> {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  if (String(user.role).toLowerCase() !== "student") {
    return;
  }

  const { Student } = getTenantModels(tenant);

  const where = user.user_id
    ? { user_id: user.user_id }
    : user.email
      ? { email: user.email }
      : null;

  if (!where) {
    throw new AppError("Unable to resolve the authenticated student", 403);
  }

  const self: any = await Student.findOne({ where });

  if (!self || Number(self.id) !== Number(studentId)) {
    throw new AppError("You can only view your own fee records", 403);
  }
}
