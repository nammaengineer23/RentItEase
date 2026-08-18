import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });
export const socialMarketingApi = {
  getConnectionState: async () => (await api.get('/social-media/accounts/status')).data,
  previewContent: async (propertyId: number, template?: string) => (await api.post('/social-media/content/preview', { propertyId, template })).data,
};
