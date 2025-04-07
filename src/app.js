import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import swaggerUi from 'swagger-ui-express';
import specs from './config/swagger.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sellers', sellerRoutes);

app.use(errorHandler);

export default app;
