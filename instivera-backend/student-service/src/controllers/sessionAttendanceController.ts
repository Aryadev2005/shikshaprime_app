import { Request, Response } from "express";
import { QueryTypes, Sequelize } from "sequelize";
import { getTenantSequelize } from "../server";

/**
 * Ensure DDL tables exist for session-based attendance
 */
export async function ensureSessionAttendanceTablesExist(sequelize: Sequelize): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      routine_entry_id BIGINT UNSIGNED NOT NULL,
      attendance_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
      started_at DATETIME NOT NULL,
      submitted_at DATETIME NULL,
      submitted_by BIGINT UNSIGNED NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_routine_date (routine_entry_id, attendance_date),
      INDEX idx_routine_entry (routine_entry_id),
      INDEX idx_attendance_date (attendance_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS student_attendance (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      attendance_session_id BIGINT UNSIGNED NOT NULL,
      student_id BIGINT UNSIGNED NOT NULL,
      attendance_status VARCHAR(20) NOT NULL DEFAULT 'ABSENT',
      correction_reason TEXT NULL,
      marked_by BIGINT UNSIGNED NOT NULL,
      marked_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_session_student (attendance_session_id, student_id),
      INDEX idx_session (attendance_session_id),
      INDEX idx_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Idempotent column check for existing student_attendance table
  const [cols]: any = await sequelize.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'student_attendance' 
      AND COLUMN_NAME = 'correction_reason'
  `);

  if (!cols || cols.length === 0) {
    await sequelize.query(`
      ALTER TABLE student_attendance ADD COLUMN correction_reason TEXT NULL;
    `);
  }
}

/**
 * Helper to identify the authenticated teacher record from req.user
 */
async function getTeacherRecord(req: any, sequelize: Sequelize): Promise<any | null> {
  const userId = req.user?.id || req.user?.user_id || req.user?.sub || 0;
  const email = req.user?.email || "";
  const username = req.user?.username || req.user?.employee_id || "";

  const replacements: any = { userId, email, username };

  const [rows] = await sequelize.query(
    `
    SELECT id, first_name, last_name, employee_id, email, user_id
    FROM teachers
    WHERE user_id = :userId 
    OR (email IS NOT NULL AND email = :email AND :email != '')
    OR (employee_id IS NOT NULL AND employee_id = :username AND :username != '')
    LIMIT 1
  `,
    { replacements }
  );

  if (rows && rows.length > 0) {
    return rows[0];
  }
  return null;
}

/**
 * START or GET Attendance Session
 * POST /api/student/session-attendance/start
 */
export async function startOrGetSession(req: any, res: Response): Promise<any> {
  try {
    const sequelize = getTenantSequelize(req.tenant);
    // await ensureSessionAttendanceTablesExist(sequelize);

    const { routine_entry_id } = req.body;
    let { attendance_date } = req.body;

    if (!routine_entry_id || isNaN(Number(routine_entry_id))) {
      return res.status(400).json({ status: 0, message: "Valid routine_entry_id is required" });
    }

    if (!attendance_date) {
      attendance_date = new Date().toISOString().split("T")[0];
    }

    // 1. Resolve Authenticated Teacher
    const teacher = await getTeacherRecord(req, sequelize);
    if (!teacher) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: Teacher profile not found for authenticated user.",
      });
    }

    // 2. Fetch Class Routine Entry
    const [entries]: any[] = await sequelize.query(
      `
      SELECT cre.*, cr.class_id, cr.academic_year_id, cr.status AS routine_status
      FROM class_routine_entries cre
      JOIN class_routines cr ON cr.id = cre.routine_id
      WHERE cre.id = :routineEntryId
      LIMIT 1
    `,
      {
        replacements: { routineEntryId: Number(routine_entry_id) },
        type: QueryTypes.SELECT,
      }
    );

    if (!entries) {
      return res.status(404).json({ status: 0, message: "Routine entry not found" });
    }

    const entry = entries;

    // 3. Verify break period
    if (entry.is_break === 1) {
      return res.status(400).json({ status: 0, message: "Break periods cannot be used for attendance" });
    }

    // 4. SECURITY AUTHORIZATION CHECK: Check teacher ownership
    if (Number(entry.teacher_id) !== Number(teacher.id)) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: You are not authorized to manage attendance for this routine entry.",
      });
    }

    // 5. Check if routine is ACTIVE
    if (entry.routine_status !== "ACTIVE") {
      return res.status(400).json({ status: 0, message: "The associated class routine is not active" });
    }

    // 6. Check if session already exists
    const [existingSessions]: any[] = await sequelize.query(
      `
      SELECT id, routine_entry_id, attendance_date, status, started_at, submitted_at, submitted_by
      FROM attendance_sessions
      WHERE routine_entry_id = :routineEntryId AND attendance_date = :attendanceDate
      LIMIT 1
    `,
      {
        replacements: { routineEntryId: Number(routine_entry_id), attendanceDate: attendance_date },
        type: QueryTypes.SELECT,
      }
    );

    let session = existingSessions;

    if (!session) {
      // Create NEW session
      const now = new Date();
      await sequelize.query(
        `
        INSERT INTO attendance_sessions (routine_entry_id, attendance_date, status, started_at, created_at, updated_at)
        VALUES (:routineEntryId, :attendanceDate, 'OPEN', :now, :now, :now)
      `,
        {
          replacements: {
            routineEntryId: Number(routine_entry_id),
            attendanceDate: attendance_date,
            now,
          },
        }
      );

      const [newSessions]: any[] = await sequelize.query(
        `
        SELECT id, routine_entry_id, attendance_date, status, started_at, submitted_at, submitted_by
        FROM attendance_sessions
        WHERE routine_entry_id = :routineEntryId AND attendance_date = :attendanceDate
        LIMIT 1
      `,
        {
          replacements: { routineEntryId: Number(routine_entry_id), attendanceDate: attendance_date },
          type: QueryTypes.SELECT,
        }
      );
      session = newSessions;
    }

    // 7. Enrich details for response
    const [details]: any[] = await sequelize.query(
      `
      SELECT 
        c.id AS class_id, c.name AS class_name, c.code AS class_code,
        s.id AS subject_id, s.name AS subject_name, s.code AS subject_code
      FROM class_routine_entries cre
      JOIN class_routines cr ON cr.id = cre.routine_id
      LEFT JOIN classes c ON c.id = cr.class_id
      LEFT JOIN subjects s ON s.id = cre.subject_id
      WHERE cre.id = :routineEntryId
      LIMIT 1
    `,
      {
        replacements: { routineEntryId: Number(routine_entry_id) },
        type: QueryTypes.SELECT,
      }
    );

    const routineInfo = {
      attendance_session_id: session.id,
      routine_entry_id: entry.id,
      attendance_date: session.attendance_date,
      status: session.status,
      started_at: session.started_at,
      submitted_at: session.submitted_at,
      submitted_by: session.submitted_by,
      period_number: entry.period_number,
      start_time: entry.start_time,
      end_time: entry.end_time,
      day_of_week: entry.day_of_week,
      teacher: {
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name || ""}`.trim(),
      },
      subject: {
        id: details?.subject_id || entry.subject_id,
        name: details?.subject_name || "N/A",
        code: details?.subject_code || "N/A",
      },
      class: {
        id: details?.class_id || entry.class_id,
        name: details?.class_name || "N/A",
        code: details?.class_code || "N/A",
      },
    };

    return res.status(200).json({
      status: 1,
      message: "Attendance session initialized successfully",
      data: routineInfo,
    });
  } catch (error: any) {
    console.error("Error starting attendance session:", error);
    return res.status(500).json({ status: 0, message: error.message || "Failed to start attendance session" });
  }
}

