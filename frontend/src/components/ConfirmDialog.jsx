export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="confirm-dialog-overlay" style={styles.overlay} onClick={onCancel}>
      <div className="confirm-dialog" style={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div style={styles.header}>
          <span style={{ ...styles.icon, ...(danger ? styles.iconDanger : {}) }}>
            {danger ? '⚠️' : '✓'}
          </span>
          <h3 id="confirm-dialog-title" style={styles.title}>{title}</h3>
        </div>

        <p style={styles.message}>{message}</p>

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            style={{ ...styles.confirmBtn, ...(danger ? styles.confirmDanger : {}) }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20, 15, 12, 0.42)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    background: '#ffffff',
    borderRadius: '14px',
    padding: '22px 20px 18px',
    boxShadow: '0 20px 48px rgba(25, 17, 15, 0.16)',
    border: '1px solid #e3dedb',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  icon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(79, 124, 82, 0.12)',
    fontSize: '16px',
  },
  iconDanger: {
    background: 'rgba(185, 28, 28, 0.1)',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#241813',
    fontWeight: '800',
  },
  message: {
    margin: '0 0 18px',
    color: '#625853',
    fontSize: '15px',
    lineHeight: '1.55',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelBtn: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #ded9d5',
    background: '#f5f3f1',
    color: '#241813',
    cursor: 'pointer',
    fontWeight: '700',
  },
  confirmBtn: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    background: '#241813',
    color: '#fffaf5',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: 'none',
  },
  confirmDanger: {
    background: '#a63d32',
    boxShadow: 'none',
  },
}
