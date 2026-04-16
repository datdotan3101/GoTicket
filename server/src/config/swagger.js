import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GoTicket API",
      version: "2.0.0",
      description: "REST API for GoTicket Sports Ticketing Platform — PERN Stack"
    },
    servers: [
      { url: "http://localhost:5000", description: "Development server" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Access Token (Bearer prefix not required)"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            email: { type: "string", format: "email" },
            full_name: { type: "string" },
            phone: { type: "string" },
            role: { type: "string", enum: ["admin", "manager", "editor", "audience", "checker"] },
            club_id: { type: "integer", nullable: true },
            is_active: { type: "boolean" },
            is_approved: { type: "boolean" },
            created_at: { type: "string", format: "date-time" }
          }
        },
        Match: {
          type: "object",
          properties: {
            id: { type: "integer" },
            home_team: { type: "string" },
            away_team: { type: "string" },
            match_date: { type: "string", format: "date-time" },
            stadium_id: { type: "integer" },
            league_id: { type: "integer" },
            club_id: { type: "integer" },
            status: {
              type: "string",
              enum: ["draft", "pending_review", "approved", "rejected", "published", "upcoming", "ongoing", "finished", "cancelled"]
            },
            ticket_sale_open_at: { type: "string", format: "date-time", nullable: true },
            thumbnail_url: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" }
          }
        },
        News: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            slug: { type: "string" },
            content: { type: "string", description: "HTML rich text" },
            thumbnail_url: { type: "string", nullable: true },
            author_id: { type: "integer" },
            sport_id: { type: "integer", nullable: true },
            status: {
              type: "string",
              enum: ["draft", "pending_review", "approved", "rejected", "published"]
            },
            scheduled_publish_at: { type: "string", format: "date-time", nullable: true },
            published_at: { type: "string", format: "date-time", nullable: true },
            created_at: { type: "string", format: "date-time" }
          }
        },
        Ticket: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "integer" },
            match_id: { type: "integer" },
            seat_id: { type: "integer" },
            qr_token: { type: "string", nullable: true, description: "JWT signed QR code" },
            status: { type: "string", enum: ["pending", "paid", "checked_in", "cancelled"] },
            created_at: { type: "string", format: "date-time" }
          }
        },
        Approval: {
          type: "object",
          properties: {
            id: { type: "integer" },
            resource_type: { type: "string", enum: ["match", "news", "user_account"] },
            resource_id: { type: "integer" },
            submitted_by: { type: "integer" },
            reviewed_by: { type: "integer", nullable: true },
            status: { type: "string", enum: ["pending", "approved", "rejected"] },
            rejection_reason: { type: "string", nullable: true },
            scheduled_publish_at: { type: "string", format: "date-time", nullable: true },
            reviewed_at: { type: "string", format: "date-time", nullable: true },
            created_at: { type: "string", format: "date-time" }
          }
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "integer" },
            type: { type: "string" },
            title: { type: "string" },
            body: { type: "string", nullable: true },
            related_id: { type: "integer", nullable: true },
            related_type: { type: "string", nullable: true },
            is_read: { type: "boolean" },
            created_at: { type: "string", format: "date-time" }
          }
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {}
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["./src/modules/*/*.routes.js", "./src/app.js"]
};

export default swaggerJsdoc(options);
