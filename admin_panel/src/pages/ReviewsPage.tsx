import { useEffect, useMemo, useState } from 'react';
import { deleteReview, getReviews, updateReview, type AdminReview } from '../api/reviewsApi';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function Stars({ rating }: { rating: number }) {
  return <span aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}{'☆'.repeat(Math.max(0, 5 - rating))}</span>;
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadReviews() {
    setLoading(true); setError('');
    try { setReviews(await getReviews()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load reviews.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadReviews(); }, []);

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => r.user.fullName.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q) || r.property.title.toLowerCase().includes(q) || r.property.city.toLowerCase().includes(q) || (r.comment ?? '').toLowerCase().includes(q));
  }, [reviews, search]);

  function openReview(review: AdminReview) {
    setSelected(review); setRating(review.rating); setComment(review.comment ?? ''); setError('');
  }

  async function saveReview() {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      await updateReview(selected.id, { rating, comment });
      await loadReviews();
      setSelected(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update review.'); }
    finally { setBusy(false); }
  }

  async function removeReview() {
    if (!selected || !window.confirm(`Delete review ${selected.id}? This cannot be undone.`)) return;
    setBusy(true); setError('');
    try { await deleteReview(selected.id); await loadReviews(); setSelected(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete review.'); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="page-loader">Loading reviews…</div>;

  return <section>
    <div className="section-heading"><div><h2>Review Management</h2><p className="muted">Review, edit and moderate user feedback.</p></div><button className="secondary-button" onClick={() => void loadReviews()}>Refresh</button></div>
    {error && <div className="error-banner">{error}</div>}
    <div className="content-card">
      <div className="users-toolbar"><input className="search-input" type="search" placeholder="Search user, property or review..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="table-summary">Showing {filteredReviews.length} of {reviews.length} reviews</div>
      {filteredReviews.length === 0 ? <div className="empty-state"><h3>No reviews found</h3></div> : <div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Property</th><th>Rating</th><th>Comment</th><th>Updated</th><th>Action</th></tr></thead><tbody>
        {filteredReviews.map((r) => <tr key={r.id}><td><div className="user-cell"><strong>{r.user.fullName}</strong><span>{r.user.email}</span></div></td><td><div className="user-cell"><strong>{r.property.title}</strong><span>{r.property.city}{r.property.locality ? `, ${r.property.locality}` : ''}</span></div></td><td><span className="rating-stars"><Stars rating={r.rating} /></span> {r.rating}/5</td><td><div className="review-comment">{r.comment || 'No comment'}</div></td><td>{formatDate(r.updatedAt || r.createdAt)}</td><td><button className="table-button" onClick={() => openReview(r)}>Details / Edit</button></td></tr>)}
      </tbody></table></div>}
    </div>
    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => !busy && setSelected(null)}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" onMouseDown={(e) => e.stopPropagation()}>
      <div className="section-heading"><div><h3 id="review-dialog-title">Review details</h3><p className="muted">ID: {selected.id}</p></div><button className="secondary-button" disabled={busy} onClick={() => setSelected(null)}>Close</button></div>
      <p><strong>Property:</strong> {selected.property.title} ({selected.property.id})</p><p><strong>Reviewer:</strong> {selected.user.fullName} · {selected.user.email}</p><p><strong>Created:</strong> {formatDate(selected.createdAt)}</p><p><strong>Updated:</strong> {formatDate(selected.updatedAt || selected.createdAt)}</p>
      <label>Rating</label><select className="filter-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select>
      <label>Review text</label><textarea className="search-input" rows={6} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="table-actions"><button className="table-button" disabled={busy} onClick={() => void saveReview()}>{busy ? 'Saving…' : 'Save changes'}</button><button className="table-button danger-button" disabled={busy} onClick={() => void removeReview()}>Delete review</button></div>
    </div></div>}
  </section>;
}
