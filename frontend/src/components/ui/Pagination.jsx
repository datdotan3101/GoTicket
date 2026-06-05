import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable Pagination Component
 * 
 * Props:
 * - currentPage: number (1-indexed)
 * - totalPages: number
 * - onPageChange: (page: number) => void
 * - maxVisible: number (default: 5) - how many page buttons to show
 */
export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  maxVisible = 5 
}) {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages = []
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const pages = getPages()

  const btnStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-slate-200)',
    background: 'var(--color-white)',
    color: 'var(--color-slate-500)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.9rem',
    fontWeight: 600
  }

  const activeBtnStyle = {
    ...btnStyle,
    background: 'var(--color-slate-900)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-slate-900)',
    boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
  }

  const disabledBtnStyle = {
    ...btnStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
    background: 'var(--color-slate-50)'
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '40px',
      marginBottom: '20px'
    }}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={currentPage === 1 ? disabledBtnStyle : btnStyle}
        onMouseEnter={e => { if (currentPage !== 1) e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)' }}
        onMouseLeave={e => { if (currentPage !== 1) e.currentTarget.style.borderColor = 'var(--color-slate-200)'; e.currentTarget.style.color = 'var(--color-slate-500)' }}
      >
        <ChevronLeft size={18} />
      </button>

      {/* First Page if not in visible range */}
      {pages[0] > 1 && (
        <>
          <button 
            onClick={() => onPageChange(1)} 
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-slate-200)'; e.currentTarget.style.color = 'var(--color-slate-500)' }}
          >
            1
          </button>
          {pages[0] > 2 && <span style={{ color: 'var(--color-slate-400)' }}>...</span>}
        </>
      )}

      {/* Visible Pages */}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={currentPage === page ? activeBtnStyle : btnStyle}
          onMouseEnter={e => { if (currentPage !== page) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)' } }}
          onMouseLeave={e => { if (currentPage !== page) { e.currentTarget.style.borderColor = 'var(--color-slate-200)'; e.currentTarget.style.color = 'var(--color-slate-500)' } }}
        >
          {page}
        </button>
      ))}

      {/* Last Page if not in visible range */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span style={{ color: 'var(--color-slate-400)' }}>...</span>}
          <button 
            onClick={() => onPageChange(totalPages)} 
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-slate-200)'; e.currentTarget.style.color = 'var(--color-slate-500)' }}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={currentPage === totalPages ? disabledBtnStyle : btnStyle}
        onMouseEnter={e => { if (currentPage !== totalPages) e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)' }}
        onMouseLeave={e => { if (currentPage !== totalPages) e.currentTarget.style.borderColor = 'var(--color-slate-200)'; e.currentTarget.style.color = 'var(--color-slate-500)' }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
