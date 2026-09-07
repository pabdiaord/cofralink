import { useEffect, useId, useRef, useState } from 'react'

export default function SelectField({
  value,
  onChange,
  options,
  id,
  ariaLabel,
  placeholder = 'Selecciona una opción',
  style,
  disabled = false,
}) {
  const generatedId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const controlId = id || `select-${generatedId}`
  const listboxId = `${controlId}-options`
  const selectedIndex = options.findIndex(option => String(option.value) === String(value))
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null
  const safeActiveIndex = options[activeIndex] ? activeIndex : Math.max(selectedIndex, 0)

  useEffect(() => {
    if (!open) return undefined

    const closeOnOutsideClick = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    document.getElementById(`${listboxId}-${safeActiveIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [listboxId, open, safeActiveIndex])

  const openMenu = () => {
    if (disabled) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const selectOption = option => {
    if (option.disabled) return
    onChange(String(option.value))
    setOpen(false)
  }

  const moveActiveOption = direction => {
    if (options.length === 0) return

    let nextIndex = safeActiveIndex
    do {
      nextIndex = (nextIndex + direction + options.length) % options.length
    } while (options[nextIndex]?.disabled && nextIndex !== safeActiveIndex)
    setActiveIndex(nextIndex)
  }

  const handleKeyDown = event => {
    if (disabled) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openMenu()
      } else {
        moveActiveOption(event.key === 'ArrowDown' ? 1 : -1)
      }
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (!open) return
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) openMenu()
      else if (options[safeActiveIndex]) selectOption(options[safeActiveIndex])
      return
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      return
    }

    if (event.key === 'Tab') {
      setOpen(false)
      return
    }

    if (open && event.key.length === 1) {
      const query = event.key.toLocaleLowerCase('es')
      const match = options.findIndex(option => (
        !option.disabled && String(option.label).toLocaleLowerCase('es').startsWith(query)
      ))
      if (match >= 0) setActiveIndex(match)
    }
  }

  return (
    <div ref={rootRef} className="cofralink-select" style={{ ...styles.root, ...(open ? styles.rootOpen : {}) }}>
      <button
        id={controlId}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={open ? `${listboxId}-${safeActiveIndex}` : undefined}
        disabled={disabled}
        className="cofralink-select__trigger"
        style={{ ...styles.trigger, ...style, ...(open ? styles.triggerOpen : {}) }}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span style={{ ...styles.value, ...(!selectedOption ? styles.placeholder : {}) }}>
          {selectedOption?.label ?? placeholder}
        </span>
        <svg
          viewBox="0 0 20 20"
          width="18"
          height="18"
          aria-hidden="true"
          style={{ ...styles.chevron, ...(open ? styles.chevronOpen : {}) }}
        >
          <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul id={listboxId} role="listbox" aria-label={ariaLabel} style={styles.menu}>
          {options.map((option, index) => {
            const selected = String(option.value) === String(value)
            const active = index === safeActiveIndex
            const showGroup = option.group && option.group !== options[index - 1]?.group

            return (
              <li key={`${option.value}-${index}`} role="presentation" style={styles.optionWrapper}>
                {showGroup && <span style={styles.groupLabel}>{option.group}</span>}
                <div
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  style={{
                    ...styles.option,
                    ...(active ? styles.optionActive : {}),
                    ...(selected ? styles.optionSelected : {}),
                    ...(option.disabled ? styles.optionDisabled : {}),
                  }}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span>{option.label}</span>
                  {selected && <span aria-hidden="true" style={styles.check}>✓</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const styles = {
  root: { position: 'relative', width: '100%', minWidth: 0 },
  rootOpen: { zIndex: 50 },
  trigger: {
    width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    padding: '10px 13px', border: '1px solid #ded9d5', borderRadius: '10px',
    color: '#241813', background: '#ffffff', boxShadow: '0 1px 2px rgba(36,24,19,0.025)',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', textAlign: 'left',
  },
  triggerOpen: { borderColor: '#a88947', boxShadow: '0 0 0 3px rgba(184,155,82,0.16)' },
  value: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  placeholder: { color: '#8b7969' },
  chevron: { flexShrink: 0, color: '#765a3f', transition: 'transform 160ms ease' },
  chevronOpen: { transform: 'rotate(180deg)' },
  menu: {
    position: 'absolute', top: 'calc(100% + 7px)', left: 0, right: 0, zIndex: 60,
    maxHeight: '260px', overflowY: 'auto', margin: 0, padding: '6px', listStyle: 'none',
    border: '1px solid #ded9d5', borderRadius: '10px',
    color: '#241813', background: '#ffffff',
    boxShadow: '0 16px 34px rgba(36,24,19,0.12)',
  },
  optionWrapper: { margin: 0, padding: 0 },
  groupLabel: { display: 'block', padding: '9px 11px 4px', color: '#96774d', fontSize: '10px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' },
  option: {
    minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    padding: '9px 11px', borderRadius: '8px', color: '#4e382b', cursor: 'pointer',
    fontSize: '14px', lineHeight: 1.4,
  },
  optionActive: { color: '#241813', background: '#f5f3f1' },
  optionSelected: { color: '#241813', background: '#eee8da', fontWeight: '700' },
  optionDisabled: { color: '#ad9f93', cursor: 'not-allowed', background: 'transparent' },
  check: { flexShrink: 0, color: '#8d6824', fontWeight: '800' },
}
