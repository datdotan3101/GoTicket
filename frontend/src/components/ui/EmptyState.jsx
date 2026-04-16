export default function EmptyState({ title = 'Chưa có dữ liệu', message = 'Không tìm thấy dữ liệu nào ở thời điểm hiện tại.', icon = '📭' }) {
  return (
    <div className="empty-state flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl" role="region" aria-label="Empty State">
      <div className="text-5xl mb-4" aria-hidden="true">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  )
}
