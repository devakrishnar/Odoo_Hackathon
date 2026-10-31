import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'brightloop_jwt_secret_dev_2026',
  jwtExpiresIn: '7d',
  corsOrigins: [
    process.env.ADMIN_FRONTEND_URL || 'http://localhost:5173',
    process.env.STAFF_FRONTEND_URL || 'http://localhost:5174',
    process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:5175',
  ],
};
