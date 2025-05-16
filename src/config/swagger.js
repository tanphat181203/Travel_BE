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
        description: 'API Server',
      },
    ],
    tags: [
      // Public API endpoints
      {
        name: 'Public Tours',
        description: 'Public endpoints for browsing and searching tours',
      },
      {
        name: 'Public Sellers',
        description: 'Public endpoints for browsing and searching sellers',
      },
      {
        name: 'Public Departures',
        description: 'Public endpoints for viewing available tour departures',
      },
      {
        name: 'Public - Reviews',
        description: 'Public endpoints for viewing tour reviews',
      },
      {
        name: 'Public - Promotion',
        description:
          'Public endpoints for viewing tour promotions and calculating discounts',
      },

      // Authentication endpoints
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

      // User endpoints
      {
        name: 'User Profile',
        description: 'Endpoints for managing user profile information',
      },
      {
        name: 'User - Booking Management',
        description: 'Endpoints for users to create and manage their bookings',
      },
      {
        name: 'User - Payment Management',
        description: 'Endpoints for users to process payments for bookings',
      },
      {
        name: 'User - Invoice Management',
        description: 'Endpoints for users to view and manage their invoices',
      },
      {
        name: 'User - Review Management',
        description:
          'Endpoints for users to create and manage their tour reviews',
      },

      // Seller endpoints
      {
        name: 'Seller Profile',
        description: 'Endpoints for managing seller profile information',
      },
      {
        name: 'Seller - Dashboard',
        description:
          'Endpoints for sellers to view dashboard statistics and metrics',
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
        name: 'Seller - Booking Management',
        description: 'Endpoints for sellers to manage bookings for their tours',
      },
      {
        name: 'Seller - Invoice Management',
        description: 'Endpoints for sellers to manage invoices for their tours',
      },
      {
        name: 'Seller - Review Management',
        description:
          'Endpoints for sellers to view and manage reviews for their tours',
      },
      {
        name: 'Seller - Subscription Management',
        description:
          'Endpoints for sellers to manage their subscription packages',
      },
      {
        name: 'Seller - Promotion Management',
        description:
          'Endpoints for sellers to create and manage promotions for their tours',
      },

      // Admin endpoints
      {
        name: 'Admin - User Management',
        description: 'Endpoints for admins to manage user accounts',
      },
      {
        name: 'Admin - Seller Management',
        description: 'Endpoints for admins to manage seller accounts',
      },
      {
        name: 'Admin - Subscription Management',
        description: 'Endpoints for admins to manage subscription packages',
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
      :root {
        /* Layout & spacing */
        --topbar-display: none;
        --info-padding: 20px 0;
        --scheme-padding: 15px 0;
        --tag-radius: 4px;
        --tag-font-size: 18px;

        /* Tag colors */
        --public-bg: #e8f4f8;       --public-border: #61affe;
        --auth-bg:   #e8f8f5;       --auth-border:  #49cc90;
        --user-bg:   #f9f1e8;       --user-border:  #f5a623;
        --seller-bg: #f5e8f8;       --seller-border:#9012fe;
        --admin-bg:  #f8e8e8;       --admin-border: #f93e3e;

        /* Method colors */
        --get-border:    #61affe;
        --post-border:   #49cc90;
        --put-border:    #fca130;
        --delete-border: #f93e3e;
      }

      .swagger-ui .topbar {
        display: var(--topbar-display);
      }

      .swagger-ui .information-container {
        padding: var(--info-padding);
      }

      .swagger-ui .scheme-container {
        padding: var(--scheme-padding);
      }

      .swagger-ui section.models {
        display: none;
      }

      .swagger-ui .opblock-tag {
        font-size: var(--tag-font-size);
        margin: 10px 0 5px;
        padding: 10px;
        border-radius: var(--tag-radius);
        transition: background-color 0.2s;
      }

      .swagger-ui .opblock-tag:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      /* Public */
      .swagger-ui .opblock-tag[data-tag^="Public"] {
        background-color: var(--public-bg);
        border-left: 4px solid var(--public-border);
      }

      /* Authentication */
      .swagger-ui .opblock-tag[data-tag^="User Authentication"],
      .swagger-ui .opblock-tag[data-tag^="Seller Authentication"],
      .swagger-ui .opblock-tag[data-tag^="Admin Authentication"] {
        background-color: var(--auth-bg);
        border-left: 4px solid var(--auth-border);
      }

      /* User endpoints */
      .swagger-ui .opblock-tag[data-tag^="User Profile"],
      .swagger-ui .opblock-tag[data-tag^="User - Booking Management"],
      .swagger-ui .opblock-tag[data-tag^="User - Payment Management"],
      .swagger-ui .opblock-tag[data-tag^="User - Invoice Management"],
      .swagger-ui .opblock-tag[data-tag^="User - Review Management"] {
        background-color: var(--user-bg);
        border-left: 4px solid var(--user-border);
      }

      /* Seller endpoints */
      .swagger-ui .opblock-tag[data-tag^="Seller Profile"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Dashboard"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Tour Management"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Departure Management"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Booking Management"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Invoice Management"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Review Management"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Subscription Management"],
      .swagger-ui .opblock-tag[data-tag^="Seller - Promotion Management"] {
        background-color: var(--seller-bg);
        border-left: 4px solid var(--seller-border);
      }

      /* Admin endpoints */
      .swagger-ui .opblock-tag[data-tag^="Admin - User Management"],
      .swagger-ui .opblock-tag[data-tag^="Admin - Seller Management"],
      .swagger-ui .opblock-tag[data-tag^="Admin - Subscription Management"],
      .swagger-ui .opblock-tag[data-tag^="Admin - System Management"] {
        background-color: var(--admin-bg);
        border-left: 4px solid var(--admin-border);
      }

      /* HTTP methods */
      .swagger-ui .opblock-summary-method {
        font-weight: bold;
      }

      .swagger-ui .opblock.opblock-get    { border-color: var(--get-border); }
      .swagger-ui .opblock.opblock-post   { border-color: var(--post-border); }
      .swagger-ui .opblock.opblock-put    { border-color: var(--put-border); }
      .swagger-ui .opblock.opblock-delete { border-color: var(--delete-border); }
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
