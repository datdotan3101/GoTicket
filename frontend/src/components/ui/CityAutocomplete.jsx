import { useState, useRef, useEffect } from 'react'
import { MapPin, X, ChevronDown } from 'lucide-react'

export default function CityAutocomplete({
  value,
  onChange,
  cities,
  id,
  className = '',
  placeholder = 'Select city',
  inputClassName = '',
  clearBtnClassName = 'hs-clear-btn',
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef(null)

  const filtered = cities.filter(c =>
    c.toLowerCase().includes(value.toLowerCase())
  )

  const handleSelect = (name) => {
    onChange(name)
    setShowDropdown(false)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={className} style={{ position: 'relative' }} ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setShowDropdown(true)
        }}
        onFocus={() => setShowDropdown(true)}
        id={id}
        autoComplete="off"
        className={inputClassName}
        style={{ paddingRight: '30px' }}
      />

      {showDropdown && (
        <div className="custom-autocomplete-dropdown">
          {filtered.length > 0 ? (
            filtered.map(c => (
              <div
                key={c}
                className="custom-autocomplete-item"
                onClick={() => handleSelect(c)}
              >
                {c}
              </div>
            ))
          ) : (
            <div className="custom-autocomplete-empty">
              No cities found
            </div>
          )}
        </div>
      )}

      {value ? (
        <button
          className={clearBtnClassName}
          onClick={() => {
            onChange('')
            setShowDropdown(true)
          }}
          aria-label="Clear"
          type="button"
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
        >
          <X size={14} color="var(--color-slate-400)" />
        </button>
      ) : (
        <ChevronDown
          size={16}
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
