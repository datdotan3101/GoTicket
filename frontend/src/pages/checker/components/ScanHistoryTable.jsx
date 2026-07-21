import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function ScanHistoryTable({ history }) {
  return (
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
              <th className="py-4 px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Code</th>
              <th className="py-4 px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Info</th>
              <th className="py-4 px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Total Tickets</th>
              <th className="py-4 px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? history.map((item, i) => {
              const blocks = item.class !== 'Standard' && item.class ? Array.from(new Set(item.class.split(',').map(s => {
                const parts = s.trim().split('-');
                return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : s.trim();
              }))).join(', ') : item.class;

              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 border-b border-slate-50 text-sm font-semibold text-slate-500">{item.time}</td>
                  <td className="py-4 px-4 border-b border-slate-50">
                    <div className="font-bold text-slate-900">{item.customer}</div>
                  </td>
                  <td className="py-4 px-4 border-b border-slate-50 font-mono text-sm font-medium text-slate-600">
                    {item.ticketCode}
                  </td>
                  <td className="py-4 px-4 border-b border-slate-50">
                    <span className={`inline-block w-fit px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600`}>
                      {blocks}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-b border-slate-50 text-center">
                    <span className="font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{item.totalTickets}</span>
                  </td>
                  <td className="py-4 px-4 border-b border-slate-50">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === 'ENTERED' || item.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status === 'ENTERED' || item.status === 'VALID' ? <CheckCircle2 size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                      {item.status}
                    </span>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
                  No tickets scanned in this session yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