/**
 * FETCH STUDENTS FOR THE ATTENDANCE SESSION
 * GET /api/student/session-attendance/students
 */
export async function getSessionStudents(req: any, res: Response): Promise<any> {
  try {
    const sequelize = getTenantSequelize(req.tenant);
    // await ensureSessionAttendanceTablesExist(sequelize);

    const sessionId = req.query.session_id ? Number(req.query.session_id) : undefined;
    const routineEntryId = req.query.routine_entry_id ? Number(req.query.routine_entry_id) : undefined;
    const attendanceDate = (req.query.attendance_date as string) || new Date().toISOString().split("T")[0];

    // 1. Resolve Authenticated Teacher
    const teacher = await getTeacherRecord(req, sequelize);
    if (!teacher) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: Teacher profile not found.",
      });
    }

    let targetSessionId = sessionId;
    let targetRoutineEntryId = routineEntryId;

    if (targetSessionId) {
      const [sess]: any[] = await sequelize.query(
        `SELECT id, routine_entry_id FROM attendance_sessions WHERE id = :sessionId LIMIT 1`,
        { replacements: { sessionId: targetSessionId }, type: QueryTypes.SELECT }
      );
      if (!sess) {
        return res.status(404).json({ status: 0, message: "Attendance session not found" });
      }
      targetRoutineEntryId = sess.routine_entry_id;
    } else if (targetRoutineEntryId) {
      const [sess]: any[] = await sequelize.query(
        `SELECT id FROM attendance_sessions WHERE routine_entry_id = :routineEntryId AND attendance_date = :attendanceDate LIMIT 1`,
        { replacements: { routineEntryId: targetRoutineEntryId, attendanceDate }, type: QueryTypes.SELECT }
      );
      if (sess) {
        targetSessionId = sess.id;
      }
    } else {
      return res.status(400).json({ status: 0, message: "session_id or routine_entry_id is required" });
    }

    // 2. Fetch Routine Entry & SECURITY CHECK
    const [entries]: any[] = await sequelize.query(
      `
      SELECT cre.id, cre.teacher_id, cr.class_id
      FROM class_routine_entries cre
      JOIN class_routines cr ON cr.id = cre.routine_id
      WHERE cre.id = :routineEntryId
      LIMIT 1
    `,
      { replacements: { routineEntryId: targetRoutineEntryId }, type: QueryTypes.SELECT }
    );

    if (!entries) {
      return res.status(404).json({ status: 0, message: "Routine entry not found" });
    }

    if (Number(entries.teacher_id) !== Number(teacher.id)) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: You are not authorized to view students for this routine entry.",
      });
    }

    const classId = entries.class_id;

    // 3. Fetch Students in Class + Left Join Student Attendance for this session
    const students: any[] = await sequelize.query(
      `
      SELECT 
        st.id AS student_id,
        st.student_id AS student_code,
        TRIM(CONCAT(st.first_name, ' ', COALESCE(st.middle_name, ''), ' ', st.last_name)) AS student_name,
        st.roll_number,
        d.name AS dept_name,
        sa.attendance_status
      FROM students st
      LEFT JOIN student_personal_details spd ON spd.student_id = st.id
      LEFT JOIN programs p ON p.id = spd.program_id
      LEFT JOIN departments d ON d.id = p.department_id
      LEFT JOIN student_attendance sa ON sa.student_id = st.id AND sa.attendance_session_id = :sessionId
      WHERE (spd.class_id = :classId OR st.semester_id IN (SELECT semester_id FROM classes WHERE id = :classId))
      ORDER BY st.roll_number ASC, st.first_name ASC
    `,
      {
        replacements: { classId, sessionId: targetSessionId || 0 },
        type: QueryTypes.SELECT,
      }
    );

    const data = students.map((s) => ({
      student_id: String(s.student_id),
      student_code: s.student_code || `STU-${s.student_id}`,
      student_name: s.student_name,
      roll_number: s.roll_number || "N/A",
      dept_name: s.dept_name || "N/A",
      attendance_status: s.attendance_status || null,
    }));

    return res.status(200).json({
      status: 1,
      message: "Session students fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error("Error fetching session students:", error);
    return res.status(500).json({ status: 0, message: error.message || "Failed to fetch session students" });
  }
}

