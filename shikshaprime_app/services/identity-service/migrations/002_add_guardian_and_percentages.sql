ALTER TABLE `student_registrations`
  ADD COLUMN `guardian_mobile` VARCHAR(20) NULL AFTER `email`,
  ADD COLUMN `guardian_email` VARCHAR(255) NULL AFTER `guardian_mobile`,
  ADD COLUMN `ten_percentage` DECIMAL(5,2) NULL AFTER `board_university`,
  ADD COLUMN `twelve_percentage` DECIMAL(5,2) NULL AFTER `ten_percentage`;
