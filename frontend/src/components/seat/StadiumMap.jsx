import React from 'react'

export default function StadiumMap({ stands = [], selectedStandId, onSelectStand }) {
  const interactive = typeof onSelectStand === 'function'

  const getStand = (name) => stands.find((s) => s.name === name) || { name, total_seats: 0, available_seats: 0 }
  const isSelected = (name) => {
    const stand = getStand(name)
    return interactive && stand?.id != null && stand.id === selectedStandId
  }

  const handleStandClick = (name) => {
    if (!interactive) return
    const stand = getStand(name)
    if (stand.available_seats > 0) {
      onSelectStand(stand)
    }
  }

  // Helper to render a striped block (representing rows of seats)
  const renderStripedBlock = (name, x, y, width, height, color, label, isTop = true) => {
    const stand = getStand(name)
    const selected = isSelected(name)
    const soldOut = stand.available_seats === 0
    
    // Draw horizontal lines for "rows"
    const rows = []
    const rowCount = 8
    for (let i = 0; i < rowCount; i++) {
      rows.push(
        <rect
          key={i}
          x={x}
          y={y + (i * (height / rowCount))}
          width={width}
          height={(height / rowCount) - 1}
          fill={selected ? '#4f46e5' : soldOut ? '#e2e8f0' : color}
          opacity={selected ? 1 : 0.85}
        />
      )
    }

    return (
      <g 
        onClick={() => handleStandClick(name)}
        style={{ cursor: soldOut ? 'not-allowed' : 'pointer' }}
      >
        {/* Main interactive area */}
        <rect 
          x={x} y={y} width={width} height={height} 
          fill="transparent" 
          stroke={selected ? '#4f46e5' : 'transparent'} 
          strokeWidth="2"
        />
        {rows}
        {/* Label */}
        <text
          x={x + width / 2}
          y={isTop ? y - 10 : y + height + 15}
          textAnchor="middle"
          fill="#1e293b"
          style={{ 
            fontSize: '11px', 
            fontWeight: 800, 
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          {label}
        </text>
      </g>
    )
  }

  return (
    <div style={{ width: '100%', position: 'relative', background: '#fff', borderRadius: '16px' }}>
      <svg viewBox="0 0 800 600" style={{ width: '100%', height: 'auto' }}>
        {/* Athletic Track & Pitch - Shrunk ry for more gap */}
        <ellipse cx="400" cy="300" rx="280" ry="135" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
        <rect x="250" y="215" width="300" height="170" rx="4" fill="#22c55e" stroke="#fff" strokeWidth="2" />
        <circle cx="400" cy="300" r="25" fill="none" stroke="#fff" strokeWidth="2" />
        <line x1="400" y1="215" x2="400" y2="385" stroke="#fff" strokeWidth="2" />

        {/* ─── STAND A (TOP) - Reverted to all Blue as per image ─── */}
        {/* Tier 2 */}
        {renderStripedBlock('A', 150, 20, 100, 40, '#2563eb', 'A5-T2')}
        {renderStripedBlock('A', 260, 20, 100, 40, '#2563eb', 'A3-T2')}
        {renderStripedBlock('A', 370, 20, 60, 40, '#2563eb', 'A1-T2')}
        {renderStripedBlock('A', 440, 20, 100, 40, '#2563eb', 'A2-T2')}
        {renderStripedBlock('A', 550, 20, 100, 40, '#2563eb', 'A4-T2')}

        {/* Tier 1 */}
        {renderStripedBlock('A', 170, 75, 100, 40, '#2563eb', 'A5-T1', false)}
        {renderStripedBlock('A', 280, 75, 80, 40, '#2563eb', 'A3-T1', false)}
        {renderStripedBlock('A', 370, 75, 60, 40, '#2563eb', 'A1-T1', false)}
        {renderStripedBlock('A', 440, 75, 80, 40, '#2563eb', 'A2-T1', false)}
        {renderStripedBlock('A', 530, 75, 100, 40, '#2563eb', 'A4-T1', false)}

        {/* ─── STAND B (BOTTOM) - Applied Red center, others Blue ─── */}
        {renderStripedBlock('B', 150, 500, 100, 40, '#2563eb', 'B14-T1', false)}
        {renderStripedBlock('B', 260, 500, 80, 40, '#2563eb', 'B13-T1', false)}
        {renderStripedBlock('B', 350, 500, 100, 40, '#ef4444', 'B12-T1', false)}
        {renderStripedBlock('B', 460, 500, 80, 40, '#2563eb', 'B10-T1', false)}
        {renderStripedBlock('B', 550, 500, 100, 40, '#2563eb', 'B9-T1', false)}

        {/* ─── STAND D (LEFT) ─── */}
        <g onClick={() => handleStandClick('D')} style={{ cursor: 'pointer' }}>
          {/* Top Block - Simplified to avoid overlap */}
          <rect x="30" y="100" width="40" height="80" fill={isSelected('D') ? '#4f46e5' : '#22c55e'} opacity="0.8" />
          {/* Center Blocks */}
          <rect x="30" y="200" width="40" height="80" fill={isSelected('D') ? '#4f46e5' : '#22c55e'} opacity="0.8" />
          <rect x="30" y="300" width="40" height="80" fill={isSelected('D') ? '#4f46e5' : '#22c55e'} opacity="0.8" />
          <text x="50" y="300" textAnchor="middle" fill="#111827" style={{ fontSize: '24px', fontWeight: 900 }}>D</text>
          
          {/* Vertical Stripes for D */}
          <g style={{ pointerEvents: 'none' }}>
            {[35, 45, 55, 65].map(x => (
              <React.Fragment key={x}>
                <line x1={x} y1="100" x2={x} y2="180" stroke="#fff" strokeWidth="1" opacity="0.5" />
                <line x1={x} y1="200" x2={x} y2="280" stroke="#fff" strokeWidth="1" opacity="0.5" />
                <line x1={x} y1="300" x2={x} y2="380" stroke="#fff" strokeWidth="1" opacity="0.5" />
              </React.Fragment>
            ))}
          </g>
        </g>

        {/* ─── STAND C (RIGHT) ─── */}
        <g onClick={() => handleStandClick('C')} style={{ cursor: 'pointer' }}>
          {/* Mirroring D structure */}
          <rect x="730" y="100" width="40" height="80" fill={isSelected('C') ? '#4f46e5' : '#94a3b8'} opacity="0.8" />
          <rect x="730" y="200" width="40" height="80" fill={isSelected('C') ? '#4f46e5' : '#94a3b8'} opacity="0.8" />
          <rect x="730" y="300" width="40" height="80" fill={isSelected('C') ? '#4f46e5' : '#94a3b8'} opacity="0.8" />
          <text x="750" y="300" textAnchor="middle" fill="#111827" style={{ fontSize: '24px', fontWeight: 900 }}>C</text>
          
          {/* Vertical Stripes for C */}
          <g style={{ pointerEvents: 'none' }}>
            {[735, 745, 755, 765].map(x => (
              <React.Fragment key={x}>
                <line x1={x} y1="100" x2={x} y2="180" stroke="#fff" strokeWidth="1" opacity="0.5" />
                <line x1={x} y1="200" x2={x} y2="280" stroke="#fff" strokeWidth="1" opacity="0.5" />
                <line x1={x} y1="300" x2={x} y2="380" stroke="#fff" strokeWidth="1" opacity="0.5" />
              </React.Fragment>
            ))}
          </g>
        </g>
      </svg>
    </div>
  )
}


