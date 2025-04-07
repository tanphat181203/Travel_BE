import dotenv from 'dotenv';
dotenv.config();

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
    servers: [
      {
        url: `${process.env.BASE_URL}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer {token}',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid input data',
            },
            error: {
              type: 'string',
              description: 'Error details',
              example: 'Email is required',
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '60d21b4667d0d8992e610c85',
            },
            email: {
              type: 'string',
              example: 'john@gmail.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            avatar_url: {
              type: 'string',
              example: 'https://storage.example.com/avatars/john.jpg',
            },
            phone_number: {
              type: 'string',
              example: '0123456789',
            },
            address: {
              type: 'string',
              example: '123 Main St, City, Country',
            },
            role: {
              type: 'string',
              example: 'user',
            },
            status: {
              type: 'string',
              example: 'active',
              description:
                'User status (pending_verification, active, suspended, etc.)',
            },
          },
        },
        Token: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'User Authentication',
        description:
          'Endpoints for user registration, login, and authentication management',
      },
      {
        name: 'User Profile',
        description: 'Endpoints for managing user profiles',
      },
      {
        name: 'Seller Authentication',
        description:
          'Endpoints for seller registration, login, and authentication management',
      },
      {
        name: 'Seller Profile',
        description: 'Endpoints for managing seller profiles',
      },
      {
        name: 'Admin - Authentication',
        description: 'Admin authentication endpoints',
      },
      {
        name: 'Admin - User Management',
        description: 'Admin endpoints for managing users',
      },
      {
        name: 'Admin - Seller Management',
        description: 'Admin endpoints for managing sellers',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

export default specs;
