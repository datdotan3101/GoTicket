import { useEffect, useState } from 'react'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatDate'

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
      <div className="section-head">
        <div>
          <h1>Approved Matches</h1>
          <p className="section-subtitle">List of matches that have been approved or published.</p>
        </div>
      </div>

      {isLoading ? (
        <p>Loading matches...</p>
      ) : (
        <div className="cards-grid">
          {matches.map((match) => (
            <article className="card" key={match.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{match.home_team} vs {match.away_team}</h3>
                <span className={`badge ${match.status}`}>
                  {match.status.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'grid', gap: '4px', marginTop: '8px' }}>
                <p><strong>ID:</strong> #{match.id}</p>
                <p><strong>Date:</strong> {formatDateTime(match.match_date)}</p>
                <p><strong>Stadium:</strong> {match.stadium_name || `Stadium ID: ${match.stadium_id}`}</p>
              </div>
            </article>
          ))}
          {matches.length === 0 && <p>No approved matches found.</p>}
        </div>
      )}
    </section>
  )
}
