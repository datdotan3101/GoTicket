import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, X, Loader2, SlidersHorizontal, Calendar } from 'lucide-react'
import MatchCard from '../../components/ui/MatchCard'
import StadiumAutocomplete from '../../components/ui/StadiumAutocomplete'
import { useStadiums } from '../../hooks/useStadiums'
import { useMatchSearch } from '../../hooks/useMatchSearch'

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [date, setDate] = useState(searchParams.get('date') || '')
  const [hasSearched, setHasSearched] = useState(false)

  // Shared hooks
  const stadiums = useStadiums()
  const {
    searchMatches,
    clearResults,
    results,
    totalCount,
    isLoading,
  } = useMatchSearch()

  const doSearch = useCallback(async (q, loc, d) => {
    if (!q && !loc && !d) {
      clearResults()
      setHasSearched(false)
      return
    }
    setHasSearched(true)
    const params = { limit: 50, status: 'published' }
    if (q) params.q = q
    if (loc) params.stadium = loc
    if (d) params.date = d
    searchMatches(params)
  }, [searchMatches, clearResults])

  // Run search on mount & when URL params change
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const loc = searchParams.get('location') || ''
    const d = searchParams.get('date') || ''
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(q)
    setLocation(loc)
    setDate(d)
    doSearch(q, loc, d)
  }, [searchParams, doSearch])

  const handleSubmit = (e) => {
    e.preventDefault()
    const params = {}
    if (query.trim()) params.q = query.trim()
    if (location.trim()) params.location = location.trim()
    if (date) params.date = date
    setSearchParams(params)
  }

  const clearQuery = () => {
    setQuery('')
    const params = {}
    if (location.trim()) params.location = location.trim()
    if (date) params.date = date
    setSearchParams(params)
  }

  const clearDate = () => {
    setDate('')
    const params = {}
    if (query.trim()) params.q = query.trim()
    if (location.trim()) params.location = location.trim()
    setSearchParams(params)
  }

  const searchTermLabel = [searchParams.get('q'), searchParams.get('location')]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="search-results-page">
      {/* Search Bar */}
      <div className="sr-search-bar-wrapper">
        <div className="container">
          <form className="sr-search-form" onSubmit={handleSubmit}>
            <div className="sr-field-wrap sr-border-r">
              <Search size={18} className="sr-icon" />
              <input
                type="text"
                className="sr-input"
                placeholder="Team, league, competition..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                id="search-query-input"
              />
              {query && (
                <button type="button" className="sr-clear-btn" onClick={clearQuery} aria-label="Clear">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Stadium — now uses shared component */}
            <StadiumAutocomplete
              value={location}
              onChange={setLocation}
              stadiums={stadiums}
              id="search-location-input"
              className="sr-field-wrap"
              inputClassName="sr-input"
              clearBtnClassName="sr-clear-btn"
              iconSize={18}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e) }}
            />
            
            {/* DATE INPUT */}
            <div className="sr-field-wrap sr-border-l" style={{ position: 'relative' }}>
              <Calendar size={18} className="sr-icon" />
              <input
                type="date"
                className="sr-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e) }}
                id="search-date-input"
                style={{ cursor: 'pointer', fontFamily: 'inherit', color: date ? 'var(--color-slate-800)' : 'var(--color-slate-400)' }}
              />
              {date && (
                <button type="button" className="sr-clear-btn" onClick={clearDate} aria-label="Clear">
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="sr-submit-btn" id="search-submit-btn">
              Find Seats
            </button>
          </form>
        </div>
      </div>

      {/* Results Area */}
      <div className="container sr-body">
        {/* Header */}
        {hasSearched && !isLoading && (
          <div className="sr-results-header">
            <div className="sr-results-meta">
              <SlidersHorizontal size={16} />
              {totalCount > 0
                ? <span><strong>{totalCount}</strong> result{totalCount !== 1 ? 's' : ''} for <em>"{searchTermLabel}"</em></span>
                : <span>No results for <em>"{searchTermLabel}"</em></span>
              }
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="sr-loading">
            <Loader2 size={40} className="sr-spinner" />
            <p>Searching matches...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="sr-empty">
            <div className="sr-empty-icon">🔍</div>
            <h2 className="sr-empty-title">No matches found</h2>
            <p className="sr-empty-desc">
              Try different keywords — team names, league names or venue names.
            </p>
            <button className="sr-back-btn" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        )}

        {/* Initial idle state */}
        {!isLoading && !hasSearched && (
          <div className="sr-empty">
            <div className="sr-empty-icon">🏟️</div>
            <h2 className="sr-empty-title">Find your next match</h2>
            <p className="sr-empty-desc">
              Search by team name, league, or stadium to discover upcoming events.
            </p>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && results.length > 0 && (
          <div className="match-cards-grid sr-grid">
            {results.map((match) => (
              <MatchCard key={match.id} match={match} showHotBadge />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
