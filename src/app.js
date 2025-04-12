import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import errorHandler from './middlewares/errorHandler.js';
import { setupSwagger } from './config/swagger.js';
import adminRoutes from './routes/admin/index.js';
import sellerRoutes from './routes/seller/index.js';
import userRoutes from './routes/user/index.js';
import publicRoutes from './routes/public/index.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Setup API routes
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/public', publicRoutes);

// Setup Swagger documentation
setupSwagger(app);

app.use(errorHandler);

export default app;
