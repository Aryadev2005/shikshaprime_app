-- Adds document columns for online student student_registrations
ALTER TABLE `student_registrations`
  ADD COLUMN `aadhar_doc` VARCHAR(255) NULL AFTER `board_university`,
  ADD COLUMN `birth_certificate_doc` VARCHAR(255) NULL AFTER `aadhar_doc`,
  ADD COLUMN `ten_marksheet_doc` VARCHAR(255) NULL AFTER `birth_certificate_doc`,
  ADD COLUMN `twelve_marksheet_doc` VARCHAR(255) NULL AFTER `ten_marksheet_doc`;
