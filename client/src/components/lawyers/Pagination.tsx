interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const showing = Math.min(itemsPerPage, totalItems);

  const pages = Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1);

  return (
    <div className="flex justify-between items-center px-4">
      <p className="text-xs text-on-surface-variant font-medium">
        Showing {showing} of {totalItems} practitioners
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
        >
          Previous
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={`text-xs font-bold transition-colors ${
              page === currentPage
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
