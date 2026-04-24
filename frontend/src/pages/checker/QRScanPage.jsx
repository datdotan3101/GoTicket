import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
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
import { unwrapData } from '../../utils/apiData'

// Stable element ID — must match the empty div below
const VIEWPORT_ID = 'qr-reader-viewport'

export default function QRScanPage() {
  const [mode, setMode] = useState('scan') // 'scan' | 'manual'
  const [ticketCode, setTicketCode] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('idle') // 'idle' | 'starting' | 'active' | 'error'

  const html5QrCodeRef = useRef(null)
  // Use a ref for the callback so it never goes stale inside html5-qrcode
  const handleCheckinRef = useRef(null)

  handleCheckinRef.current = async (value, type) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const response = type === 'qr'
        ? await checkinService.scanQr(value)
        : await checkinService.checkinByCode(value)
      const data = unwrapData(response)
      setScanResult(data)
      toast.success(data.message || 'Check-in successful.')
      if (type === 'manual') {
        setTicketCode('')
        setMode('scan')
      }
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
        { fps: 10, qrbox: { width: 250, height: 250 } },
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

  return (
    <div className="qr-scanner-premium">
      <div className="container">
        {/* Header */}
        <header className="scanner-header">
          <Link to="/checker" className="scanner-back-btn">
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          <div className="scanner-title">
            <h1>Ticket Validator</h1>
          </div>
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
            <Clock size={14} />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>

        <div className="scanner-main-layout">
          {/* Left: viewport + controls */}
          <div className="scanner-viewport-card">

            {/*
              ⚠️  CRITICAL: This div must ALWAYS be in the DOM and ALWAYS be EMPTY.
              html5-qrcode owns everything inside it. React must never render
              children here, otherwise React's removeChild will crash when
              html5-qrcode has already moved those nodes.
            */}
            <div
              className="scanner-frame"
              style={{ display: mode === 'scan' ? 'block' : 'none' }}
            >
              <div className="corner tl" />
              <div className="corner tr" />
              <div className="corner bl" />
              <div className="corner br" />
              {/* ← NO children here ever → html5-qrcode owns this div */}
              <div id={VIEWPORT_ID} className="w-full h-full overflow-hidden rounded-2xl" />
            </div>

            {/* Overlay status shown OUTSIDE the viewport div */}
            {mode === 'scan' && cameraStatus !== 'active' && (
              <div className="scanner-status-overlay">
                {cameraStatus === 'starting' && (
                  <>
                    <Scan size={56} className="animate-pulse text-slate-500" />
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-4">
                      Initializing Camera...
                    </span>
                  </>
                )}
                {cameraStatus === 'error' && (
                  <>
                    <AlertCircle size={48} className="text-red-500" />
                    <span className="text-sm font-bold uppercase tracking-widest text-red-400 mt-4">
                      Camera unavailable
                    </span>
                    <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">
                      Allow camera permission in your browser or use manual code entry below.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Scan mode — "Enter Code Ticket" button */}
            {mode === 'scan' && (
              <div className="text-center mt-6">
                <p className="text-slate-400 text-sm mb-6">
                  {cameraStatus === 'active'
                    ? 'Camera active — align QR code within the frame.'
                    : 'Or enter the code manually.'}
                </p>
                <button
                  onClick={() => setMode('manual')}
                  className="inline-flex flex-row items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-bold transition-all shadow-lg shadow-blue-900/20 mx-auto border-none"
                >
                  <Keyboard size={20} className="shrink-0" />
                  <span className="whitespace-nowrap leading-none">Enter Code Ticket</span>
                </button>
              </div>
            )}

            {/* Manual mode */}
            {mode === 'manual' && (
              <div className="manual-input-container animate-fadeIn w-full">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                    <Keyboard size={32} />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-center mb-2 uppercase tracking-tight">
                  Manual Entry
                </h2>
                <p className="text-slate-400 text-sm text-center mb-10">
                  Use this if the QR code is damaged or unreadable.
                </p>

                <form onSubmit={onSubmit} className="flex flex-col gap-6 w-full max-w-sm mx-auto">
                  <div className="relative">
                    <input
                      autoFocus
                      className="scanner-input text-center text-3xl tracking-[0.3em] font-black uppercase w-full py-6"
                      placeholder="XXXXX"
                      maxLength={10}
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Ticket Code
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="scanner-submit-btn py-5"
                    >
                      <CheckCircle2 size={20} />
                      <span>{isSubmitting ? 'Validating...' : 'Confirm Check-in'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('scan')}
                      className="py-4 text-slate-500 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors"
                    >
                      Return to Scanner
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right: result panel */}
          <aside className="scan-result-aside">
            {scanResult ? (
              <div className="result-card-premium">
                <div className="result-header success">
                  <CheckCircle2 size={48} />
                  <h2 className="text-xl font-black uppercase italic">Access Granted</h2>
                </div>
                <div className="result-body">
                  <div className="result-info-grid">
                    <div className="result-info-item">
                      <span className="result-info-label">Ticket Reference</span>
                      <span className="result-info-value font-mono">#{scanResult.ticketId}</span>
                    </div>
                    <div className="result-info-item">
                      <span className="result-info-label">Validated At</span>
                      <span className="result-info-value">{new Date().toLocaleString()}</span>
                    </div>
                    <div className="result-info-item">
                      <span className="result-info-label">Status</span>
                      <div className="flex items-center gap-2 text-green-600 font-bold">
                        <CheckCircle2 size={16} />
                        <span>Successfully Checked-in</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-white/5 rounded-[32px] p-8 text-center flex flex-col items-center gap-4 justify-center h-full min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                  <Scan size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Awaiting Scan</h3>
                <p className="text-slate-400 text-sm max-w-[240px]">
                  Point the camera at a QR code or enter the ticket code manually.
                </p>
              </div>
            )}

            <div className="bg-blue-900/20 border border-blue-500/20 rounded-[32px] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  <AlertCircle size={20} />
                </div>
                <h4 className="font-bold text-blue-100">Security Notice</h4>
              </div>
              <p className="text-blue-200/60 text-xs leading-relaxed">
                Tokens are cryptographically signed. Any tampering will result in immediate validation failure.
                Report suspicious activity to the venue manager.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
