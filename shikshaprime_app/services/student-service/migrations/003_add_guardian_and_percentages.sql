-- Adds guardian contact and percentage fields to student_info
ALTER TABLE `student_info`
  ADD COLUMN IF NOT EXISTS `guardian_mobile` VARCHAR(20) NULL AFTER `mobile`,
  ADD COLUMN IF NOT EXISTS `guardian_email` VARCHAR(255) NULL AFTER `guardian_mobile`,
  ADD COLUMN IF NOT EXISTS `ten_class_percentage` DECIMAL(5,2) NULL AFTER `exam_board`,
  ADD COLUMN IF NOT EXISTS `twelve_class_percentage` DECIMAL(5,2) NULL AFTER `ten_class_percentage`;
