import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import errorHandler from './middlewares/errorHandler.js';
import { setupSwagger } from './config/swagger.js';
import { initCronJobs } from './utils/cronJobs.js';
import adminRoutes from './routes/admin/index.js';
import sellerRoutes from './routes/seller/index.js';
import userRoutes from './routes/user/index.js';
import publicRoutes from './routes/public/index.js';

const app = express();

// Apply JSON parsing middleware to all routes except Stripe webhooks
app.use((req, res, next) => {
  if (
    req.originalUrl === '/api/user/payments/stripe-webhook' ||
    req.originalUrl === '/api/seller/subscriptions/stripe-webhook'
  ) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors());
app.use(passport.initialize());

app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/public', publicRoutes);

setupSwagger(app);

if (process.env.NODE_ENV !== 'test') {
  const jobs = initCronJobs();
}

app.use(errorHandler);

export default app;
