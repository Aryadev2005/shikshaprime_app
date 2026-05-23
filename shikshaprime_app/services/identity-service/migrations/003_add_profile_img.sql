-- Adds profile_img column for student profile images
ALTER TABLE `student_registrations`
  ADD COLUMN `profile_img` VARCHAR(255) NULL AFTER `twelve_marksheet_doc`;