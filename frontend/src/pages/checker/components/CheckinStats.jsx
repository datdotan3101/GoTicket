export default function CheckinStats({ stats }) {
  const checkinPercentage = stats.total_tickets > 0 ? Math.round((stats.checked_in_tickets / stats.total_tickets) * 100) : 0
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (checkinPercentage / 100) * circumference

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center">
      <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Check-in Status</h2>
      
      <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--color-slate-100)" strokeWidth="12" />
          <circle 
            cx="80" cy="80" r={radius} 
            fill="none" 
            stroke="var(--color-primary-600)" 
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
  )
}
