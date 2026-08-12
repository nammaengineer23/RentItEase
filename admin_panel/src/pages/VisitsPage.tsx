import { useEffect, useMemo, useState } from 'react';
import {
  approveVisit,
  completeVisit,
  getVisits,
  rejectVisit,
  type AdminVisit,
  type VisitStatus,
} from '../api/visitsApi';

type StatusFilter = 'ALL' | VisitStatus;

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function statusLabel(status: VisitStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'CANCELLED':
      return 'Cancelled';
    case 'COMPLETED':
      return 'Completed';
  }
}

function statusClass(status: VisitStatus): string {
  switch (status) {
    case 'PENDING':
      return 'status-pending';
    case 'APPROVED':
      return 'status-approved';
    case 'COMPLETED':
      return 'status-completed';
    case 'REJECTED':
    case 'CANCELLED':
      return 'status-inactive';
  }
}

export function VisitsPage() {
  const [visits, setVisits] = useState<AdminVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL');
  const [busyVisitId, setBusyVisitId] = useState<string | null>(null);

  async function loadVisits() {
    setLoading(true);
    setError('');

    try {
      const result = await getVisits();
      setVisits(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load visits.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVisits();
  }, []);

  const filteredVisits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visits.filter((visit) => {
      const matchesSearch =
        !query ||
        visit.tenant.fullName.toLowerCase().includes(query) ||
        visit.tenant.email.toLowerCase().includes(query) ||
        visit.property.title.toLowerCase().includes(query) ||
        visit.property.city.toLowerCase().includes(query) ||
        (visit.property.locality ?? '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'ALL' || visit.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [visits, search, statusFilter]);

  async function handleAction(
    visit: AdminVisit,
    action: 'approve' | 'reject' | 'complete',
  ) {
    const actionLabel =
      action === 'approve'
        ? 'approve'
        : action === 'reject'
          ? 'reject'
          : 'complete';

    const confirmed = window.confirm(
      `${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(
        1,
      )} the visit requested by ${visit.tenant.fullName}?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyVisitId(visit.id);
    setError('');

    try {
      let updated: AdminVisit;

      if (action === 'approve') {
        updated = await approveVisit(visit.id);
      } else if (action === 'reject') {
        updated = await rejectVisit(visit.id);
      } else {
        updated = await completeVisit(visit.id);
      }

      setVisits((current) =>
        current.map((item) =>
          item.id === visit.id ? { ...item, ...updated } : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${actionLabel} visit.`,
      );
    } finally {
      setBusyVisitId(null);
    }
  }

  if (loading) {
    return <div className="page-loader">Loading visits…</div>;
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Visit Management</h2>
          <p className="muted">
            Review and manage property visit requests across RentItEase.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => void loadVisits()}
        >
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="content-card">
        <div className="users-toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Search tenant, property or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="table-summary">
          Showing {filteredVisits.length} of {visits.length} visits
        </div>

        {filteredVisits.length === 0 ? (
          <div className="empty-state">
            <h3>No visits found</h3>
            <p>
              {visits.length === 0
                ? 'There are no property visits to manage.'
                : 'Try changing the search or status filter.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Visit date</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVisits.map((visit) => {
                  const busy = busyVisitId === visit.id;

                  return (
                    <tr key={visit.id}>
                      <td>
                        <div className="user-cell">
                          <strong>{visit.tenant.fullName}</strong>
                          <span>{visit.tenant.email}</span>
                        </div>
                      </td>

                      <td>
                        <div className="user-cell">
                          <strong>{visit.property.title}</strong>
                          <span>
                            {visit.property.city}
                            {visit.property.locality
                              ? `, ${visit.property.locality}`
                              : ''}
                          </span>
                        </div>
                      </td>

                      <td>{formatDateTime(visit.visitDate)}</td>

                      <td>
                        <span
                          className={`status-badge ${statusClass(
                            visit.status,
                          )}`}
                        >
                          {statusLabel(visit.status)}
                        </span>
                      </td>

                      <td>{formatDateTime(visit.createdAt)}</td>

                      <td>
                        <div className="table-actions">
                          {visit.status === 'PENDING' && (
                            <>
                              <button
                                className="table-button"
                                disabled={busy}
                                onClick={() =>
                                  void handleAction(visit, 'approve')
                                }
                              >
                                {busy ? '...' : 'Approve'}
                              </button>

                              <button
                                className="table-button danger-button"
                                disabled={busy}
                                onClick={() =>
                                  void handleAction(visit, 'reject')
                                }
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {visit.status === 'APPROVED' && (
                            <button
                              className="table-button"
                              disabled={busy}
                              onClick={() =>
                                void handleAction(visit, 'complete')
                              }
                            >
                              {busy ? '...' : 'Complete'}
                            </button>
                          )}

                          {(visit.status === 'REJECTED' ||
                            visit.status === 'CANCELLED' ||
                            visit.status === 'COMPLETED') && (
                            <span className="muted">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