/**
 * BULK SUBMIT ATTENDANCE FOR SESSION
 * POST /api/student/session-attendance/submit
 */
export async function submitSessionAttendance(req: any, res: Response): Promise<any> {
  const sequelize = getTenantSequelize(req.tenant);
  // await ensureSessionAttendanceTablesExist(sequelize);

  const { attendance_session_id, students } = req.body;

  if (!attendance_session_id || !students || !Array.isArray(students)) {
    return res.status(400).json({ status: 0, message: "Invalid payload: attendance_session_id and students array are required" });
  }

  // 1. Resolve Authenticated Teacher
  const teacher = await getTeacherRecord(req, sequelize);
  if (!teacher) {
    return res.status(403).json({
      status: 0,
      message: "Authorization Error: Teacher profile not found.",
    });
  }

  // 2. Fetch Session & Routine Entry
  const [sessions]: any[] = await sequelize.query(
    `SELECT id, routine_entry_id, status FROM attendance_sessions WHERE id = :sessionId LIMIT 1`,
    { replacements: { sessionId: Number(attendance_session_id) }, type: QueryTypes.SELECT }
  );

  if (!sessions) {
    return res.status(404).json({ status: 0, message: "Attendance session not found" });
  }

  const session = sessions;

  // 3. Verify Session Status is OPEN
  if (session.status === "SUBMITTED") {
    return res.status(400).json({ status: 0, message: "Attendance session is already submitted and locked." });
  }

  // 4. SECURITY AUTHORIZATION CHECK: Check Teacher Ownership
  const [entries]: any[] = await sequelize.query(
    `SELECT cre.id, cre.teacher_id, cr.class_id 
     FROM class_routine_entries cre 
     JOIN class_routines cr ON cr.id = cre.routine_id
     WHERE cre.id = :routineEntryId LIMIT 1`,
    { replacements: { routineEntryId: session.routine_entry_id }, type: QueryTypes.SELECT }
  );

  if (!entries) {
    return res.status(404).json({ status: 0, message: "Routine entry for this session not found" });
  }

  if (Number(entries.teacher_id) !== Number(teacher.id)) {
    return res.status(403).json({
      status: 0,
      message: "Authorization Error: You cannot submit attendance for another teacher's session.",
    });
  }

  // 5. Validate status values
  for (const s of students) {
    const statusStr = String(s.attendance_status || "").toUpperCase();
    if (statusStr !== "PRESENT" && statusStr !== "ABSENT") {
      return res.status(400).json({
        status: 0,
        message: `Invalid attendance_status '${s.attendance_status}' for student_id ${s.student_id}. Must be PRESENT or ABSENT.`,
      });
    }
  }

  // 6. Transactional Save
  const transaction = await sequelize.transaction();

  try {
    const now = new Date();

    for (const s of students) {
      const studentIdNum = Number(s.student_id);
      const statusStr = String(s.attendance_status).toUpperCase();

      await sequelize.query(
        `
        INSERT INTO student_attendance 
          (attendance_session_id, student_id, attendance_status, marked_by, marked_at, created_at, updated_at)
        VALUES 
          (:sessionId, :studentId, :status, :markedBy, :now, :now, :now)
        ON DUPLICATE KEY UPDATE
          attendance_status = VALUES(attendance_status),
          marked_by = VALUES(marked_by),
          marked_at = VALUES(marked_at),
          updated_at = VALUES(updated_at)
      `,
        {
          replacements: {
            sessionId: session.id,
            studentId: studentIdNum,
            status: statusStr,
            markedBy: teacher.id,
            now,
          },
          transaction,
        }
      );
    }

    // Update session status to SUBMITTED
    await sequelize.query(
      `
      UPDATE attendance_sessions
      SET status = 'SUBMITTED', submitted_at = :now, submitted_by = :submittedBy, updated_at = :now
      WHERE id = :sessionId
    `,
      {
        replacements: {
          submittedBy: teacher.id,
          sessionId: session.id,
          now,
        },
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      status: 1,
      message: "Session attendance submitted successfully",
      data: {
        attendance_session_id: session.id,
        status: "SUBMITTED",
        total_students_marked: students.length,
      },
    });
  } catch (err: any) {
    await transaction.rollback();
    console.error("Error submitting session attendance:", err);
    return res.status(500).json({ status: 0, message: err.message || "Failed to submit session attendance" });
  }
}

/**
 * API #1 — GET TEACHER'S EDITABLE SESSIONS FOR A DATE
 * GET /api/student/session-attendance/correction/sessions?date=YYYY-MM-DD
 */
