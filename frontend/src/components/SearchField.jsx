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
    width: '100%', minWidth: '220px', minHeight: '58px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '10px',
    padding: '0 26px', border: '2px solid rgba(117,82,52,0.22)', borderRadius: '18px', background: 'rgba(255,253,250,0.86)',
    boxShadow: '0 5px 14px rgba(44,24,16,0.04)', color: '#775420', transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  },
  containerFocused: { borderColor: '#c9a84c', boxShadow: '0 0 0 4px rgba(201,168,76,0.28)' },
  icon: { flexShrink: 0 },
  input: {
    minWidth: 0, width: '100%', border: 'none', outline: 'none', padding: '10px 0', color: '#2c1810', background: 'transparent',
    font: 'inherit', fontSize: '16px', boxShadow: 'none',
  },
  clearButton: {
    width: '24px', height: '24px', flexShrink: 0, border: 'none', borderRadius: '50%', background: 'rgba(117,82,52,0.1)',
    color: '#654832', cursor: 'pointer', fontSize: '18px', lineHeight: 1, display: 'grid', placeItems: 'center', padding: 0,
  },
}
