import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function ScannerHeader({ currentMatch }) {
  return (
    <header className="console-header mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
      <div className="console-title-wrap">
        <Link to="/checker" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-2 transition-colors font-semibold">
          <ChevronLeft size={18} />
          <span className="text-sm uppercase tracking-wider">Back to Dashboard</span>
        </Link>
      </div>
      
      <div className="console-match-info text-right bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Event</span>
        <div className="text-sm font-bold text-slate-800">
          {currentMatch ? `${currentMatch.home_team} vs ${currentMatch.away_team}` : 'No Match Selected'}
        </div>
      </div>
    </header>
  )
}
