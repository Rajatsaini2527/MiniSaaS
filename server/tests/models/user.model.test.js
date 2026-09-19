'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, USER_STATUSES } = require('../../src/models');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('User Model', () => {
  const validUserData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securepassword123',
  };

  describe('Required fields', () => {
    it('should create a user with valid data', async () => {
      const user = await User.create(validUserData);
      expect(user._id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    it('should fail without name', async () => {
      const { name: _name, ...data } = validUserData;
      await expect(User.create(data)).rejects.toThrow(/Name is required/);
    });

    it('should fail without email', async () => {
      const { email: _email, ...data } = validUserData;
      await expect(User.create(data)).rejects.toThrow(/Email is required/);
    });

    it('should fail without password', async () => {
      const { password: _password, ...data } = validUserData;
      await expect(User.create(data)).rejects.toThrow(/Password is required/);
    });
  });

  describe('Email validation', () => {
    it('should lowercase the email', async () => {
      const user = await User.create({ ...validUserData, email: 'JOHN@EXAMPLE.COM' });
      expect(user.email).toBe('john@example.com');
    });

    it('should reject invalid email format', async () => {
      await expect(User.create({ ...validUserData, email: 'not-an-email' }))
        .rejects.toThrow(/valid email/);
    });

    it('should enforce email uniqueness', async () => {
      await User.create(validUserData);
      await expect(User.create({ ...validUserData, name: 'Jane Doe' }))
        .rejects.toThrow();
    });
  });

  describe('Password validation', () => {
    it('should reject password shorter than 8 characters', async () => {
      await expect(User.create({ ...validUserData, password: 'short' }))
        .rejects.toThrow(/8 characters/);
    });

    it('should not return password by default', async () => {
      const user = await User.create(validUserData);
      const found = await User.findById(user._id);
      expect(found.password).toBeUndefined();
    });

    it('should return password when explicitly selected', async () => {
      const user = await User.create(validUserData);
      const found = await User.findById(user._id).select('+password');
      expect(found.password).toBeDefined();
    });
  });

  describe('Status enum', () => {
    it('should default status to active', async () => {
      const user = await User.create(validUserData);
      expect(user.status).toBe('active');
    });

    it('should accept all valid statuses', async () => {
      for (const status of USER_STATUSES) {
        const user = await User.create({ ...validUserData, email: `${status}@example.com`, status });
        expect(user.status).toBe(status);
      }
    });

    it('should reject invalid status', async () => {
      await expect(User.create({ ...validUserData, status: 'banned' }))
        .rejects.toThrow(/Status must be one of/);
    });
  });

  describe('Defaults', () => {
    it('should default isEmailVerified to false', async () => {
      const user = await User.create(validUserData);
      expect(user.isEmailVerified).toBe(false);
    });

    it('should default lastLoginAt to null', async () => {
      const user = await User.create(validUserData);
      expect(user.lastLoginAt).toBeNull();
    });

    it('should default deletedAt to null', async () => {
      const user = await User.create(validUserData);
      expect(user.deletedAt).toBeNull();
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const user = await User.create(validUserData);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have an index on email', async () => {
      const indexes = await User.collection.getIndexes();
      const hasEmailIndex = Object.values(indexes).some(
        (idx) => idx[0] && idx[0][0] === 'email'
      );
      expect(hasEmailIndex).toBe(true);
    });
  });
});