export async function getCorrectionSessions(req: any, res: Response): Promise<any> {
  try {
    const sequelize = getTenantSequelize(req.tenant);

    const teacher = await getTeacherRecord(req, sequelize);
    if (!teacher) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: Teacher profile not found for authenticated user.",
      });
    }

    const { date } = req.query;
    const rawDateStr = typeof date === "string" ? date.trim() : "";
    const todayDate = new Date().toISOString().split("T")[0];
    // Validate it's a proper YYYY-MM-DD date — partial dates like "2026-08-1" must be rejected
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDateStr) && !isNaN(new Date(rawDateStr).getTime());
    const attendanceDate = isValidDate ? rawDateStr : todayDate;

    const rows: any = await sequelize.query(
      `
      SELECT 
        s.id AS attendance_session_id,
        s.routine_entry_id,
        s.attendance_date,
        s.status,
        s.started_at,
        s.submitted_at,
        s.submitted_by,
        cre.period_number,
        cre.start_time,
        cre.end_time,
        cre.day_of_week,
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        c.id AS class_id,
        c.name AS class_name,
        t.id AS teacher_id,
        CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')) AS teacher_name,
        DATE_ADD(s.submitted_at, INTERVAL 3 DAY) AS correction_deadline
      FROM attendance_sessions s
      JOIN class_routine_entries cre ON cre.id = s.routine_entry_id
      JOIN class_routines cr ON cr.id = cre.routine_id
      JOIN subjects sub ON sub.id = cre.subject_id
      JOIN classes c ON c.id = cr.class_id
      JOIN teachers t ON t.id = cre.teacher_id
      WHERE cre.teacher_id = :teacherId
        AND s.attendance_date = :attendanceDate
        AND s.status = 'SUBMITTED'
        AND s.submitted_at IS NOT NULL
        AND cre.is_break = 0
        AND NOW() <= DATE_ADD(s.submitted_at, INTERVAL 3 DAY)
      ORDER BY cre.period_number ASC
    `,
      {
        replacements: { teacherId: teacher.id, attendanceDate },
        type: QueryTypes.SELECT,
      }
    );

    const resultList: any[] = Array.isArray(rows) ? rows : (rows ? [rows] : []);

    const formatted = resultList.map((r: any) => ({
      attendance_session_id: r.attendance_session_id,
      routine_entry_id: r.routine_entry_id,
      attendance_date: r.attendance_date,
      period_number: r.period_number,
      start_time: r.start_time,
      end_time: r.end_time,
      subject_id: r.subject_id,
      subject_name: r.subject_name,
      subject_code: r.subject_code,
      class_id: r.class_id,
      class_name: r.class_name,
      teacher_id: r.teacher_id,
      teacher_name: (r.teacher_name || "").trim(),
      submitted_at: r.submitted_at,
      correction_deadline: r.correction_deadline,
      correction_allowed: true,
    }));

    return res.status(200).json({
      status: 1,
      message: "Editable sessions retrieved successfully",
      data: formatted,
    });
  } catch (err: any) {
    console.error("Error fetching editable sessions:", err);
    return res.status(500).json({ status: 0, message: err.message || "Failed to fetch editable sessions" });
  }
}

/**
 * API #2 — LOAD ATTENDANCE RECORD FOR SELECTED SESSION
 * GET /api/student/session-attendance/correction/sessions/:attendanceSessionId
 */
export async function getCorrectionSessionDetails(req: any, res: Response): Promise<any> {
  try {
    const sequelize = getTenantSequelize(req.tenant);

    const teacher = await getTeacherRecord(req, sequelize);
    if (!teacher) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: Teacher profile not found for authenticated user.",
      });
    }

    const attendanceSessionId = Number(req.params.attendanceSessionId || req.query.session_id);
    if (!attendanceSessionId || isNaN(attendanceSessionId)) {
      return res.status(400).json({ status: 0, message: "Valid attendance_session_id is required" });
    }

    // 1. Fetch Session & Routine Info with Deadline Validation
    const [sessions]: any[] = await sequelize.query(
      `
      SELECT 
        s.id AS attendance_session_id,
        s.routine_entry_id,
        s.attendance_date,
        s.status,
        s.submitted_at,
        s.submitted_by,
        cre.teacher_id,
        cre.period_number,
        cre.start_time,
        cre.end_time,
        cre.day_of_week,
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        c.id AS class_id,
        c.name AS class_name,
        t.id AS teacher_profile_id,
        CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')) AS teacher_name,
        DATE_ADD(s.submitted_at, INTERVAL 3 DAY) AS correction_deadline,
        (NOW() <= DATE_ADD(s.submitted_at, INTERVAL 3 DAY)) AS is_within_deadline
      FROM attendance_sessions s
      JOIN class_routine_entries cre ON cre.id = s.routine_entry_id
      JOIN class_routines cr ON cr.id = cre.routine_id
      JOIN subjects sub ON sub.id = cre.subject_id
      JOIN classes c ON c.id = cr.class_id
      JOIN teachers t ON t.id = cre.teacher_id
      WHERE s.id = :sessionId
      LIMIT 1
    `,
      {
        replacements: { sessionId: attendanceSessionId },
        type: QueryTypes.SELECT,
      }
    );

    if (!sessions) {
      return res.status(404).json({ status: 0, message: "Attendance session not found" });
    }

    const sessionInfo = sessions;

    // 2. SECURITY AUTHORIZATION CHECK: Ownership
    if (Number(sessionInfo.teacher_id) !== Number(teacher.id)) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: You are not authorized to correct attendance for another teacher's session.",
      });
    }

    // 3. Status check: Only SUBMITTED sessions allowed
    if (sessionInfo.status !== "SUBMITTED" || !sessionInfo.submitted_at) {
      return res.status(400).json({
        status: 0,
        message: "Only submitted attendance sessions can be corrected.",
      });
    }

    // 4. Deadline check: Must be within 3-day correction window
    if (!sessionInfo.is_within_deadline) {
      return res.status(400).json({
        status: 0,
        message: "Attendance correction period has expired for this session.",
      });
    }

    // 5. Fetch Students & Existing Student Attendance Records
    const students: any[] = await sequelize.query(
      `
      SELECT 
        st.id AS student_pk,
        st.student_id AS student_code_raw,
        st.roll_number,
        TRIM(CONCAT(COALESCE(st.first_name, ''), ' ', COALESCE(st.middle_name, ''), ' ', COALESCE(st.last_name, ''))) AS student_name,
        dept.name AS dept_name,
        sa.id AS student_attendance_id,
        sa.attendance_status,
        sa.correction_reason
      FROM students st
      LEFT JOIN student_personal_details spd ON (spd.student_id = st.id OR spd.user_id = st.user_id)
      LEFT JOIN programs p ON p.id = spd.program_id
      LEFT JOIN departments dept ON dept.id = p.department_id
      LEFT JOIN student_attendance sa ON (sa.student_id = st.id AND sa.attendance_session_id = :sessionId)
      WHERE (
        spd.class_id = :classId 
        OR st.semester_id IN (SELECT semester_id FROM classes WHERE id = :classId)
        OR sa.id IS NOT NULL
      )
      ORDER BY st.roll_number ASC, st.first_name ASC, st.id ASC
    `,
      {
        replacements: { sessionId: attendanceSessionId, classId: sessionInfo.class_id },
        type: QueryTypes.SELECT,
      }
    );

    const formattedStudents = (students || []).map((r: any) => ({
      student_id: String(r.student_pk),
      student_code: r.student_code_raw || String(r.student_pk),
      student_name: (r.student_name || "").trim() || `Student ${r.student_pk}`,
      roll_number: r.roll_number || "N/A",
      dept_name: r.dept_name || "N/A",
      student_attendance_id: r.student_attendance_id || null,
      attendance_status: r.attendance_status || "ABSENT",
      correction_reason: r.correction_reason || null,
    }));

    return res.status(200).json({
      status: 1,
      message: "Session attendance details loaded for correction",
      data: {
        session: {
          attendance_session_id: sessionInfo.attendance_session_id,
          routine_entry_id: sessionInfo.routine_entry_id,
          attendance_date: sessionInfo.attendance_date,
          status: sessionInfo.status,
          submitted_at: sessionInfo.submitted_at,
          correction_deadline: sessionInfo.correction_deadline,
          period_number: sessionInfo.period_number,
          start_time: sessionInfo.start_time,
          end_time: sessionInfo.end_time,
          day_of_week: sessionInfo.day_of_week,
          subject: {
            id: sessionInfo.subject_id,
            name: sessionInfo.subject_name,
            code: sessionInfo.subject_code,
          },
          class: {
            id: sessionInfo.class_id,
            name: sessionInfo.class_name,
          },
          teacher: {
            id: sessionInfo.teacher_profile_id,
            name: (sessionInfo.teacher_name || "").trim(),
          },
        },
        students: formattedStudents,
      },
    });
  } catch (err: any) {
    console.error("Error fetching correction session details:", err);
    return res.status(500).json({ status: 0, message: err.message || "Failed to load session details for correction" });
  }
}

