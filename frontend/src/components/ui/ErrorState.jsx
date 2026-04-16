export default function ErrorState({ title = 'Đã có lỗi xảy ra', message = 'Vui lòng thử lại sau hoặc làm mới trang.', onRetry }) {
  return (
    <div className="error-state p-6 my-4 bg-red-50 border border-red-200 rounded-lg text-center shadow-sm" role="alert" aria-live="assertive">
      <div className="text-red-500 text-3xl mb-3" aria-hidden="true">⚠️</div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md font-medium transition-colors"
          aria-label="Thử lại"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}
