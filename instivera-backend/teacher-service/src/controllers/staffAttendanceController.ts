import { Request, Response, NextFunction } from "express";
import staffAttendanceService from "../services/staffAttendanceService";
import { AppError } from "../utils/appError";

/**
 * Mark attendance for a single staff member
 */
export async function markStaffAttendance(req, res: Response, next: NextFunction) {
  try {
    const { employee_id, attendance_date, attendance_status } = req.body;

    if (!employee_id || !attendance_date || !attendance_status) {
      throw new AppError("employee_id, attendance_date, and attendance_status are required", 400);
    }

    const record = await staffAttendanceService.markAttendance(req.body, req.tenant);

    return res.status(201).json({
      status: 1,
      message: "Attendance marked successfully",
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk mark attendance for multiple staff members
 */
export async function bulkMarkStaffAttendance(req, res: Response, next: NextFunction) {
  try {
    const { date, staff, marked_by } = req.body;

    if (!date || !staff || !Array.isArray(staff) || staff.length === 0) {
      throw new AppError("date and staff array are required", 400);
    }

    const results = await staffAttendanceService.bulkMarkAttendance(
      date,
      staff.map((s: any) => ({
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        department_id: s.department_id,
        designation: s.designation,
        status: s.status,
      })),
      marked_by || "ADMIN",
      req.tenant
    );

    return res.status(200).json({
      status: 1,
      message: `Attendance processed: ${results.created} created, ${results.updated} updated`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance summary with stats
 */
export async function getStaffAttendanceSummary(req, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, department_id } = req.query;

    const summary = await staffAttendanceService.getAttendanceSummary({
      startDate: startDate as string,
      endDate: endDate as string,
      department_id: department_id ? Number(department_id) : undefined
    }, req.tenant);

    return res.status(200).json({
      status: 1,
      message: "Attendance summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance report for PDF generation
 */
export async function getStaffAttendanceReport(req, res: Response, next: NextFunction) {
  try {
    const { date, month, year, department_id, format } = req.query;

    const records = await staffAttendanceService.getAttendanceReport({
      date: date as string,
      month: month as string,
      year: year as string,
      department_id: department_id ? Number(department_id) : undefined      
    }, req.tenant);

    if (format === "html") {
      const html = generateReportHtml(records, {
        date: date as string,
        month: month as string,
        year: year as string,
      });
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(html);
    }

    return res.status(200).json({
      status: 1,
      message: "Attendance report fetched successfully",
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

function generateReportHtml(records: any[], filters: { date?: string; month?: string; year?: string }) {
  const isMonth = !!(filters.month && filters.year);
  let tableHtml = "";

  if (isMonth) {
    const teachersMap = new Map<string, { id: string; name: string }>();
    records.forEach((r) => {
      if (!teachersMap.has(r.employee_id)) {
        teachersMap.set(r.employee_id, {
          id: r.employee_id,
          name: r.employee_name || r.employee_id,
        });
      }
    });
    const teachers = Array.from(teachersMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const dates = Array.from(new Set(records.map((r) => r.attendance_date))).sort();
    const statusMap = new Map<string, string>();
    records.forEach((r) => {
      statusMap.set(`${r.attendance_date}_${r.employee_id}`, r.attendance_status);
    });

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            ${teachers.map((t) => `<th><div>${t.name}</div><div style="font-size: 10px; font-weight: normal; opacity: 0.85; margin-top: 2px;">(${t.id})</div></th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${dates
            .map(
              (d) => `
            <tr>
              <td style="font-weight: 600; color: #334155;">${d}</td>
              ${teachers
                .map((t) => {
                  const status = statusMap.get(`${d}_${t.id}`);
                  if (!status) return `<td style="color: #cbd5e1;">-</td>`;
                  return `<td><span class="badge ${status.toLowerCase()}">${status}</span></td>`;
                })
                .join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } else {
    tableHtml = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map(
              (r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><div>${r.employee_name || "N/A"}</div><div style="font-size: 10px; color: #64748b;">(${r.employee_id})</div></td>
              <td>${r.employee_id}</td>
              <td>${r.attendance_date}</td>
              <td><span class="badge ${r.attendance_status?.toLowerCase()}">${r.attendance_status}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  const monthName = filters.month
    ? new Date(2000, parseInt(filters.month, 10) - 1).toLocaleString("default", { month: "long" })
    : "";

  const logoSvg = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="189px" height="55.25px" viewBox="0 0 189 55.25" enable-background="new 0 0 189 55.25" xml:space="preserve">
<g>
	<linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="5.8906" y1="25.1699" x2="90.4486" y2="25.1699">
		<stop offset="0" style="stop-color:#F0A949"/>
		<stop offset="0.601" style="stop-color:#E27A45"/>
		<stop offset="0.6024" style="stop-color:#E27A45"/>
		<stop offset="0.7451" style="stop-color:#EC9C48"/>
		<stop offset="0.8227" style="stop-color:#F0A949"/>
		<stop offset="0.8943" style="stop-color:#EC8946"/>
		<stop offset="0.9586" style="stop-color:#EA7344"/>
		<stop offset="1" style="stop-color:#E96B43"/>
	</linearGradient>
	<path fill="url(#SVGID_1_)" d="M11.418,16.06v20.616H6.516V16.06c0,0,1.563-0.377,2.452-2.397 C9.394,15.322,11.418,16.06,11.418,16.06z"/>
	<linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="5.8906" y1="24.6357" x2="90.4494" y2="24.6357">
		<stop offset="0" style="stop-color:#F0A949"/>
		<stop offset="0.601" style="stop-color:#E27A45"/>
		<stop offset="0.6024" style="stop-color:#E27A45"/>
		<stop offset="0.7451" style="stop-color:#EC9C48"/>
		<stop offset="0.8227" style="stop-color:#F0A949"/>
		<stop offset="0.8943" style="stop-color:#EC8946"/>
		<stop offset="0.9586" style="stop-color:#EA7344"/>
		<stop offset="1" style="stop-color:#E96B43"/>
	</linearGradient>
	<path fill="url(#SVGID_2_)" d="M34.833,13.756c1.476,0.774,2.629,1.92,3.461,3.44c0.831,1.521,1.246,3.354,1.246,5.505v13.975 h-4.858V23.431c0-2.121-0.532-3.746-1.592-4.879c-1.06-1.134-2.508-1.7-4.343-1.7c-1.835,0-3.29,0.566-4.365,1.7 c-1.074,1.133-1.612,2.758-1.612,4.879v13.245h-4.902V12.982h4.902v2.708c0.802-0.973,1.828-1.734,3.075-2.278 c1.247-0.544,2.572-0.817,3.978-0.817C31.687,12.595,33.355,12.982,34.833,13.756z"/>
	<linearGradient id="SVGID_3_" gradientUnits="userSpaceOnUse" x1="5.8887" y1="24.8301" x2="90.452" y2="24.8301">
		<stop offset="0" style="stop-color:#F0A949"/>
		<stop offset="0.601" style="stop-color:#E27A45"/>
		<stop offset="0.6024" style="stop-color:#E27A45"/>
		<stop offset="0.7451" style="stop-color:#EC9C48"/>
		<stop offset="0.8227" style="stop-color:#F0A949"/>
		<stop offset="0.8943" style="stop-color:#EC8946"/>
		<stop offset="0.9586" style="stop-color:#EA7344"/>
		<stop offset="1" style="stop-color:#E96B43"/>
	</linearGradient>
	<path fill="url(#SVGID_3_)" d="M49.367,36.053c-1.477-0.673-2.645-1.592-3.504-2.752c-0.861-1.162-1.32-2.458-1.377-3.891h5.075 c0.086,1.003,0.565,1.841,1.44,2.516c0.875,0.673,1.971,1.01,3.29,1.01c1.376,0,2.444-0.265,3.205-0.797 c0.759-0.529,1.14-1.21,1.14-2.041c0-0.889-0.424-1.548-1.27-1.979c-0.845-0.429-2.186-0.901-4.021-1.418 c-1.778-0.487-3.225-0.96-4.344-1.42c-1.117-0.458-2.084-1.16-2.901-2.107c-0.817-0.946-1.226-2.192-1.226-3.74 c0-1.261,0.372-2.415,1.118-3.462c0.745-1.047,1.813-1.871,3.203-2.473c1.391-0.602,2.989-0.903,4.795-0.903 c2.694,0,4.866,0.681,6.515,2.042s2.53,3.218,2.646,5.568h-4.903c-0.084-1.061-0.515-1.906-1.29-2.537 c-0.773-0.631-1.82-0.947-3.139-0.947c-1.291,0-2.278,0.244-2.967,0.732c-0.688,0.488-1.033,1.133-1.033,1.935 c0,0.632,0.23,1.161,0.688,1.592c0.459,0.43,1.018,0.768,1.677,1.012c0.659,0.242,1.635,0.551,2.925,0.924 c1.72,0.458,3.131,0.924,4.236,1.396c1.103,0.474,2.056,1.169,2.859,2.087c0.802,0.917,1.218,2.137,1.248,3.654 c0,1.349-0.373,2.553-1.119,3.613c-0.745,1.062-1.799,1.892-3.16,2.494c-1.362,0.601-2.96,0.903-4.795,0.903 C52.514,37.064,50.844,36.727,49.367,36.053z"/>
	<linearGradient id="SVGID_4_" gradientUnits="userSpaceOnUse" x1="5.8872" y1="21.8828" x2="90.4514" y2="21.8828">
		<stop offset="0" style="stop-color:#F0A949"/>
		<stop offset="0.601" style="stop-color:#E27A45"/>
		<stop offset="0.6024" style="stop-color:#E27A45"/>
		<stop offset="0.7451" style="stop-color:#EC9C48"/>
		<stop offset="0.8227" style="stop-color:#F0A949"/>
		<stop offset="0.8943" style="stop-color:#EC8946"/>
		<stop offset="0.9586" style="stop-color:#EA7344"/>
		<stop offset="1" style="stop-color:#E96B43"/>
	</linearGradient>
	<path fill="url(#SVGID_4_)" d="M74.459,16.98v13.117c0,0.889,0.208,1.526,0.625,1.913c0.415,0.388,1.124,0.58,2.127,0.58h3.011 v4.085h-3.87c-2.208,0-3.898-0.515-5.074-1.547c-1.176-1.033-1.764-2.71-1.764-5.031V16.98h-2.795v-3.999h2.795V7.09h4.946v5.892 h5.763v3.999H74.459z"/>
	<linearGradient id="SVGID_5_" gradientUnits="userSpaceOnUse" x1="5.8994" y1="21.9111" x2="90.45" y2="21.9111">
		<stop offset="0" style="stop-color:#F0A949"/>
		<stop offset="0.601" style="stop-color:#E27A45"/>
		<stop offset="0.6024" style="stop-color:#E27A45"/>
		<stop offset="0.7451" style="stop-color:#EC9C48"/>
		<stop offset="0.8227" style="stop-color:#F0A949"/>
		<stop offset="0.8943" style="stop-color:#EC8946"/>
		<stop offset="0.9586" style="stop-color:#EA7344"/>
		<stop offset="1" style="stop-color:#E96B43"/>
	</linearGradient>
	<path fill="url(#SVGID_5_)" d="M84.994,12.522c-0.601-0.602-0.902-1.347-0.902-2.236c0-0.889,0.301-1.635,0.902-2.237 c0.603-0.602,1.348-0.903,2.237-0.903c0.861,0,1.591,0.301,2.193,0.903c0.602,0.602,0.902,1.348,0.902,2.237 c0,0.889-0.3,1.634-0.902,2.236c-0.603,0.602-1.333,0.903-2.193,0.903C86.342,13.425,85.597,13.124,84.994,12.522z M89.64,16.117 v20.559h-4.902V16.117H89.64z"/>
</g>
<path fill-rule="evenodd" clip-rule="evenodd" fill="#FFFFFF" d="M5.748,9.121C4.818,9.012,3.943,8.938,3.08,8.799 c-0.944-0.153-1.618-0.716-1.8-1.656c-0.214-1.104,0.063-2.129,1-2.836C3.067,3.712,3.943,3.77,4.795,4.206 c0.487,0.249,0.954,0.538,1.434,0.802c0.154,0.085,0.324,0.146,0.639,0.285C6.704,4.335,6.549,3.529,6.429,2.718 c-0.143-0.957,0.228-1.71,1.026-2.226c1.57-1.011,3.797-0.117,3.947,1.654c0.062,0.731-0.286,1.498-0.453,2.248 C10.882,4.699,10.799,5,10.683,5.46c0.325-0.141,0.509-0.206,0.68-0.297c0.633-0.338,1.251-0.707,1.895-1.021 c0.848-0.415,1.708-0.399,2.448,0.216c0.871,0.724,1.177,1.715,0.937,2.805c-0.22,0.989-0.944,1.542-1.929,1.663 C13.822,8.936,12.916,8.942,11.895,9c0.41,0.37,0.784,0.714,1.166,1.048c0.284,0.249,0.584,0.479,0.869,0.729 c1.07,0.944,1.006,2.55-0.085,3.469c-1.661,1.399-3.42,0.773-4.074-0.934c-0.162-0.421-0.376-0.824-0.573-1.232 c-0.063-0.129-0.144-0.249-0.302-0.518c-0.303,0.696-0.562,1.265-0.801,1.842c-0.518,1.246-1.611,1.885-2.791,1.527 c-1.059-0.323-2.325-1.289-2.03-2.8c0.082-0.42,0.302-0.86,0.581-1.184c0.441-0.511,0.987-0.932,1.485-1.396 C5.481,9.416,5.611,9.265,5.748,9.121z M13.239,6.638c0.014,0.027,0.028,0.054,0.042,0.083c-0.451,0.174-0.917,0.32-1.347,0.54 c-0.15,0.077-0.295,0.34-0.288,0.51c0.012,0.265,0.115,0.721,0.253,0.752c1.196,0.259,2.418,0.269,3.54-0.261 c0.92-0.432,1.142-1.377,0.772-2.609c-0.389-1.296-1.591-1.843-2.809-1.257c-0.542,0.26-1.063,0.569-1.591,0.858 c-0.356,0.194-0.707,0.393-1.077,0.599c0.36,0.651,0.68,1.169,1.497,0.912C12.55,6.664,12.902,6.677,13.239,6.638z M4.706,6.728 c0.004-0.025,0.008-0.051,0.01-0.076c0.319,0.037,0.659,0.016,0.95,0.125c0.627,0.233,0.929-0.11,1.24-0.553 C7.079,5.978,7.076,5.83,6.813,5.683c-0.792-0.442-1.57-0.908-2.374-1.328c-0.591-0.311-1.2-0.261-1.789,0.056 C1.985,4.768,1.764,5.406,1.586,6.076C1.302,7.141,1.914,8.244,2.993,8.469c0.734,0.155,1.492,0.237,2.244,0.264 c0.94,0.034,0.998-0.042,0.961-0.97c-0.006-0.186-0.19-0.43-0.36-0.53C5.484,7.022,5.086,6.891,4.706,6.728z M11.517,11.491 c-0.032,0.022-0.066,0.043-0.099,0.065c-0.165-0.177-0.351-0.338-0.49-0.534c-0.389-0.551-0.855-0.608-1.451-0.339 c-0.328,0.149-0.464,0.299-0.3,0.635c0.405,0.83,0.792,1.669,1.224,2.482c0.126,0.236,0.363,0.439,0.593,0.588 c0.998,0.645,2.025,0.311,2.937-0.717c0.685-0.772,0.639-1.84-0.099-2.556c-0.661-0.642-1.379-1.226-2.089-1.813 c-0.083-0.07-0.354-0.063-0.41,0.009c-0.285,0.375-0.686,0.729-0.232,1.277C11.305,10.834,11.382,11.187,11.517,11.491z M8.866,3.692c0.04,0,0.078-0.002,0.117-0.003c0.055,0.419,0.111,0.836,0.166,1.254C9.222,5.5,9.717,5.43,10.07,5.502 c0.095,0.019,0.321-0.29,0.383-0.481c0.213-0.665,0.38-1.343,0.565-2.017c0.243-0.88,0.004-1.651-0.676-2.175 c-0.638-0.49-1.873-0.565-2.586-0.157C6.987,1.11,6.612,1.883,6.75,2.781c0.112,0.728,0.22,1.457,0.384,2.173 C7.192,5.2,7.397,5.575,7.576,5.601c0.541,0.077,1.091-0.348,1.146-0.757C8.773,4.46,8.818,4.076,8.866,3.692z M6.244,9.151 c-0.716,0.661-1.5,1.332-2.219,2.066c-0.554,0.564-0.651,1.297-0.318,2.001c0.403,0.854,1.13,1.375,2.072,1.473 c0.803,0.084,1.451-0.281,1.817-1.008c0.347-0.69,0.628-1.414,0.93-2.125c0.116-0.269,0.351-0.615-0.041-0.784 c-0.371-0.161-0.8-0.531-1.226-0.029c-0.248,0.295-0.529,0.564-0.795,0.845C6.704,10.748,7.518,9.924,6.244,9.151z"/>
<g>
	<linearGradient id="SVGID_6_" gradientUnits="userSpaceOnUse" x1="98.1475" y1="24.8301" x2="188.3197" y2="24.8301">
		<stop offset="0" style="stop-color:#E95A43"/>
		<stop offset="1" style="stop-color:#E13A43"/>
	</linearGradient>
	<path fill="url(#SVGID_6_)" d="M142.404,26.657h-18.105c0.145,1.893,0.846,3.412,2.109,4.56c1.26,1.146,2.809,1.719,4.644,1.719 c2.638,0,4.501-1.104,5.591-3.312h5.288c-0.717,2.179-2.015,3.963-3.892,5.354c-1.877,1.391-4.207,2.086-6.987,2.086 c-2.266,0-4.295-0.509-6.086-1.528c-1.791-1.018-3.196-2.45-4.215-4.299c-1.018-1.851-1.526-3.993-1.526-6.429 c0-2.438,0.495-4.581,1.484-6.43c0.989-1.85,2.379-3.275,4.171-4.279c1.791-1.003,3.849-1.504,6.172-1.504 c2.235,0,4.229,0.487,5.978,1.461c1.747,0.976,3.109,2.345,4.086,4.107c0.973,1.763,1.461,3.792,1.461,6.085 C142.576,25.138,142.519,25.94,142.404,26.657z M137.458,22.701c-0.028-1.807-0.673-3.255-1.934-4.344 c-1.264-1.089-2.825-1.635-4.688-1.635c-1.691,0-3.14,0.539-4.342,1.613c-1.206,1.076-1.923,2.531-2.151,4.366H137.458z"/>
	<linearGradient id="SVGID_7_" gradientUnits="userSpaceOnUse" x1="98.1475" y1="24.6357" x2="188.3191" y2="24.6357">
		<stop offset="0" style="stop-color:#E95A43"/>
		<stop offset="1" style="stop-color:#E13A43"/>
	</linearGradient>
	<path fill="url(#SVGID_7_)" d="M155.154,13.605c1.188-0.673,2.601-1.01,4.235-1.01v5.074h-1.247c-1.921,0-3.375,0.487-4.364,1.461 c-0.989,0.976-1.484,2.666-1.484,5.075v12.47h-4.902V12.982h4.902v3.44C153.011,15.218,153.964,14.279,155.154,13.605z"/>
	<linearGradient id="SVGID_8_" gradientUnits="userSpaceOnUse" x1="98.1484" y1="24.8301" x2="188.3185" y2="24.8301">
		<stop offset="0" style="stop-color:#E95A43"/>
		<stop offset="1" style="stop-color:#E13A43"/>
	</linearGradient>
	<path fill="url(#SVGID_8_)" d="M163.754,18.4c0.989-1.835,2.336-3.261,4.043-4.279c1.705-1.018,3.591-1.526,5.654-1.526 c1.863,0,3.49,0.366,4.881,1.096c1.39,0.731,2.502,1.641,3.333,2.731v-3.44h4.945v23.694h-4.945V33.15 c-0.831,1.117-1.964,2.051-3.397,2.796c-1.434,0.744-3.067,1.118-4.902,1.118c-2.036,0-3.899-0.523-5.591-1.57 c-1.69-1.048-3.031-2.509-4.021-4.387c-0.989-1.876-1.483-4.006-1.483-6.387C162.271,22.343,162.765,20.235,163.754,18.4z M180.655,20.55c-0.675-1.204-1.557-2.121-2.646-2.752c-1.089-0.63-2.264-0.946-3.525-0.946s-2.438,0.308-3.526,0.924 c-1.091,0.617-1.971,1.52-2.646,2.71c-0.673,1.189-1.01,2.602-1.01,4.234c0,1.635,0.337,3.068,1.01,4.301 c0.675,1.233,1.563,2.172,2.667,2.818c1.104,0.645,2.272,0.967,3.505,0.967c1.262,0,2.437-0.315,3.525-0.946 c1.09-0.631,1.972-1.554,2.646-2.774c0.673-1.218,1.01-2.643,1.01-4.277C181.665,23.173,181.328,21.754,180.655,20.55z"/>
	<linearGradient id="SVGID_9_" gradientUnits="userSpaceOnUse" x1="98.1484" y1="22.4658" x2="188.3185" y2="22.4658">
		<stop offset="0" style="stop-color:#E95A43"/>
		<stop offset="1" style="stop-color:#E13A43"/>
	</linearGradient>
	<path fill="url(#SVGID_9_)" d="M94.342,21.064l5.031-0.043c1.323,0.509,4.094,7.396,4.299,10.034c0,0,1.819-10.067,10.049-17.193 c10.329-8.947,22.105-7.195,31.697-2.768c-11.253-2.644-21.646-2.958-29.393,5.842c-4.396,4.996-8.219,11.523-9.144,20.539h-5.673 C101.209,37.476,100.762,29.051,94.342,21.064z"/>
</g>
<g>
	<g>
		<path fill="#FFFFFF" d="M11.447,52.194H8.708l-0.453,1.311H6.807l2.474-6.888h1.605l2.474,6.888H11.9L11.447,52.194z M11.073,51.091l-0.995-2.877l-0.995,2.877H11.073z"/>
		<path fill="#FFFFFF" d="M21.35,53.505h-1.38l-3.123-4.72v4.72h-1.38v-6.888h1.38l3.123,4.729v-4.729h1.38V53.505z"/>
		<path fill="#FFFFFF" d="M28.798,46.628v6.877h-1.379v-6.877H28.798z"/>
		<path fill="#FFFFFF" d="M37.223,53.505h-1.38l-3.123-4.72v4.72h-1.38v-6.888h1.38l3.123,4.729v-4.729h1.38V53.505z"/>
		<path fill="#FFFFFF" d="M41.144,46.628v6.877h-1.379v-6.877H41.144z"/>
		<path fill="#FFFFFF" d="M48.366,46.628v1.113h-1.833v5.764h-1.379v-5.764h-1.833v-1.113H48.366z"/>
		<path fill="#FFFFFF" d="M51.933,46.628v6.877h-1.379v-6.877H51.933z"/>
		<path fill="#FFFFFF" d="M58.692,52.194h-2.739L55.5,53.505h-1.448l2.473-6.888h1.606l2.473,6.888h-1.458L58.692,52.194z M58.317,51.091l-0.995-2.877l-0.995,2.877H58.317z"/>
		<path fill="#FFFFFF" d="M67.392,46.628v1.113H65.56v5.764h-1.38v-5.764h-1.832v-1.113H67.392z"/>
		<path fill="#FFFFFF" d="M70.959,46.628v6.877h-1.38v-6.877H70.959z"/>
		<path fill="#FFFFFF" d="M79.679,46.628l-2.522,6.877h-1.675l-2.522-6.877h1.478l1.893,5.468l1.882-5.468H79.679z"/>
		<path fill="#FFFFFF" d="M83.068,47.741v1.724h2.315v1.094h-2.315v1.823h2.611v1.123h-3.991v-6.888h3.991v1.124H83.068z"/>
		<path fill="#FFFFFF" d="M96.498,50.559c0.25,0.315,0.375,0.677,0.375,1.084c0,0.368-0.092,0.691-0.271,0.971 c-0.182,0.279-0.441,0.497-0.783,0.655c-0.342,0.157-0.746,0.236-1.213,0.236H91.64v-6.877h2.838c0.467,0,0.869,0.075,1.208,0.227 c0.338,0.15,0.594,0.361,0.768,0.63c0.174,0.27,0.262,0.575,0.262,0.917c0,0.4-0.107,0.735-0.32,1.005s-0.498,0.46-0.853,0.571 C95.93,50.05,96.248,50.243,96.498,50.559z M93.02,49.465h1.261c0.329,0,0.582-0.073,0.759-0.222 c0.178-0.147,0.267-0.359,0.267-0.635c0-0.276-0.089-0.489-0.267-0.641c-0.177-0.151-0.43-0.227-0.759-0.227H93.02V49.465z M95.192,52.146c0.187-0.158,0.28-0.381,0.28-0.67c0-0.296-0.098-0.527-0.295-0.695c-0.197-0.167-0.464-0.251-0.799-0.251H93.02 v1.853h1.39C94.744,52.382,95.005,52.303,95.192,52.146z"/>
		<path fill="#FFFFFF" d="M104.627,46.628l-2.325,4.482v2.395h-1.38V51.11l-2.335-4.482h1.557l1.479,3.143l1.468-3.143H104.627z"/>
		<path fill="#FFFFFF" d="M113.681,53.505l-1.517-2.68h-0.65v2.68h-1.38v-6.877h2.582c0.531,0,0.985,0.093,1.359,0.28 s0.655,0.44,0.843,0.759c0.187,0.318,0.28,0.675,0.28,1.069c0,0.453-0.131,0.862-0.394,1.227 c-0.264,0.364-0.654,0.615-1.173,0.754l1.646,2.788H113.681z M111.514,49.79h1.152c0.375,0,0.653-0.09,0.838-0.271 c0.184-0.181,0.275-0.432,0.275-0.754c0-0.315-0.092-0.56-0.275-0.734c-0.185-0.174-0.463-0.261-0.838-0.261h-1.152V49.79z"/>
		<path fill="#FFFFFF" d="M119.012,47.741v1.724h2.315v1.094h-2.315v1.823h2.61v1.123h-3.99v-6.888h3.99v1.124H119.012z"/>
		<path fill="#FFFFFF" d="M128.737,46.628v1.113h-1.833v5.764h-1.379v-5.764h-1.833v-1.113H128.737z"/>
		<path fill="#FFFFFF" d="M132.304,47.741v1.724h2.315v1.094h-2.315v1.823h2.61v1.123h-3.99v-6.888h3.99v1.124H132.304z"/>
		<path fill="#FFFFFF" d="M137.471,48.238c0.306-0.535,0.723-0.952,1.252-1.251c0.528-0.299,1.121-0.448,1.778-0.448 c0.769,0,1.441,0.197,2.02,0.591c0.578,0.395,0.982,0.939,1.212,1.636h-1.586c-0.158-0.328-0.38-0.575-0.665-0.739 c-0.286-0.164-0.616-0.246-0.99-0.246c-0.401,0-0.758,0.094-1.069,0.281c-0.313,0.187-0.555,0.451-0.729,0.793 c-0.174,0.342-0.261,0.742-0.261,1.202c0,0.453,0.087,0.852,0.261,1.197c0.175,0.345,0.417,0.61,0.729,0.798 c0.312,0.188,0.668,0.28,1.069,0.28c0.374,0,0.704-0.083,0.99-0.251c0.285-0.167,0.507-0.415,0.665-0.744h1.586 c-0.229,0.703-0.632,1.25-1.207,1.641c-0.574,0.391-1.25,0.587-2.024,0.587c-0.657,0-1.25-0.149-1.778-0.449 c-0.529-0.299-0.946-0.714-1.252-1.246c-0.305-0.532-0.458-1.136-0.458-1.813S137.166,48.773,137.471,48.238z"/>
		<path fill="#FFFFFF" d="M151.803,46.628v6.877h-1.38v-2.927h-2.945v2.927h-1.38v-6.877h1.38v2.827h2.945v-2.827H151.803z"/>
		<path fill="#FFFFFF" d="M159.098,49.79c-0.174,0.322-0.446,0.582-0.817,0.778c-0.371,0.197-0.839,0.296-1.404,0.296h-1.152v2.641 h-1.38v-6.877h2.532c0.532,0,0.985,0.092,1.36,0.275c0.374,0.184,0.654,0.437,0.842,0.759s0.281,0.687,0.281,1.094 C159.359,49.124,159.271,49.469,159.098,49.79z M157.664,49.49c0.185-0.175,0.276-0.419,0.276-0.734 c0-0.67-0.375-1.005-1.123-1.005h-1.094v2h1.094C157.198,49.751,157.48,49.664,157.664,49.49z"/>
		<path fill="#FFFFFF" d="M165.063,53.505l-1.517-2.68h-0.65v2.68h-1.38v-6.877h2.582c0.531,0,0.985,0.093,1.359,0.28 s0.655,0.44,0.843,0.759c0.187,0.318,0.28,0.675,0.28,1.069c0,0.453-0.131,0.862-0.394,1.227 c-0.264,0.364-0.654,0.615-1.173,0.754l1.646,2.788H165.063z M162.896,49.79h1.152c0.375,0,0.653-0.09,0.838-0.271 c0.184-0.181,0.275-0.432,0.275-0.754c0-0.315-0.092-0.56-0.275-0.734c-0.185-0.174-0.463-0.261-0.838-0.261h-1.152V49.79z"/>
		<path fill="#FFFFFF" d="M170.395,46.628v6.877h-1.38v-6.877H170.395z"/>
		<path fill="#FFFFFF" d="M180.435,46.628v6.877h-1.379v-4.474l-1.843,4.474h-1.044l-1.853-4.474v4.474h-1.38v-6.877h1.566 l2.188,5.113l2.188-5.113H180.435z"/>
		<path fill="#FFFFFF" d="M184.356,47.741v1.724h2.315v1.094h-2.315v1.823h2.61v1.123h-3.99v-6.888h3.99v1.124H184.356z"/>
	</g>
</g>
<g opacity="0.2">
	<rect x="6.516" y="41.688" fill="#FFFFFF" width="180.094" height="1"/>
</g>
</svg>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Staff Attendance Report</title>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { padding: 0 !important; background: #fff !important; }
      @page { size: landscape; margin: 10mm; }
    }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 14px 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; border: 1px solid #e2e8f0; }
    .toolbar-title { font-size: 18px; font-weight: 700; color: #941B74; }
    .btn-print { background: linear-gradient(135deg, #941B74 0%, #2D2050 100%); color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-print:hover { opacity: 0.9; }
    .report-card { background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; }
    .report-logo { display: flex; justify-content: center; align-items: center; margin-bottom: 16px; }
    .logo-badge { background: #801463; padding: 10px 24px; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.12); display: inline-flex; align-items: center; justify-content: center; }
    .report-header h1 { color: #941B74; margin: 0 0 6px 0; font-size: 24px; }
    .report-meta { color: #64748b; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th { background: linear-gradient(to right, #941B74, #2D2050); color: white; padding: 10px; text-align: center; }
    td { padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .badge { font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-block; text-transform: uppercase; font-size: 11px; }
    .badge.present { background: #d1fae5; color: #047857; }
    .badge.absent { background: #fee2e2; color: #b91c1c; }
    .badge.late { background: #fef3c7; color: #b45309; }
    .badge.leave { background: #f3e8ff; color: #6b21a8; }
    .report-footer { text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .copyright-text { margin: 0 0 6px 0; color: #64748b; font-size: 13px; font-weight: 500; }
    .company-highlight { color: #e27a45; font-weight: 600; }
    .generated-date { margin: 0; color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="report-header">
      <div class="report-logo">
        <div class="logo-badge">
          ${logoSvg}
        </div>
      </div>
      <h1>👥 Staff Attendance Report</h1>
      <p class="report-meta">
        ${isMonth ? `Month: ${monthName} ${filters.year}` : `Date: ${filters.date}`} | Total Records: ${records.length}
      </p>
    </div>
    ${tableHtml}
    <div class="no-print" style="text-align: center; margin-top: 24px; margin-bottom: 8px;">
      <button class="btn-print" onclick="window.print()">📥 Download / Print PDF</button>
    </div>
    <div class="report-footer">
      <p class="copyright-text">
        Copyright © 2026, by <span class="company-highlight">ReTechPrime Technology</span> Solutions Pvt. Ltd
      </p>
      <p class="generated-date">
        Generated on: ${new Date().toLocaleString()}
      </p>
    </div>
  </div>
</body>
</html>`;
}


/**
 * Get attendance for a specific employee
 */
export async function getEmployeeAttendance(req, res: Response, next: NextFunction) {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!employeeId) {
      throw new AppError("Employee ID is required", 400);
    }

    const records = await staffAttendanceService.getEmployeeAttendance(String(employeeId), {
      startDate: startDate as string,
      endDate: endDate as string,
    }, req.tenant);

    return res.status(200).json({
      status: 1,
      message: "Employee attendance fetched successfully",
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete attendance record
 */
export async function deleteStaffAttendance(req, res: Response, next: NextFunction) {
  try {
    const { attendanceId } = req.params;

    if (!attendanceId) {
      throw new AppError("Attendance ID is required", 400);
    }

    const result = await staffAttendanceService.deleteAttendance(String(attendanceId), req.tenant);

    return res.status(200).json({
      status: 1,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance stats (counts for dashboard)
 */
export async function getStaffAttendanceStats(req, res: Response, next: NextFunction) {
  try {
    const { date } = req.query;

    const stats = await staffAttendanceService.getAttendanceStats(date as string, req.tenant);

    return res.status(200).json({
      status: 1,
      message: "Attendance stats fetched successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get staff attendance overview (for pie chart / donut widget)
 */
export async function getStaffAttendanceOverview(req, res: Response, next: NextFunction) {
  try {
    const { facultyId } = req.query;
    const stats = await staffAttendanceService.getAttendanceStatsOverview(
      req.tenant,
      facultyId ? Number(facultyId) : undefined
    );

    return res.status(200).json({
      status: "success",
      message: "Staff attendance overview fetched successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