/**
 * API #3 (Batch) — SUBMIT ATTENDANCE CORRECTIONS FOR A SESSION
 * POST /api/student/session-attendance/correction/submit
 */
export async function submitSessionAttendanceCorrection(req: any, res: Response): Promise<any> {
  const sequelize = getTenantSequelize(req.tenant);
  const transaction = await sequelize.transaction();

  try {
    const teacher = await getTeacherRecord(req, sequelize);
    if (!teacher) {
      await transaction.rollback();
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: Teacher profile not found for authenticated user.",
      });
    }

    const { attendance_session_id, corrections } = req.body;

    if (!attendance_session_id || isNaN(Number(attendance_session_id))) {
      await transaction.rollback();
      return res.status(400).json({ status: 0, message: "Valid attendance_session_id is required" });
    }

    if (!Array.isArray(corrections) || corrections.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ status: 0, message: "No attendance corrections provided" });
    }

    // 1. Fetch & Verify Session Ownership, Status & 3-Day Deadline
    const [sessions]: any[] = await sequelize.query(
      `
      SELECT 
        s.id AS attendance_session_id,
        s.status,
        s.submitted_at,
        cre.teacher_id,
        (NOW() <= DATE_ADD(s.submitted_at, INTERVAL 3 DAY)) AS is_within_deadline
      FROM attendance_sessions s
      JOIN class_routine_entries cre ON cre.id = s.routine_entry_id
      WHERE s.id = :sessionId
      LIMIT 1
    `,
      {
        replacements: { sessionId: Number(attendance_session_id) },
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    if (!sessions) {
      await transaction.rollback();
      return res.status(404).json({ status: 0, message: "Attendance session not found" });
    }

    const session = sessions;

    // Ownership check
    if (Number(session.teacher_id) !== Number(teacher.id)) {
      await transaction.rollback();
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: You are not authorized to correct attendance for another teacher's session.",
      });
    }

    // Status check
    if (session.status !== "SUBMITTED" || !session.submitted_at) {
      await transaction.rollback();
      return res.status(400).json({ status: 0, message: "Only submitted sessions can be corrected." });
    }

    // Deadline check
    if (!session.is_within_deadline) {
      await transaction.rollback();
      return res.status(400).json({
        status: 0,
        message: "Attendance correction period has expired for this session.",
      });
    }

    // 2. Validate and Apply Corrections
    const now = new Date();
    let updatedCount = 0;

    for (const item of corrections) {
      const studentIdNum = Number(item.student_id);
      const statusStr = String(item.attendance_status || "").toUpperCase();
      const reasonStr = (item.correction_reason || "").trim();

      if (!["PRESENT", "ABSENT"].includes(statusStr)) {
        await transaction.rollback();
        return res.status(400).json({
          status: 0,
          message: `Invalid attendance status '${item.attendance_status}' for student ${item.student_id}`,
        });
      }

      // Mandatory non-empty correction reason
      if (!reasonStr || reasonStr.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          status: 0,
          message: "A meaningful correction reason is mandatory for every updated attendance record.",
        });
      }

      if (reasonStr.length > 500) {
        await transaction.rollback();
        return res.status(400).json({
          status: 0,
          message: "Correction reason exceeds maximum length of 500 characters.",
        });
      }

      if (item.student_attendance_id) {
        // Verify record belongs to this session before updating
        const [attRec]: any[] = await sequelize.query(
          `SELECT id, attendance_session_id FROM student_attendance WHERE id = :attId LIMIT 1`,
          {
            replacements: { attId: Number(item.student_attendance_id) },
            type: QueryTypes.SELECT,
            transaction,
          }
        );

        if (!attRec || Number(attRec.attendance_session_id) !== Number(session.attendance_session_id)) {
          await transaction.rollback();
          return res.status(400).json({
            status: 0,
            message: `Attendance record ${item.student_attendance_id} does not belong to the selected session.`,
          });
        }

        // Update existing row (marked_by & marked_at remain UNCHANGED, updated_at changes)
        await sequelize.query(
          `
          UPDATE student_attendance
          SET attendance_status = :status,
              correction_reason = :reason,
              updated_at = :now
          WHERE id = :attId AND attendance_session_id = :sessionId
        `,
          {
            replacements: {
              status: statusStr,
              reason: reasonStr,
              now,
              attId: Number(item.student_attendance_id),
              sessionId: Number(session.attendance_session_id),
            },
            transaction,
          }
        );
      } else {
        // Insert new row if missing
        await sequelize.query(
          `
          INSERT INTO student_attendance
            (attendance_session_id, student_id, attendance_status, correction_reason, marked_by, marked_at, created_at, updated_at)
          VALUES
            (:sessionId, :studentId, :status, :reason, :markedBy, :now, :now, :now)
          ON DUPLICATE KEY UPDATE
            attendance_status = VALUES(attendance_status),
            correction_reason = VALUES(correction_reason),
            updated_at = VALUES(updated_at)
        `,
          {
            replacements: {
              sessionId: Number(session.attendance_session_id),
              studentId: studentIdNum,
              status: statusStr,
              reason: reasonStr,
              markedBy: teacher.id,
              now,
            },
            transaction,
          }
        );
      }
      updatedCount++;
    }

    await transaction.commit();

    return res.status(200).json({
      status: 1,
      message: "Attendance corrections saved successfully",
      data: {
        attendance_session_id: Number(attendance_session_id),
        total_records_updated: updatedCount,
      },
    });
  } catch (err: any) {
    await transaction.rollback();
    console.error("Error submitting attendance correction:", err);
    return res.status(500).json({ status: 0, message: err.message || "Failed to save attendance corrections" });
  }
}

