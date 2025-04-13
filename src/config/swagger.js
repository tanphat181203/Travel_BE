import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    tags: [
      {
        name: 'Public Tours',
        description: 'Public endpoints for browsing and searching tours',
      },
      {
        name: 'Public Departures',
        description: 'Public endpoints for viewing available tour departures',
      },
      {
        name: 'User Authentication',
        description:
          'Endpoints for user registration, login, and account verification',
      },
      {
        name: 'Seller Authentication',
        description:
          'Endpoints for seller registration, login, and account verification',
      },
      {
        name: 'Admin Authentication',
        description: 'Endpoints for admin login and authentication',
      },
      {
        name: 'User Profile',
        description: 'Endpoints for managing user profile information',
      },
      {
        name: 'Seller Profile',
        description: 'Endpoints for managing seller profile information',
      },
      {
        name: 'Seller - Tour Management',
        description: 'Endpoints for sellers to create and manage their tours',
      },
      {
        name: 'Seller - Departure Management',
        description:
          'Endpoints for sellers to manage tour departures and schedules',
      },
      {
        name: 'Admin - User Management',
        description: 'Endpoints for admins to manage user accounts',
      },
      {
        name: 'Admin - Seller Management',
        description: 'Endpoints for admins to manage seller accounts',
      },
      {
        name: 'Admin - System Management',
        description: 'Endpoints for admins to manage system operations',
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
  apis: [...getRoutePaths()],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  const swaggerOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .information-container { padding: 20px 0 }
      .swagger-ui .scheme-container { padding: 15px 0 }
      .swagger-ui .opblock-tag { font-size: 18px; margin: 10px 0 5px 0; padding: 10px; border-radius: 4px; }
      .swagger-ui .opblock-tag:hover { background-color: rgba(0,0,0,.05) }
      .swagger-ui section.models { display: none }

      /* Tag group styling */
      .swagger-ui .opblock-tag[data-tag^="Public"] { background-color: #e8f4f8; border-left: 4px solid #61affe; }
      .swagger-ui .opblock-tag[data-tag^="User Auth"],
      .swagger-ui .opblock-tag[data-tag^="Seller Auth"],
      .swagger-ui .opblock-tag[data-tag^="Admin Auth"] { background-color: #e8f8f5; border-left: 4px solid #49cc90; }
      .swagger-ui .opblock-tag[data-tag^="User Pro"] { background-color: #f9f1e8; border-left: 4px solid #f5a623; }
      .swagger-ui .opblock-tag[data-tag^="Seller Pro"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Tour"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Dep"] { background-color: #f5e8f8; border-left: 4px solid #9012fe; }
      .swagger-ui .opblock-tag[data-tag^="Admin"] { background-color: #f8e8e8; border-left: 4px solid #f93e3e; }

      /* Method styling */
      .swagger-ui .opblock-summary-method { font-weight: bold; }
      .swagger-ui .opblock.opblock-get { border-color: #61affe; }
      .swagger-ui .opblock.opblock-post { border-color: #49cc90; }
      .swagger-ui .opblock.opblock-put { border-color: #fca130; }
      .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; }
    `,
    customSiteTitle: 'Tour Management API Documentation',
    docExpansion: 'none',
    filter: true,
    displayOperationId: false,
    displayRequestDuration: true,
    defaultModelsExpandDepth: -1,
    tagsSorter: 'alpha',
  };

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
};
