/**
 * StadiumMap — Shared visual stadium map component.
 *
 * Props:
 *  - stands: array of stand objects. Each must have { name, total_seats }
 *  - selectedStandId: (optional) id of currently selected stand
 *  - onSelectStand: (optional) callback(stand) — if provided, enables interactive mode
 */
const STAND_COLORS = {
  selected: { bg: 'rgba(79, 70, 229, 0.35)', border: '#6366f1', glow: '0 0 16px rgba(99,102,241,0.6)' },
  soldOut:  { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239,68,68,0.2)', glow: 'none' },
  hover:    { bg: 'rgba(79, 70, 229, 0.2)', border: '#4f46e5', glow: 'none' },
  default:  { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', glow: 'none' },
}

function StandSectorGrid({ standName, standData, interactive, selected, onSelect, rows = 3, cols = 6 }) {
  const totalSeats = standData?.total_seats || 0
  const availableSeats = standData?.available_seats ?? totalSeats
  const isSoldOut = interactive && availableSeats === 0
  const isSelected = selected

  const blocks = rows * cols
  const seatsPerBlock = blocks > 0 ? Math.floor(totalSeats / blocks) : 0
  const remainder = blocks > 0 ? totalSeats % blocks : 0

  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const num = r * cols + c + 1
      cells.push({
        id: `${standName}${num}`,
        seats: seatsPerBlock + (num <= remainder ? 1 : 0),
      })
    }
  }

  const wrapperStyle = {
    background: isSelected
      ? STAND_COLORS.selected.bg
      : isSoldOut
        ? STAND_COLORS.soldOut.bg
        : STAND_COLORS.default.bg,
    border: `1px solid ${isSelected
      ? STAND_COLORS.selected.border
      : isSoldOut
        ? STAND_COLORS.soldOut.border
        : STAND_COLORS.default.border}`,
    boxShadow: isSelected ? STAND_COLORS.selected.glow : 'none',
    padding: '12px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    cursor: interactive && !isSoldOut ? 'pointer' : isSoldOut ? 'not-allowed' : 'default',
    transition: 'all 0.2s ease',
    opacity: isSoldOut ? 0.5 : 1,
  }

  return (
    <div
      style={wrapperStyle}
      onClick={() => interactive && !isSoldOut && onSelect && onSelect(standData)}
    >
      <div className="stand-sector-title" style={{ color: isSelected ? '#a5b4fc' : '#94a3b8' }}>
        STAND {standName} — {totalSeats.toLocaleString()} SEATS
        {interactive && isSoldOut && (
          <span style={{ color: '#ef4444', marginLeft: '6px', fontSize: '0.6rem' }}>SOLD OUT</span>
        )}
      </div>
      <div className="stand-sector-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cells.map((cell) => (
          <div
            key={cell.id}
            className="sector-cell"
            style={{
              background: isSelected ? 'rgba(99,102,241,0.2)' : undefined,
              borderColor: isSelected ? 'rgba(99,102,241,0.5)' : undefined,
              pointerEvents: 'none',
            }}
          >
            <span className="sector-id">{cell.id}</span>
            <span className="sector-seats">{cell.seats}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VipBlock({ standData, interactive, selected, onSelect }) {
  const totalSeats = standData?.total_seats || 0
  const availableSeats = standData?.available_seats ?? totalSeats
  const isSoldOut = interactive && availableSeats === 0

  return (
    <div
      style={{
        background: selected ? 'rgba(79,70,229,0.35)' : isSoldOut ? 'rgba(239,68,68,0.08)' : 'rgba(79,70,229,0.15)',
        border: `1px solid ${selected ? '#6366f1' : isSoldOut ? 'rgba(239,68,68,0.3)' : '#4f46e5'}`,
        boxShadow: selected ? '0 0 16px rgba(99,102,241,0.6)' : 'none',
        padding: '12px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: interactive && !isSoldOut ? 'pointer' : isSoldOut ? 'not-allowed' : 'default',
        transition: 'all 0.2s ease',
        opacity: isSoldOut ? 0.5 : 1,
        minWidth: '90px',
      }}
      onClick={() => interactive && !isSoldOut && onSelect && onSelect(standData)}
    >
      <div className="stand-sector-title" style={{ color: selected ? '#a5b4fc' : '#818cf8' }}>VIP AREA</div>
      <div
        className="sector-cell"
        style={{
          background: selected ? 'rgba(99,102,241,0.3)' : 'rgba(79,70,229,0.2)',
          border: `1px solid ${selected ? '#6366f1' : '#4f46e5'}`,
          pointerEvents: 'none',
        }}
      >
        <span className="sector-id" style={{ color: '#fff' }}>VIP</span>
        <span className="sector-seats" style={{ color: selected ? '#a5b4fc' : '#a5b4fc' }}>
          {totalSeats.toLocaleString()} seats
        </span>
      </div>
    </div>
  )
}

export default function StadiumMap({ stands = [], selectedStandId, onSelectStand }) {
  const interactive = typeof onSelectStand === 'function'

  const getStand = (name) => stands.find((s) => s.name === name) || { name, total_seats: 0, available_seats: 0 }
  const isSelected = (name) => {
    const stand = getStand(name)
    return interactive && stand?.id != null && stand.id === selectedStandId
  }

  return (
    <div className="stadium-visual-container">
      <div className="stadium-map">
        {/* Left: Stand C */}
        <StandSectorGrid
          standName="C"
          standData={getStand('C')}
          interactive={interactive}
          selected={isSelected('C')}
          onSelect={onSelectStand}
          rows={5}
          cols={2}
        />

        {/* Center column */}
        <div className="stadium-center-column">
          {/* Top: Stand A + VIP */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <StandSectorGrid
              standName="A"
              standData={getStand('A')}
              interactive={interactive}
              selected={isSelected('A')}
              onSelect={onSelectStand}
              rows={3}
              cols={6}
            />
            <VipBlock
              standData={getStand('VIP')}
              interactive={interactive}
              selected={isSelected('VIP')}
              onSelect={onSelectStand}
            />
          </div>

          {/* Football Pitch */}
          <div className="football-pitch" style={{ margin: '20px 0' }}>
            <div className="pitch-outline">
              <div className="center-circle" />
              <div className="penalty-area left" />
              <div className="penalty-area right" />
            </div>
          </div>

          {/* Bottom: Stand B */}
          <StandSectorGrid
            standName="B"
            standData={getStand('B')}
            interactive={interactive}
            selected={isSelected('B')}
            onSelect={onSelectStand}
            rows={3}
            cols={6}
          />
        </div>

        {/* Right: Stand D */}
        <div className="stadium-side-column">
          <StandSectorGrid
            standName="D"
            standData={getStand('D')}
            interactive={interactive}
            selected={isSelected('D')}
            onSelect={onSelectStand}
            rows={5}
            cols={2}
          />
        </div>
      </div>
    </div>
  )
}
