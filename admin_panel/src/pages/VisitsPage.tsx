import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  approveVisit,
  cancelVisit,
  completeVisit,
  getVisits,
  rejectVisit,
  type AdminVisit,
  type VisitStatus,
} from '../api/visitsApi';

type StatusFilter = 'ALL' | VisitStatus;
type VisitAction = 'approve' | 'reject' | 'complete' | 'cancel';

function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function statusClass(status: VisitStatus): string {
  if (status === 'PENDING') return 'status-pending';
  if (status === 'APPROVED') return 'status-approved';
  if (status === 'COMPLETED') return 'status-completed';
  return 'status-inactive';
}

export function VisitsPage() {
  const [searchParams] = useSearchParams();
  const [visits, setVisits] = useState<AdminVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [busyVisitId, setBusyVisitId] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<AdminVisit | null>(null);

  async function loadVisits() {
    setLoading(true);
    setError('');
    try { setVisits(await getVisits()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load visits.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadVisits(); }, []);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query) setSearch(query);
  }, [searchParams]);

  useEffect(() => {
    const recordId = searchParams.get('record');
    if (!recordId || loading) return;
    const match = visits.find((visit) => visit.id === recordId);
    if (match) setSelectedVisit(match);
  }, [searchParams, loading, visits]);

  const filteredVisits = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visits.filter((visit) => {
      const matchesSearch = !query ||
        visit.tenant.fullName.toLowerCase().includes(query) ||
        visit.tenant.email.toLowerCase().includes(query) ||
        visit.property.title.toLowerCase().includes(query) ||
        visit.property.city.toLowerCase().includes(query) ||
        (visit.property.locality ?? '').toLowerCase().includes(query);
      return matchesSearch && (statusFilter === 'ALL' || visit.status === statusFilter);
    });
  }, [visits, search, statusFilter]);

  async function handleAction(visit: AdminVisit, action: VisitAction) {
    const confirmed = window.confirm(`${action.charAt(0).toUpperCase()}${action.slice(1)} the visit requested by ${visit.tenant.fullName}?`);
    if (!confirmed) return;
    setBusyVisitId(visit.id);
    setError('');
    try {
      const updated = action === 'approve' ? await approveVisit(visit.id)
        : action === 'reject' ? await rejectVisit(visit.id)
        : action === 'complete' ? await completeVisit(visit.id)
        : await cancelVisit(visit.id);
      setVisits((current) => current.map((item) => item.id === visit.id ? { ...item, ...updated } : item));
      setSelectedVisit((current) => current?.id === visit.id ? { ...current, ...updated } : current);
      await loadVisits();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} visit.`);
    } finally { setBusyVisitId(null); }
  }

  if (loading) return <div className="page-loader">Loading visits…</div>;

  return <section>
    <div className="section-heading"><div><h2>Visit Management</h2><p className="muted">Review and manage property visit requests across RentItEase.</p></div><button className="secondary-button" onClick={() => void loadVisits()}>Refresh</button></div>
    {error && <div className="error-banner">{error}</div>}
    <div className="content-card">
      <div className="users-toolbar">
        <input className="search-input" type="search" placeholder="Search tenant, property or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option>
        </select>
      </div>
      <div className="table-summary">Showing {filteredVisits.length} of {visits.length} visits</div>
      {filteredVisits.length === 0 ? <div className="empty-state"><h3>No visits found</h3><p>Try changing the search or status filter.</p></div> :
        <div className="table-container"><table className="data-table"><thead><tr><th>Tenant</th><th>Property</th><th>Visit date</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>
          {filteredVisits.map((visit) => <tr key={visit.id}>
            <td><div className="user-cell"><strong>{visit.tenant.fullName}</strong><span>{visit.tenant.email}</span></div></td>
            <td><div className="user-cell"><strong>{visit.property.title}</strong><span>{visit.property.city}{visit.property.locality ? `, ${visit.property.locality}` : ''}</span></div></td>
            <td>{formatDateTime(visit.visitDate)}</td><td><span className={`status-badge ${statusClass(visit.status)}`}>{visit.status}</span></td><td>{formatDateTime(visit.createdAt)}</td>
            <td><button className="table-button" onClick={() => setSelectedVisit(visit)}>View / Manage</button></td>
          </tr>)}
        </tbody></table></div>}
    </div>

    {selectedVisit && <div className="modal-backdrop" onClick={() => setSelectedVisit(null)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="section-heading"><div><h3>Visit details</h3><p className="muted">ID: {selectedVisit.id}</p></div><button className="secondary-button" onClick={() => setSelectedVisit(null)}>Close</button></div>
        <div className="details-grid">
          <div><strong>Tenant</strong><p>{selectedVisit.tenant.fullName}<br />{selectedVisit.tenant.email}</p></div>
          <div><strong>Property</strong><p>{selectedVisit.property.title}<br />{selectedVisit.property.city}{selectedVisit.property.locality ? `, ${selectedVisit.property.locality}` : ''}</p></div>
          <div><strong>Owner</strong><p>{selectedVisit.property.owner ? `${selectedVisit.property.owner.fullName} (${selectedVisit.property.owner.email})` : '—'}</p></div>
          <div><strong>Requested date/time</strong><p>{formatDateTime(selectedVisit.visitDate)}</p></div>
          <div><strong>Status</strong><p>{selectedVisit.status}</p></div>
          <div><strong>Created / updated</strong><p>{formatDateTime(selectedVisit.createdAt)}<br />{formatDateTime(selectedVisit.updatedAt)}</p></div>
          <div><strong>Notes</strong><p>{selectedVisit.notes || '—'}</p></div>
          <div><strong>Related booking</strong><p>{selectedVisit.booking ? `${selectedVisit.booking.id} · ${selectedVisit.booking.status}` : 'No booking'}</p></div>
        </div>
        <div className="table-actions">
          {selectedVisit.status === 'PENDING' && <><button className="table-button" disabled={busyVisitId === selectedVisit.id} onClick={() => void handleAction(selectedVisit, 'approve')}>Approve</button><button className="table-button danger-button" disabled={busyVisitId === selectedVisit.id} onClick={() => void handleAction(selectedVisit, 'reject')}>Reject</button></>}
          {selectedVisit.status === 'APPROVED' && <button className="table-button" disabled={busyVisitId === selectedVisit.id} onClick={() => void handleAction(selectedVisit, 'complete')}>Complete</button>}
          {(selectedVisit.status === 'PENDING' || selectedVisit.status === 'APPROVED') && <button className="table-button danger-button" disabled={busyVisitId === selectedVisit.id} onClick={() => void handleAction(selectedVisit, 'cancel')}>Cancel visit</button>}
        </div>
      </div>
    </div>}
  </section>;
}
