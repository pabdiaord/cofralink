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
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={{ ...styles.icon, ...(danger ? styles.iconDanger : {}) }}>
            {danger ? '⚠️' : '✓'}
          </span>
          <h3 style={styles.title}>{title}</h3>
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
    background: 'rgba(20, 15, 12, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,245,241,0.98))',
    borderRadius: '18px',
    padding: '22px 20px 18px',
    boxShadow: '0 18px 36px rgba(25, 17, 15, 0.18)',
    border: '1px solid rgba(117, 82, 52, 0.12)',
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
    color: '#2c1810',
    fontWeight: '800',
  },
  message: {
    margin: '0 0 18px',
    color: '#4b352d',
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
    border: '1px solid rgba(44,24,16,0.18)',
    background: '#f3ece5',
    color: '#2c1810',
    cursor: 'pointer',
    fontWeight: '700',
  },
  confirmBtn: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #2c1810 0%, #4b2d1f 35%, #1d1823 100%)',
    color: '#fff',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(44,24,16,0.16)',
  },
  confirmDanger: {
    background: 'linear-gradient(135deg, #a52a2a 0%, #b3261e 100%)',
    boxShadow: '0 8px 16px rgba(163, 42, 42, 0.2)',
  },
}
