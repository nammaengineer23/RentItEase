export const cert = (value: unknown) => value;
export const getApp = () => ({ name: 'test-app' });
export const getApps = () => [];
export const initializeApp = (options?: unknown) => ({ options });

export const getStorage = () => ({
  bucket: () => ({
    file: () => ({
      save: async () => undefined,
      delete: async () => undefined,
    }),
  }),
});

export const getDownloadURL = async () => 'https://example.test/file';

export const getAuth = () => ({
  verifyIdToken: async () => ({ uid: 'test-user' }),
});

export const getMessaging = () => ({
  send: async () => 'test-message-id',
  sendEachForMulticast: async () => ({
    successCount: 0,
    failureCount: 0,
    responses: [],
  }),
});
