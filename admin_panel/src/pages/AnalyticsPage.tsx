import { useEffect, useState } from "react";
import { getAnalytics, type AdminAnalytics } from "../api/adminApi";

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function percentage(value: number, total: number): string {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const result = await getAnalytics();
      setAnalytics(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  if (loading) {
    return (
      <section>
        <div className="page-loader">Loading analytics…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="section-heading">
          <div>
            <h2>Platform Analytics</h2>
            <p className="muted">Monitor RentItEase platform activity.</p>
          </div>

          <button
            className="secondary-button"
            onClick={() => void loadAnalytics()}
          >
            Retry
          </button>
        </div>

        <div className="error-banner">{error}</div>
      </section>
    );
  }

  if (!analytics) {
    return (
      <section>
        <div className="empty-state">
          <h3>No analytics data</h3>
          <p>Analytics data is currently unavailable.</p>
        </div>
      </section>
    );
  }

  const activeUserPercentage = percentage(
    analytics.users.active,
    analytics.users.total,
  );

  const availablePropertyPercentage = percentage(
    analytics.properties.available,
    analytics.properties.total,
  );

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Platform Analytics</h2>
          <p className="muted">
            Monitor RentItEase users, properties and engagement.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => void loadAnalytics()}
        >
          Refresh
        </button>
      </div>

      <div className="analytics-section">
        <div className="analytics-section-header">
          <div>
            <h3>Users</h3>
            <p>Platform account activity and roles.</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="Total users" value={analytics.users.total} />

          <StatCard
            label="Active users"
            value={analytics.users.active}
            detail={`${activeUserPercentage} of all users`}
          />

          <StatCard label="Inactive users" value={analytics.users.inactive} />

          <StatCard label="Owners" value={analytics.users.owners} />

          <StatCard label="Tenants" value={analytics.users.tenants} />

          <StatCard label="Administrators" value={analytics.users.admins} />
        </div>
      </div>

      <div className="analytics-section">
        <div className="analytics-section-header">
          <div>
            <h3>Properties</h3>
            <p>Listing availability across the platform.</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Total properties"
            value={analytics.properties.total}
          />

          <StatCard
            label="Available"
            value={analytics.properties.available}
            detail={`${availablePropertyPercentage} currently available`}
          />

          <StatCard
            label="Rented / unavailable"
            value={analytics.properties.rented}
          />
        </div>
      </div>

      <div className="analytics-section">
        <div className="analytics-section-header">
          <div>
            <h3>Engagement</h3>
            <p>How users interact with the platform.</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="Reviews" value={analytics.engagement.reviews} />

          <StatCard label="Favorites" value={analytics.engagement.favorites} />

          <StatCard
            label="Property visits"
            value={analytics.engagement.visits}
          />
        </div>
      </div>

      <div className="content-card analytics-summary">
        <h3>Platform Summary</h3>

        <div className="analytics-summary-grid">
          <div>
            <span>User accounts</span>
            <strong>{analytics.users.total}</strong>
          </div>

          <div>
            <span>Owner accounts</span>
            <strong>{analytics.users.owners}</strong>
          </div>

          <div>
            <span>Active listings</span>
            <strong>{analytics.properties.available}</strong>
          </div>

          <div>
            <span>Total engagement</span>
            <strong>
              {(
                analytics.engagement.reviews +
                analytics.engagement.favorites +
                analytics.engagement.visits
              ).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
