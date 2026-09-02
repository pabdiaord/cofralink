export const ITEMS_PER_PAGE = 15

export function getPageData(items, requestedPage, pageSize = ITEMS_PER_PAGE) {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages)
  const firstItemIndex = (currentPage - 1) * pageSize

  return {
    currentPage,
    pageItems: items.slice(firstItemIndex, firstItemIndex + pageSize),
  }
}

function getVisiblePages(totalPages, currentPage) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) pages.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < totalPages - 1) pages.push('end-ellipsis')

  pages.push(totalPages)
  return pages
}

export default function Pagination({
  currentPage,
  totalItems,
  onPageChange,
  itemLabel = 'elementos',
  pageSize = ITEMS_PER_PAGE,
}) {
  if (totalItems === 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(currentPage, 1), totalPages)
  const firstItem = (safePage - 1) * pageSize + 1
  const lastItem = Math.min(safePage * pageSize, totalItems)

  return (
    <nav className="pagination" aria-label={`Paginación de ${itemLabel}`}>
      <span className="pagination-summary" aria-live="polite">
        Mostrando {firstItem}-{lastItem} de {totalItems} {itemLabel}
      </span>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-button"
            disabled={safePage === 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            Anterior
          </button>

          {getVisiblePages(totalPages, safePage).map(page => (
            typeof page === 'number' ? (
              <button
                key={page}
                type="button"
                className="pagination-button"
                aria-current={page === safePage ? 'page' : undefined}
                aria-label={`Página ${page}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ) : (
              <span key={page} className="pagination-ellipsis" aria-hidden="true">…</span>
            )
          ))}

          <button
            type="button"
            className="pagination-button"
            disabled={safePage === totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </nav>
  )
}
