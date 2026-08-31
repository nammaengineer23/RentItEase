import { apiRequest } from './http';

export const socialMarketingApi = {
  getConnectionState: async () => apiRequest<Record<string, any>>('/social-media/accounts/status'),
  previewContent: async (propertyId: number, template?: string) =>
    apiRequest('/social-media/content/preview', {
      method: 'POST',
      body: JSON.stringify({ propertyId, template }),
    }),
};
