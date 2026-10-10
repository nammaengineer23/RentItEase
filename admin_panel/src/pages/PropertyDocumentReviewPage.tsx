import { useCallback, useEffect, useState } from "react";
import {
  getDocumentReviewQueue,
  updateDocumentReviewStatus,
  type DocumentReviewProperty,
  type PropertyDocumentReviewStatus,
} from "../api/propertyDocumentReviewApi";

const statuses: PropertyDocumentReviewStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
];

function pretty(value: string): string {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PropertyDocumentReviewPage() {
  const [items, setItems] = useState<DocumentReviewProperty[]>([]);
  const [statusById, setStatusById] = useState<Record<string, PropertyDocumentReviewStatus>>({});
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queue = await getDocumentReviewQueue();
      setItems(queue);
      setStatusById(Object.fromEntries(queue.map((item) => [item.id, item.documentReviewStatus])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the document review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(item: DocumentReviewProperty) {
    const status = statusById[item.id] ?? item.documentReviewStatus;
    if (status === "VERIFIED" && !window.confirm("Mark the submitted documents as reviewed/verified? This does not verify property ownership or publish the listing.")) return;
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await updateDocumentReviewStatus(item.id, status, reasonById[item.id]);
      setNotice("Document review status saved. Property verification and publication are unchanged.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update document review status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <h2>Property Document Review</h2>
          <p>Review submitted document status separately from property verification and publishing.</p>
        </div>
        <button className="secondary-button" onClick={() => void load()} disabled={loading}>Refresh</button>
      </div>
      <div className="notice-banner" role="note">
        A document status is not proof of ownership, title validity, or permission to publish a listing.
      </div>
      {error && <div className="error-banner" role="alert">{error}</div>}
      {notice && <div className="success-banner" role="status">{notice}</div>}
      <div className="content-card">
        {loading ? <p>Loading document review queue…</p> : items.length === 0 ? (
          <div className="empty-state"><h3>No documents awaiting review</h3><p>Listings submitted for review will appear here.</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Listing</th><th>Owner</th><th>Category</th><th>Location</th><th>Current status</th><th>Review action</th></tr></thead>
              <tbody>{items.map((item) => (
                <tr key={item.id}>
                  <td><div className="user-cell"><strong>{item.title}</strong><span>{item.id}</span></div></td>
                  <td><div className="user-cell"><strong>{item.owner.fullName}</strong><span>{item.owner.email}</span></div></td>
                  <td>{pretty(item.transactionType)}</td>
                  <td>{item.locality ? item.locality + ", " : ""}{item.city}</td>
                  <td><span className="status-badge status-pending">{pretty(item.documentReviewStatus)}</span></td>
                  <td>
                    <div className="table-actions">
                      <select
                        className="filter-select"
                        aria-label={"Review status for " + item.title}
                        value={statusById[item.id] ?? item.documentReviewStatus}
                        onChange={(event) => setStatusById((current) => ({ ...current, [item.id]: event.target.value as PropertyDocumentReviewStatus }))}
                      >
                        {statuses.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                      </select>
                      <input
                        className="search-input"
                        aria-label={"Review reason for " + item.title}
                        placeholder="Reason / audit note (optional)"
                        maxLength={500}
                        value={reasonById[item.id] ?? ""}
                        onChange={(event) => setReasonById((current) => ({ ...current, [item.id]: event.target.value }))}
                      />
                      <button className="table-button" disabled={busyId === item.id} onClick={() => void save(item)}>
                        {busyId === item.id ? "Saving…" : "Save status"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
