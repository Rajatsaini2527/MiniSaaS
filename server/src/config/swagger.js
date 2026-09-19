'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini SaaS API',
      version: '1.0.0',
      description: `
## Mini SaaS — Production-ready REST API

Inspired by **Notion**, **Trello**, and **Slack**.

### Authentication
Use **Bearer JWT** tokens. Obtain an access token via \`POST /auth/login\`.
The refresh token is stored as an **httpOnly cookie** and rotated automatically.

### Rate Limiting (production only)
- Global: 500 req / 15 min
- Auth endpoints: 20 req / 15 min
- Search: 30 req / 1 min

### Response Shape
All responses follow a consistent envelope:
\`\`\`json
{ "success": true, "message": "...", "data": {...} }
\`\`\`
Paginated responses include a \`pagination\` object.
      `,
      contact: { name: 'API Support', email: 'support@example.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: '/api/v1', description: 'API v1' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token obtained from POST /auth/login',
        },
      },
      schemas: {
        // ── Shared ──────────────────────────────────────────────────────────
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object', nullable: true },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
        // ── User ─────────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Alice Smith' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            avatar: { type: 'string', nullable: true, example: null },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
            isEmailVerified: { type: 'boolean', example: true },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Workspace ────────────────────────────────────────────────────────
        Workspace: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Acme Corp' },
            description: { type: 'string', nullable: true },
            ownerId: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            slug: { type: 'string', example: 'acme-corp' },
            status: { type: 'string', enum: ['active', 'archived'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        WorkspaceMember: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            workspaceId: { type: 'string' },
            userId: { $ref: '#/components/schemas/User' },
            role: { type: 'string', enum: ['owner', 'admin', 'member', 'guest'], example: 'member' },
            joinedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Project ──────────────────────────────────────────────────────────
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            workspaceId: { type: 'string' },
            ownerId: { type: 'string' },
            name: { type: 'string', example: 'Website Redesign' },
            description: { type: 'string', nullable: true },
            key: { type: 'string', example: 'WEB' },
            status: { type: 'string', enum: ['active', 'completed', 'archived'], example: 'active' },
            startDate: { type: 'string', format: 'date', nullable: true },
            dueDate: { type: 'string', format: 'date', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Task ─────────────────────────────────────────────────────────────
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            workspaceId: { type: 'string' },
            projectId: { type: 'string' },
            title: { type: 'string', example: 'Fix login bug' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], example: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'medium' },
            assigneeId: { $ref: '#/components/schemas/User', nullable: true },
            reporterId: { $ref: '#/components/schemas/User' },
            dueDate: { type: 'string', format: 'date', nullable: true },
            position: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Comment ──────────────────────────────────────────────────────────
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            taskId: { type: 'string' },
            userId: { $ref: '#/components/schemas/User' },
            content: { type: 'string', example: 'Looks good to me!' },
            editedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Notification ─────────────────────────────────────────────────────
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            type: { type: 'string', enum: ['task_assigned', 'task_updated', 'comment_added', 'project_invite', 'workspace_invite', 'system'] },
            title: { type: 'string', example: 'Task assigned to you' },
            message: { type: 'string' },
            isRead: { type: 'boolean', example: false },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Attachment ───────────────────────────────────────────────────────
        Attachment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            uploadedBy: { type: 'string' },
            taskId: { type: 'string', nullable: true },
            projectId: { type: 'string', nullable: true },
            fileName: { type: 'string' },
            originalName: { type: 'string', example: 'document.pdf' },
            mimeType: { type: 'string', example: 'application/pdf' },
            size: { type: 'integer', example: 102400 },
            url: { type: 'string', example: '/uploads/attachments/doc.pdf' },
            provider: { type: 'string', enum: ['local', 's3', 'gcs', 'azure'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── AuditLog ─────────────────────────────────────────────────────────
        AuditLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { $ref: '#/components/schemas/User', nullable: true },
            workspaceId: { type: 'string', nullable: true },
            action: { type: 'string', enum: ['login', 'logout', 'create', 'update', 'delete', 'assign', 'invite', 'status_change'] },
            entityType: { type: 'string', example: 'Task' },
            entityId: { type: 'string' },
            metadata: { type: 'object' },
            ipAddress: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Health ───────────────────────────────────────────────────────────
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded'], example: 'ok' },
            database: { type: 'string', example: 'connected' },
            redis: { type: 'string', example: 'connected' },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string', example: '1.0.0' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Access token missing or invalid',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Access token required' } } },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Forbidden' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Resource not found' } } },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
        },
        Conflict: {
          description: 'Conflict — resource already exists',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Service health check' },
      { name: 'Auth', description: 'Authentication: register, login, logout, token refresh' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Workspaces', description: 'Workspace CRUD and management' },
      { name: 'Workspace Members', description: 'Workspace membership and roles (RBAC)' },
      { name: 'Projects', description: 'Project CRUD inside workspaces' },
      { name: 'Tasks', description: 'Task management with Kanban board support' },
      { name: 'Comments', description: 'Task comment threads' },
      { name: 'Notifications', description: 'User notification inbox' },
      { name: 'Audit Logs', description: 'Workspace activity audit trail' },
      { name: 'Upload', description: 'File attachment uploads (avatar + task attachments)' },
      { name: 'Chat', description: 'Workspace/project chat messages' },
      { name: 'Search', description: 'Global full-text search' },
    ],
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/app.js', './src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
