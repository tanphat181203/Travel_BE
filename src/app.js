import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import swaggerUi from 'swagger-ui-express';
import specs from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
