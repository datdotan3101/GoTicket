import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function StadiumMap({ stands = [], selectedBlockId, onSelectBlock, blockConfigs = {} }) {
  const interactive = typeof onSelectBlock === 'function'
  const [hoverInfo, setHoverInfo] = useState(null)

  // In the new architecture, the database 'stands' ARE the blocks.
  // So stand.name will be 'A1-T1', etc.
  const getBlockStand = (blockId) => stands.find((s) => s.name === blockId) || { name: blockId, total_seats: 0, available_seats: 0, price: 0 }

  const isSelected = (blockId) => {
    return interactive && blockId === selectedBlockId
  }

  const handleBlockClick = (standName, blockId, tierName) => {
    if (!interactive) return
    const stand = getBlockStand(blockId)
    
    // If total_seats is 0, the block is missing from DB (inactive/not for sale)
    if (stand.total_seats === 0) {
      toast.error('Vị trí này hiện không khả dụng.')
      return
    }

    if (stand.available_seats === 0) {
      toast.error('Khu vực này đã hết vé.')
      return
    }

    onSelectBlock({ stand, blockId, tierName })
  }

  // Helper to render a striped block (representing rows of seats)
  const renderStripedBlock = (standName, x, y, width, height, color, blockId, tierName, isTop = true) => {
    const stand = getBlockStand(blockId)
    const selected = isSelected(blockId)
    
    // If total_seats === 0, it means manager disabled it, so it's not in DB
    const isActive = stand.total_seats > 0
    const soldOut = isActive && stand.available_seats === 0
    
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
          fill={selected ? '#4f46e5' : soldOut ? '#cbd5e1' : color}
          opacity={selected ? 1 : soldOut ? 0.5 : 0.85}
        />
      )
    }

    return (
      <g 
        onClick={() => handleBlockClick(standName, blockId, tierName)}
        onMouseEnter={(e) => {
          if (!interactive) return
          setHoverInfo({
            x: e.clientX,
            y: e.clientY,
            blockId,
            tierName,
            standName,
            price: stand.price,
            available: stand.available_seats,
            soldOut,
            active: isActive
          })
        }}
        onMouseMove={(e) => {
          if (hoverInfo) {
            setHoverInfo(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
          }
        }}
        onMouseLeave={() => setHoverInfo(null)}
        style={{ cursor: soldOut ? 'not-allowed' : isActive ? 'pointer' : 'default' }}
      >
        {/* Main interactive area */}
        <rect 
          x={x} y={y} width={width} height={height} 
          fill="transparent" 
          stroke={selected ? '#4f46e5' : 'transparent'} 
          strokeWidth="3"
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
            userSelect: 'none',
            opacity: soldOut ? 0.5 : 1
          }}
        >
          {blockId}
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

        {/* ─── STAND A (TOP) ─── */}
        {renderStripedBlock('A', 150, 20, 500, 40, '#2563eb', 'A-T2', 'Tầng 2')}
        {renderStripedBlock('A', 170, 75, 460, 40, '#3b82f6', 'A-T1', 'Tầng 1', false)}

        {/* ─── STAND B (BOTTOM) ─── */}
        {renderStripedBlock('B', 170, 450, 460, 40, '#ef4444', 'B-T1', 'Tầng 1', false)}
        {renderStripedBlock('B', 150, 505, 500, 40, '#f87171', 'B-T2', 'Tầng 2', false)}

        {/* ─── STAND D (LEFT) ─── */}
        <g 
          onClick={() => handleBlockClick('D', 'D-T1', 'Tầng 1')}
          onMouseEnter={(e) => {
            if (!interactive) return
            const stand = getBlockStand('D-T1')
            const isActive = stand.total_seats > 0
            const soldOut = isActive && stand.available_seats === 0
            setHoverInfo({
              x: e.clientX,
              y: e.clientY,
              blockId: 'D-T1',
              tierName: 'Tầng 1',
              standName: 'D',
              price: stand.price,
              available: stand.available_seats,
              soldOut,
              active: isActive
            })
          }}
          onMouseMove={(e) => {
            if (hoverInfo) setHoverInfo(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
          }}
          onMouseLeave={() => setHoverInfo(null)}
          style={{ cursor: getBlockStand('D-T1').available_seats === 0 && getBlockStand('D-T1').total_seats > 0 ? 'not-allowed' : getBlockStand('D-T1').total_seats > 0 ? 'pointer' : 'default' }}
        >
          {(() => {
            const stand = getBlockStand('D-T1')
            const isActive = stand.total_seats > 0
            const soldOut = isActive && stand.available_seats === 0;
            const fill = isSelected('D-T1') ? '#4f46e5' : soldOut ? '#cbd5e1' : '#22c55e';
            const opacity = soldOut ? 0.5 : 0.8;
            return (
              <>
                <rect x="30" y="100" width="40" height="280" rx="8" fill={fill} opacity={opacity} />
                <text x="50" y="245" textAnchor="middle" fill="#fff" style={{ fontSize: '24px', fontWeight: 900, pointerEvents: 'none', opacity: soldOut ? 0.5 : 1 }}>D</text>
              </>
            )
          })()}
        </g>

        {/* ─── STAND C (RIGHT) ─── */}
        <g 
          onClick={() => handleBlockClick('C', 'C-T1', 'Tầng 1')}
          onMouseEnter={(e) => {
            if (!interactive) return
            const stand = getBlockStand('C-T1')
            const isActive = stand.total_seats > 0
            const soldOut = isActive && stand.available_seats === 0
            setHoverInfo({
              x: e.clientX,
              y: e.clientY,
              blockId: 'C-T1',
              tierName: 'Tầng 1',
              standName: 'C',
              price: stand.price,
              available: stand.available_seats,
              soldOut,
              active: isActive
            })
          }}
          onMouseMove={(e) => {
            if (hoverInfo) setHoverInfo(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
          }}
          onMouseLeave={() => setHoverInfo(null)}
          style={{ cursor: getBlockStand('C-T1').available_seats === 0 && getBlockStand('C-T1').total_seats > 0 ? 'not-allowed' : getBlockStand('C-T1').total_seats > 0 ? 'pointer' : 'default' }}
        >
          {(() => {
            const stand = getBlockStand('C-T1')
            const isActive = stand.total_seats > 0
            const soldOut = isActive && stand.available_seats === 0;
            const fill = isSelected('C-T1') ? '#4f46e5' : soldOut ? '#cbd5e1' : '#facc15';
            const opacity = soldOut ? 0.5 : 0.8;
            return (
              <>
                <rect x="730" y="100" width="40" height="280" rx="8" fill={fill} opacity={opacity} />
                <text x="750" y="245" textAnchor="middle" fill="#fff" style={{ fontSize: '24px', fontWeight: 900, pointerEvents: 'none', opacity: soldOut ? 0.5 : 1 }}>C</text>
              </>
            )
          })()}
        </g>
      </svg>

      {/* TOOLTIP PORTAL / OVERLAY */}
      {hoverInfo && (
        <div 
          style={{
            position: 'fixed',
            left: hoverInfo.x + 15,
            top: hoverInfo.y + 15,
            background: '#1e293b',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            pointerEvents: 'none',
            minWidth: '160px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
            Khán đài {hoverInfo.standName} • {hoverInfo.tierName}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
            Khu {hoverInfo.blockId}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', marginBottom: '4px' }}>
            <span style={{ color: '#cbd5e1' }}>Giá vé:</span>
            <span style={{ fontWeight: 800, color: '#fbbf24' }}>{hoverInfo.price ? Number(hoverInfo.price).toLocaleString('vi-VN') + 'đ' : '---'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: '#cbd5e1' }}>Trạng thái:</span>
            <span style={{ fontWeight: 800, color: hoverInfo.soldOut ? '#ef4444' : '#22c55e' }}>
              {!hoverInfo.active ? 'Không bán' : hoverInfo.soldOut ? 'Hết vé' : `${hoverInfo.available} ghế`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}



