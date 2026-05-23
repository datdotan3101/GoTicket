/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ChevronLeft,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Camera,
  Search
} from 'lucide-react'
import { checkinService } from '../../services/checkinService'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

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
  const [cameraStatus, setCameraStatus] = useState('idle')
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
        const allMatches = payload?.data ?? payload ?? []
        // Only show upcoming or ongoing matches (match_date within last 4 hours or future)
        const now = new Date()
        const list = allMatches.filter(m => {
          if (!m.match_date) return true
          const matchEnd = new Date(new Date(m.match_date).getTime() + 4 * 60 * 60 * 1000)
          return matchEnd > now
        })
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
      toast.success(`✅ Ticket verified: ${data.ticketCode}`)

      setHistory(prev => [{
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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

      setHistory(prev => prev.map(item => 
        item.ticketCode === scanResult.ticketCode ? { ...item, status: 'ENTERED' } : item
      ))

      if (selectedMatchId) {
        const statsRes = await checkinService.getStatsByMatch(selectedMatchId)
        setStats(unwrapData(statsRes))
      }
      
      setTimeout(() => {
        setShowSuccess(false)
        setScanResult(prev => ({ ...prev, alreadyCheckedIn: true }))
        setTicketCode('')
      }, 3000)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Check-in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startCamera = async () => {
    if (html5QrCodeRef.current) return
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
          disableFlip: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
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

  const stopCamera = async () => {
    const scanner = html5QrCodeRef.current
    if (!scanner) return
    html5QrCodeRef.current = null
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

  useEffect(() => {
    if (mode === 'scan') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => { stopCamera() }
  }, [mode])

  const onSubmit = (e) => {
    e.preventDefault()
    if (!ticketCode.trim()) {
      toast.error('Please enter a ticket code.')
      return
    }
    handleCheckinRef.current(ticketCode.trim(), 'manual')
  }

  useEffect(() => {
    if (mode === 'manual' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mode, scanResult])

  const currentMatch = matches.find(m => String(m.id) === selectedMatchId)
  const checkinPercentage = stats.total_tickets > 0 ? Math.round((stats.checked_in_tickets / stats.total_tickets) * 100) : 0
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (checkinPercentage / 100) * circumference

  return (
    <div className="checker-console-layout bg-slate-50 min-h-screen">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <header className="console-header mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
          <div className="console-title-wrap">
            <Link to="/checker" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-2 transition-colors font-semibold">
              <ChevronLeft size={18} />
              <span className="text-sm uppercase tracking-wider">Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-black text-slate-900 m-0">Scanner Workspace</h1>
          </div>
          
          <div className="console-match-info text-right bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Event</span>
            <div className="text-sm font-bold text-slate-800">
              {currentMatch ? `${currentMatch.home_team} vs ${currentMatch.away_team}` : 'No Match Selected'}
            </div>
          </div>
        </header>

        {/* Main Grid: Scanner Left, Stats Right */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
          
          {/* SCANNER CARD (PRIMARY) */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden relative shadow-lg flex flex-col h-[400px] lg:h-[450px]">
            
            {/* Header overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-slate-900/80 to-transparent">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${cameraStatus === 'active' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-white font-bold text-sm tracking-wide uppercase">
                  {mode === 'scan' ? (cameraStatus === 'active' ? 'Camera Active' : 'Initializing...') : 'Manual Mode'}
                </span>
              </div>
              
              <button
                onClick={() => setMode(mode === 'scan' ? 'manual' : 'scan')}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all border border-white/10"
              >
                {mode === 'scan' ? <><Keyboard size={16} /> Manual Entry</> : <><Camera size={16} /> Switch to Camera</>}
              </button>
            </div>

            {/* Viewport Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black/50">
              {mode === 'scan' ? (
                <>
                  <div id={VIEWPORT_ID} className="w-full h-full object-cover"></div>
                  {/* Camera frame decorations */}
                  {cameraStatus === 'active' && !showSuccess && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/10 rounded-3xl pointer-events-none">
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl"></div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl"></div>
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl"></div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl"></div>
                      <div className="absolute left-0 right-0 h-0.5 bg-indigo-500/80 animate-scan-line shadow-[0_0_15px_#6366f1]"></div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full max-w-sm px-6 flex flex-col gap-6 z-10">
                  <div className="text-center text-white">
                    <Search size={48} className="mx-auto mb-4 text-indigo-400 opacity-80" />
                    <h2 className="text-2xl font-bold mb-2">Manual Ticket Entry</h2>
                    <p className="text-slate-400 text-sm">Enter the ticket code manually if the QR code is unreadable or damaged.</p>
                  </div>
                  <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
                    <input
                      ref={inputRef}
                      autoFocus
                      placeholder="e.g. GT-ABC123XYZ"
                      className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-indigo-500 rounded-xl px-6 py-4 text-white text-lg font-mono text-center outline-none transition-colors shadow-inner"
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                      disabled={isSubmitting}
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !ticketCode.trim()} 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.4)] disabled:shadow-none"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify Ticket'}
                    </button>
                  </form>
                </div>
              )}

              {/* Success Overlay */}
              {showSuccess && scanResult && (
                <div className="absolute inset-0 bg-green-600/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white animate-fadeIn">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 tracking-tight">ACCESS GRANTED</h2>
                  <div className="text-center mb-8">
                    <p className="text-xl font-bold text-green-100 mb-1">{scanResult.fullName}</p>
                    <p className="font-mono text-green-200">{scanResult.ticketCode}</p>
                  </div>
                  <div className="bg-black/20 px-6 py-3 rounded-full font-bold text-sm">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              )}

              {/* Scan Result Action Panel (Before Confirmation) */}
              {scanResult && !showSuccess && (
                <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl shadow-2xl z-20 flex flex-col md:flex-row justify-between items-center p-4 border border-slate-100 animate-fadeIn gap-4">
                  <div className="flex gap-4 items-center w-full md:w-auto">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-900 text-lg truncate">{scanResult.fullName}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">{scanResult.seatLabels}</span>
                        <span className="font-mono font-medium text-indigo-600">{scanResult.ticketCode}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmCheckin}
                    disabled={isSubmitting}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md whitespace-nowrap"
                  >
                    Confirm Check-in
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PROGRESS CARD (SECONDARY) */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Check-in Status</h2>
            
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 160 160" className="-rotate-90">
                <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle 
                  cx="80" cy="80" r={radius} 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="12" 
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-slate-900">{checkinPercentage}%</span>
                <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Filled</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-center">
                <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Checked In</span>
                <span className="text-xl font-black text-indigo-700">{stats.checked_in_tickets.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining</span>
                <span className="text-xl font-black text-slate-700">{stats.not_checked_in_tickets.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ENTRY HISTORY */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
              Recent Scans
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="py-4 px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="py-4 px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Info</th>
                  <th className="py-4 px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 border-b border-slate-50 text-sm font-semibold text-slate-500">{item.time}</td>
                    <td className="py-4 px-4 border-b border-slate-50">
                      <div className="font-bold text-slate-900">{item.customer}</div>
                    </td>
                    <td className="py-4 px-4 border-b border-slate-50">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-sm font-medium text-slate-600">{item.ticketCode}</span>
                        <span className={`inline-block w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.class.includes('VIP') ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                          {item.class}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-slate-50">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === 'ENTERED' || item.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status === 'ENTERED' || item.status === 'VALID' ? <CheckCircle2 size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
                      No tickets scanned in this session yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          position: absolute;
          animation: scan-line 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        /* Overrides for html5-qrcode */
        #qr-reader-viewport video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #qr-reader-viewport__scan_region {
          background: transparent !important;
        }
      ` }} />
    </div>
  )
}
