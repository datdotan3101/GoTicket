import { useEffect, useState, useMemo, useRef, Suspense, lazy } from 'react'
import { Loader2, X, MapPin, Calendar, ChevronDown } from 'lucide-react'
const MatchCard = lazy(() => import('../../components/ui/MatchCard'))
import Pagination from '../../components/ui/Pagination'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import { unwrapData } from '../../utils/apiData'
import { usePagination } from '../../hooks/usePagination'

export default function HomePage() {
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Search state
  const [heroQuery, setHeroQuery] = useState('')
  const [heroLocation, setHeroLocation] = useState('')
  const [heroDate, setHeroDate] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [stadiums, setStadiums] = useState([])
  const [showStadiumDropdown, setShowStadiumDropdown] = useState(false)
  const debounceRef = useRef(null)

  const isSearchActive = heroQuery.trim().length > 0 || heroLocation.trim().length > 0 || heroDate.trim().length > 0

  // Load all published matches on mount
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await matchService.getAll({ limit: 20, status: 'published' })
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

    // Fetch stadiums for dropdown
    stadiumService.getAll().then(res => {
      const payload = unwrapData(res)
      if (Array.isArray(payload)) setStadiums(payload)
      else if (payload && Array.isArray(payload.data)) setStadiums(payload.data)
    }).catch(() => {})
  }, [])

  // Debounced real-time search
  useEffect(() => {
    if (!isSearchActive) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const params = { limit: 50, status: 'published' }
        if (heroQuery.trim()) params.q = heroQuery.trim()
        if (heroLocation.trim()) params.stadium = heroLocation.trim()
        if (heroDate) params.date = heroDate

        const response = await matchService.getAll(params)
        const payload = unwrapData(response)
        let items = []
        if (Array.isArray(payload)) items = payload
        else if (payload && Array.isArray(payload.data)) items = payload.data
        setSearchResults(items)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [heroQuery, heroLocation])

  const clearSearch = () => {
    setHeroQuery('')
    setHeroLocation('')
    setHeroDate('')
    setSearchResults([])
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
                <span style={{ fontSize: '1rem', opacity: 0.5, flexShrink: 0 }}>🔍</span>
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

              {/* Location input */}
              <div className="hs-input-wrap" style={{ position: 'relative' }}>
                <span style={{ fontSize: '1rem', opacity: 0.5, flexShrink: 0 }}>📍</span>
                <input
                  type="text"
                  placeholder="Stadium"
                  value={heroLocation}
                  onChange={e => {
                    setHeroLocation(e.target.value)
                    setShowStadiumDropdown(true)
                  }}
                  onFocus={() => setShowStadiumDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStadiumDropdown(false), 200)}
                  id="hero-location-input"
                  autoComplete="off"
                />
                {showStadiumDropdown && stadiums.length > 0 && (
                  <div className="custom-autocomplete-dropdown">
                    {stadiums.filter(s => s.name.toLowerCase().includes(heroLocation.toLowerCase())).length > 0 ? (
                      stadiums.filter(s => s.name.toLowerCase().includes(heroLocation.toLowerCase())).map(s => (
                        <div 
                          key={s.id} 
                          className="custom-autocomplete-item"
                          onClick={() => {
                            setHeroLocation(s.name)
                            setShowStadiumDropdown(false)
                          }}
                        >
                          <MapPin size={14} color="#94a3b8" />
                          {s.name}
                        </div>
                      ))
                    ) : (
                      <div className="custom-autocomplete-empty">No stadiums found</div>
                    )}
                  </div>
                )}
                {heroLocation && (
                  <button
                    className="hs-clear-btn"
                    onClick={() => setHeroLocation('')}
                    aria-label="Clear"
                    type="button"
                  >
                    <X size={13} />
                  </button>
                )}
                {!heroLocation && (
                  <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                )}
              </div>
              
              {/* Date input */}
              <div className="hs-input-wrap" style={{ position: 'relative' }}>
                <Calendar size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                <input
                  type="date"
                  value={heroDate}
                  onChange={e => setHeroDate(e.target.value)}
                  id="hero-date-input"
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: heroDate ? '#1e293b' : '#94a3b8', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500, width: '100%', padding: '12px 0', cursor: 'pointer' }}
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
                {isSearching
                  ? <Loader2 size={18} className="hs-spinner" />
                  : <span style={{ fontSize: '1rem' }}>⚡</span>
                }
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
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
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
                  <h2 className="section-title" style={{ margin: 0 }}>UPCOMING MATCHES</h2>
                </div>
                {upcomingMatches.length > 0 ? (
                  <div className="match-cards-grid">
                    <Suspense fallback={<div className="match-cards-grid si-grid">{[1, 2, 3].map(i => <div key={i} className="si-skeleton-card" />)}</div>}>
                      {upcomingMatches.map((match) => <MatchCard key={`upcoming-${match.id}`} match={match} />)}
                    </Suspense>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    No matches available.
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
                  <h2 className="section-title" style={{ margin: 0 }}>ENDED MATCHES</h2>
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
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
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
