/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatters'

export default function ApprovedMatchesPage() {
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchApprovedMatches = async () => {
      try {
        // Fetch matches that are either 'published' or 'approved'
        const response = await matchService.getAll({ 
          status: 'published,approved',
          limit: 100 
        })
        const payload = unwrapData(response)
        setMatches(payload?.data ?? payload ?? [])
      } catch (error) {
        setMatches([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchApprovedMatches()
  }, [])

  return (
    <section className="container page">
      <div className="section-head" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-2px', color: 'var(--color-slate-900)', lineHeight: 1 }}>Match</h1>
          <p className="section-subtitle" style={{ fontSize: '1.1rem', color: 'var(--color-slate-500)', marginTop: '8px', fontWeight: 500 }}>
            Management of approved and published sports matches.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p>Loading matches...</p>
      ) : (
        <div className="cards-grid">
          {matches.map((match) => (
            <article className="card" key={match.id} style={{ padding: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>{match.home_team} vs {match.away_team}</h3>
                <span className={`badge ${match.status}`} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                  {match.status.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#4b5563', display: 'grid', gap: '8px' }}>
                <p style={{ margin: 0 }}><strong>📅 Date:</strong> {formatDateTime(match.match_date)}</p>
                <p style={{ margin: 0 }}><strong>🏟️ Stadium:</strong> {match.stadium_name || 'N/A'}</p>
                <p style={{ margin: 0 }}><strong>📍 Address:</strong> {match.stadium_address || 'N/A'}</p>
              </div>
            </article>
          ))}
          {matches.length === 0 && <p>No approved matches found.</p>}
        </div>
      )}
    </section>
  )
}