/**
 * API #3 (Single Record Patch) — CORRECT SINGLE STUDENT ATTENDANCE RECORD
 * PATCH /api/student/session-attendance/correction/:studentAttendanceId
 */
export async function correctSingleStudentAttendance(req: any, res: Response): Promise<any> {
  const sequelize = getTenantSequelize(req.tenant);

  try {
    const teacher = await getTeacherRecord(req, sequelize);
    if (!teacher) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: Teacher profile not found for authenticated user.",
      });
    }

    const studentAttendanceId = Number(req.params.studentAttendanceId);
    if (!studentAttendanceId || isNaN(studentAttendanceId)) {
      return res.status(400).json({ status: 0, message: "Valid studentAttendanceId is required" });
    }

    const { attendance_status, correction_reason } = req.body;
    const statusStr = String(attendance_status || "").toUpperCase();
    const reasonStr = String(correction_reason || "").trim();

    if (!["PRESENT", "ABSENT"].includes(statusStr)) {
      return res.status(400).json({ status: 0, message: "Invalid attendance_status. Must be PRESENT or ABSENT." });
    }

    if (!reasonStr || reasonStr.length === 0) {
      return res.status(400).json({ status: 0, message: "A meaningful correction_reason is required." });
    }

    if (reasonStr.length > 500) {
      return res.status(400).json({ status: 0, message: "correction_reason exceeds maximum length of 500 characters." });
    }

    // 1. Traverse student_attendance -> attendance_sessions -> class_routine_entries to verify ownership & 3-day window
    const [records]: any[] = await sequelize.query(
      `
      SELECT 
        sa.id AS student_attendance_id,
        sa.attendance_session_id,
        sa.student_id,
        s.status AS session_status,
        s.submitted_at,
        cre.teacher_id,
        (NOW() <= DATE_ADD(s.submitted_at, INTERVAL 3 DAY)) AS is_within_deadline
      FROM student_attendance sa
      JOIN attendance_sessions s ON s.id = sa.attendance_session_id
      JOIN class_routine_entries cre ON cre.id = s.routine_entry_id
      WHERE sa.id = :attId
      LIMIT 1
    `,
      {
        replacements: { attId: studentAttendanceId },
        type: QueryTypes.SELECT,
      }
    );

    if (!records) {
      return res.status(404).json({ status: 0, message: "Student attendance record not found" });
    }

    const rec = records;

    // Ownership check
    if (Number(rec.teacher_id) !== Number(teacher.id)) {
      return res.status(403).json({
        status: 0,
        message: "Authorization Error: You are not authorized to correct another teacher's attendance record.",
      });
    }

    // Session status check
    if (rec.session_status !== "SUBMITTED" || !rec.submitted_at) {
      return res.status(400).json({ status: 0, message: "Only submitted attendance records can be corrected." });
    }

    // Deadline check
    if (!rec.is_within_deadline) {
      return res.status(400).json({ status: 0, message: "Attendance correction period has expired for this session." });
    }

    // 2. Perform update
    const now = new Date();
    await sequelize.query(
      `
      UPDATE student_attendance
      SET attendance_status = :status,
          correction_reason = :reason,
          updated_at = :now
      WHERE id = :attId
    `,
      {
        replacements: {
          status: statusStr,
          reason: reasonStr,
          now,
          attId: studentAttendanceId,
        },
      }
    );

    const [updated]: any[] = await sequelize.query(
      `SELECT * FROM student_attendance WHERE id = :attId LIMIT 1`,
      { replacements: { attId: studentAttendanceId }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      status: 1,
      message: "Student attendance record corrected successfully",
      data: updated,
    });
  } catch (err: any) {
    console.error("Error correcting single student attendance:", err);
    return res.status(500).json({ status: 0, message: err.message || "Failed to correct student attendance record" });
  }
}

