export default function LoadingSpinner({ text = 'Đang tải...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4 w-full h-full">
      <div
        className="spinner"
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(0, 0, 0, 0.1)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s ease-in-out infinite',
        }}
        role="status"
        aria-label="Đang tải dữ liệu"
      >
        {/* CSS cho spin sẽ thêm ở index.css, mặc định dùng inline style animate vòng xoay */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
      <p className="text-gray-500 font-medium" aria-live="polite">
        {text}
      </p>
    </div>
  )
}
