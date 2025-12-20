const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Advocate Pro SaaS API',
      version: '1.0.0',
      description: 'Multi-tenant SaaS platform for advocate services with JWT authentication and role-based access control',
      contact: {
        name: 'Advocate Pro Support',
        email: 'support@advocatepro.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
      {
        url: 'https://api.advocatepro.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token in Authorization header. Example: Bearer {token}',
        },
      },
      schemas: {
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Tenant ID' },
            name: { type: 'string', description: 'Tenant name' },
            slug: { type: 'string', description: 'URL-friendly slug' },
            email: { type: 'string', description: 'Tenant email' },
            subscription: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  enum: ['free', 'starter', 'professional', 'enterprise'],
                },
                status: {
                  type: 'string',
                  enum: ['active', 'inactive', 'suspended'],
                },
                expiresAt: { type: 'string', format: 'date-time' },
              },
            },
            settings: {
              type: 'object',
              properties: {
                timezone: { type: 'string', default: 'UTC' },
                language: { type: 'string', default: 'en' },
                features: { type: 'array', items: { type: 'string' } },
              },
            },
            logo: { type: 'string', description: 'Logo URL' },
            website: { type: 'string', description: 'Website URL' },
            isActive: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            tenantId: { type: 'string', description: 'Tenant ID reference' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: {
              type: 'string',
              enum: ['OWNER', 'ADMIN', 'ADVOCATE', 'STAFF', 'CLIENT'],
            },
            phone: { type: 'string' },
            avatar: { type: 'string', description: 'Avatar URL' },
            isActive: { type: 'boolean', default: true },
            emailVerified: { type: 'boolean', default: false },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SignupRequest: {
          type: 'object',
          required: ['tenantName', 'firstName', 'lastName', 'email', 'password'],
          properties: {
            tenantName: { type: 'string', minLength: 2, maxLength: 100 },
            firstName: { type: 'string', minLength: 2, maxLength: 50 },
            lastName: { type: 'string', minLength: 2, maxLength: 50 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'role'],
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: {
              type: 'string',
              enum: ['OWNER', 'ADMIN', 'ADVOCATE', 'STAFF', 'CLIENT'],
            },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: {
              type: 'string',
              enum: ['OWNER', 'ADMIN', 'ADVOCATE', 'STAFF', 'CLIENT'],
            },
          },
        },
        UpdateTenantRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            timezone: { type: 'string' },
            language: { type: 'string' },
            website: { type: 'string' },
            logo: { type: 'string' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
