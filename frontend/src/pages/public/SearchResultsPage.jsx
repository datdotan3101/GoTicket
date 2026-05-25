import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, MapPin, X, Loader2, SlidersHorizontal, Calendar, ChevronDown } from 'lucide-react'
import MatchCard from '../../components/ui/MatchCard'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import { unwrapData } from '../../utils/apiData'

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [date, setDate] = useState(searchParams.get('date') || '')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [stadiums, setStadiums] = useState([])
  const [showStadiumDropdown, setShowStadiumDropdown] = useState(false)

  const doSearch = useCallback(async (q, loc, d) => {
    if (!q && !loc && !d) {
      setResults([])
      setHasSearched(false)
      return
    }
    setIsLoading(true)
    setHasSearched(true)
    try {
      const params = { limit: 50, status: 'published' }
      if (q) params.q = q
      if (loc) params.stadium = loc
      if (d) params.date = d
      const response = await matchService.getAll(params)
      const payload = unwrapData(response)
      let items = []
      let total = 0
      if (Array.isArray(payload)) {
        items = payload
        total = payload.length
      } else if (payload && Array.isArray(payload.data)) {
        items = payload.data
        total = payload.total ?? payload.data.length
      }
      setResults(items)
      setTotalCount(total)
    } catch {
      setResults([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Run search on mount & when URL params change
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const loc = searchParams.get('location') || ''
    const d = searchParams.get('date') || ''
    setQuery(q)
    setLocation(loc)
    setDate(d)
    doSearch(q, loc, d)

    // Fetch stadiums for dropdown
    stadiumService.getAll().then(res => {
      const payload = unwrapData(res)
      if (Array.isArray(payload)) setStadiums(payload)
      else if (payload && Array.isArray(payload.data)) setStadiums(payload.data)
    }).catch(() => {})
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

  const clearLocation = () => {
    setLocation('')
    const params = {}
    if (query.trim()) params.q = query.trim()
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
            <div className="sr-field-wrap" style={{ position: 'relative' }}>
              <MapPin size={18} className="sr-icon" />
              <input
                type="text"
                className="sr-input"
                placeholder="Stadium"
                value={location}
                onChange={e => {
                  setLocation(e.target.value)
                  setShowStadiumDropdown(true)
                }}
                onFocus={() => setShowStadiumDropdown(true)}
                onBlur={() => setTimeout(() => setShowStadiumDropdown(false), 200)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e) }}
                id="search-location-input"
                autoComplete="off"
              />
              {showStadiumDropdown && stadiums.length > 0 && (
                <div className="custom-autocomplete-dropdown">
                  {stadiums.filter(s => s.name.toLowerCase().includes(location.toLowerCase())).length > 0 ? (
                    stadiums.filter(s => s.name.toLowerCase().includes(location.toLowerCase())).map(s => (
                      <div 
                        key={s.id} 
                        className="custom-autocomplete-item"
                        onClick={() => {
                          setLocation(s.name)
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
              {location && (
                <button type="button" className="sr-clear-btn" onClick={clearLocation} aria-label="Clear">
                  <X size={14} />
                </button>
              )}
              {!location && (
                <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              )}
            </div>
            
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
                style={{ cursor: 'pointer', fontFamily: 'inherit', color: date ? '#1e293b' : '#94a3b8' }}
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
