import { useState } from 'react'
import { Trophy, X, ChevronDown } from 'lucide-react'

export default function LeagueAutocomplete({
  value,
  onChange,
  leagues,
  id,
  className = '',
  placeholder = 'League',
  onKeyDown,
  inputClassName = '',
  clearBtnClassName = 'hs-clear-btn',
  iconSize = 16,
}) {
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = leagues.filter(l =>
    l.name.toLowerCase().includes(value.toLowerCase())
  )

  const handleSelect = (name) => {
    onChange(name)
    setShowDropdown(false)
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* Icon */}
      <Trophy size={iconSize} color="var(--color-slate-400)" style={{ flexShrink: 0 }} />

      {/* Input */}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setShowDropdown(true)
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onKeyDown={onKeyDown}
        id={id}
        autoComplete="off"
        className={inputClassName}
      />

      {/* Dropdown */}
      {showDropdown && leagues.length > 0 && (
        <div className="custom-autocomplete-dropdown">
          {filtered.length > 0 ? (
            filtered.map(l => (
              <div
                key={l.id}
                className="custom-autocomplete-item"
                onClick={() => handleSelect(l.name)}
              >
                <Trophy size={14} color="var(--color-slate-400)" />
                {l.name}
              </div>
            ))
          ) : (
            <div className="custom-autocomplete-empty">No leagues found</div>
          )}
        </div>
      )}

      {/* Clear button */}
      {value && (
        <button
          className={clearBtnClassName}
          onClick={() => onChange('')}
          aria-label="Clear"
          type="button"
        >
          <X size={13} />
        </button>
      )}

      {/* Dropdown indicator */}
      {!value && (
        <ChevronDown
          size={14}
          color="var(--color-slate-400)"
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