/**
 * Fetch all distinct subjects taught by the logged-in teacher
 */
export async function getTeacherSubjects(req: any, res: Response) {
  try {
    const sequelize = getTenantSequelize(req.tenant);
    const teacher = await getTeacherRecord(req, sequelize);
    if (!teacher || !teacher.id) {
      return res.status(404).json({ status: 0, message: "Teacher profile not found" });
    }

    const subjects: any = await sequelize.query(
      `
      SELECT DISTINCT 
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        cls.id AS class_id,
        cls.name AS class_name
      FROM class_routine_entries cre
      JOIN class_routines cr ON cr.id = cre.routine_id
      JOIN subjects sub ON sub.id = cre.subject_id
      LEFT JOIN classes cls ON cls.id = cr.class_id
      WHERE cre.teacher_id = :teacherId
        AND (cre.is_break = 0 OR cre.is_break IS NULL)
      ORDER BY sub.name ASC, cls.name ASC;
    `,
      {
        replacements: { teacherId: teacher.id },
        type: QueryTypes.SELECT,
      }
    );

    const subjectList = Array.isArray(subjects) ? subjects : subjects ? [subjects] : [];

    return res.status(200).json({
      status: 1,
      message: "Teacher subjects retrieved successfully",
      data: subjectList,
    });
  } catch (err: any) {
    console.error("Error fetching teacher subjects:", err);
return res.status(500).json({ status: 0, message: err.message || "Failed to fetch teacher subjects" });
  }
}

/**
 * Fetch subject-wise student attendance statistics & session heatmap records
 */
