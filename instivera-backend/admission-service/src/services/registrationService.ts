import bcrypt from 'bcrypt';
import { QueryTypes } from 'sequelize';
import { getTenantModels } from '../models';
import { rulesService } from '@shared/rules';
import { tenantsService } from '@shared/tenants';

export class RegistrationService {

  private async notifyAdminsForRegistration(
    models: any,
    applicationId: string,
    studentName: string,
    email: string,
    mobile: string
  ) {
    try {
      const adminQuery = `SELECT user_id FROM users WHERE role IS NOT NULL AND LOWER(role) LIKE '%admin%'`;
      const admins: any[] = await models.sequelize.query(adminQuery, {
        type: QueryTypes.SELECT,
      });

      if (admins && admins.length > 0) {
        const title = "New Student Registration";
        const message = `New registration application ${applicationId} submitted by ${studentName} (${email}, ${mobile}).`;
        const insertQuery = `
          INSERT INTO notifications (
            user_id, student_id, registration_id, channel, to_address, template_key, title, message, payload, type, link, is_read, status, created_at, updated_at
          ) VALUES ${admins.map(() => '(?, NULL, NULL, "IN_APP", "", "REGISTRATION_NOTIF", ?, ?, "{}", ?, ?, 0, "SENT", NOW(), NOW())').join(', ')}
        `;

        const replacements = admins.flatMap((admin: any) => [
          admin.user_id,
          title,
          message,
          'info',
          '/admin/student-selection',
        ]);

        await models.sequelize.query(insertQuery, {
          replacements,
          type: QueryTypes.INSERT,
        });
      }
    } catch (err) {
      console.error('[REGISTRATION NOTIFICATION ERROR] Failed to notify admins:', err);
    }
  }

  async registerApplicant(registration: any, hsCertificatePath: string, castCertificatePath: string | null, tenantName: string) {
    const models = getTenantModels(tenantName);
    const t = await models.sequelize.transaction();
    try {
      const {
        first_name,
        middle_name,
        last_name,
        nationality,
        state,
        district,
        gender,
        dob,
        social_category,
        sub_catagory,
        catagory_certificate_number,
        catagory_certificate_issue_authority,
        catagory_certificate_issue_date,
        username,
        password,
        mobile,
        email,
        hs_year_of_passing,
        hs_board,
        hs_registration_number,
        hs_roll_number
      } = registration;
      if (!hsCertificatePath) {
        throw {
          status: 400,
          message: "HS Registration Certificate is required",
        };
      }
      /**
       * Optional:
       * Require category certificate only for reserved categories.
       */
      const reservedCategories = [
        "SC",
        "ST",
        "OBC-WB",
        "OBC-A",
        "OBC-B",
        "EWS-WB",
      ];

      if (
        reservedCategories.includes(social_category) &&
        !castCertificatePath
      ) {
        throw {
          status: 400,
          message:
            "Category Certificate is required for reserved category applicants.",
        };
      }

      const tenant = await tenantsService.getTenantByName(tenantName);

      /*** Admission Mode Rule*/
      const admissionMode = await rulesService.getString(tenant.university_id, tenant.id, "admission_mode");
      if (admissionMode === "CENTRAL_PORTAL") {
        throw { status: 400, message: "Registration is disabled because admission is handled by the central portal" };
      }
      // 2️⃣ RULE: allow_gap_years + max_gap_years
      const allowGapYears = await rulesService.getBool(tenant.university_id, tenant.id, "allow_gap_years");
      const maxGapYears = await rulesService.getInt(tenant.university_id, tenant.id, "max_gap_years");

      const currentYear = new Date().getFullYear();
      const gap = currentYear - parseInt(hs_year_of_passing);

      if (!allowGapYears && gap > 0) {
        throw { status: 400, message: "Gap years are not allowed for admission" };
      }
      if (allowGapYears && gap > maxGapYears) {
        throw { status: 400, message: `Maximum allowed gap is ${maxGapYears} years` };
      }
      // Duplicate checks
      const existingUser = await models.User.findOne({ where: { username } });
      if (existingUser) {
        throw { status: 400, message: 'User ID already exists' };
      }

      const existingEmail = await models.User.findOne({ where: { email } });
      if (existingEmail) {
        throw { status: 400, message: 'Email address already registered' };
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await models.User.create(
        {
          username,
          password_hash: hashedPassword,
          email,
          role: 'applicant',
          first_name,
          last_name,
          is_active: 1
        },
        { transaction: t }
      );

      // Generate application_id
      let maxId = await models.StudentPreRegistration.max('id', { transaction: t }) as number | null;
      if (typeof maxId !== 'number' || isNaN(maxId)) {
        maxId = 0;
      }
      const nextId = maxId + 1;
      const application_id = `APP${nextId.toString().padStart(6, '0')}`;

      // Create pre-registration record
      const preReg = await models.StudentPreRegistration.create(
        {
          user_id: user.user_id,
          application_id,
          first_name,
          middle_name: middle_name || null,
          last_name,
          gender,
          dob,
          nationality,
          state,
          district,
          social_category,
          sub_catagory: sub_catagory || null,
          catagory_certificate_number: catagory_certificate_number || null,
          catagory_certificate_issue_authority: catagory_certificate_issue_authority || null,
          catagory_certificate_issue_date: catagory_certificate_issue_date || null,
          mobile,
          email,
          hs_year_of_passing,
          hs_board,
          hs_registration_number,
          hs_roll_number,
          hs_registration_certificate_path: hsCertificatePath,
          cast_certificate_path: castCertificatePath,
          status: 'PENDING',
        },
        { transaction: t }
      );

      await t.commit();

      // Notify all admin users of the new registration (isolated post-commit execution)
      const studentFullName = [first_name, middle_name, last_name].filter(Boolean).join(" ");
      await this.notifyAdminsForRegistration(
        models,
        application_id,
        studentFullName,
        email,
        mobile
      );

      return { user, preReg };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}