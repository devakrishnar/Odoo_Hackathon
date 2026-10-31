import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { successResponse, errorResponse } from './utils/response.js';
import { errorHandler } from './middleware/error.middleware.js';
import prisma from './config/db.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import customersRoutes from './modules/customers/customers.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import plansRoutes from './modules/plans/plans.routes.js';
import quotationsRoutes from './modules/quotations/quotations.routes.js';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes.js';
import discountsRoutes from './modules/discounts/discounts.routes.js';
import invoicesRoutes from './modules/invoices/invoices.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';

const app = express();

// CORS configuration supporting all three frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  ...config.corsOrigins,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get(['/health', '/api/health'], async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  return successResponse(res, 'Brightloop API is operational', {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus,
    frontends: {
      admin: 'http://localhost:5173',
      staff: 'http://localhost:5174',
      customer: 'http://localhost:5175',
    },
  });
});

// Mount Module APIs
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/discounts', discountsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reports', reportsRoutes);

// 404 Route Handler
app.use((req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, [], 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
