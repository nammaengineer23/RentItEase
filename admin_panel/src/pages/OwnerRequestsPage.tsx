import { useEffect, useState } from "react";
import {
  decideOwnerRequest,
  getOwnerRequests,
  type OwnerRequest,
} from "../api/ownerRequestsApi";

export function OwnerRequestsPage() {
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRequests(await getOwnerRequests());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load owner requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function decide(request: OwnerRequest, approve: boolean) {
    if (!window.confirm(`${approve ? "Approve" : "Reject"} owner access for ${request.fullName}?`)) return;
    setBusyId(request.id);
    try {
      await decideOwnerRequest(request.id, approve);
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update owner request.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="page-loader">Loading owner requests…</div>;
  return <section className="page-section">
    <div className="page-heading"><div><h2>Owner Requests</h2><p>Approve or reject tenant requests to list properties.</p></div><button className="secondary-button" onClick={() => void load()}>Refresh</button></div>
    {error && <div className="error-banner">{error}</div>}
    <div className="content-card">
      {requests.length === 0 ? <div className="empty-state"><h3>No pending owner requests</h3></div> :
        <div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Phone</th><th>Requested</th><th>Actions</th></tr></thead><tbody>
          {requests.map((request) => { const busy = busyId === request.id; return <tr key={request.id}><td><div className="user-cell"><strong>{request.fullName}</strong><span>{request.email}</span></div></td><td>{request.phone ?? "—"}</td><td>{request.ownerRequestedAt ? new Date(request.ownerRequestedAt).toLocaleDateString() : "—"}</td><td><div className="table-actions"><button className="table-button" disabled={busy} onClick={() => void decide(request, true)}>{busy ? "..." : "Approve"}</button><button className="table-button danger-button" disabled={busy} onClick={() => void decide(request, false)}>Reject</button></div></td></tr>; })}
        </tbody></table></div>}
    </div>
  </section>;
}
