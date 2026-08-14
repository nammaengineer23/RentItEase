import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { jest } from '@jest/globals';

// ============================================================
// RentItEase E2E SETUP
// ============================================================

// ------------------------------------------------------------
// Load E2E environment
// ------------------------------------------------------------

const envFile = path.resolve(__dirname, '.env.e2e');

if (fs.existsSync(envFile)) {
  dotenv.config({
    path: envFile,
  });
} else {
  console.warn(`⚠️ E2E environment file not found: ${envFile}`);
}

// ============================================================
// Firebase Admin E2E mocks
// ============================================================
//
// firebase-admin v14 -> jwks-rsa -> jose
//
// jose is ESM and the current Jest CommonJS E2E setup cannot
// parse it correctly.
//
// These mocks prevent the real Firebase Admin modules from
// being loaded during E2E tests.
// ============================================================

// ------------------------------------------------------------
// Firebase Auth
// ------------------------------------------------------------

const mockFirebaseAuth = {
  verifyIdToken: jest.fn<() => Promise<unknown>>(async () => ({
    uid: 'e2e-firebase-user',
    email: 'e2e@example.com',
  })),

  createUser: jest.fn<() => Promise<unknown>>(async () => ({
    uid: 'e2e-firebase-user',
  })),

  getUser: jest.fn<() => Promise<unknown>>(async () => ({
    uid: 'e2e-firebase-user',
    email: 'e2e@example.com',
  })),

  deleteUser: jest.fn<() => Promise<void>>(async () => undefined),

  setCustomUserClaims: jest.fn<() => Promise<void>>(async () => undefined),
};

// ------------------------------------------------------------
// Firebase Messaging
// ------------------------------------------------------------

const mockFirebaseMessaging = {
  send: jest.fn<() => Promise<string>>(async () => 'e2e-message-id'),

  sendEachForMulticast: jest.fn<() => Promise<unknown>>(async () => ({
    successCount: 0,
    failureCount: 0,
    responses: [],
  })),

  subscribeToTopic: jest.fn<() => Promise<unknown>>(async () => ({
    successCount: 0,
    failureCount: 0,
    errors: [],
  })),

  unsubscribeFromTopic: jest.fn<() => Promise<unknown>>(async () => ({
    successCount: 0,
    failureCount: 0,
    errors: [],
  })),
};

// ------------------------------------------------------------
// Firebase Storage
// ------------------------------------------------------------

const mockFirebaseStorage = {
  bucket: jest.fn(() => ({
    file: jest.fn(() => ({
      save: jest.fn<() => Promise<void>>(async () => undefined),

      delete: jest.fn<() => Promise<void>>(async () => undefined),

      getSignedUrl: jest.fn<() => Promise<string[][]>>(async () => [
        ['https://example.com/e2e-file'],
      ]),

      getMetadata: jest.fn<() => Promise<unknown[]>>(async () => [
        {
          contentType: 'application/octet-stream',
        },
      ]),
    })),
  })),
};

// ============================================================
// Firebase Admin module mocks
// ============================================================

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => mockFirebaseAuth),
}));

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(() => mockFirebaseMessaging),
}));

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => mockFirebaseStorage),
}));

// ============================================================
// Firebase Admin App mock
// ============================================================

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn((options?: Record<string, unknown>) => ({
    name: '[DEFAULT]',
    options: options ?? {},
  })),

  getApps: jest.fn(() => []),

  cert: jest.fn((options: Record<string, unknown>) => ({
    ...options,
  })),

  applicationDefault: jest.fn(() => ({
    credential: 'application-default',
  })),
}));

// ============================================================
// END OF E2E SETUP
// ============================================================
//
// Intentionally no afterEach/afterAll here.
//
// The previous setup attempted to import Jest lifecycle
// functions from @jest/globals, but this setup is executed
// through Jest's setupFiles phase where those functions are
// not available in that form.
// ============================================================
