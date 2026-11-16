export default function Pagination({ pagination, onPage }) {
  const { page, totalPages, total } = pagination;
  return (
    <div className="pager">
      <span>{total} records</span>
      <div>
        <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
        <span className="pager-info"> Page {page} / {totalPages} </span>
        <button className="btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
