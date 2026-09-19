'use strict';

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, Notification, NOTIFICATION_TYPES } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Notification Model', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({ name: 'Notified', email: 'notified@example.com', password: 'password123' });
  });

  const validData = (userId) => ({
    userId,
    type: 'task_assigned',
    title: 'Test Notification',
    message: 'You have a new notification',
  });

  describe('Required fields', () => {
    it('should create a notification with valid data', async () => {
      const notif = await Notification.create(validData(user._id));
      expect(notif._id).toBeDefined();
    });

    it('should fail without userId', async () => {
      const { userId: _u, ...data } = validData(user._id);
      await expect(Notification.create(data)).rejects.toThrow(/User is required/);
    });

    it('should fail without type', async () => {
      const { type: _t, ...data } = validData(user._id);
      await expect(Notification.create(data)).rejects.toThrow(/type is required/i);
    });
  });

  describe('Type enum', () => {
    it('should accept all valid notification types', async () => {
      for (const type of NOTIFICATION_TYPES) {
        const n = await Notification.create({ ...validData(user._id), type });
        expect(n.type).toBe(type);
      }
    });

    it('should reject invalid type', async () => {
      await expect(Notification.create({ ...validData(user._id), type: 'unknown_type' }))
        .rejects.toThrow(/Type must be one of/);
    });
  });

  describe('Defaults', () => {
    it('should default isRead to false', async () => {
      const notif = await Notification.create(validData(user._id));
      expect(notif.isRead).toBe(false);
    });

    it('should default readAt to null', async () => {
      const notif = await Notification.create(validData(user._id));
      expect(notif.readAt).toBeNull();
    });

    it('should default entityId to null', async () => {
      const notif = await Notification.create(validData(user._id));
      expect(notif.entityId).toBeNull();
    });
  });

  describe('Read functionality', () => {
    it('should allow marking a notification as read', async () => {
      const notif = await Notification.create(validData(user._id));
      notif.isRead = true;
      notif.readAt = new Date();
      await notif.save();
      const updated = await Notification.findById(notif._id);
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it('should accept entityId as ObjectId', async () => {
      const entityId = new mongoose.Types.ObjectId();
      const notif = await Notification.create({ ...validData(user._id), entityType: 'Task', entityId });
      expect(notif.entityId.toString()).toBe(entityId.toString());
    });
  });
});
