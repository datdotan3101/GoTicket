import { useEffect, useState } from 'react'
import MatchCard from '../../components/ui/MatchCard'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

export default function HomePage() {
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await matchService.getAll({ limit: 3, status: 'published' }) // Featured limit
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
              <span>🔍</span>
              <input type="text" placeholder="Search by team, league..." />
            </div>
            <div className="hs-input-wrap">
              <span>📍</span>
              <input type="text" placeholder="Location" />
            </div>
            <button className="hs-submit">Find Seats</button>
          </div>
        </div>
      </section>

      {/* Arena Hub */}
      <section className="arena-hub container">
        <div className="section-head">
          <div>
            <h2 className="section-title">THE ARENA HUB</h2>
            <p className="section-subtitle">Filter by your favorite discipline</p>
          </div>
          <a href="#" className="view-all-link">View All Categories ➔</a>
        </div>
        
        <div className="hub-grid">
          <div className="hub-card"><span className="hub-icon">⚽</span><span className="hub-label">SOCCER</span></div>
          <div className="hub-card"><span className="hub-icon">🏀</span><span className="hub-label">BASKETBALL</span></div>
          <div className="hub-card"><span className="hub-icon">🎾</span><span className="hub-label">TENNIS</span></div>
          <div className="hub-card"><span className="hub-icon">🏈</span><span className="hub-label">AMERICAN FOOTBALL</span></div>
          <div className="hub-card"><span className="hub-icon">🏎️</span><span className="hub-label">FORMULA 1</span></div>
          <div className="hub-card"><span className="hub-icon">🥊</span><span className="hub-label">UFC</span></div>
        </div>
      </section>

      {/* Featured Matchups */}
      <section className="featured-section">
        <div className="container">
          <h2 className="section-title mb-6">FEATURED MATCHUPS</h2>
          
          {isLoading ? (
             <p className="loading-state">Loading matchups...</p>
          ) : (
            <div className="match-cards-grid">
              {Array.isArray(matches) && matches.map((match) => <MatchCard key={match.id} match={match} />)}
            </div>
          )}
          {!isLoading && matches.length === 0 && <p className="empty-state-text">No published matches yet.</p>}
        </div>
      </section>

      {/* Trust Gateway Section */}
      <section className="trust-section container">
        <div className="trust-content">
          <h2 className="trust-title">THE MOST TRUSTED<br/>GATEWAY TO LIVE<br/>SPORTS.</h2>
          <p className="trust-desc">We don't just sell tickets. We provide the peace of mind that lets you focus on the match, knowing your entry is 100% guaranteed.</p>
          
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon bg-off-blue">🛡️</div>
              <h4 className="trust-item-title">Official Tickets</h4>
              <p className="trust-item-desc">Direct partnerships with clubs and leagues worldwide.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon bg-off-blue">🔒</div>
              <h4 className="trust-item-title">Secure Payments</h4>
              <p className="trust-item-desc">Bank-grade encryption for all financial transactions.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon bg-off-blue">🎧</div>
              <h4 className="trust-item-title">24/7 Support</h4>
              <p className="trust-item-desc">Our concierge team is always available to assist.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon bg-off-blue">📱</div>
              <h4 className="trust-item-title">Instant Delivery</h4>
              <p className="trust-item-desc">Digital tickets delivered straight to your mobile wallet.</p>
            </div>
          </div>
        </div>
        <div className="trust-image-col">
          <img src="/fans-cheering.png" alt="Fans cheering" className="trust-image" />
        </div>
      </section>
    </div>
  )
}
