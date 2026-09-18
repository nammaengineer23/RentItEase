import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socialMediaApi, type GenerateVideoResponse, type SocialAnalytics, type SocialAuditEvent, type SocialPlatform, type SocialPost, type SocialPostStatus, type SocialProperty, type SocialSettings } from '../api/socialMediaApi';
import '../styles/social-media.css';

export function SocialMediaPage() {
  const [searchParams] = useSearchParams();
  const [propertyId, setPropertyId] = useState('');
  const [settings, setSettings] = useState<SocialSettings | null>(null);
  const [properties, setProperties] = useState<SocialProperty[]>([]);
  const [analytics, setAnalytics] = useState<SocialAnalytics | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [selected, setSelected] = useState<SocialProperty | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [history, setHistory] = useState<SocialAuditEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<SocialPostStatus | ''>('');
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | ''>('');
  const [video, setVideo] = useState<GenerateVideoResponse | null>(null);
  const [caption, setCaption] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState<SocialPlatform | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadDashboard() {
    try {
      const [s, p, a, activity] = await Promise.all([socialMediaApi.settings(), socialMediaApi.properties(), socialMediaApi.analytics(), socialMediaApi.posts(statusFilter || undefined, platformFilter || undefined)]);
      setSettings(s); setProperties(p); setAnalytics(a); setPosts(activity);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load social activity.'); }
  }
  useEffect(() => { void loadDashboard(); }, [statusFilter, platformFilter]);

  useEffect(() => {
    const recordId = searchParams.get('record');
    if (!recordId || posts.length === 0) return;
    const match = posts.find((post) => post.id === recordId);
    if (match) void openPost(match);
  }, [searchParams, posts]);

  const platforms = useMemo(() => [
    ['INSTAGRAM', settings?.instagramEnabled], ['FACEBOOK', settings?.facebookEnabled], ['YOUTUBE', settings?.youtubeEnabled],
  ] as const, [settings]);

  function chooseProperty(property: SocialProperty) { setSelected(property); setPropertyId(property.id); setVideo(null); setCaption(''); setVideoTitle(''); }
  async function openPost(post: SocialPost) { setSelectedPost(post); try { setHistory(await socialMediaApi.history(post.id)); } catch { setHistory([]); } }

  async function generateVideo() {
    if (!propertyId.trim()) return setError('Choose a consented property.');
    setLoading(true); setError(''); setMessage('');
    try { const result = await socialMediaApi.generate(propertyId.trim()); setVideo(result); setCaption(result.caption); setVideoTitle(result.videoTitle); setMessage('Property content generated successfully.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Video generation failed.'); }
    finally { setLoading(false); }
  }

  async function publish(platform: SocialPlatform) {
    if (!propertyId.trim()) return setError('Choose a consented property.');
    setPublishing(platform); setError('');
    try { const result = await socialMediaApi.publish(propertyId.trim(), platform, caption || video?.caption, videoTitle || video?.videoTitle); setMessage(`${platform} published successfully${result.url ? `: ${result.url}` : '.'}`); await loadDashboard(); }
    catch (e) { setError(e instanceof Error ? e.message : `${platform} publishing failed.`); }
    finally { setPublishing(null); }
  }

  async function schedule(platform: SocialPlatform) {
    const date = new Date(scheduledAt);
    if (!propertyId.trim() || !scheduledAt || Number.isNaN(date.getTime()) || date <= new Date()) return setError('Choose a consented property and future schedule time.');
    setPublishing(platform); setError('');
    try { await socialMediaApi.schedule(propertyId.trim(), platform, date.toISOString(), caption || video?.caption, videoTitle || video?.videoTitle); setMessage(`${platform} post scheduled successfully.`); await loadDashboard(); }
    catch (e) { setError(e instanceof Error ? e.message : `Unable to schedule ${platform}.`); }
    finally { setPublishing(null); }
  }

  async function postAction(action: 'retry' | 'cancel') {
    if (!selectedPost) return;
    if (action === 'cancel' && !window.confirm('Cancel this pending social publication?')) return;
    setLoading(true); setError('');
    try { if (action === 'retry') await socialMediaApi.retry(selectedPost.id); else await socialMediaApi.cancel(selectedPost.id); setSelectedPost(null); setHistory([]); setMessage(action === 'retry' ? 'Retry started.' : 'Publication cancelled.'); await loadDashboard(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update publication.'); }
    finally { setLoading(false); }
  }

  return <section className="social-page">
    <div className="social-header"><div><p className="social-eyebrow">RENTITEASE ADMIN</p><h1>Social Media Activity</h1><p>Prepare and publish content only for properties with recorded owner marketing consent.</p></div><div className="social-status"><span>Automation</span><strong>{settings?.mode ?? 'Loading...'}</strong></div></div>
    <div className="dashboard-grid">{[['Consented properties', properties.length], ['Prepared / posts', analytics?.totalPosts ?? 0], ['Pending / scheduled', analytics?.pending ?? 0], ['Published', analytics?.published ?? 0], ['Failed', analytics?.failed ?? 0]].map(([label, value]) => <div className="content-card" key={String(label)}><span className="muted">{label}</span><h2>{value}</h2></div>)}</div>
    <div className="content-card"><h3>Platform connections</h3><div className="social-publish-grid">{platforms.map(([platform, enabled]) => <div key={platform}><strong>{platform}</strong><p className={enabled ? 'status-badge status-active' : 'status-badge status-inactive'}>{enabled ? 'Connected' : 'Not configured'}</p></div>)}</div></div>

    <div className="content-card"><div className="section-heading"><div><h3>Consented properties</h3><p className="muted">Select a property to generate, edit, preview, publish or schedule content.</p></div><button className="secondary-button" onClick={() => void loadDashboard()}>Refresh</button></div>
      {properties.length === 0 ? <div className="empty-state">No consented properties found.</div> : <div className="table-container"><table className="data-table"><thead><tr><th>Property</th><th>Owner</th><th>Consent</th><th>Action</th></tr></thead><tbody>{properties.map((p) => <tr key={p.id}><td><strong>{p.title}</strong><br/><span className="muted">{p.city}{p.locality ? `, ${p.locality}` : ''}</span></td><td>{p.owner.fullName}</td><td><span className="status-badge status-active">Approved · v{p.socialMarketingConsent.consentVersion}</span></td><td><button className="table-button" onClick={() => chooseProperty(p)}>Manage</button></td></tr>)}</tbody></table></div>}
    </div>

    {selected && <div className="social-card"><div className="section-heading"><div><h2>{selected.title}</h2><p className="muted">{selected.owner.fullName} · consented {new Date(selected.socialMarketingConsent.consentedAt).toLocaleString()}</p></div><button className="secondary-button" onClick={() => setSelected(null)}>Close</button></div>
      <button onClick={() => void generateVideo()} disabled={loading}>{loading ? 'Generating…' : 'Generate / Regenerate content'}</button>
      {video && <><h3>Preview</h3>{video.videoUrl && <video src={video.videoUrl} controls playsInline style={{ width:'100%', maxWidth:360, aspectRatio:'9 / 16', objectFit:'cover', borderRadius:12 }}/>}<label htmlFor="social-title">Title</label><input id="social-title" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} /><label htmlFor="caption">Caption / description</label><textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={9}/><div className="social-publish-grid">{platforms.map(([platform, enabled]) => <button key={platform} onClick={() => void publish(platform)} disabled={!enabled || publishing !== null}>{publishing === platform ? 'Publishing…' : `Publish ${platform}`}</button>)}</div><label htmlFor="scheduled-at">Schedule for later</label><input id="scheduled-at" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}/><div className="social-publish-grid">{platforms.map(([platform, enabled]) => <button key={`schedule-${platform}`} onClick={() => void schedule(platform)} disabled={!enabled || publishing !== null || !scheduledAt}>Schedule {platform}</button>)}</div></>}
    </div>}

    <div className="content-card"><div className="section-heading"><div><h3>Publication history</h3><p className="muted">Audit scheduled, published, failed and cancelled activity.</p></div><div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SocialPostStatus | '')}><option value="">All statuses</option>{['PENDING','READY','PUBLISHING','PUBLISHED','FAILED','CANCELLED'].map((s) => <option key={s}>{s}</option>)}</select> <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as SocialPlatform | '')}><option value="">All platforms</option>{['INSTAGRAM','FACEBOOK','YOUTUBE'].map((p) => <option key={p}>{p}</option>)}</select></div></div>
      {posts.length === 0 ? <div className="empty-state">No publication activity matches these filters.</div> : <div className="table-container"><table className="data-table"><thead><tr><th>Property</th><th>Platform</th><th>Status</th><th>When</th><th>External ref / failure</th><th /></tr></thead><tbody>{posts.map((post) => <tr key={post.id}><td>{post.property.title}<div className="muted">{post.property.owner.fullName}</div></td><td>{post.platform}</td><td>{post.status}</td><td>{new Date(post.publishedAt || post.scheduledAt || post.createdAt).toLocaleString()}</td><td>{post.externalId || post.error || '—'}</td><td><button className="table-button" onClick={() => void openPost(post)}>Details</button></td></tr>)}</tbody></table></div>}
    </div>

    {selectedPost && <div className="modal-backdrop" onClick={() => setSelectedPost(null)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><h3>Publication details</h3><p><strong>{selectedPost.property.title}</strong> · {selectedPost.platform}</p><p>Status: {selectedPost.status}<br/>Created: {new Date(selectedPost.createdAt).toLocaleString()}<br/>Scheduled: {selectedPost.scheduledAt ? new Date(selectedPost.scheduledAt).toLocaleString() : '—'}<br/>Published: {selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toLocaleString() : '—'}<br/>External reference: {selectedPost.externalId || '—'}<br/>Failure: {selectedPost.error || '—'}</p><p>{selectedPost.caption || 'No caption recorded.'}</p><h4>Audit history</h4>{history.length ? <ul>{history.map((event) => <li key={event.id}>{new Date(event.createdAt).toLocaleString()} — {event.eventType}</li>)}</ul> : <p className="muted">No audit events.</p>}<div className="modal-actions">{selectedPost.status === 'FAILED' && <button disabled={loading} onClick={() => void postAction('retry')}>Retry</button>}{['PENDING','READY','FAILED'].includes(selectedPost.status) && <button className="danger-button" disabled={loading} onClick={() => void postAction('cancel')}>Cancel</button>}<button className="secondary-button" onClick={() => setSelectedPost(null)}>Close</button></div></div></div>}
    {message && <div className="social-message success">{message}</div>}{error && <div className="social-message error">{error}</div>}
  </section>;
}
