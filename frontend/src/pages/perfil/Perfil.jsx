import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import nazarenoIcon from '../../assets/nazareno.png'
import costaleroIcon from '../../assets/costalero.png'
import miembroJuntaIcon from '../../assets/miembroDeJunta.png'

const CARACTER_INFO = {
  NAZARENO:      { label: 'Nazareno',        icon: nazarenoIcon, desc: 'Desfila en el cortejo portando el cirio o la cruz de guía.' },
  COSTALERO:     { label: 'Costalero',       icon: costaleroIcon, desc: 'Porta un paso durante la estación de penitencia.' },
  MIEMBRO_JUNTA: { label: 'Junta de Gobierno', icon: miembroJuntaIcon, desc: 'Forma parte del gobierno de la hermandad.' },
}

const ESTADO_CUOTA_INFO = {
  PAGADO:    { label: 'Al corriente',  color: '#2d7a45', bg: '#eaf7ee', icon: '✅' },
  NO_PAGADO: { label: 'Pendiente',     color: '#b45309', bg: '#fef3c7', icon: '⚠️' },
}

export default function Perfil() {
  const { usuario } = useAuth()
  const [hermano, setHermano]     = useState(null)
  const [cargando, setCargando]   = useState(true)
  const [editando, setEditando]   = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')
  const [exito, setExito]         = useState('')
  const [form, setForm] = useState({ direccion: '', email: '' })

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        if (usuario?.is_staff) {
          // Admin: solo muestra datos de cuenta
          setCargando(false)
          return
        }
        const res = await api.get('/mi-perfil/')
        if (activo) {
          setHermano(res.data)
          setForm({ direccion: res.data.direccion || '', email: usuario?.email || '' })
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

  const handleGuardar = async e => {
    e.preventDefault()
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

  if (cargando) return <p style={styles.info}>Cargando perfil...</p>

  const caracter = CARACTER_INFO[hermano?.caracter]
  const cuota    = ESTADO_CUOTA_INFO[hermano?.estado_cuota]

  return (
    <div style={styles.page}>

      {/* ── Cabecera con escudo ── */}
      <div style={styles.hero}>
        <div style={styles.escudo}>
          {usuario?.is_staff ? '⚜️' : (caracter?.icon ? <img src={caracter.icon} alt={caracter.label} style={styles.heroIcon} /> : '⛪')}
        </div>
        <div style={styles.heroInfo}>
          {hermano ? (
            <>
              <h1 style={styles.heroNombre}>
                {hermano.nombre} {hermano.apellidos}
              </h1>
              <p style={styles.heroSub}>
                Hermano Nº <strong>{hermano.numero_hermano}</strong>
              </p>
            </>
          ) : (
            <>
              <h1 style={styles.heroNombre}>{usuario?.email}</h1>
              <p style={styles.heroSub}>Administrador · Junta de Gobierno</p>
            </>
          )}
        </div>
      </div>

      {exito && <div style={styles.exito}>✅ {exito}</div>}
      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      <div style={styles.grid}>

        {/* ── Columna izquierda ── */}
        <div style={styles.col}>

          {/* Datos personales */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>👤</span>
              <h2 style={styles.cardTitulo}>Datos personales</h2>
              {!usuario?.is_staff && !editando && (
                <button style={styles.btnEditar} onClick={() => setEditando(true)}>
                  Editar
                </button>
              )}
            </div>

            {editando ? (
              <form onSubmit={handleGuardar} style={styles.form}>
                <Fila label="Nombre" value={`${hermano.nombre} ${hermano.apellidos}`} readonly />
                <Fila label="Nº Hermano" value={`#${hermano.numero_hermano}`} readonly />

                <div style={styles.campo}>
                  <label style={styles.campoLabel}>Email</label>
                  <input
                    style={styles.input}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    type="email"
                  />
                </div>

                <div style={styles.campo}>
                  <label style={styles.campoLabel}>Dirección</label>
                  <input
                    style={styles.input}
                    value={form.direccion}
                    onChange={e => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Tu dirección"
                  />
                </div>

                <div style={styles.formBtns}>
                  <button type="submit" disabled={guardando} style={styles.btnGuardar}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button type="button" style={styles.btnCancelar} onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div style={styles.filas}>
                {hermano && <Fila label="Nombre completo" value={`${hermano.nombre} ${hermano.apellidos}`} />}
                <Fila label="Email" value={usuario?.email} />
                {hermano && <Fila label="Dirección" value={hermano.direccion || 'No indicada'} />}
                {hermano && <Fila label="Nº de hermano" value={`#${hermano.numero_hermano}`} />}
                {hermano?.fecha_ingreso && (
                  <Fila label="Fecha de ingreso" value={
                    new Date(hermano.fecha_ingreso).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })
                  } />
                )}
              </div>
            )}
          </div>

          {/* Cuenta */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>🔐</span>
              <h2 style={styles.cardTitulo}>Cuenta</h2>
            </div>
            <div style={styles.filas}>
              <Fila label="Usuario" value={usuario?.username || '—'} />
              <Fila label="Rol" value={usuario?.is_staff ? 'Administrador · Junta de Gobierno' : 'Hermano'} />
              <Fila label="Estado" value={usuario?.is_active ? 'Cuenta activa' : 'Cuenta inactiva'} />
            </div>
          </div>

        </div>

        {/* ── Columna derecha (solo hermanos) ── */}
        {hermano && (
          <div style={styles.col}>

            {/* Estado de cuota */}
            <div style={{ ...styles.card, borderLeft: `4px solid ${cuota?.color || '#888'}` }}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>💰</span>
                <h2 style={styles.cardTitulo}>Cuota</h2>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '16px', borderRadius: '8px',
                backgroundColor: cuota?.bg, marginTop: '8px',
              }}>
                <span style={{ fontSize: '28px' }}>{cuota?.icon}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: cuota?.color }}>
                    {cuota?.label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                    {hermano.estado_cuota === 'PAGADO'
                      ? 'Tus cuotas están al corriente. ¡Gracias!'
                      : 'Tienes cuotas pendientes. Contacta con la Junta.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Carácter en la hermandad */}
            {caracter && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardIcon}>⛪</span>
                  <h2 style={styles.cardTitulo}>Carácter en la hermandad</h2>
                </div>
                <div style={styles.caracterBox}>
                  <img src={caracter.icon} alt={caracter.label} style={styles.caracterIcon} />
                  <div>
                    <div style={styles.caracterLabel}>{caracter.label}</div>
                    <div style={styles.caracterDesc}>{caracter.desc}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tarjeta de hermano */}
            <div style={styles.tarjeta}>
              <div style={styles.tarjetaTop}>
                <span style={styles.tarjetaLogo}>⛪ CofraLink</span>
                <span style={styles.tarjetaAnyo}>Hermandad</span>
              </div>
              <div style={styles.tarjetaOrla} />
              <div style={styles.tarjetaNombre}>
                {hermano.nombre} {hermano.apellidos}
              </div>
              <div style={styles.tarjetaNum}>Hermano Nº {hermano.numero_hermano}</div>
              <div style={styles.tarjetaBottom}>
                <span style={styles.tarjetaCaracter}>{caracter?.label || '—'}</span>
                <span style={styles.tarjetaEstado} style={{
                  color: cuota?.color, fontSize: '12px', fontWeight: '600'
                }}>
                  {cuota?.icon} {cuota?.label}
                </span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

// ── Componente auxiliar fila de datos ─────────────────────────────
function Fila({ label, value, readonly }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f0ece4' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#9a8866', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: readonly ? '#999' : '#1a1a2e', fontWeight: readonly ? '400' : '500' }}>
        {value || '—'}
      </div>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────
const GOLD   = '#c9a84c'
const DARK   = '#1a1a2e'
const CREAM  = '#faf7f2'
const BORDER = '#e8e0d0'

const styles = {
  page: { padding: '0 0 40px', backgroundColor: CREAM, minHeight: 'calc(100vh - 56px)' },
  info: { textAlign: 'center', padding: '60px', color: '#666' },

  // Hero
  hero: {
    background: `linear-gradient(135deg, rgba(28,18,15,0.96) 0%, rgba(54,37,27,0.94) 45%, rgba(16,16,26,0.96) 100%)`,
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
  heroNombre: { color: 'white', fontSize: '24px', fontWeight: '700', margin: '0 0 6px' },
  heroSub:    { color: GOLD, fontSize: '14px', margin: 0 },

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
  form:  { display: 'flex', flexDirection: 'column', gap: '12px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  campoLabel: { fontSize: '11px', fontWeight: '700', color: '#9a8866', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    padding: '10px 14px', borderRadius: '8px', border: `1px solid ${BORDER}`,
    fontSize: '14px', outline: 'none', fontFamily: 'inherit', color: DARK,
  },
  formBtns: { display: 'flex', gap: '10px', marginTop: '4px' },
  btnGuardar: {
    padding: '10px 20px', background: `linear-gradient(135deg, rgba(28,18,15,0.96) 0%, rgba(54,37,27,0.94) 45%, rgba(16,16,26,0.96) 100%)`, color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '600',
  },
  btnCancelar: {
    padding: '10px 20px', backgroundColor: '#eee', color: '#555',
    border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
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
    background: `linear-gradient(135deg, rgba(28,18,15,0.96) 0%, rgba(54,37,27,0.94) 45%, rgba(16,16,26,0.96) 100%)`,
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
  exito:    { margin: '16px 32px 0', padding: '12px 16px', backgroundColor: '#eaf7ee', color: '#2d7a45', borderRadius: '8px', fontSize: '14px' },
  errorBox: { margin: '16px 32px 0', padding: '12px 16px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '14px' },
}