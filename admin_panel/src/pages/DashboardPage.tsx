import { useEffect, useState } from 'react';
import {
  getDashboard,
  type AdminDashboard,
} from '../api/adminApi';

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
    <article className="stat-card">
      <span className="stat-label">{label}</span>

      <strong className="stat-value">
        {value.toLocaleString()}
      </strong>

      {detail && (
        <span className="stat-detail">
          {detail}
        </span>
      )}
    </article>
  );
}

export function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<AdminDashboard | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-card">
          <p>Loading dashboard…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="content-card">
          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button
            className="secondary-button"
            onClick={() => void loadDashboard()}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="page-section">
        <div className="content-card">
          <p>No dashboard data.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Platform overview</h1>

          <p>
            Live totals from the RentItEase admin API.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => void loadDashboard()}
        >
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total users"
          value={dashboard.users.totalUsers}
          detail={`${dashboard.users.totalOwners} owners`}
        />

        <StatCard
          label="Administrators"
          value={dashboard.users.totalAdmins}
        />

        <StatCard
          label="Properties"
          value={dashboard.properties.totalProperties}
          detail={`${dashboard.properties.activeProperties} available`}
        />

        <StatCard
          label="Rented / unavailable"
          value={dashboard.properties.rentedProperties}
        />

        <StatCard
          label="Reviews"
          value={dashboard.engagement.totalReviews}
        />

        <StatCard
          label="Favorites"
          value={dashboard.engagement.totalFavorites}
        />

        <StatCard
          label="Visits"
          value={dashboard.visits.totalVisits}
          detail={`${dashboard.visits.pendingVisits} pending`}
        />

        <StatCard
          label="Completed visits"
          value={dashboard.visits.completedVisits}
          detail={`${dashboard.visits.approvedVisits} approved`}
        />
      </div>

      <div className="content-card dashboard-next">
        <h3>Admin modules</h3>

        <div className="module-list">
          <div>
            <strong>User management</strong>
            <span>
              View, activate, deactivate and delete users.
            </span>
          </div>

          <div>
            <strong>Property management</strong>
            <span>
              Review, hide, unhide and delete properties.
            </span>
          </div>

          <div>
            <strong>Review &amp; visit moderation</strong>
            <span>
              Moderate reviews and property visits.
            </span>
          </div>

          <div>
            <strong>Commercial monitoring</strong>
            <span>
              Payment and membership management will be
              connected next.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}