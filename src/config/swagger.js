import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically find all route files
const getRoutePaths = () => {
  const routesDir = path.join(__dirname, '../routes');
  const routeTypes = ['admin', 'seller', 'user', 'public'];

  const routeFiles = [];

  routeTypes.forEach((type) => {
    const typePath = path.join(routesDir, type);
    if (fs.existsSync(typePath)) {
      const files = fs.readdirSync(typePath);
      files.forEach((file) => {
        if (file.endsWith('.routes.js')) {
          routeFiles.push(path.join(typePath, file));
        }
      });
    }
  });

  return routeFiles;
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
    servers: [
      {
        url: '/api',
        description: 'API server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    // Include all route files
    ...getRoutePaths(),
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
};
