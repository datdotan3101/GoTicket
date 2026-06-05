import React, { useState } from 'react'
import { toast } from 'react-toastify'

const MAP_BLOCKS = [
  // A Stands (Top) - T2
  { id: 'A5-T2', stand: 'A', tier: 'Floor 2', color: '#496db7', d: 'M 190 70 h 90 v 15 h -15 v 15 h -75 Z', labelX: 240, labelY: 55, pattern: 'stripe-h' },
  { id: 'A3-T2', stand: 'A', tier: 'Floor 2', color: '#e5e834', d: 'M 290 70 h 75 v 30 h -85 v -15 h 10 Z', labelX: 325, labelY: 55, pattern: 'stripe-h' },
  { id: 'A1-T2', stand: 'A', tier: 'Floor 2', color: '#e33434', d: 'M 375 70 h 80 v 30 h -80 Z', labelX: 415, labelY: 55, pattern: 'stripe-h' },
  { id: 'A2-T2', stand: 'A', tier: 'Floor 2', color: '#e5e834', d: 'M 465 70 h 75 v 15 h 10 v 15 h -85 Z', labelX: 505, labelY: 55, pattern: 'stripe-h' },
  { id: 'A4-T2', stand: 'A', tier: 'Floor 2', color: '#496db7', d: 'M 560 70 h 90 v 30 h -75 v -15 h -15 Z', labelX: 610, labelY: 55, pattern: 'stripe-h' },

  // A Stands (Top) - T1
  { id: 'A5-T1', stand: 'A', tier: 'Floor 1', color: '#496db7', d: 'M 220 110 h 85 v 15 h -15 v 15 h -70 Z', labelX: 250, labelY: 155, pattern: 'stripe-h' },
  { id: 'A3-T1', stand: 'A', tier: 'Floor 1', color: '#e5e834', d: 'M 315 110 h 65 v 30 h -75 v -15 h 10 Z', labelX: 345, labelY: 155, pattern: 'stripe-h' },
  { id: 'A1-T1', stand: 'A', tier: 'Floor 1', color: '#e33434', d: 'M 390 110 h 50 v 30 h -50 Z', labelX: 415, labelY: 155, pattern: 'stripe-h' },
  { id: 'A2-T1', stand: 'A', tier: 'Floor 1', color: '#e5e834', d: 'M 450 110 h 65 v 15 h 10 v 15 h -75 Z', labelX: 485, labelY: 155, pattern: 'stripe-h' },
  { id: 'A4-T1', stand: 'A', tier: 'Floor 1', color: '#496db7', d: 'M 535 110 h 85 v 30 h -70 v -15 h -15 Z', labelX: 580, labelY: 155, pattern: 'stripe-h' },

  // D Stand (Left)
  { id: 'D-T1', stand: 'D', tier: 'Floor 1', color: '#2ec36a', d: 'M 160 160 h -25 l -25 35 v 50 h 25 v -40 l 25 -25 Z M 110 255 h 25 v 45 h -25 Z M 110 310 h 25 v 45 h -25 Z', labelX: 85, labelY: 295, pattern: 'stripe-v', labelName: 'D' },

  // C Stand (Right)
  { id: 'C-T1', stand: 'C', tier: 'Floor 1', color: '#bdc3c7', d: 'M 640 160 h 25 l 25 35 v 50 h -25 v -40 l -25 -25 Z M 665 255 h 25 v 45 h -25 Z M 665 310 h 25 v 45 h -25 Z', labelX: 715, labelY: 295, pattern: 'stripe-v', labelName: 'C' },

  // B Stands (Bottom)
  { id: 'B15-T1', stand: 'B', tier: 'Floor 1', color: '#8b5ca0', d: 'M 225 455 L 140 370 L 115 395 L 200 480 Z', labelX: 100, labelY: 410, pattern: 'stripe-d-right' },
  { id: 'B14-T1', stand: 'B', tier: 'Floor 1', color: '#4a8cd0', d: 'M 230 460 h 20 v 10 h 30 v -10 h 20 v 50 h -70 Z', labelX: 265, labelY: 445, pattern: 'stripe-h' },
  { id: 'B13-T1', stand: 'B', tier: 'Floor 1', color: '#b9ce58', d: 'M 305 460 h 15 v 10 h 20 v -10 h 15 v 50 h -50 Z', labelX: 330, labelY: 445, pattern: 'stripe-h' },
  { id: 'B12-T1', stand: 'B', tier: 'Floor 1', color: '#c55685', d: 'M 360 460 h 80 v 50 h -80 Z', labelX: 400, labelY: 530, pattern: 'stripe-h' },
  { id: 'B10-T1', stand: 'B', tier: 'Floor 1', color: '#5ec788', d: 'M 445 460 h 15 v 10 h 20 v -10 h 15 v 50 h -50 Z', labelX: 470, labelY: 445, pattern: 'stripe-h' },
  { id: 'B9-T1', stand: 'B', tier: 'Floor 1', color: '#4a8cd0', d: 'M 500 460 h 20 v 10 h 30 v -10 h 20 v 50 h -70 Z', labelX: 535, labelY: 445, pattern: 'stripe-h' },
  { id: 'B8-T1', stand: 'B', tier: 'Floor 1', color: '#8b5ca0', d: 'M 575 455 L 660 370 L 685 395 L 600 480 Z', labelX: 700, labelY: 410, pattern: 'stripe-d-left' },
]

