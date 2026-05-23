const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hierarchical MySpiritualCoach API',
            version: '1.0.0',
            description: 'API documentation for the ISKCON MySpiritualCoach',
        },
        servers: [
            {
                url: `https://myspiritualassistant.onrender.com`,
                // url: `https://myspiritualassistant.com`,
                // url: `http://localhost:${process.env.PORT}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        phone_number: { type: 'string' },
                        current_level: { type: 'integer' },
                        timezone: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                DailyTask: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        task_name: { type: 'string' },
                        score: { type: 'integer', minimum: 0, maximum: 4 },
                        completed_at: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
    },
    apis: [
        './app.js',
        './routes/*.js',
        './controllers/*.js'
    ],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

const customOptions = {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .wrapper { max-width: none; padding: 0 20px; }
    `,
    customSiteTitle: "MySpiritualCoach API Docs"
};

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, customOptions));
};

module.exports = setupSwagger;
