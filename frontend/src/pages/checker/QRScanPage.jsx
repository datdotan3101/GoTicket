import { useState } from 'react'
import toast from 'react-hot-toast'
import { checkinService } from '../../services/checkinService'
import { unwrapData } from '../../utils/apiData'

export default function QRScanPage() {
  const [qrToken, setQrToken] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!qrToken.trim()) {
      toast.error('Please paste QR token first.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await checkinService.scanQr(qrToken.trim())
      const data = unwrapData(response)
      setScanResult(data)
      toast.success('Check-in successful.')
      setQrToken('')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Check-in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container page">
      <h1>QR Scan</h1>
      <p>Free mode: paste QR token string to validate and check-in.</p>
      <form className="form" onSubmit={onSubmit}>
        <textarea
          rows={6}
          placeholder="Paste qr_token from ticket"
          value={qrToken}
          onChange={(event) => setQrToken(event.target.value)}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Checking...' : 'Check-in ticket'}
        </button>
      </form>

      {scanResult && (
        <article className="card" style={{ marginTop: '12px' }}>
          <h3>Latest check-in</h3>
          <p>Ticket ID: {scanResult.ticketId}</p>
          <p>Match ID: {scanResult.matchId}</p>
          <p>Seat ID: {scanResult.seatId}</p>
          <p>Status: {scanResult.status}</p>
        </article>
      )}
    </section>
  )
}
