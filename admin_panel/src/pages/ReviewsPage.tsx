import { useEffect, useMemo, useState } from 'react';
import {
  deleteReview,
  getReviews,
  type AdminReview,
} from '../api/reviewsApi';

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(Math.max(0, Math.min(5, rating)))}
      {'☆'.repeat(Math.max(0, 5 - rating))}
    </span>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);

  async function loadReviews() {
    setLoading(true);
    setError('');

    try {
      const result = await getReviews();
      setReviews(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load reviews.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return reviews;
    }

    return reviews.filter((review) => {
      return (
        review.user.fullName.toLowerCase().includes(query) ||
        review.user.email.toLowerCase().includes(query) ||
        review.property.title.toLowerCase().includes(query) ||
        review.property.city.toLowerCase().includes(query) ||
        (review.property.locality ?? '').toLowerCase().includes(query) ||
        (review.comment ?? '').toLowerCase().includes(query)
      );
    });
  }, [reviews, search]);

  async function handleDelete(review: AdminReview) {
    const confirmed = window.confirm(
      `Delete the review by ${review.user.fullName}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyReviewId(review.id);
    setError('');

    try {
      await deleteReview(review.id);

      setReviews((current) =>
        current.filter((item) => item.id !== review.id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete review.',
      );
    } finally {
      setBusyReviewId(null);
    }
  }

  if (loading) {
    return <div className="page-loader">Loading reviews…</div>;
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Review Management</h2>
          <p className="muted">
            Review and moderate feedback submitted by RentItEase users.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => void loadReviews()}
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
            placeholder="Search user, property or review..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-summary">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>

        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <h3>No reviews found</h3>
            <p>
              {reviews.length === 0
                ? 'There are no reviews to moderate.'
                : 'Try changing the search criteria.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Property</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.map((review) => {
                  const busy = busyReviewId === review.id;

                  return (
                    <tr key={review.id}>
                      <td>
                        <div className="user-cell">
                          <strong>{review.user.fullName}</strong>
                          <span>{review.user.email}</span>
                        </div>
                      </td>

                      <td>
                        <div className="user-cell">
                          <strong>{review.property.title}</strong>
                          <span>
                            {review.property.city}
                            {review.property.locality
                              ? `, ${review.property.locality}`
                              : ''}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="rating-stars">
                          <Stars rating={review.rating} />
                        </span>
                        <span className="rating-value">
                          {review.rating}/5
                        </span>
                      </td>

                      <td>
                        <div className="review-comment">
                          {review.comment || 'No comment'}
                        </div>
                      </td>

                      <td>{formatDate(review.createdAt)}</td>

                      <td>
                        <button
                          className="table-button danger-button"
                          onClick={() => void handleDelete(review)}
                          disabled={busy}
                        >
                          {busy ? '...' : 'Delete'}
                        </button>
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
