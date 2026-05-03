import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ChevronLeft,
  Scan,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { checkinService } from '../../services/checkinService'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

// Stable element ID — must match the empty div below
const VIEWPORT_ID = 'qr-reader-viewport'
export default function QRScanPage() {
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(() => localStorage.getItem('checker_selected_match_id') || '')
  const [stats, setStats] = useState({ total_tickets: 0, checked_in_tickets: 0, not_checked_in_tickets: 0 })
  const [history, setHistory] = useState([])

  const [mode, setMode] = useState('scan') // 'scan' | 'manual'
  const [ticketCode, setTicketCode] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('idle') // 'idle' | 'starting' | 'active' | 'error'
  const [showSuccess, setShowSuccess] = useState(false)



  const html5QrCodeRef = useRef(null)
  const scanLockedRef = useRef(false)
  const handleCheckinRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await matchService.getAll({ limit: 30 })
        const payload = unwrapData(response)
        const list = payload?.data ?? payload ?? []
        setMatches(list)
        if (!selectedMatchId && list[0]?.id) {
          setSelectedMatchId(String(list[0].id))
        }
      } catch (err) {
        console.error('Failed to fetch matches', err)
      }
    }
    fetchMatches()
  }, [])

  useEffect(() => {
    if (!selectedMatchId) return
    const fetchStats = async () => {
      try {
        const response = await checkinService.getStatsByMatch(selectedMatchId)
        setStats(unwrapData(response) || { total_tickets: 0, checked_in_tickets: 0, not_checked_in_tickets: 0 })
      } catch (err) {
        console.error('Failed to fetch stats', err)
      }
    }
    fetchStats()
  }, [selectedMatchId])


  handleCheckinRef.current = async (value, type) => {
    if (scanLockedRef.current) return
    scanLockedRef.current = true
    setIsSubmitting(true)

    try {
      const response = type === 'qr'
        ? await checkinService.scanQr(value)
        : await checkinService.checkinByCode(value)

      const data = unwrapData(response)
      setScanResult(data)
      toast.success(`✅ ${data.fullName} — ${data.ticketCode}`)

      // Add to history
      setHistory(prev => [{
        time: new Date().toLocaleTimeString(),
        customer: data.fullName,
        ticketCode: data.ticketCode,
        status: 'VALID',
        class: data.seatLabels || 'Standard'
      }, ...prev].slice(0, 10))

    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Scan failed.')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => { scanLockedRef.current = false }, 1500)
    }
  }

  const handleConfirmCheckin = async () => {
    if (!scanResult || scanResult.alreadyCheckedIn) return
    
    setIsSubmitting(true)
    try {
      const response = await checkinService.confirm(scanResult.ticketCode)
      const data = unwrapData(response)
      
      setShowSuccess(true)
      toast.success(data.message || 'Check-in successful.')

      // Update history
      setHistory(prev => prev.map(item => 
        item.ticketCode === scanResult.ticketCode ? { ...item, status: 'ENTERED' } : item
      ))

      // Refresh stats
      if (selectedMatchId) {
        const statsRes = await checkinService.getStatsByMatch(selectedMatchId)
        setStats(unwrapData(statsRes))
      }
      
      setTimeout(() => {
        setShowSuccess(false)
        setScanResult(prev => ({ ...prev, alreadyCheckedIn: true }))
      }, 4000)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Check-in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }


  // Start camera — only called when mode === 'scan'
  const startCamera = async () => {
    if (html5QrCodeRef.current) return // already running
    const el = document.getElementById(VIEWPORT_ID)
    if (!el) return

    setCameraStatus('starting')
    const scanner = new Html5Qrcode(VIEWPORT_ID)
    html5QrCodeRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          disableFlip: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        (decoded) => handleCheckinRef.current(decoded, 'qr')
      )
      setCameraStatus('active')
    } catch (err) {
      console.warn('[QRScan] Camera start failed:', err)
      html5QrCodeRef.current = null
      setCameraStatus('error')
    }
  }

  // Stop camera gracefully
  const stopCamera = async () => {
    const scanner = html5QrCodeRef.current
    if (!scanner) return
    html5QrCodeRef.current = null // clear ref first to prevent re-entry
    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
      await scanner.clear()
    } catch (err) {
      console.warn('[QRScan] Camera stop (suppressed):', err)
    }
    setCameraStatus('idle')
  }

  // Mount → start; unmount → stop; mode switch → start/stop
  useEffect(() => {
    if (mode === 'scan') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const onSubmit = (e) => {
    e.preventDefault()
    if (!ticketCode.trim()) {
      toast.error('Please enter a ticket code.')
      return
    }
    handleCheckinRef.current(ticketCode.trim(), 'manual')
  }

  // Auto-focus input when in manual mode
  useEffect(() => {
    if (mode === 'manual' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mode, scanResult])

  const currentMatch = matches.find(m => String(m.id) === selectedMatchId)
  const checkinPercentage = stats.total_tickets > 0 ? Math.round((stats.checked_in_tickets / stats.total_tickets) * 100) : 0
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (checkinPercentage / 100) * circumference

  return (
    <div className="checker-console-layout">
      <div className="container">
        <header className="console-header">
          <div className="console-title-wrap">
            <Link to="/checker" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-2 transition-colors">
              <ChevronLeft size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
            </Link>
            <h1>Check-in Verification & Stats</h1>
          </div>
          
          <div className="console-match-info">
            <span className="console-match-label">Current Match</span>
            <div className="console-match-value">
              {currentMatch ? `${currentMatch.home_team} vs ${currentMatch.away_team}` : 'No Match Selected'}
            </div>
          </div>
        </header>

        <div className="console-grid">
          {/* Progress Card */}
          <div className="console-card">
            <h2 className="card-title-console">Check-in Progress</h2>
            
            <div className="progress-ring-container">
              <svg width="200" height="200">
                <circle
                  stroke="#f1f5f9"
                  strokeWidth="15"
                  fill="transparent"
                  r={radius}
                  cx="100"
                  cy="100"
                />
                <circle
                  stroke="#1D4ED8"
                  strokeWidth="15"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
                  strokeLinecap="round"
                  fill="transparent"
                  r={radius}
                  cx="100"
                  cy="100"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="progress-ring-text">
                <div className="progress-percentage">{checkinPercentage}%</div>
                <div className="progress-stats-label">
                  {stats.checked_in_tickets.toLocaleString()} / {stats.total_tickets.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="console-stats-row">
              <div className="stat-box-console">
                <span className="stat-box-label">Remaining</span>
                <div className="stat-box-value">{stats.not_checked_in_tickets.toLocaleString()}</div>
              </div>
              <div className="stat-box-console">
                <span className="stat-box-label">Rate/Min</span>
                <div className="stat-box-value accent">0</div>
              </div>
            </div>
          </div>

          {/* Scanner Card — Camera Primary, Manual Secondary */}
          <div className="console-card scanner-console-card" style={{padding: 0, display: 'flex', flexDirection: 'column'}}>

            {/* ── PRIMARY: Camera Viewport ── */}
            <div className="scanner-console-viewport" style={{flex: 1, minHeight: 200}}>
              {/* Status badge */}
              <div className="scanner-overlay-top">
                <div className={`status-dot-console ${cameraStatus === 'active' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                <span>Camera {cameraStatus === 'active' ? 'Active' : 'Starting...'}</span>
              </div>

              {/* QR viewport — owned by html5-qrcode */}
              <div id={VIEWPORT_ID} className="w-full h-full"></div>

              {/* Scan frame corners when active */}
              {cameraStatus === 'active' && !showSuccess && (
                <>
                  <div className="absolute inset-0 pointer-events-none border-[50px] border-black/50"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-white/20 rounded-2xl">
                    <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"></div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-blue-400 rounded-br-xl"></div>
                    <div className="absolute left-0 right-0 h-0.5 bg-blue-400/70 animate-scan-line"></div>
                  </div>
                </>
              )}

              {/* Success overlay */}
              {showSuccess && scanResult && (
                <div className="checkin-success-overlay animate-fadeIn bg-green-600">
                  <div className="checkin-success-icon"><CheckCircle2 size={64} /></div>
                  <h2 className="checkin-success-title">ACCESS GRANTED</h2>
                  <p className="checkin-success-sub">{scanResult.fullName} &bull; {scanResult.ticketCode}</p>
                  <p className="checkin-success-time">{new Date().toLocaleTimeString()}</p>
                </div>
              )}

              {/* Scan result info chip */}
              {scanResult && !showSuccess && (
                <div className="absolute bottom-[80px] left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-2xl z-20 flex justify-between items-center animate-fadeIn border border-slate-200/50">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 truncate text-sm">{scanResult.fullName}</div>
                      <div className="text-xs text-slate-500 truncate">{scanResult.seatLabels} &bull; <span className="font-mono text-blue-600">{scanResult.ticketCode}</span></div>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmCheckin}
                    disabled={isSubmitting}
                    className="manual-approve-btn ml-3"
                    style={{padding: '8px 20px', fontSize: '0.8rem'}}
                  >
                    Approve
                  </button>
                </div>
              )}

              {/* Bottom bar: manual entry toggle */}
              <div className="scanner-controls-bottom" style={{gap: 0, padding: 0}}>
                {mode === 'manual' ? (
                  // Manual input expanded
                  <form onSubmit={onSubmit} className="flex gap-2 w-full">
                    <input
                      ref={inputRef}
                      autoFocus
                      placeholder="Enter ticket code..."
                      className="console-input-manual"
                      style={{flex:1}}
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                      disabled={isSubmitting}
                    />
                    <button type="submit" disabled={isSubmitting} className="console-confirm-btn" style={{padding: '0 20px'}}>
                      {isSubmitting ? '...' : 'OK'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('scan')}
                      className="console-confirm-btn"
                      style={{background: '#334155', padding: '0 16px'}}
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  // Collapsed — show "Enter Code" button
                  <button
                    onClick={() => setMode('manual')}
                    className="camera-toggle-btn"
                    style={{margin: '0 auto', borderStyle: 'solid', background: 'rgba(15,23,42,0.7)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)'}}
                  >
                    <Keyboard size={14} />
                    <span>Enter Code Manually</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Entry History */}
        <div className="console-card history-card-console">
          <div className="history-header">
            <h2>Recent Entry History</h2>
            <Link to="#" className="view-all-console">View All</Link>
          </div>
          
          <table className="console-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Ticket Class</th>
                <th>Customer</th>
                <th>Ticket Code</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((item, i) => (
                <tr key={i}>
                  <td className="history-time">{item.time}</td>
                  <td>
                    <span className={`ticket-class-badge ${item.class.includes('VIP') ? 'vip' : ''}`}>
                      {item.class}
                    </span>
                  </td>
                  <td className="history-customer">{item.customer}</td>
                  <td className="font-mono text-slate-500">{item.ticketCode}</td>
                  <td>
                    <span className={`history-status ${item.status === 'ENTERED' || item.status === 'VALID' ? 'success' : 'error'}`}>
                      {item.status === 'ENTERED' || item.status === 'VALID' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {item.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400 font-medium italic">
                    No recent scans in this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          position: absolute;
          animation: scan-line 2s linear infinite;
        }
      ` }} />
    </div>
  )
}