export async function getTeacherSubjectStats(req: any, res: Response) {
  try {
    const sequelize = getTenantSequelize(req.tenant);
    const teacher = await getTeacherRecord(req, sequelize);
    if (!teacher || !teacher.id) {
      return res.status(404).json({ status: 0, message: "Teacher profile not found" });
    }

    const { subject_id, routine_entry_id, startDate, endDate } = req.query;

    if (!subject_id && !routine_entry_id) {
      return res.status(400).json({ status: 0, message: "subject_id or routine_entry_id is required" });
    }

    // 1. Get class routine entries taught by this teacher for this subject or routine_entry_id
    let entryConditions = `cre.teacher_id = :teacherId`;
    const replacements: any = { teacherId: teacher.id };

    if (routine_entry_id) {
      entryConditions += ` AND cre.id = :routineEntryId`;
      replacements.routineEntryId = Number(routine_entry_id);
    } else if (subject_id) {
      entryConditions += ` AND cre.subject_id = :subjectId`;
      replacements.subjectId = Number(subject_id);
    }

    const routineEntries: any[] = await sequelize.query(
      `
      SELECT 
        cre.id AS routine_entry_id,
        cre.routine_id,
        cre.subject_id,
        cre.period_number,
        cre.start_time,
        cre.end_time,
        sub.name AS subject_name,
        sub.code AS subject_code,
        cls.id AS class_id,
        cls.name AS class_name,
        cls.semester_id
      FROM class_routine_entries cre
      JOIN class_routines cr ON cr.id = cre.routine_id
      JOIN subjects sub ON sub.id = cre.subject_id
      LEFT JOIN classes cls ON cls.id = cr.class_id
      WHERE ${entryConditions}
    `,
      { replacements, type: QueryTypes.SELECT }
    );

    if (!routineEntries || routineEntries.length === 0) {
      return res.status(200).json({
        status: 1,
        message: "No routine entries found for this teacher and subject",
        data: [],
        session_dates: [],
        sessions: [],
        student_heatmap: [],
        meta: null,
      });
    }

    const routineEntryIds = routineEntries.map((r) => r.routine_entry_id);
    const classIds = Array.from(new Set(routineEntries.map((r) => r.class_id).filter(Boolean)));
    const primarySubject = routineEntries[0];

    // 2. Fetch actual submitted attendance sessions in the date range
    let sessionDateCondition = "";
    if (startDate && endDate) {
      sessionDateCondition = ` AND DATE(ats.attendance_date) BETWEEN :startDate AND :endDate`;
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    } else if (startDate) {
      sessionDateCondition = ` AND DATE(ats.attendance_date) = :startDate`;
      replacements.startDate = startDate;
    }

    replacements.routineEntryIds = routineEntryIds;

    const sessions: any[] = await sequelize.query(
      `
      SELECT 
        ats.id AS attendance_session_id,
        DATE_FORMAT(ats.attendance_date, '%Y-%m-%d') AS attendance_date,
        ats.routine_entry_id,
        ats.status,
        cre.period_number,
        cre.start_time,
        cre.end_time,
        sub.name AS subject_name,
        sub.code AS subject_code,
        cls.name AS class_name
      FROM attendance_sessions ats
      JOIN class_routine_entries cre ON cre.id = ats.routine_entry_id
      JOIN subjects sub ON sub.id = cre.subject_id
      LEFT JOIN class_routines cr ON cr.id = cre.routine_id
      LEFT JOIN classes cls ON cls.id = cr.class_id
      WHERE ats.routine_entry_id IN (:routineEntryIds)
        AND ats.status = 'SUBMITTED'
        AND EXISTS (SELECT 1 FROM student_attendance sa WHERE sa.attendance_session_id = ats.id)
        ${sessionDateCondition}
      ORDER BY ats.attendance_date ASC, cre.period_number ASC, cre.start_time ASC;
    `,
      { replacements, type: QueryTypes.SELECT }
    );

    // 3. Fetch enrolled students
    let enrolledStudents: any[] = [];
    if (classIds.length > 0) {
      enrolledStudents = await sequelize.query(
        `
        SELECT 
          st.id AS student_pk,
          st.student_id AS student_code,
          TRIM(CONCAT(st.first_name, ' ', COALESCE(st.middle_name, ''), ' ', st.last_name)) AS student_name,
          COALESCE(st.roll_number, 'N/A') AS roll_number,
          COALESCE(d.name, 'N/A') AS dept_name
        FROM students st
        LEFT JOIN student_personal_details spd ON spd.student_id = st.id
        LEFT JOIN programs p ON p.id = spd.program_id
        LEFT JOIN departments d ON d.id = p.department_id
        WHERE (
          spd.class_id IN (:classIds)
          OR st.semester_id IN (SELECT semester_id FROM classes WHERE id IN (:classIds))
        )
        ORDER BY st.first_name ASC, st.last_name ASC;
      `,
        { replacements: { classIds }, type: QueryTypes.SELECT }
      );
    }

    // 4. Fetch actual attendance marks for these sessions
    const sessionIds = sessions.map((s) => s.attendance_session_id);
    let attendanceRecords: any[] = [];

    if (sessionIds.length > 0) {
      attendanceRecords = await sequelize.query(
        `
        SELECT 
          sa.attendance_session_id,
          sa.student_id,
          sa.attendance_status,
          DATE_FORMAT(ats.attendance_date, '%Y-%m-%d') AS attendance_date
        FROM student_attendance sa
        JOIN attendance_sessions ats ON ats.id = sa.attendance_session_id
        WHERE sa.attendance_session_id IN (:sessionIds);
      `,
        { replacements: { sessionIds }, type: QueryTypes.SELECT }
      );
    }

    // Map student attendance by student_pk/student_id and session_id
    const studentSessionMap = new Map<string, Record<number, "PRESENT" | "ABSENT">>();
    const studentDateMap = new Map<string, Record<string, "PRESENT" | "ABSENT">>();

    attendanceRecords.forEach((att) => {
      const sId = String(att.student_id);
      if (!studentSessionMap.has(sId)) {
        studentSessionMap.set(sId, {});
      }
      studentSessionMap.get(sId)![att.attendance_session_id] = att.attendance_status;

      if (!studentDateMap.has(sId)) {
        studentDateMap.set(sId, {});
      }
      studentDateMap.get(sId)![att.attendance_date] = att.attendance_status;
    });

    const totalSessions = sessions.length;

    // 5. Aggregate statistics per student
    const studentStatsList: any[] = [];
    const studentHeatmapList: any[] = [];

    enrolledStudents.forEach((student) => {
      const sPk = String(student.student_pk);
      const sSessionStatus = studentSessionMap.get(sPk) || {};
      const sDateStatus = studentDateMap.get(sPk) || {};

      let presentCount = 0;
      let absentCount = 0;

      // Session detail breakdown
      const sessionAttendanceDetails: {
        attendance_session_id: number;
        attendance_date: string;
        period_number: number;
        start_time: string;
        end_time: string;
        status: "PRESENT" | "ABSENT";
      }[] = [];

      sessions.forEach((sess) => {
        const status = sSessionStatus[sess.attendance_session_id] || "ABSENT";
        if (status === "PRESENT") {
          presentCount++;
        } else {
          absentCount++;
        }
        sessionAttendanceDetails.push({
          attendance_session_id: sess.attendance_session_id,
          attendance_date: sess.attendance_date,
          period_number: sess.period_number,
          start_time: sess.start_time,
          end_time: sess.end_time,
          status,
        });
      });

      const totalDays = totalSessions;
      const pct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

      // Table Stat record
      studentStatsList.push({
        student_id: String(student.student_pk),
        student_code: student.student_code,
        student_name: student.student_name,
        roll_number: student.roll_number,
        dept_name: student.dept_name,
        present_days: presentCount,
        absent_days: absentCount,
        total_days: totalDays,
        attendance_percentage: pct,
      });

      // Heatmap matrix record
      studentHeatmapList.push({
        student_id: String(student.student_pk),
        student_code: student.student_code,
        student_name: student.student_name,
        roll_number: student.roll_number,
        dept_name: student.dept_name,
        attendance_by_date: sDateStatus,
        attendance_by_session: sSessionStatus,
        sessions: sessionAttendanceDetails,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_percentage: pct,
      });
    });

    const uniqueDates = Array.from(new Set(sessions.map((s) => s.attendance_date)));
    // Return every requested calendar date, even when no class was submitted on
    // a date. The heatmap uses this to show both ends of the selected range.
    const rangeDates: string[] = [];
    if (startDate && endDate) {
      const cursor = new Date(`${startDate}T00:00:00.000Z`);
      const lastDate = new Date(`${endDate}T00:00:00.000Z`);
      while (cursor <= lastDate) {
        rangeDates.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    return res.status(200).json({
      status: 1,
      message: "Subject attendance statistics retrieved successfully",
      data: studentStatsList,
      session_dates: uniqueDates,
      range_dates: rangeDates.length > 0 ? rangeDates : uniqueDates,
      sessions,
      student_heatmap: studentHeatmapList,
      meta: {
        subject_id: primarySubject.subject_id,
        subject_name: primarySubject.subject_name,
        subject_code: primarySubject.subject_code,
        class_name: primarySubject.class_name,
        total_sessions: totalSessions,
      },
    });
  } catch (err: any) {
    console.error("Error fetching subject attendance stats:", err);
    return res.status(500).json({ status: 0, message: err.message || "Failed to fetch subject attendance statistics" });
  }
}
