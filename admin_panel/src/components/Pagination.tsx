interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="table-button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">Previous</button>
      <span aria-live="polite">Page {page} of {pages}</span>
      <button className="table-button" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">Next</button>
    </nav>
  );
}
