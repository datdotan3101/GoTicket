import { Keyboard, Camera, CheckCircle2 } from 'lucide-react'

export default function ScannerCard({
  mode,
  setMode,
  cameraStatus,
  cameras,
  selectedCameraId,
  onCameraChange,
  viewportId,
  showSuccess,
  scanResult,
  ticketCode,
  setTicketCode,
  onSubmit,
  isSubmitting,
  inputRef,
  onSearch,
  showSearchInfo,
  closeSearchInfo
}) {
  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden relative shadow-lg flex flex-col h-[400px] lg:h-[450px]">
      
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex flex-col md:flex-row justify-between items-start md:items-center z-20 bg-linear-to-b from-slate-900/80 to-transparent gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${cameraStatus === 'active' ? 'bg-green-500 shadow-[0_0_10px_var(--color-success-alt)]' : 'bg-red-500 animate-pulse'}`}></div>
          <span className="text-white font-bold text-sm tracking-wide uppercase">
            {mode === 'scan' ? (cameraStatus === 'active' ? 'Camera Active' : 'Initializing...') : 'Manual Mode'}
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {mode === 'scan' && cameras.length > 0 && (
            <select 
              value={selectedCameraId} 
              onChange={onCameraChange}
              className="bg-black/50 text-white border border-white/20 rounded-lg px-3 py-2 text-sm w-full md:w-auto max-w-full md:max-w-[200px] outline-none focus:border-indigo-500 truncate"
            >
              {cameras.map(c => (
                <option key={c.id} value={c.id}>{c.label || `Camera ${c.id.substring(0,5)}`}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setMode(mode === 'scan' ? 'manual' : 'scan')}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all border border-white/10 whitespace-nowrap"
          >
            {mode === 'scan' ? <><Keyboard size={16} /> Manual</> : <><Camera size={16} /> Camera</>}
          </button>
        </div>
      </div>

      {/* Viewport Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black/50">
        {mode === 'scan' ? (
          <>
            <div id={viewportId} className="w-full h-full object-cover"></div>
            {/* Camera frame decorations */}
            {cameraStatus === 'active' && !showSuccess && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-4xl border border-white/20 transition-all duration-300" 
                  style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)' }}
                >
                  {/* Corners */}
                  <div className="absolute -top-0.5 -left-0.5 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-4xl"></div>
                  <div className="absolute -top-0.5 -right-0.5 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-4xl"></div>
                  <div className="absolute -bottom-0.5 -left-0.5 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-4xl"></div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-4xl"></div>
                  
                  {/* Scan line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-indigo-500/80 animate-scan-line shadow-[0_0_15px_var(--color-primary)]"></div>
                  
                  {/* Target reticles */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-20">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white"></div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full max-w-sm px-6 flex flex-col gap-6 z-10">
            <div className="text-center text-white">
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
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={onSearch}
                  disabled={isSubmitting || !ticketCode.trim()} 
                  className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(0,0,0,0.2)] disabled:shadow-none"
                >
                  Search Info
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !ticketCode.trim()} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.4)] disabled:shadow-none"
                >
                  {isSubmitting ? 'Verifying...' : 'Check In'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Info Overlay */}
        {showSearchInfo && scanResult && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-40 flex flex-col items-center justify-center text-white animate-fadeIn p-6">
            <h2 className="text-2xl font-black mb-6 tracking-tight text-indigo-400 uppercase">TICKET INFORMATION</h2>
            <div className="w-full max-w-sm bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
              <div className="mb-4">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                <p className="text-xl font-bold">{scanResult.fullName}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Ticket Code</p>
                <p className="font-mono text-lg text-indigo-300">{scanResult.ticketCode}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Class</p>
                  <p className="font-bold">{scanResult.seatLabels || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Quantity</p>
                  <p className="font-bold">{scanResult.count || 1} tickets</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${scanResult.alreadyCheckedIn ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'}`}>
                  {scanResult.alreadyCheckedIn ? 'USED' : 'VALID'}
                </span>
              </div>
            </div>
            <button 
              onClick={closeSearchInfo}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-colors"
            >
              Close
            </button>
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
      </div>
    </div>
  )
}
