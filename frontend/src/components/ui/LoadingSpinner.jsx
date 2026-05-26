export default function LoadingSpinner({ text = 'Loading...' }) {
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
        aria-label="Loading data"
      >
        {/* Spin animation is handled inline here; can be moved to index.css if needed */}
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
