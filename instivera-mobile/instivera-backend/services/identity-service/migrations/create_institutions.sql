CREATE TABLE IF NOT EXISTS institutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('school','college') NOT NULL,
  logo_url VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO institutions (name, slug, type, is_active) VALUES
  ('ShikshaPrime College A', 'collegea', 'college', 1),
  ('ShikshaPrime College B', 'collegeb', 'college', 1);
