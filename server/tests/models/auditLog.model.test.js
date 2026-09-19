'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, Workspace, AuditLog, AUDIT_LOG_ACTIONS } = require('../../src/models');
const mongoose = require('mongoose');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('AuditLog Model', () => {
  let user, workspace;

  beforeEach(async () => {
    user = await User.create({ name: 'Auditor', email: 'auditor@example.com', password: 'password123' });
    workspace = await Workspace.create({ name: 'WS', ownerId: user._id, slug: 'audit-ws' });
  });

  const getValidData = (userId, wsId) => ({
    userId,
    workspaceId: wsId,
    action: 'create',
    entityType: 'Task',
    entityId: new mongoose.Types.ObjectId(),
  });

  describe('Required fields', () => {
    it('should create an audit log with valid data', async () => {
      const log = await AuditLog.create(getValidData(user._id, workspace._id));
      expect(log._id).toBeDefined();
      expect(log.action).toBe('create');
    });

    it('should fail without action', async () => {
      const { action: _a, ...data } = getValidData(user._id, workspace._id);
      await expect(AuditLog.create(data)).rejects.toThrow(/Action is required/);
    });

    it('should fail without entityType', async () => {
      const { entityType: _e, ...data } = getValidData(user._id, workspace._id);
      await expect(AuditLog.create(data)).rejects.toThrow(/Entity type is required/);
    });

    it('should fail without entityId', async () => {
      const { entityId: _id, ...data } = getValidData(user._id, workspace._id);
      await expect(AuditLog.create(data)).rejects.toThrow(/Entity ID is required/);
    });
  });

  describe('Action enum', () => {
    it('should accept all valid actions', async () => {
      for (const action of AUDIT_LOG_ACTIONS) {
        const log = await AuditLog.create({ ...getValidData(user._id, workspace._id), action });
        expect(log.action).toBe(action);
      }
    });

    it('should reject invalid action', async () => {
      await expect(AuditLog.create({ ...getValidData(user._id, workspace._id), action: 'hack' }))
        .rejects.toThrow(/Action must be one of/);
    });
  });

  describe('Optional fields', () => {
    it('should allow userId to be null', async () => {
      const log = await AuditLog.create({
        action: 'login',
        entityType: 'User',
        entityId: new mongoose.Types.ObjectId(),
        userId: null,
      });
      expect(log._id).toBeDefined();
    });

    it('should store metadata as mixed type', async () => {
      const metadata = { before: { status: 'todo' }, after: { status: 'done' } };
      const log = await AuditLog.create({ ...getValidData(user._id, workspace._id), metadata });
      expect(log.metadata).toEqual(metadata);
    });
  });
});
