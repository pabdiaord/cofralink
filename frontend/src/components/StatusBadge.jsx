const TONES = {
  success: { color: '#166534', backgroundColor: '#dcfce7' },
  warning: { color: '#9a6700', backgroundColor: '#fff3cd' },
  danger:  { color: '#b42318', backgroundColor: '#fee4e2' },
  neutral: { color: '#555',    backgroundColor: '#eee' },
  purple:  { color: '#6b21a8', backgroundColor: '#f3e8ff' },
}

export default function StatusBadge({ children, tone = 'neutral' }) {
  return (
    <span className="status-badge" style={{ ...styles.badge, ...(TONES[tone] || TONES.neutral) }}>
      {children}
    </span>
  )
}

const styles = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  },
}
