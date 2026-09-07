import { useState } from 'react'
import AppIcon from './AppIcon'

export default function SearchField({ value, onChange, placeholder = 'Buscar', ariaLabel = placeholder, className, style }) {
  const [tieneFoco, setTieneFoco] = useState(false)

  return (
    <div
      className={className}
      style={{ ...styles.container, ...style, ...(tieneFoco ? styles.containerFocused : {}) }}
      onFocus={() => setTieneFoco(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setTieneFoco(false)
      }}
    >
      <AppIcon name="search" size={20} style={styles.icon} />
      <input
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={styles.input}
      />
      {value && (
        <button type="button" aria-label="Limpiar búsqueda" onClick={() => onChange('')} style={styles.clearButton}>
          ×
        </button>
      )}
    </div>
  )
}

const styles = {
  container: {
    width: '100%', minWidth: '220px', minHeight: '46px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '10px',
    padding: '0 14px', border: '1px solid #ded9d5', borderRadius: '10px', background: '#ffffff',
    boxShadow: '0 1px 2px rgba(36,24,19,0.025)', color: '#766a63', transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  },
  containerFocused: { borderColor: '#a88947', boxShadow: '0 0 0 3px rgba(184,155,82,0.16)' },
  icon: { flexShrink: 0 },
  input: {
    minWidth: 0, width: '100%', border: 'none', outline: 'none', padding: '9px 0', color: '#241813', background: 'transparent',
    font: 'inherit', fontSize: '14px', boxShadow: 'none',
  },
  clearButton: {
    width: '24px', height: '24px', flexShrink: 0, border: 'none', borderRadius: '7px', background: '#f0edeb',
    color: '#655b55', cursor: 'pointer', fontSize: '18px', lineHeight: 1, display: 'grid', placeItems: 'center', padding: 0,
  },
}
