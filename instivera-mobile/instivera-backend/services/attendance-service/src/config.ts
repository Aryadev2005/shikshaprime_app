import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 9051,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'attendance_db',
  },
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  // Add other configuration variables as needed
};

export default config;