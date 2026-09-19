'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { hashPassword } = require('../../src/utils/hash');
const { User, Workspace, WorkspaceMember, Project, Task } = require('../../src/models');

/**
 * Create a user directly in DB and return login tokens.
 */
async function createUserAndLogin(overrides = {}) {
  const defaults = {
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    status: 'active',
  };
  const data = { ...defaults, ...overrides };
  const hashedPw = await hashPassword(data.password);
  const user = await User.create({ ...data, password: hashedPw });

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: data.email, password: data.password });

  return {
    user,
    plainPassword: data.password,
    accessToken: res.body.data?.accessToken,
    refreshToken: res.body.data?.refreshToken || res.headers['set-cookie']?.[0],
    cookie: res.headers['set-cookie'],
  };
}

/**
 * Create a workspace with the given user as owner.
 */
async function createWorkspace(userId, overrides = {}) {
  const slug = `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return Workspace.create({
    name: 'Test Workspace',
    ownerId: userId,
    slug,
    status: 'active',
    ...overrides,
  });
}

/**
 * Add userId as owner member of a workspace (used when creating workspace directly).
 */
async function addOwnerMember(workspaceId, userId) {
  return WorkspaceMember.create({ workspaceId, userId, role: 'owner', joinedAt: new Date() });
}

/**
 * Add a member to workspace with given role.
 */
async function addMember(workspaceId, userId, role = 'member') {
  return WorkspaceMember.create({ workspaceId, userId, role, joinedAt: new Date() });
}

/**
 * Create a project directly in DB.
 */
async function createProject(workspaceId, ownerId, overrides = {}) {
  const key = `K${Date.now().toString(36).toUpperCase().slice(-4)}`;
  return Project.create({
    workspaceId,
    ownerId,
    name: 'Test Project',
    key,
    status: 'active',
    ...overrides,
  });
}

/**
 * Create a task directly in DB.
 */
async function createTask(workspaceId, projectId, reporterId, overrides = {}) {
  return Task.create({
    workspaceId,
    projectId,
    title: 'Test Task',
    status: 'todo',
    priority: 'medium',
    reporterId,
    position: 1,
    ...overrides,
  });
}

module.exports = {
  createUserAndLogin,
  createWorkspace,
  addOwnerMember,
  addMember,
  createProject,
  createTask,
};
