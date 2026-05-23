import { useEffect, useState, useMemo } from 'react'
import MatchCard from '../../components/ui/MatchCard'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

export default function HomePage() {
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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
  }, [])

  // Split matches into categories
  const { newMatches, onSaleMatches, endedMatches } = useMemo(() => {
    const now = new Date()

    // New/Hot: created recently (last 3 days) or sorted by newest first
    const sorted = [...matches].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    const hot = sorted.filter(m => {
      if (!m.match_date) return false
      return new Date(m.match_date) > now
    }).slice(0, 3)

    // On Sale: ticket_sale_open_at is in the past and match_date is in the future
    const onSale = matches.filter(m => {
      if (!m.match_date) return false
      const matchDate = new Date(m.match_date)
      if (matchDate <= now) return false // match already happened
      if (m.ticket_sale_open_at) {
        const saleOpen = new Date(m.ticket_sale_open_at)
        return saleOpen <= now
      }
      return true // if no ticket_sale_open_at, assume on sale
    })

    // Ended: match_date is in the past
    const ended = matches
      .filter(m => {
        if (!m.match_date) return false
        return new Date(m.match_date) <= now
      })
      .sort((a, b) => new Date(b.match_date) - new Date(a.match_date)) // newest ended first

    return { newMatches: hot, onSaleMatches: onSale.slice(0, 6), endedMatches: ended.slice(0, 6) }
  }, [matches])

  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section className="hero-section" style={{ backgroundImage: "url('/hero-bg.png')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content container">
          <span className="hero-badge">OFFICIAL TICKETING PARTNER</span>
          <h1 className="hero-title">YOUR FRONT ROW<br />SEAT AWAITS.</h1>
          
          <div className="hero-search-box">
            <div className="hs-input-wrap hs-border-r">
              <span>≡ƒöì</span>
              <input type="text" placeholder="Search by team, league..." />
            </div>
            <div className="hs-input-wrap">
              <span>≡ƒôì</span>
              <input type="text" placeholder="Location" />
            </div>
            <button className="hs-submit">Find Seats</button>
          </div>
        </div>
      </section>



      {/* On Sale Now ΓÇö top priority */}
      {!isLoading && onSaleMatches.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <div className="section-head" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>ON SALE NOW</h2>
                <span style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '99px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>Open</span>
              </div>
            </div>
            
            <div className="match-cards-grid">
              {onSaleMatches.map((match) => <MatchCard key={`sale-${match.id}`} match={match} showHotBadge />)}
            </div>
          </div>
        </section>
      )}



      {/* Ended Matches */}
      {!isLoading && endedMatches.length > 0 && (
        <section className="featured-section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head" style={{ marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>ENDED MATCHES</h2>
            </div>
            
            <div className="match-cards-grid">
              {endedMatches.map((match) => <MatchCard key={`ended-${match.id}`} match={match} />)}
            </div>
          </div>
        </section>
      )}


    </div>
  )
}
