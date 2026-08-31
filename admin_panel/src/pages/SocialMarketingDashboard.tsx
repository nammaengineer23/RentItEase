import { useEffect, useState } from 'react';
import { socialMarketingApi } from '../api/socialMarketingApi';
export default function SocialMarketingDashboard() {
  const [connections, setConnections] = useState<Record<string, any>>({});
  useEffect(() => { socialMarketingApi.getConnectionState().then(setConnections).catch(() => setConnections({})); }, []);
  return <section><h1>Social Marketing</h1><p>Generate and publish approved property marketing content.</p>{['instagram','facebook','youtube'].map(p => <article key={p}><h3>{p}</h3><p>{connections[p]?.connected ? 'Connected' : 'Not connected'}</p><button type="button">Connect</button></article>)}</section>;
}
