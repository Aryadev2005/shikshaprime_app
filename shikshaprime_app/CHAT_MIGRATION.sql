-- Chat System Database Schema
-- Description: Creates tables for chat functionality with teacher-student, teacher-teacher, and teacher-class communications
-- Compatible with existing college_users and students tables

-- 1. Conversations table - stores conversation metadata
CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  type ENUM('direct', 'class_broadcast') NOT NULL DEFAULT 'direct',
  subject VARCHAR(255) NULL COMMENT 'Subject for class broadcasts',
  class_id BIGINT UNSIGNED NULL COMMENT 'Class ID for class broadcasts',
  created_by_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Creator user ID from college_users',
  created_by_user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_created_by (created_by_user_id, created_by_user_type),
  INDEX idx_type (type),
  INDEX idx_class_id (class_id),
  INDEX idx_created_at (created_at),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores conversation metadata for direct and class broadcast chats';

-- 2. Conversation participants - tracks who is part of each conversation
CREATE TABLE IF NOT EXISTS conversation_participants (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'User ID from college_users or students table',
  user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP NULL COMMENT 'Last time user read messages in this conversation',
  is_muted TINYINT(1) DEFAULT 0 COMMENT 'Whether user has muted this conversation',
  is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether user is still part of conversation',
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant (conversation_id, user_id, user_type),
  INDEX idx_user (user_id, user_type),
  INDEX idx_conversation (conversation_id),
  INDEX idx_last_read (last_read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks participants in each conversation and their read status';

-- 3. Messages table - stores all chat messages
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Sender ID from college_users or students',
  sender_user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL,
  message_text TEXT NOT NULL,
  message_type ENUM('text', 'announcement', 'important', 'file') DEFAULT 'text',
  parent_message_id BIGINT UNSIGNED NULL COMMENT 'For threaded replies',
  file_url VARCHAR(500) NULL COMMENT 'File attachment URL if any',
  file_name VARCHAR(255) NULL COMMENT 'Original filename',
  file_size BIGINT NULL COMMENT 'File size in bytes',
  is_deleted TINYINT(1) DEFAULT 0 COMMENT 'Soft delete flag',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL,
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender (sender_user_id, sender_user_type),
  INDEX idx_created_at (created_at),
  INDEX idx_parent (parent_message_id),
  INDEX idx_deleted (is_deleted),
  FULLTEXT KEY idx_message_search (message_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores all chat messages with support for replies and file attachments';

-- 4. Message read status - tracks which users have read which messages
CREATE TABLE IF NOT EXISTS message_read_status (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  message_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reader user ID',
  user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reader (message_id, user_id, user_type),
  INDEX idx_message (message_id),
  INDEX idx_user (user_id, user_type),
  INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks read status of messages for each user';

-- 5. Class broadcast recipients - specifically for class broadcasts to track all intended recipients
CREATE TABLE IF NOT EXISTS class_broadcast_recipients (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL COMMENT 'Student ID from students table',
  is_delivered TINYINT(1) DEFAULT 1 COMMENT 'Whether message was delivered to this student',
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_broadcast_recipient (conversation_id, student_id),
  INDEX idx_conversation (conversation_id),
  INDEX idx_student (student_id),
  INDEX idx_delivered (is_delivered)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks students who should receive class broadcast messages';

-- 6. Chat settings - user preferences for notifications, etc.
CREATE TABLE IF NOT EXISTS chat_settings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  user_type ENUM('teacher', 'student', 'admin', 'staff') NOT NULL,
  email_notifications TINYINT(1) DEFAULT 1 COMMENT 'Send email notifications for new messages',
  sound_notifications TINYINT(1) DEFAULT 1 COMMENT 'Play sound for new messages',
  desktop_notifications TINYINT(1) DEFAULT 1 COMMENT 'Show desktop notifications',
  online_status ENUM('online', 'away', 'busy', 'offline') DEFAULT 'online',
  last_seen TIMESTAMP NULL COMMENT 'Last activity timestamp',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_settings (user_id, user_type),
  INDEX idx_user (user_id, user_type),
  INDEX idx_online_status (online_status),
  INDEX idx_last_seen (last_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User preferences and settings for chat functionality';

-- 7. Additional indexes for performance optimization
ALTER TABLE conversation_participants 
ADD INDEX idx_user_conversations (user_id, user_type, is_active, joined_at);

ALTER TABLE messages 
ADD INDEX idx_conversation_unread (conversation_id, created_at, is_deleted);

ALTER TABLE conversations 
ADD INDEX idx_class_broadcasts (type, class_id, is_active, created_at);

ALTER TABLE messages 
ADD INDEX idx_conversation_pagination (conversation_id, is_deleted, created_at);

ALTER TABLE conversation_participants 
ADD INDEX idx_direct_conversations (user_id, user_type, conversation_id);