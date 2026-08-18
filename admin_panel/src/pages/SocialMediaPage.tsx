import { useEffect, useState } from 'react';
import {
  socialMediaApi,
  type GenerateVideoResponse,
  type SocialPlatform,
  type SocialSettings,
} from '../api/socialMediaApi';
import '../styles/social-media.css';

export function SocialMediaPage() {
  const [propertyId, setPropertyId] = useState('');
  const [settings, setSettings] = useState<SocialSettings | null>(null);
  const [video, setVideo] = useState<GenerateVideoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState<SocialPlatform | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    socialMediaApi.settings().then(setSettings).catch(() => undefined);
  }, []);

  async function generateVideo() {
    if (!propertyId.trim()) {
      setError('Enter a property ID.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await socialMediaApi.generate(propertyId.trim());
      setVideo(result);
      setMessage('Property video generated successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Video generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function publish(platform: SocialPlatform) {
    if (!propertyId.trim()) {
      setError('Enter a property ID.');
      return;
    }

    setPublishing(platform);
    setError('');
    setMessage('');

    try {
      const result = await socialMediaApi.publish(
        propertyId.trim(),
        platform,
        video?.caption,
        video?.videoTitle,
      );
      setMessage(
        `${platform} published successfully${result.url ? `: ${result.url}` : '.'}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : `${platform} publishing failed.`);
    } finally {
      setPublishing(null);
    }
  }

  async function processApproved() {
    if (!propertyId.trim()) {
      setError('Enter a property ID.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await socialMediaApi.processApproved(propertyId.trim());

      if (result.skipped) {
        setMessage(result.reason || 'Automation skipped.');
      } else {
        const successes =
          result.publications?.filter((item) => item.success).length ?? 0;
        setMessage(`Automation completed. ${successes} platform(s) published.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Automation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="social-page">
      <div className="social-header">
        <div>
          <p className="social-eyebrow">RENTITEASE ADMIN</p>
          <h1>Social Media Automation</h1>
          <p>
            Generate a 9:16 property reel from approved property photos and
            information, then publish it to connected social accounts.
          </p>
        </div>
        <div className="social-status">
          <span>Automation</span>
          <strong>{settings?.mode ?? 'Loading...'}</strong>
        </div>
      </div>

      <div className="social-card">
        <label htmlFor="property-id">Property ID</label>
        <div className="social-input-row">
          <input
            id="property-id"
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            placeholder="e.g. cmrpyufqv0003v5600z6q2cm6"
          />
          <button onClick={generateVideo} disabled={loading}>
            {loading ? 'Generating…' : 'Generate Video'}
          </button>
        </div>

        <button
          className="social-secondary"
          onClick={processApproved}
          disabled={loading}
        >
          Run Approval Automation
        </button>
      </div>

      {video && (
        <div className="social-card">
          <h2>{video.title}</h2>
          <p>{video.durationSeconds}s vertical reel</p>
          {video.videoUrl && (
            <video
              src={video.videoUrl}
              controls
              playsInline
              style={{ width: '100%', maxWidth: 360, aspectRatio: '9 / 16', objectFit: 'cover', borderRadius: 12 }}
            />
          )}

          <label htmlFor="caption">Generated caption</label>
          <textarea id="caption" value={video.caption} readOnly rows={9} />

          <div className="social-publish-grid">
            {(
              [
                ['INSTAGRAM', settings?.instagramEnabled],
                ['FACEBOOK', settings?.facebookEnabled],
                ['YOUTUBE', settings?.youtubeEnabled],
              ] as const
            ).map(([platform, enabled]) => (
              <button
                key={platform}
                onClick={() => publish(platform)}
                disabled={!enabled || publishing !== null}
                title={!enabled ? `${platform} is not configured` : ''}
              >
                {publishing === platform
                  ? 'Publishing…'
                  : enabled
                    ? `Publish to ${platform}`
                    : `${platform} not configured`}
              </button>
            ))}
          </div>
        </div>
      )}

      {message && <div className="social-message success">{message}</div>}
      {error && <div className="social-message error">{error}</div>}
    </section>
  );
}
