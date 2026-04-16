import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import { STAND_NAMES } from '../../constants/standRatios'
import { matchService } from '../../services/matchService'
import { generateStandsPreview } from '../../utils/standGenerator'

export default function StandConfigPage() {
  const { matchId } = useParams()
  const [totalCapacity, setTotalCapacity] = useState('')
  const [prices, setPrices] = useState({ A: '', B: '', C: '', D: '' })
  const [serverPreview, setServerPreview] = useState([])

  const localPreview = useMemo(
    () => (totalCapacity ? generateStandsPreview(Number(totalCapacity)) : []),
    [totalCapacity],
  )

  const payload = useMemo(
    () => ({
      totalCapacity: Number(totalCapacity),
      prices: {
        A: Number(prices.A || 0),
        B: Number(prices.B || 0),
        C: Number(prices.C || 0),
        D: Number(prices.D || 0),
      },
    }),
    [prices, totalCapacity],
  )

  const previewOnServer = async () => {
    try {
      const response = await matchService.previewStands(payload)
      setServerPreview(response.data?.data || [])
      toast.success('Preview generated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Preview failed.')
    }
  }

  const saveConfig = async () => {
    try {
      await matchService.configureStands(matchId, payload)
      toast.success('Stands configured.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed.')
    }
  }

  return (
    <section className="container page">
      <h1>Stand Config</h1>
      <div className="form">
        <input type="number" min="100" placeholder="Total capacity" value={totalCapacity} onChange={(e) => setTotalCapacity(e.target.value)} />
        {STAND_NAMES.map((name) => (
          <input
            key={name}
            type="number"
            min="0"
            placeholder={`Price stand ${name}`}
            value={prices[name]}
            onChange={(e) => setPrices((p) => ({ ...p, [name]: e.target.value }))}
          />
        ))}
      </div>

      <h2 style={{ marginTop: '12px' }}>Local preview (DRY util)</h2>
      <div className="cards-grid">
        {localPreview.map((stand) => (
          <article key={stand.name} className="card">
            <h3>Stand {stand.name}</h3>
            <p>Total seats: {stand.total_seats}</p>
            <p>Rows: {stand.rows}</p>
            <p>Seats/row: {stand.seats_per_row}</p>
          </article>
        ))}
      </div>

      <div className="row-gap" style={{ marginTop: '12px' }}>
        <button type="button" onClick={previewOnServer}>Preview with API</button>
        <button type="button" onClick={saveConfig}>Save stand config</button>
      </div>

      {serverPreview.length > 0 && (
        <>
          <h2 style={{ marginTop: '12px' }}>Server preview</h2>
          <pre>{JSON.stringify(serverPreview, null, 2)}</pre>
        </>
      )}
    </section>
  )
}
