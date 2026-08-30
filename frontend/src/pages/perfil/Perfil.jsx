import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'
import CharacterIcon from '../../components/CharacterIcon'
import AppIcon from '../../components/AppIcon'
import { CHARACTER_INFO } from '../../constants/characterInfo'

const ESTADO_CUOTA_INFO = {
  PAGADO:    { label: 'Al corriente',  color: '#2d7a45', bg: '#eaf7ee', icon: 'check' },
  NO_PAGADO: { label: 'Pendiente',     color: '#b45309', bg: '#fef3c7', icon: 'alert' },
}

const formatearEuros = (centimos) => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR',
}).format((centimos || 0) / 100)

export default function Perfil() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [hermano, setHermano]     = useState(null)
  const [totalDonado, setTotalDonado] = useState(0)
  const [cargando, setCargando]   = useState(true)
  const [editando, setEditando]   = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')
  const [exito, setExito]         = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [form, setForm] = useState({ direccion: '', email: '' })

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        const peticiones = [api.get('/donaciones/mis-donaciones/')]
        if (!usuario?.is_staff) peticiones.unshift(api.get('/mi-perfil/'))
        const resultados = await Promise.all(peticiones)
        const indiceDonaciones = usuario?.is_staff ? 0 : 1

        if (activo) {
          const donacionesPagadas = resultados[indiceDonaciones].data
            .filter(donacion => donacion.estado === 'PAGADA')
          setTotalDonado(donacionesPagadas.reduce(
            (total, donacion) => total + donacion.importe_centimos, 0
          ))

          if (!usuario?.is_staff) {
            const perfil = resultados[0].data
            setHermano(perfil)
            setForm({ direccion: perfil.direccion || '', email: usuario?.email || '' })
          }
        }
      } catch {
        if (activo) setError('No se pudo cargar el perfil.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [usuario])

  const openConfirm = (action) => {
    setPendingAction({ action })
    setConfirmOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    const { action } = pendingAction
    setConfirmOpen(false)

    if (action === 'save-perfil') {
      setGuardando(true)
      setError(''); setExito('')
      try {
        await api.patch('/mi-perfil/', form)
        setHermano(prev => ({ ...prev, direccion: form.direccion }))
        setEditando(false)
        setExito('Perfil actualizado correctamente.')
        setTimeout(() => setExito(''), 3000)
      } catch {
        setError('Error al guardar los cambios.')
      } finally {
        setGuardando(false)
      }
    }

    setPendingAction(null)
  }

  const handleGuardar = async e => {
    e.preventDefault()
    openConfirm('save-perfil')
  }

  if (cargando) return <p style={styles.info}>Cargando perfil...</p>

  const caracterCodigo = usuario?.is_staff ? 'MIEMBRO_JUNTA' : hermano?.caracter
  const caracter = CHARACTER_INFO[caracterCodigo]
  const cuota    = ESTADO_CUOTA_INFO[hermano?.estado_cuota]
  const nombreVisible = hermano
    ? `${hermano.nombre} ${hermano.apellidos}`
    : (usuario?.email || 'Junta de Gobierno')
  const nombreEsCorreo = nombreVisible.includes('@')
  const caracterVisible = caracter?.label || 'Hermano'
  const estadoCuenta = usuario?.is_active ? 'Cuenta activa' : 'Cuenta inactiva'
  const fechaIngreso = hermano?.fecha_ingreso
    ? new Date(hermano.fecha_ingreso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="profile-page" style={styles.page}>
      <header className="profile-hero" style={styles.credentialHero}>
        <div className="profile-identity" style={styles.heroIdentity}>
          <div style={styles.profileSeal}>
            {caracter ? <CharacterIcon caracter={caracterCodigo} alt={caracter.label} style={styles.heroIcon} /> : '⛪'}
          </div>
          <div>
            <p style={styles.heroEyebrow}>Credencial digital · CofraLink</p>
            <h1 className={`profile-name ${nombreEsCorreo ? 'profile-name--email' : ''}`} style={styles.heroNombre}>{nombreVisible}</h1>
            <p style={styles.heroSub}>
              {hermano ? `Hermano Nº ${hermano.numero_hermano}` : 'Administrador'} · {caracterVisible}
            </p>
            <div style={styles.heroTags}>
              <span style={styles.heroTag}>{estadoCuenta}</span>
              {hermano?.fecha_ingreso && <span style={styles.heroTag}>Desde {fechaIngreso}</span>}
            </div>
          </div>
        </div>
        {!usuario?.is_staff && (
          <button type="button" style={styles.heroEditButton} onClick={() => setEditando(true)}>
            Editar mi ficha
          </button>
        )}
      </header>

      <main style={styles.profileContent}>
        {exito && <div style={styles.exito}>✅ {exito}</div>}
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <section className="profile-milestones" style={styles.milestoneGrid} aria-label="Resumen de perfil">
          <Hito
            icon={caracter ? <CharacterIcon caracter={caracterCodigo} alt="" style={styles.milestoneImage} /> : '⛪'}
            label="Carácter"
            value={caracterVisible}
          />
          <Hito icon={<AppIcon name={cuota?.icon || 'check'} size={21} />} label="Cuota" value={cuota?.label || estadoCuenta} color={cuota?.color} />
          <Hito icon="♡" label="Donado a la Hermandad" value={formatearEuros(totalDonado)} />
          <Hito icon={<AppIcon name="id" size={21} />} label="Hermano número" value={hermano ? `${hermano.numero_hermano}` : 'Junta'} />
        </section>

        <div className="profile-grid" style={styles.profileGrid}>
          <section className="profile-panel" style={styles.profilePanel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelEyebrow}>Información personal</p>
                <h2 style={styles.panelTitle}>Mi ficha</h2>
              </div>
              {!usuario?.is_staff && !editando && (
                <button type="button" style={styles.outlineButton} onClick={() => setEditando(true)}>Editar</button>
              )}
            </div>

            {editando ? (
              <form onSubmit={handleGuardar} style={styles.form}>
                <div style={styles.formReadOnly}>
                  <Fila label="Nombre" value={`${hermano.nombre} ${hermano.apellidos}`} readonly />
                  <Fila label="Número de hermano" value={`#${hermano.numero_hermano}`} readonly />
                </div>
                <div style={styles.formFields}>
                  <div style={styles.campo}>
                    <label style={styles.campoLabel}>Correo electrónico</label>
                    <input style={styles.input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" />
                  </div>
                  <div style={styles.campo}>
                    <label style={styles.campoLabel}>Dirección</label>
                    <input style={styles.input} value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Tu dirección" />
                  </div>
                </div>
                <div style={styles.formBtns}>
                  <button type="submit" disabled={guardando} style={styles.btnGuardar}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
                  <button type="button" style={styles.btnCancelar} onClick={() => setEditando(false)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div style={styles.detailGrid}>
                {hermano && <Fila label="Nombre completo" value={nombreVisible} />}
                <Fila label="Correo electrónico" value={usuario?.email} />
                {hermano && <Fila label="Dirección" value={hermano.direccion || 'No indicada'} />}
                {hermano?.fecha_ingreso && <Fila label="Fecha de ingreso" value={new Date(hermano.fecha_ingreso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} />}
              </div>
            )}

            <div style={styles.accountBand}>
              <div>
                <p style={styles.panelEyebrow}>Acceso a CofraLink</p>
                <h3 style={styles.accountTitle}>{usuario?.username || 'Cuenta de Hermandad'}</h3>
              </div>
              <span style={styles.accountStatus}>{estadoCuenta}</span>
            </div>
          </section>

          <aside className="profile-side-stack" style={styles.sideStack}>
            <section style={styles.membershipPanel}>
              <div style={styles.membershipIcon}>
                {caracter ? <CharacterIcon caracter={caracterCodigo} alt="" style={styles.membershipImage} /> : '✦'}
              </div>
              <div>
                <p style={styles.panelEyebrow}>En mi último Martes Santo fui</p>
                <h2 style={styles.membershipTitle}>{caracterVisible}</h2>
                <p style={styles.membershipDescription}>{caracter?.description || 'Gestionas la actividad y la comunicación de la Hermandad desde CofraLink.'}</p>
              </div>
            </section>

            <section style={styles.quickAccessPanel}>
              <div style={styles.panelHeader}>
                <div>
                  <p style={styles.panelEyebrow}>Continúa desde aquí</p>
                  <h2 style={styles.panelTitle}>Mi actividad</h2>
                </div>
              </div>
              <div style={styles.quickLinks}>
                <AccesoPerfil icon={<AppIcon name="calendar" size={17} />} label="Próximos eventos" onClick={() => navigate('/eventos')} />
                <AccesoPerfil icon={<AppIcon name="document" size={17} />} label="Papeleta de sitio" onClick={() => navigate('/procesional')} />
                <AccesoPerfil icon={<AppIcon name="coin" size={17} />} label="Donaciones" onClick={() => navigate('/donaciones')} />
              </div>
            </section>
          </aside>
        </div>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="Guardar cambios"
        message="¿Quieres guardar los cambios del perfil con los datos actuales?"
        confirmText="Guardar"
        onConfirm={executePendingAction}
        onCancel={() => { setConfirmOpen(false); setPendingAction(null) }}
      />
    </div>
  )
}

// ── Componente auxiliar fila de datos ─────────────────────────────
function Hito({ icon, label, value, color }) {
  return (
    <div style={styles.milestone}>
      <span style={styles.milestoneIcon}>{icon}</span>
      <div>
        <p style={styles.milestoneLabel}>{label}</p>
        <p style={{ ...styles.milestoneValue, ...(color ? { color } : {}) }}>{value}</p>
      </div>
    </div>
  )
}

function AccesoPerfil({ icon, label, onClick }) {
  return (
    <button type="button" style={styles.quickLink} onClick={onClick}>
      <span style={styles.quickLinkIcon}>{icon}</span>
      <span>{label}</span>
      <span aria-hidden="true" style={styles.quickLinkArrow}>→</span>
    </button>
  )
}

function Fila({ label, value, readonly }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={{ ...styles.detailValue, ...(readonly ? styles.detailReadOnly : {}) }}>
        {value || '—'}
      </span>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────
const GOLD   = '#c9a84c'
const DARK   = '#2c1810'
const CREAM  = '#faf7f2'
const BORDER = '#e8e0d0'

const styles = {
  page: { padding: 'clamp(16px, 3vw, 32px)', background: 'linear-gradient(180deg, #f5efe7 0%, #efe3d7 100%)', minHeight: 'calc(100vh - 56px)', color: '#2c1810' },
  info: { textAlign: 'center', padding: '60px', color: '#666' },

  // Hero
  hero: {
    background: 'linear-gradient(135deg, #2c1810, #563522)',
    padding: '40px 32px',
    display: 'flex', alignItems: 'center', gap: '28px',
    borderBottom: `3px solid ${GOLD}`,
    boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.18)',
  },
  escudo: {
    width: '92px', height: '92px', borderRadius: '50%',
    background: `radial-gradient(circle at 30% 30%, rgba(255,236,178,0.28), rgba(201,168,76,0.08) 45%, rgba(0,0,0,0.1) 100%)`,
    border: `2px solid ${GOLD}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '40px', flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '0 0 0 4px rgba(201,168,76,0.08), 0 12px 24px rgba(0,0,0,0.18)',
  },
  heroIcon: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    padding: '6px',
    background: 'rgba(255,255,255,0.04)',
    boxSizing: 'border-box',
  },
  heroInfo: {},
  heroNombre: { color: '#fffaf4', fontSize: '32px', fontWeight: '700', margin: '3px 0 7px', lineHeight: 1.2 },
  heroSub:    { color: '#eed891', fontSize: '16px', margin: 0 },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' },
  col:  { display: 'flex', flexDirection: 'column', gap: '16px' },

  // Card
  card: {
    background: 'white', borderRadius: '10px',
    padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    border: `1px solid ${BORDER}`,
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  cardIcon:   { fontSize: '18px' },
  cardTitulo: { fontSize: '15px', fontWeight: '700', color: DARK, flex: 1, margin: 0 },
  filas:      {},

  // Formulario edición
  form:  { display: 'flex', flexDirection: 'column', gap: '18px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '7px' },
  campoLabel: { fontSize: '13px', fontWeight: '700', color: '#765a3f', letterSpacing: '0.02em' },
  input: {
    padding: '12px 14px', borderRadius: '10px', border: `1px solid ${BORDER}`,
    fontSize: '16px', outline: 'none', fontFamily: 'inherit', color: DARK, background: '#fffdfa',
  },
  formBtns: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '2px' },
  btnGuardar: {
    padding: '12px 20px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee',
    border: 'none', borderRadius: '10px', fontSize: '15px',
    cursor: 'pointer', fontWeight: '600',
  },
  btnCancelar: {
    padding: '12px 20px', backgroundColor: '#f3ece3', color: '#5d4a3d',
    border: `1px solid ${BORDER}`, borderRadius: '10px', fontSize: '15px', cursor: 'pointer',
  },
  btnEditar: {
    padding: '5px 14px', backgroundColor: 'transparent',
    border: `1px solid ${GOLD}`, color: GOLD,
    borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600',
  },

  // Carácter
  caracterBox: {
    display: 'flex', alignItems: 'flex-start', gap: '16px',
    padding: '14px', backgroundColor: '#faf7f2',
    borderRadius: '8px', border: `1px solid ${BORDER}`,
  },
  caracterIcon: {
    width: '42px',
    height: '42px',
    objectFit: 'contain',
    flexShrink: 0,
    display: 'block',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.10))',
  },
  caracterLabel: { fontWeight: '700', color: DARK, fontSize: '15px', marginBottom: '4px' },
  caracterDesc:  { fontSize: '13px', color: '#666', lineHeight: '1.5' },

  // Tarjeta de hermano
  tarjeta: {
    background: 'linear-gradient(135deg, #2c1810, #563522)',
    borderRadius: '12px', padding: '20px',
    border: `1px solid ${GOLD}`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  tarjetaTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  tarjetaLogo: { color: GOLD, fontWeight: '700', fontSize: '14px' },
  tarjetaAnyo: { color: 'rgba(255,255,255,0.5)', fontSize: '11px' },
  tarjetaOrla: {
    height: '1px', backgroundColor: GOLD, opacity: 0.4, marginBottom: '14px',
  },
  tarjetaNombre: { color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '4px' },
  tarjetaNum:    { color: GOLD, fontSize: '13px', marginBottom: '16px' },
  tarjetaBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tarjetaCaracter: { color: 'rgba(255,255,255,0.7)', fontSize: '12px' },

  // Alertas
  exito:    { margin: '16px 0', padding: '12px 16px', backgroundColor: '#eaf7ee', color: '#2d7a45', borderRadius: '10px', fontSize: '15px' },
  errorBox: { margin: '16px 0', padding: '12px 16px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '10px', fontSize: '15px' },

  credentialHero: {
    maxWidth: '1240px', margin: '0 auto', minHeight: '202px', padding: 'clamp(22px, 4vw, 36px)', borderRadius: '26px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap',
    background: 'radial-gradient(circle at 88% 8%, rgba(231,199,119,0.28), transparent 28%), linear-gradient(135deg, #2c1810, #563522)',
    border: '1px solid rgba(201,168,76,0.45)', boxShadow: '0 20px 40px rgba(44,24,16,0.18)',
  },
  heroIdentity: { display: 'flex', alignItems: 'center', gap: '22px', minWidth: 0 },
  profileSeal: {
    width: '96px', height: '96px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
    display: 'grid', placeItems: 'center', fontSize: '42px',
    background: 'radial-gradient(circle at 30% 30%, rgba(255,236,178,0.34), rgba(201,168,76,0.08) 52%, rgba(0,0,0,0.22))',
    border: `2px solid ${GOLD}`, boxShadow: '0 0 0 6px rgba(201,168,76,0.10), 0 12px 26px rgba(0,0,0,0.25)',
  },
  heroEyebrow: { margin: 0, color: '#e7c777', fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' },
  heroTags: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' },
  heroTag: { border: '1px solid rgba(255,255,255,0.18)', borderRadius: '999px', padding: '5px 10px', color: 'rgba(255,250,244,0.9)', background: 'rgba(255,255,255,0.07)', fontSize: '13px' },
  heroEditButton: { border: `1px solid ${GOLD}`, borderRadius: '10px', padding: '11px 16px', color: '#fff8e9', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap' },
  profileContent: { maxWidth: '1240px', margin: '0 auto' },
  milestoneGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', margin: '-18px clamp(0px, 2vw, 24px) 24px', position: 'relative', zIndex: 1 },
  milestone: { minHeight: '78px', display: 'flex', alignItems: 'center', gap: '11px', padding: '13px 15px', border: `1px solid ${BORDER}`, borderRadius: '14px', background: 'rgba(255,253,250,0.98)', boxShadow: '0 10px 22px rgba(44,24,16,0.08)' },
  milestoneIcon: { width: '38px', height: '38px', flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '11px', color: '#765a3f', background: '#f2e6cf', fontSize: '20px', overflow: 'hidden' },
  milestoneImage: { width: '100%', height: '100%', objectFit: 'contain', padding: '3px' },
  milestoneLabel: { margin: 0, color: '#826b57', fontSize: '12px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' },
  milestoneValue: { margin: '2px 0 0', color: '#2c1810', fontSize: '16px', fontWeight: '700', lineHeight: 1.25 },
  profileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px', alignItems: 'start' },
  profilePanel: { padding: '26px', borderRadius: '20px', border: `1px solid ${BORDER}`, background: 'rgba(255,253,250,0.94)', boxShadow: '0 12px 28px rgba(44,24,16,0.06)' },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '22px' },
  panelEyebrow: { margin: 0, color: '#95713a', fontSize: '12px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' },
  panelTitle: { margin: '3px 0 0', color: '#2c1810', fontSize: '22px' },
  outlineButton: { padding: '9px 14px', border: '1px solid rgba(117,82,52,0.34)', borderRadius: '9px', background: 'transparent', color: '#5b3927', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 22px' },
  detailRow: { padding: '15px 0', borderBottom: '1px solid rgba(117,82,52,0.14)', display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { color: '#826b57', fontSize: '13px', fontWeight: '700', letterSpacing: '0.02em' },
  detailValue: { color: '#2c1810', fontSize: '16px', fontWeight: '600', lineHeight: 1.4 },
  detailReadOnly: { color: '#867767', fontWeight: '500' },
  formReadOnly: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 18px', padding: '0 14px', borderRadius: '12px', background: '#f7f0e6' },
  formFields: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  accountBand: { marginTop: '25px', padding: '17px 18px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#f2e6cf' },
  accountTitle: { margin: '3px 0 0', color: '#2c1810', fontSize: '17px' },
  accountStatus: { padding: '6px 10px', borderRadius: '999px', color: '#27633a', background: '#dcf3e1', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' },
  sideStack: { display: 'flex', flexDirection: 'column', gap: '16px' },
  membershipPanel: { display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '19px', borderRadius: '17px', border: '1px solid rgba(201,168,76,0.45)', background: 'linear-gradient(135deg, #fff8eb, #f2e3c6)' },
  membershipIcon: { width: '48px', height: '48px', flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '14px', color: '#775420', background: 'rgba(201,168,76,0.22)', fontSize: '23px', overflow: 'hidden' },
  membershipImage: { width: '100%', height: '100%', objectFit: 'contain', padding: '4px' },
  membershipTitle: { margin: '3px 0 5px', color: '#2c1810', fontSize: '18px' },
  membershipDescription: { margin: 0, color: '#654f3b', fontSize: '15px', lineHeight: 1.5 },
  quickAccessPanel: { padding: '22px', borderRadius: '18px', border: `1px solid ${BORDER}`, background: 'rgba(255,253,250,0.94)' },
  quickLinks: { display: 'flex', flexDirection: 'column', gap: '8px' },
  quickLink: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', color: '#4f3829', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(117,82,52,0.12)', cursor: 'pointer', fontSize: '15px', fontWeight: '600', textAlign: 'left' },
  quickLinkIcon: { width: '25px', height: '25px', display: 'grid', placeItems: 'center', borderRadius: '8px', color: '#775420', background: '#f2e6cf', fontSize: '15px' },
  quickLinkArrow: { marginLeft: 'auto', color: '#9b7b4d', fontSize: '19px' },
}
