'use strict';

require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Task,
  Comment,
  Notification,
  AuditLog,
} = require('../src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mini-saas';

async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log('✓ Cleared all collections');
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    await clearCollections();

    // Create users
    const users = await User.insertMany([
      {
        name: 'Alice Admin',
        email: 'alice@example.com',
        password: 'hashedpassword123',
        status: 'active',
        isEmailVerified: true,
        lastLoginAt: new Date(),
      },
      {
        name: 'Bob Member',
        email: 'bob@example.com',
        password: 'hashedpassword456',
        status: 'active',
        isEmailVerified: true,
      },
      {
        name: 'Carol Guest',
        email: 'carol@example.com',
        password: 'hashedpassword789',
        status: 'active',
        isEmailVerified: false,
      },
    ]);
    console.log(`✓ Created ${users.length} users`);

    // Create workspace
    const workspace = await Workspace.create({
      name: 'Acme Corp',
      description: 'Main workspace for Acme Corporation',
      ownerId: users[0]._id,
      slug: 'acme-corp',
      status: 'active',
    });
    console.log(`✓ Created workspace: ${workspace.name}`);

    // Create workspace members
    const members = await WorkspaceMember.insertMany([
      { workspaceId: workspace._id, userId: users[0]._id, role: 'owner', joinedAt: new Date() },
      { workspaceId: workspace._id, userId: users[1]._id, role: 'admin', joinedAt: new Date() },
      { workspaceId: workspace._id, userId: users[2]._id, role: 'member', joinedAt: new Date() },
    ]);
    console.log(`✓ Created ${members.length} workspace members`);

    // Create project
    const project = await Project.create({
      workspaceId: workspace._id,
      ownerId: users[0]._id,
      name: 'Website Redesign',
      description: 'Complete redesign of the company website',
      key: 'WEB',
      status: 'active',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    console.log(`✓ Created project: ${project.name}`);

    // Create tasks
    const tasks = await Task.insertMany([
      {
        workspaceId: workspace._id,
        projectId: project._id,
        title: 'Setup project repository',
        description: 'Initialize Git repository and CI/CD pipeline',
        status: 'done',
        priority: 'high',
        assigneeId: users[0]._id,
        reporterId: users[0]._id,
        position: 1,
      },
      {
        workspaceId: workspace._id,
        projectId: project._id,
        title: 'Design homepage mockups',
        description: 'Create wireframes and high-fidelity mockups for the homepage',
        status: 'in_progress',
        priority: 'high',
        assigneeId: users[1]._id,
        reporterId: users[0]._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        position: 2,
      },
      {
        workspaceId: workspace._id,
        projectId: project._id,
        title: 'Write API documentation',
        description: 'Document all API endpoints using OpenAPI spec',
        status: 'todo',
        priority: 'medium',
        assigneeId: users[2]._id,
        reporterId: users[0]._id,
        position: 3,
      },
    ]);
    console.log(`✓ Created ${tasks.length} tasks`);

    // Create comments
    const comments = await Comment.insertMany([
      {
        taskId: tasks[1]._id,
        userId: users[0]._id,
        content: 'Please make sure to follow the brand guidelines.',
      },
      {
        taskId: tasks[1]._id,
        userId: users[1]._id,
        content: 'Understood! I will have the first draft ready by Friday.',
        editedAt: new Date(),
      },
    ]);
    console.log(`✓ Created ${comments.length} comments`);

    // Create notifications
    const notifications = await Notification.insertMany([
      {
        userId: users[1]._id,
        type: 'task_assigned',
        title: 'New task assigned',
        message: 'You have been assigned to "Design homepage mockups"',
        entityType: 'Task',
        entityId: tasks[1]._id,
        isRead: false,
      },
      {
        userId: users[2]._id,
        type: 'task_assigned',
        title: 'New task assigned',
        message: 'You have been assigned to "Write API documentation"',
        entityType: 'Task',
        entityId: tasks[2]._id,
        isRead: true,
        readAt: new Date(),
      },
    ]);
    console.log(`✓ Created ${notifications.length} notifications`);

    // Create audit logs
    const auditLogs = await AuditLog.insertMany([
      {
        userId: users[0]._id,
        workspaceId: workspace._id,
        action: 'create',
        entityType: 'Workspace',
        entityId: workspace._id,
        metadata: { name: workspace.name },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script/1.0',
      },
      {
        userId: users[0]._id,
        workspaceId: workspace._id,
        action: 'invite',
        entityType: 'WorkspaceMember',
        entityId: members[1]._id,
        metadata: { invitedUserId: users[1]._id, role: 'admin' },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script/1.0',
      },
    ]);
    console.log(`✓ Created ${auditLogs.length} audit log entries`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`\nSeed Summary:`);
    console.log(`  Users:            ${users.length}`);
    console.log(`  Workspaces:       1`);
    console.log(`  Workspace Members:${members.length}`);
    console.log(`  Projects:         1`);
    console.log(`  Tasks:            ${tasks.length}`);
    console.log(`  Comments:         ${comments.length}`);
    console.log(`  Notifications:    ${notifications.length}`);
    console.log(`  Audit Logs:       ${auditLogs.length}`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

seed();
