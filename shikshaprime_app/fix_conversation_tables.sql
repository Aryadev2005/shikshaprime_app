-- SQL script to fix conversation tables
-- Run this in your MySQL database to ensure all tables exist with correct structure

-- 1. Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('direct','class_broadcast') NOT NULL,
  `subject` varchar(255) DEFAULT NULL COMMENT 'Subject for class broadcasts',
  `class_id` int unsigned DEFAULT NULL COMMENT 'Class ID for broadcasts',
  `created_by_user_id` bigint unsigned NOT NULL,
  `created_by_user_type` enum('teacher','student','admin','staff') NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_created_by` (`created_by_user_id`,`created_by_user_type`),
  KEY `idx_active` (`is_active`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create conversation_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `user_type` enum('teacher','student','admin','staff') NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `is_muted` tinyint NOT NULL DEFAULT '0',
  `last_read_at` timestamp NULL DEFAULT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_participant` (`conversation_id`,`user_id`,`user_type`),
  KEY `idx_conversation` (`conversation_id`),
  KEY `idx_user` (`user_id`,`user_type`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Ensure messages table has correct structure
ALTER TABLE `messages` 
ADD COLUMN IF NOT EXISTS `conversation_id` bigint unsigned NOT NULL AFTER `id`,
ADD INDEX IF NOT EXISTS `idx_conversation` (`conversation_id`);

-- 4. Create class_broadcast_recipients table if it doesn't exist
CREATE TABLE IF NOT EXISTS `class_broadcast_recipients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `is_delivered` tinyint NOT NULL DEFAULT '0',
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_recipient` (`conversation_id`,`student_id`),
  KEY `idx_conversation` (`conversation_id`),
  KEY `idx_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4a. Foreign key constraints removed to avoid setup issues
-- The application will handle data integrity through business logic
-- You can manually add foreign keys later if needed:
-- ALTER TABLE class_broadcast_recipients ADD CONSTRAINT fk_recipient_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE;

-- 5. Check if data exists but conversations are empty - this helps debug
SELECT 
  'Messages' as table_name, COUNT(*) as count FROM messages
UNION ALL
SELECT 
  'Conversations' as table_name, COUNT(*) as count FROM conversations  
UNION ALL
SELECT 
  'Conversation Participants' as table_name, COUNT(*) as count FROM conversation_participants
UNION ALL
SELECT 
  'Message Read Status' as table_name, COUNT(*) as count FROM message_read_status;

-- 6. Show any existing conversations and participants
SELECT 
  c.id as conversation_id,
  c.type,
  cp.user_id,
  cp.user_type,
  cp.is_active,
  c.created_at
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
ORDER BY c.created_at DESC
LIMIT 10;