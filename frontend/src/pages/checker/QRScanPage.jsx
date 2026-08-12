/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { toast } from 'react-toastify'
import { checkinService } from '../../services/checkinService'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

import ScannerHeader from './components/ScannerHeader'
import ScannerCard from './components/ScannerCard'
import CheckinStats from './components/CheckinStats'
import ScanHistoryTable from './components/ScanHistoryTable'

const VIEWPORT_ID = 'qr-reader-viewport'

export default function QRScanPage() {
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(() => localStorage.getItem('checker_selected_match_id') || '')
  const [stats, setStats] = useState({ total_tickets: 0, checked_in_tickets: 0, not_checked_in_tickets: 0 })
  const [history, setHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('scanner_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    sessionStorage.setItem('scanner_history', JSON.stringify(history))
  }, [history])

  const [mode, setMode] = useState('scan') // 'scan' | 'manual'
  const [ticketCode, setTicketCode] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('idle')
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [cameras, setCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [isGettingCameras, setIsGettingCameras] = useState(true)

  const html5QrCodeRef = useRef(null)
  const scanLockedRef = useRef(false)
  const handleCheckinRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let mounted = true
    setIsGettingCameras(true)
    Html5Qrcode.getCameras().then(devices => {
      if (!mounted) return
      if (devices && devices.length > 0) {
        setCameras(devices)
        const saved = localStorage.getItem('preferred_camera_id')
        let camIdToUse = devices[0].id
        if (saved && devices.find(d => d.id === saved)) {
          camIdToUse = saved
        } else {
          const camo = devices.find(d => d.label.toLowerCase().includes('camo'))
          const back = devices.find(d => d.label.toLowerCase().includes('back'))
          if (camo) camIdToUse = camo.id
          else if (back) camIdToUse = back.id
        }
        setSelectedCameraId(camIdToUse)
      }
      setIsGettingCameras(false)
    }).catch(err => {
      console.warn('Could not get cameras', err)
      if (mounted) setIsGettingCameras(false)
    })
    return () => { mounted = false }
  }, [])

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

      if (data.alreadyCheckedIn) {
        toast.error(`Ticket ${data.ticketCode} is already checked in!`)
        setHistory(prev => [{
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          customer: data.fullName,
          ticketCode: data.ticketCode,
          status: 'USED',
          class: data.seatLabels || 'Standard',
          totalTickets: data.seatLabels ? data.seatLabels.split(',').length : 1
        }, ...prev].slice(0, 10))
        setIsSubmitting(false)
        setTimeout(() => { scanLockedRef.current = false }, 2500)
        return
      }

      // Auto-confirm check-in
      try {
        const confirmRes = await checkinService.confirm(data.ticketCode)
        const confirmData = unwrapData(confirmRes)
        
        setShowSuccess(true)
        toast.success(confirmData.message || 'Check-in successful.')

        setHistory(prev => [{
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          customer: data.fullName,
          ticketCode: data.ticketCode,
          status: 'ENTERED',
          class: data.seatLabels || 'Standard',
          totalTickets: data.seatLabels ? data.seatLabels.split(',').length : 1
        }, ...prev].slice(0, 10))

        if (selectedMatchId) {
          const statsRes = await checkinService.getStatsByMatch(selectedMatchId)
          setStats(unwrapData(statsRes))
        }

        setIsSubmitting(false)
        setTimeout(() => {
          setShowSuccess(false)
          setScanResult(prev => ({ ...prev, alreadyCheckedIn: true }))
          setTicketCode('')
          scanLockedRef.current = false
        }, 3000)
      } catch (confirmError) {
        toast.error(confirmError.response?.data?.message ?? 'Check-in failed.')
        setIsSubmitting(false)
        setTimeout(() => { scanLockedRef.current = false }, 2500)
      }

    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Scan failed.')
      setIsSubmitting(false)
      setTimeout(() => { scanLockedRef.current = false }, 2500)
    }
  }

  const startCamera = async (overrideId) => {
    if (html5QrCodeRef.current) return
    const el = document.getElementById(VIEWPORT_ID)
    if (!el) return

    setCameraStatus('starting')
    const scanner = new Html5Qrcode(VIEWPORT_ID)
    html5QrCodeRef.current = scanner

    const camId = overrideId || selectedCameraId
    const config = camId ? camId : { facingMode: 'environment' }

    try {
      await scanner.start(
        config,
        {
          fps: 30, // Increase fps for faster scanning
          disableFlip: false,
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ], // Only scan QR Code to save resources from processing other barcode types
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
      if (!isGettingCameras) {
        startCamera(selectedCameraId)
      }
    } else {
      stopCamera()
    }
    return () => { stopCamera() }
  }, [mode, isGettingCameras])

  const handleCameraChange = async (e) => {
    const newId = e.target.value
    setSelectedCameraId(newId)
    localStorage.setItem('preferred_camera_id', newId)
    if (mode === 'scan') {
      await stopCamera()
      setTimeout(() => {
        startCamera(newId)
      }, 100)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!ticketCode.trim()) {
      toast.error('Please enter a ticket code.')
      return
    }
    handleCheckinRef.current(ticketCode.trim(), 'manual')
  }

  const [showSearchInfo, setShowSearchInfo] = useState(false)

  const onSearch = async (e) => {
    e?.preventDefault()
    if (!ticketCode.trim()) {
      toast.error('Please enter a ticket code.')
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await checkinService.checkinByCode(ticketCode.trim())
      const data = unwrapData(response)
      
      setScanResult(data)
      setShowSearchInfo(true)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Search failed. Ticket not found.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeSearchInfo = () => {
    setShowSearchInfo(false)
    setTicketCode('')
    setScanResult(null)
  }

  useEffect(() => {
    if (mode === 'manual' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mode, scanResult, showSearchInfo])

  const currentMatch = matches.find(m => String(m.id) === selectedMatchId)

  return (
    <div className="checker-console-layout bg-slate-50 min-h-screen">
      <div className="container max-w-6xl py-8">
        <ScannerHeader currentMatch={currentMatch} />

        {/* Main Grid: Scanner Left, Stats Right */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
          <ScannerCard 
            mode={mode}
            setMode={setMode}
            cameraStatus={cameraStatus}
            cameras={cameras}
            selectedCameraId={selectedCameraId}
            onCameraChange={handleCameraChange}
            viewportId={VIEWPORT_ID}
            showSuccess={showSuccess}
            scanResult={scanResult}
            ticketCode={ticketCode}
            setTicketCode={setTicketCode}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            inputRef={inputRef}
            onSearch={onSearch}
            showSearchInfo={showSearchInfo}
            closeSearchInfo={closeSearchInfo}
          />

          <CheckinStats stats={stats} />
        </div>

        <ScanHistoryTable history={history} />
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
