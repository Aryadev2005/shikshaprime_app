-- Adds document columns for created students
ALTER TABLE `student_info`
  ADD COLUMN `aadhar_doc` VARCHAR(255) NULL AFTER `twelve_class_percentage`,
  ADD COLUMN `birth_certificate_doc` VARCHAR(255) NULL AFTER `aadhar_doc`,
  ADD COLUMN `ten_marksheet_doc` VARCHAR(255) NULL AFTER `birth_certificate_doc`,
  ADD COLUMN `twelve_marksheet_doc` VARCHAR(255) NULL AFTER `ten_marksheet_doc`;
