import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GoTicket API",
      version: "1.0.0",
      description: "REST API cho nền tảng đặt vé thể thao GoTicket"
    },
    servers: [{ url: "http://localhost:5000", description: "Development server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["./src/modules/*/*.routes.js", "./src/app.js"]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
