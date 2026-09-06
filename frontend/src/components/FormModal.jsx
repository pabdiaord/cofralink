import { useEffect, useId } from 'react'

export default function FormModal({
  title,
  onClose,
  children,
  error = '',
  maxWidth = '620px',
  closeDisabled = false,
}) {
  const titleId = useId()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape' && !closeDisabled) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeDisabled, onClose])

  const handleBackdropClick = event => {
    if (event.target === event.currentTarget && !closeDisabled) onClose()
  }

  return (
    <div className="form-modal-overlay" style={styles.overlay} onClick={handleBackdropClick}>
      <section
        className="responsive-modal form-modal"
        style={{ ...styles.modal, maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header style={styles.header}>
          <h2 id={titleId} style={styles.title}>{title}</h2>
          <button
            type="button"
            style={styles.closeButton}
            onClick={onClose}
            disabled={closeDisabled}
            aria-label={`Cerrar ${title.toLowerCase()}`}
          >
            ×
          </button>
        </header>
        {error && <p role="alert" style={styles.error}>{error}</p>}
        {children}
      </section>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'rgba(20, 15, 12, 0.55)',
  },
  modal: {
    width: '100%',
    maxHeight: 'calc(100dvh - 40px)',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: '26px',
    border: '1px solid rgba(117, 82, 52, 0.14)',
    borderRadius: '18px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(250,245,241,0.99))',
    boxShadow: '0 20px 50px rgba(25, 17, 15, 0.28)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#2c1810',
    fontSize: '20px',
    fontWeight: '800',
  },
  error: {
    margin: '0 0 16px',
    padding: '11px 14px',
    border: '1px solid #f2b8b5',
    borderRadius: '10px',
    background: '#fde8e7',
    color: '#9f1d1d',
    fontSize: '14px',
  },
  closeButton: {
    width: '36px',
    height: '36px',
    flexShrink: 0,
    border: '1px solid rgba(117, 82, 52, 0.18)',
    borderRadius: '50%',
    background: '#f3ece5',
    color: '#2c1810',
    cursor: 'pointer',
    fontSize: '24px',
    lineHeight: 1,
  },
}
