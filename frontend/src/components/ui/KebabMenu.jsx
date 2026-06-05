import { useState } from 'react'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function KebabMenu({ onEdit, onDelete, variant = 'solid', customItems }) {
  const [isOpen, setIsOpen] = useState(false)

  // Styling based on variant
  const buttonStyle = variant === 'glass' 
    ? {
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(4px)',
        color: 'var(--color-slate-900)'
      }
    : {
        background: 'transparent',
        color: 'var(--color-slate-500)'
      }

  const hoverBackground = variant === 'glass' ? 'var(--color-white)' : 'var(--color-slate-200)'
  const defaultBackground = variant === 'glass' ? 'rgba(255,255,255,0.8)' : 'transparent'

  return (
    <div style={{ position: 'relative', zIndex: 5 }}>
      <button 
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen) }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        style={{
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background 0.2s',
          ...buttonStyle
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = hoverBackground}
        onMouseLeave={(e) => e.currentTarget.style.background = defaultBackground}
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: 'var(--color-white)',
          border: '1px solid var(--color-slate-200)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 10,
          width: '140px',
          padding: '6px',
          marginTop: '4px'
        }}>
          {onEdit && (
            <button 
              onClick={() => { setIsOpen(false); onEdit(); }} 
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-slate-700)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', fontWeight: 600 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-slate-100)'; e.currentTarget.style.color = 'var(--color-slate-900)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-slate-700)' }}
            >
              <Edit2 size={16} /> Edit
            </button>
          )}

          {customItems && customItems.map((item, idx) => {
            const commonStyle = { width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: item.color || 'var(--color-slate-700)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box' }
            const handleMouseEnter = (e) => { e.currentTarget.style.background = item.hoverBg || 'var(--color-slate-100)'; e.currentTarget.style.color = item.hoverColor || 'var(--color-slate-900)' }
            const handleMouseLeave = (e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.color || 'var(--color-slate-700)' }

            if (item.to) {
              return (
                <Link 
                  key={idx} 
                  to={item.to} 
                  style={commonStyle}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon} {item.label}
                </Link>
              )
            }
            
            return (
              <button 
                key={idx}
                onClick={(e) => { e.preventDefault(); setIsOpen(false); item.onClick?.(); }} 
                style={commonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {item.icon} {item.label}
              </button>
            )
          })}

          {onDelete && (
            <button 
              onClick={() => { setIsOpen(false); onDelete(); }} 
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', fontWeight: 600 }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
