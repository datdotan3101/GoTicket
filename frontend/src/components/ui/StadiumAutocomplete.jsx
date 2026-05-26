import { useState } from 'react'
import { MapPin, X, ChevronDown } from 'lucide-react'

/**
 * Reusable stadium autocomplete input with dropdown.
 *
 * Props:
 *  - value       (string)          — current stadium name
 *  - onChange     (name => void)    — called on text input change or item selection
 *  - stadiums    (array)           — list of { id, name } objects
 *  - id          (string)          — HTML id for the input
 *  - className   (string)          — optional wrapper class
 *  - placeholder (string)          — optional, defaults to "Stadium"
 *  - onKeyDown   (event => void)   — optional, forwarded to the input
 *  - inputClassName (string)       — optional class for the <input>
 *  - clearBtnClassName (string)    — optional class for the clear button
 *  - iconSize    (number)          — optional icon size, defaults to 16
 */
export default function StadiumAutocomplete({
  value,
  onChange,
  stadiums,
  id,
  className = '',
  placeholder = 'Stadium',
  onKeyDown,
  inputClassName = '',
  clearBtnClassName = 'hs-clear-btn',
  iconSize = 16,
}) {
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = stadiums.filter(s =>
    s.name.toLowerCase().includes(value.toLowerCase())
  )

  const handleSelect = (name) => {
    onChange(name)
    setShowDropdown(false)
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* Icon */}
      <MapPin size={iconSize} color="#94a3b8" style={{ flexShrink: 0 }} />

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
      {showDropdown && stadiums.length > 0 && (
        <div className="custom-autocomplete-dropdown">
          {filtered.length > 0 ? (
            filtered.map(s => (
              <div
                key={s.id}
                className="custom-autocomplete-item"
                onClick={() => handleSelect(s.name)}
              >
                <MapPin size={14} color="#94a3b8" />
                {s.name}
              </div>
            ))
          ) : (
            <div className="custom-autocomplete-empty">No stadiums found</div>
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
          color="#94a3b8"
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