export default function StadiumMap({ stands = [], selectedBlockIds = [], onSelectBlock, blockConfigs = {} }) {
  const interactive = typeof onSelectBlock === 'function'
  const [hoverInfo, setHoverInfo] = useState(null)

  const getBlockStand = (blockId) => stands.find((s) => s.name === blockId) || { name: blockId, total_seats: 0, available_seats: 0, price: 0 }

  const isSelected = (blockId) => {
    return interactive && selectedBlockIds.includes(blockId)
  }

  const handleBlockClick = (stand, blockId, tierName) => {
    if (!interactive) return
    const standData = getBlockStand(blockId)
    
    if (standData.total_seats === 0) {
      toast.error('This location is currently unavailable.')
      return
    }

    if (standData.available_seats === 0) {
      toast.error('This section is sold out.')
      return
    }

    onSelectBlock({ stand: standData, blockId, tierName })
  }

  return (
    <div style={{ width: '100%', position: 'relative', background: 'var(--color-white)', borderRadius: '16px' }}>
      <svg viewBox="0 0 800 600" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <pattern id="stripe-h" width="10" height="6" patternUnits="userSpaceOnUse">
            <rect width="10" height="2" fill="rgba(255,255,255,0.4)" />
          </pattern>
          <pattern id="stripe-v" width="6" height="10" patternUnits="userSpaceOnUse">
            <rect width="2" height="10" fill="rgba(255,255,255,0.4)" />
          </pattern>
          <pattern id="stripe-d-left" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="8" fill="rgba(255,255,255,0.4)" />
          </pattern>
          <pattern id="stripe-d-right" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="2" height="8" fill="rgba(255,255,255,0.4)" />
          </pattern>
        </defs>

        {/* Pitch and Track */}
        <rect x="180" y="180" width="440" height="240" rx="120" fill="none" stroke="var(--color-slate-800)" strokeWidth="2" />
        <rect x="190" y="190" width="420" height="220" rx="110" fill="none" stroke="var(--color-slate-800)" strokeWidth="1" />
        <rect x="270" y="220" width="260" height="160" fill="#529c48" stroke="var(--color-white)" strokeWidth="1" />
        <line x1="400" y1="220" x2="400" y2="380" stroke="var(--color-white)" strokeWidth="1" />
        <circle cx="400" cy="300" r="25" fill="none" stroke="var(--color-white)" strokeWidth="1" />
        {/* Left penalty box */}
        <rect x="270" y="250" width="40" height="100" fill="none" stroke="var(--color-white)" strokeWidth="1" />
        <rect x="270" y="275" width="15" height="50" fill="none" stroke="var(--color-white)" strokeWidth="1" />
        <path d="M 310 275 A 20 20 0 0 1 310 325" fill="none" stroke="var(--color-white)" strokeWidth="1" />
        {/* Right penalty box */}
        <rect x="490" y="250" width="40" height="100" fill="none" stroke="var(--color-white)" strokeWidth="1" />
        <rect x="515" y="275" width="15" height="50" fill="none" stroke="var(--color-white)" strokeWidth="1" />
        <path d="M 490 275 A 20 20 0 0 0 490 325" fill="none" stroke="var(--color-white)" strokeWidth="1" />

        {/* Render Blocks */}
        {MAP_BLOCKS.map((block) => {
          const standData = getBlockStand(block.id)
          const config = blockConfigs[block.id]
          const selected = isSelected(block.id)
          
          // Determine active status: prioritize local config if available (Manager View)
          const isActive = config ? config.active : standData.total_seats > 0
          const soldOut = !config && isActive && standData.available_seats === 0
          
          // Active + available → original color, Sold out → muted red, Inactive → grey
          const fill = selected 
            ? 'var(--color-primary-600)' 
            : soldOut 
              ? '#9b1c1c' 
              : !isActive 
                ? 'var(--color-slate-300)' 
                : block.color

          // Compute center of block path for SOLD OUT label
          let cx = block.labelX
          let cy = block.labelY + 15

          return (
            <g
              key={block.id}
              onClick={() => handleBlockClick(block.stand, block.id, block.tier)}
              onMouseEnter={(e) => {
                if (!interactive) return
                setHoverInfo({
                  x: e.clientX,
                  y: e.clientY,
                  blockId: block.id,
                  tierName: block.tier,
                  standName: block.stand,
                  price: standData.price,
                  available: standData.available_seats,
                  soldOut,
                  active: isActive
                })
              }}
              onMouseMove={(e) => {
                if (hoverInfo) setHoverInfo(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
              }}
              onMouseLeave={() => setHoverInfo(null)}
              style={{ cursor: (!isActive || soldOut) ? 'not-allowed' : 'pointer' }}
            >
              <path 
                d={block.d} 
                fill={fill} 
                opacity={soldOut ? 0.6 : !isActive ? 0.4 : 0.9} 
              />
              <path 
                d={block.d} 
                fill={`url(#${block.pattern})`} 
                opacity={soldOut ? 0.15 : !isActive ? 0.2 : 0.8} 
                pointerEvents="none" 
              />
              {selected && (
                <path 
                  d={block.d} 
                  fill="none" 
                  stroke="var(--color-primary-600)" 
                  strokeWidth="3" 
                  pointerEvents="none" 
                />
              )}
              <text 
                x={block.labelX} 
                y={block.labelY} 
                textAnchor="middle" 
                fill={soldOut ? 'var(--color-white)' : 'var(--color-black)'} 
                style={{ fontSize: '12px', fontWeight: 900, pointerEvents: 'none', opacity: soldOut ? 0.7 : !isActive ? 0.4 : 1 }}
              >
                {block.labelName || block.id}
              </text>
              {/* SOLD OUT overlay text for sold-out blocks */}
              {soldOut && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  fill="var(--color-white)"
                  style={{ fontSize: '8px', fontWeight: 900, pointerEvents: 'none', letterSpacing: '1px', opacity: 0.9 }}
                >
                  SOLD OUT
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip Overlay */}
      {hoverInfo && (
        <div 
          style={{
            position: 'fixed',
            left: hoverInfo.x + 15,
            top: hoverInfo.y + 15,
            background: 'var(--color-slate-800)',
            color: 'var(--color-white)',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            pointerEvents: 'none',
            minWidth: '160px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-slate-400)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Stand {hoverInfo.standName} • {hoverInfo.tierName}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-white)', marginBottom: '8px' }}>
            Section {hoverInfo.blockId}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--color-slate-300)' }}>Price:</span>
            <span style={{ fontWeight: 800, color: '#fbbf24' }}>{hoverInfo.price ? Number(hoverInfo.price).toLocaleString() + ' VND' : '---'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-slate-300)' }}>Status:</span>
            <span style={{ fontWeight: 800, color: hoverInfo.soldOut ? 'var(--color-danger)' : 'var(--color-success-alt)' }}>
              {!hoverInfo.active ? 'Not for Sale' : hoverInfo.soldOut ? 'Sold Out' : `${hoverInfo.available} seats`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}



