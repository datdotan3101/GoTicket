import { useEffect, useState, useMemo, useRef, Suspense, lazy } from 'react'
import { Loader2, X, Calendar, Search } from 'lucide-react'
const MatchCard = lazy(() => import('../../components/ui/MatchCard'))
import Pagination from '../../components/ui/Pagination'
import StadiumAutocomplete from '../../components/ui/StadiumAutocomplete'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'
import { usePagination } from '../../hooks/usePagination'
import { useStadiums } from '../../hooks/useStadiums'
import { useMatchSearch } from '../../hooks/useMatchSearch'

export default function HomePage() {
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Search state
  const [heroQuery, setHeroQuery] = useState('')
  const [heroLocation, setHeroLocation] = useState('')
  const [heroDate, setHeroDate] = useState('')
  const debounceRef = useRef(null)

  // Shared hooks
  const stadiums = useStadiums()
  const {
    searchMatches,
    clearResults,
    results: searchResults,
    isLoading: isSearching,
  } = useMatchSearch()

  const isSearchActive = heroQuery.trim().length > 0 || heroLocation.trim().length > 0 || heroDate.trim().length > 0

  // Load all published matches on mount
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await matchService.getAll({ limit: 50, status: 'published' })
        const payload = unwrapData(response)
        let items = []
        if (Array.isArray(payload)) items = payload
        else if (payload && Array.isArray(payload.data)) items = payload.data
        setMatches(items)
      } catch {
        setMatches([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchMatches()
  }, [])

  // Debounced real-time search
  useEffect(() => {
    if (!isSearchActive) {
      clearResults()
      return
    }

    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const params = { limit: 50, status: 'published' }
      if (heroQuery.trim()) params.q = heroQuery.trim()
      if (heroLocation.trim()) params.stadium = heroLocation.trim()
      if (heroDate) params.date = heroDate
      searchMatches(params)
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [heroQuery, heroLocation, heroDate, isSearchActive, searchMatches, clearResults])

  const clearSearch = () => {
    setHeroQuery('')
    setHeroLocation('')
    setHeroDate('')
    clearResults()
  }

  // Split matches into categories
  const { onSaleMatches, upcomingMatches, endedMatches } = useMemo(() => {
    const now = new Date()

    const onSale = matches.filter(m => {
      if (!m.match_date) return false
      const matchDate = new Date(m.match_date)
      if (matchDate <= now) return false
      if (m.ticket_sale_open_at) {
        const saleOpen = new Date(m.ticket_sale_open_at)
        return saleOpen <= now
      }
      return true
    })

    const upcoming = matches.filter(m => {
      if (!m.match_date) return false
      const matchDate = new Date(m.match_date)
      if (matchDate <= now) return false
      if (m.ticket_sale_open_at) {
        const saleOpen = new Date(m.ticket_sale_open_at)
        return saleOpen > now
      }
      return false
    })

    const ended = matches
      .filter(m => {
        if (!m.match_date) return false
        return new Date(m.match_date) <= now
      })
      .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))

    return { 
      onSaleMatches: onSale.slice(0, 6), 
      upcomingMatches: upcoming.slice(0, 6),
      endedMatches: ended 
    }
  }, [matches])

  const {
    currentPage: endedPage,
    setCurrentPage: setEndedPage,
    paginatedItems: paginatedEndedMatches,
    totalPages: endedTotalPages
  } = usePagination(endedMatches, 6)

  const searchLabel = [heroQuery, heroLocation].filter(Boolean).join(' · ')

  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section className="hero-section" style={{ backgroundImage: "url('/hero-bg.png')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content container">
          <span className="hero-badge">OFFICIAL TICKETING PARTNER</span>
          <h1 className="hero-title">YOUR FRONT ROW<br />SEAT AWAITS.</h1>

          <div className="hero-search-wrapper">
            <div className="hero-search-box">
              {/* Query input */}
              <div className="hs-input-wrap hs-border-r" style={{ position: 'relative' }}>
                <Search size={16} color="var(--color-slate-400)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search by team, league..."
                  value={heroQuery}
                  onChange={e => setHeroQuery(e.target.value)}
                  id="hero-search-input"
                  autoComplete="off"
                />
                {heroQuery && (
                  <button
                    className="hs-clear-btn"
                    onClick={() => setHeroQuery('')}
                    aria-label="Clear"
                    type="button"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Location input — now uses shared component */}
              <StadiumAutocomplete
                value={heroLocation}
                onChange={setHeroLocation}
                stadiums={stadiums}
                id="hero-location-input"
                className="hs-input-wrap"
                iconSize={16}
              />
              
              {/* Date input */}
              <div className="hs-input-wrap" style={{ position: 'relative' }}>
                <Calendar size={16} color="var(--color-slate-400)" style={{ flexShrink: 0 }} />
                <input
                  type="date"
                  value={heroDate}
                  onChange={e => setHeroDate(e.target.value)}
                  id="hero-date-input"
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: heroDate ? 'var(--color-slate-800)' : 'var(--color-slate-400)', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500, width: '100%', padding: '12px 0', cursor: 'pointer' }}
                />
                {heroDate && (
                  <button
                    className="hs-clear-btn"
                    onClick={() => setHeroDate('')}
                    aria-label="Clear"
                    type="button"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {/* Loading indicator or static icon */}
              <div className="hs-search-status">
                {isSearching && <Loader2 size={18} className="hs-spinner" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH RESULTS (real-time) ── */}
      {isSearchActive && (
        <section className="search-inline-section">
          <div className="container">
            {/* Header */}
            <div className="si-header">
              <div className="si-meta">
                {isSearching ? (
                  <span className="si-searching-label">Searching for <em>"{searchLabel}"</em>...</span>
                ) : (
                  <span>
                    {searchResults.length > 0
                      ? <><strong>{searchResults.length}</strong> result{searchResults.length !== 1 ? 's' : ''} for <em>"{searchLabel}"</em></>
                      : <>No results for <em>"{searchLabel}"</em></>
                    }
                  </span>
                )}
              </div>
              <button className="si-clear-btn" onClick={clearSearch}>
                <X size={14} /> Clear search
              </button>
            </div>

            {/* Results */}
            {!isSearching && searchResults.length > 0 && (
              <div className="match-cards-grid si-grid">
                {searchResults.map(match => (
                  <MatchCard key={`search-${match.id}`} match={match} showHotBadge />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isSearching && searchResults.length === 0 && (
              <div className="si-empty">
                <div className="si-empty-icon">🏟️</div>
                <p className="si-empty-title">No matches found</p>
                <p className="si-empty-desc">Try a different team name, league or stadium.</p>
              </div>
            )}

            {/* Skeleton while searching */}
            {isSearching && (
              <div className="match-cards-grid si-grid">
                {[1, 2, 3].map(i => (
                  <div key={i} className="si-skeleton-card" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── DEFAULT SECTIONS (hidden when searching) ── */}
      {!isSearchActive && (
        <>
          {/* On Sale Now */}
          {!isLoading && (
            <section className="featured-section">
              <div className="container">
                <div className="section-head" style={{ marginBottom: '24px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>ON SALE NOW</h2>
                </div>
                {onSaleMatches.length > 0 ? (
                  <div className="match-cards-grid">
                    <Suspense fallback={<div className="match-cards-grid si-grid">{[1, 2, 3].map(i => <div key={i} className="si-skeleton-card" />)}</div>}>
                      {onSaleMatches.map((match) => <MatchCard key={`sale-${match.id}`} match={match} showHotBadge />)}
                    </Suspense>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-slate-500)', backgroundColor: 'var(--color-slate-50)', borderRadius: '12px', border: '1px dashed var(--color-slate-300)' }}>
                    No matches available.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Upcoming Matches */}
          {!isLoading && (
            <section className="featured-section" style={{ paddingTop: 0 }}>
              <div className="container">
                <div className="section-head" style={{ marginBottom: '24px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>UPCOMING TICKET SALES</h2>
                </div>
                {upcomingMatches.length > 0 ? (
                  <div className="match-cards-grid">
                    <Suspense fallback={<div className="match-cards-grid si-grid">{[1, 2, 3].map(i => <div key={i} className="si-skeleton-card" />)}</div>}>
                      {upcomingMatches.map((match) => <MatchCard key={`upcoming-${match.id}`} match={match} />)}
                    </Suspense>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-slate-500)', backgroundColor: 'var(--color-slate-50)', borderRadius: '12px', border: '1px dashed var(--color-slate-300)' }}>
                    No upcoming ticket sales at the moment.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Ended Matches */}
          {!isLoading && (
            <section className="featured-section" style={{ paddingTop: 0 }}>
              <div className="container">
                <div className="section-head" style={{ marginBottom: '24px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>ENDED SALE</h2>
                </div>
                {endedMatches.length > 0 ? (
                  <>
                    <div className="match-cards-grid">
                      <Suspense fallback={<div className="match-cards-grid si-grid">{[1, 2, 3].map(i => <div key={i} className="si-skeleton-card" />)}</div>}>
                        {paginatedEndedMatches.map((match) => <MatchCard key={`ended-${match.id}`} match={match} />)}
                      </Suspense>
                    </div>
                    {endedTotalPages > 1 && (
                      <Pagination 
                        currentPage={endedPage}
                        totalPages={endedTotalPages}
                        onPageChange={setEndedPage}
                      />
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-slate-500)', backgroundColor: 'var(--color-slate-50)', borderRadius: '12px', border: '1px dashed var(--color-slate-300)' }}>
                    No matches available.
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
