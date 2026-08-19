import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import logo   from '../../assets/logo.png'
import escudo from '../../assets/escudo.png'

const DARK = '#2c1810'
const GOLD = '#c9a84c'
const CREAM = '#f5f0e8'

// ══════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════
export default function Auth({ initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab)

  return (
    <div style={as.page}>

      {/* ── Panel izquierdo ── */}
      <div style={as.left}>
        <div style={as.leftInner}>

          <div style={as.fundacion}>
            <div style={as.lineaOro} />
            <span style={as.fundText}>FUND. 1986</span>
            <div style={as.lineaOro} />
          </div>

          <img src={escudo} alt="Escudo" style={as.escudo} />

          <div style={as.hermandadInfo}>
            <p style={as.hermandadLabel}>HERMANDAD Y COFRADÍA</p>
            <h2 style={as.hermandadNombre}>
              Santísimo Cristo<br />del Perdón
            </h2>
            <div style={as.separador}>
              <div style={as.lineaOroFina} />
              <span style={as.cruz}>+</span>
              <div style={as.lineaOroFina} />
            </div>
            <p style={as.lema}>LXX VECES VII</p>
          </div>

        </div>

        {/* Indicador de slide */}
        <div style={as.indicator}>
          <div style={as.dot} />
        </div>
      </div>

      {/* ── Panel derecho ── */}
      <div style={as.right}>
        <div style={as.rightInner}>

          {/* Logo */}
          <div style={as.logoWrap}>
            <div style={as.logoBox}>
              <img src={logo} alt="CofraLink" style={as.logoImg} />
            </div>
            <h1 style={as.appName}>CofraLink</h1>
            <p style={as.appSub}>PLATAFORMA DE GESTIÓN COFRADE</p>
          </div>

          {/* Separador ACCESO */}
          <div style={as.accesoRow}>
            <div style={as.lineaGris} />
            <span style={as.accesoLabel}>ACCESO</span>
            <div style={as.lineaGris} />
          </div>

          {/* Tabs */}
          <div style={as.tabs}>
            <button
              style={{ ...as.tabBtn, ...(tab === 'login' ? as.tabActivo : {}) }}
              onClick={() => setTab('login')}
            >
              Entrar
            </button>
            <button
              style={{ ...as.tabBtn, ...(tab === 'registro' ? as.tabActivo : {}) }}
              onClick={() => setTab('registro')}
            >
              Crear cuenta
            </button>
          </div>

          {/* Formulario activo */}
          {tab === 'login'
            ? <FormLogin />
            : <FormRegistro onExito={() => setTab('login')} />
          }

        </div>
      </div>

    </div>
  )
}

// ══════════════════════════════════════════════
// FORMULARIO LOGIN
// ══════════════════════════════════════════════
function FormLogin() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)
  const [verPass, setVerPass]   = useState(false)

  // ── Flujo cambio de contraseña ──
  const [modalPass, setModalPass]     = useState(false)
  const [emailReset, setEmailReset]   = useState('')
  const [enviandoReset, setEnviandoReset] = useState(false)
  const [mensajeReset, setMensajeReset]   = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch {
      setError('Email o contraseña incorrectos.')
    } finally {
      setCargando(false)
    }
  }

  const handleSolicitarReset = async e => {
    e.preventDefault()
    setEnviandoReset(true)
    try {
      const res = await api.post('/auth/solicitar-cambio-password/', { email: emailReset })
      setMensajeReset(res.data.mensaje)
    } catch {
      setMensajeReset('Si el correo está registrado, recibirás un enlace en breve.')
    } finally {
      setEnviandoReset(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={as.form}>
        <div style={as.campo}>
          <label style={as.label}>CORREO ELECTRÓNICO</label>
          <input
            type="email" value={form.email} required
            style={as.input} placeholder="tu@hermandad.es"
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div style={as.campo}>
          <label style={as.label}>CONTRASEÑA</label>
          <div style={as.passWrap}>
            <input
              type={verPass ? 'text' : 'password'}
              value={form.password} required
              style={{ ...as.input, paddingRight: '42px' }}
              placeholder="••••••••"
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button type="button" style={as.eyeBtn} onClick={() => setVerPass(!verPass)}>
              {verPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {error && <p style={as.error}>{error}</p>}

        <button type="submit" disabled={cargando} style={as.btnSubmit}>
          {cargando ? 'ENTRANDO...' : 'INICIAR SESIÓN  ›'}
        </button>

        {/* Enlace cambio de contraseña */}
        <button
          type="button"
          style={as.linkPass}
          onClick={() => { setModalPass(true); setMensajeReset('') }}
        >
          ¿Primera vez o has olvidado tu contraseña?
        </button>
      </form>

      {/* Modal solicitud de cambio */}
      {modalPass && (
        <div style={as.overlay} onClick={() => setModalPass(false)}>
          <div style={as.modalPass} onClick={e => e.stopPropagation()}>
            <button style={as.modalCerrar} onClick={() => setModalPass(false)}>✕</button>
            <h3 style={as.modalTitulo}>Cambiar contraseña</h3>
            <p style={as.modalDesc}>
              Introduce tu correo y te enviaremos un enlace para establecer una nueva contraseña.
            </p>

            {mensajeReset ? (
              <div style={as.mensajeReset}>
                <p>📬 {mensajeReset}</p>
              </div>
            ) : (
              <form onSubmit={handleSolicitarReset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={as.campo}>
                  <label style={as.label}>CORREO ELECTRÓNICO</label>
                  <input
                    type="email" value={emailReset} required
                    style={as.input} placeholder="tu@hermandad.es"
                    onChange={e => setEmailReset(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={enviandoReset} style={as.btnSubmit}>
                  {enviandoReset ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════
// FORMULARIO REGISTRO
// ══════════════════════════════════════════════
function FormRegistro({ onExito }) {
  const [form, setForm]   = useState({ nombre: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setCargando(true)

    // Generar username a partir del nombre
    const username = form.nombre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/\s+/g, '.')
      .slice(0, 30)

    try {
      await api.post('/auth/registro/', {
        username,
        email:     form.email,
        password:  form.password,
        password2: form.password,
      })
      onExito()
    } catch (err) {
      const data = err.response?.data
      const msg  = data ? Object.values(data).flat().join(' ') : 'Error al registrarse.'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={as.form}>

      <div style={as.campo}>
        <label style={as.label}>NOMBRE COMPLETO</label>
        <input
          value={form.nombre} required
          style={as.input} placeholder="Pablo García Rodríguez"
          onChange={e => setForm({ ...form, nombre: e.target.value })}
        />
      </div>

      <div style={as.campo}>
        <label style={as.label}>CORREO ELECTRÓNICO</label>
        <input
          type="email" value={form.email} required
          style={as.input} placeholder="tu@hermandad.es"
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div style={as.campo}>
        <label style={as.label}>CONTRASEÑA</label>
        <input
          type="password" value={form.password} required
          style={as.input} placeholder="••••••••"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
      </div>

      {error && <p style={as.error}>{error}</p>}

      <button type="submit" disabled={cargando} style={as.btnSubmit}>
        {cargando ? 'REGISTRANDO...' : 'CREAR CUENTA DE HERMANO'}
      </button>

      <p style={as.nota}>
        Al registrarte se te asigna el rol de hermano.
        La Junta puede ascender tu rol más tarde.
      </p>

    </form>
  )
}

// ══════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════
const as = {
  page: {
    display: 'flex', minHeight: '100vh',
    fontFamily: "'Segoe UI', sans-serif",
  },

  // ── Panel izquierdo ──
  left: {
    width: '50%', flexShrink: 0,
    background: `radial-gradient(ellipse at 30% 40%, #4a2c1a 0%, #2c1810 40%, #150c08 100%)`,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', alignItems: 'center',
    padding: '48px 40px 28px',
    position: 'relative',
  },
  leftInner: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '28px', flex: 1, justifyContent: 'center',
  },
  fundacion: {
    display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center',
  },
  lineaOro: { flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.4)', maxWidth: '80px' },
  fundText: { fontSize: '11px', fontWeight: '700', color: GOLD, letterSpacing: '0.18em' },
  escudo: { width: '180px', height: '180px', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' },
  hermandadInfo: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  hermandadLabel: { fontSize: '10px', color: 'rgba(201,168,76,0.7)', letterSpacing: '0.2em', margin: 0 },
  hermandadNombre: {
    color: 'white', fontSize: '32px', fontWeight: '700',
    margin: 0, lineHeight: '1.2', textAlign: 'center',
    fontFamily: 'Georgia, serif',
  },
  separador: { display: 'flex', alignItems: 'center', gap: '10px', width: '120px' },
  lineaOroFina: { flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.5)' },
  cruz: { color: GOLD, fontSize: '14px', fontWeight: '300' },
  lema: { fontSize: '13px', fontWeight: '700', color: GOLD, letterSpacing: '0.25em', margin: 0 },
  indicator: { display: 'flex', gap: '6px', justifyContent: 'center' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: GOLD, opacity: 0.7 },

  // ── Panel derecho ──
  right: {
    flex: 1, backgroundColor: CREAM,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px',
  },
  rightInner: { width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '20px' },

  // Logo
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  logoBox: {
    width: '64px', height: '64px', borderRadius: '16px',
    backgroundColor: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(44,24,16,0.25)',
  },
  logoImg:  { width: '44px', height: '44px', objectFit: 'contain' },
  appName:  { fontSize: '24px', fontWeight: '700', color: DARK, margin: 0, fontFamily: 'Georgia, serif' },
  appSub:   { fontSize: '10px', fontWeight: '700', color: GOLD, letterSpacing: '0.15em', margin: 0 },

  // Separador ACCESO
  accesoRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  lineaGris: { flex: 1, height: '1px', backgroundColor: '#d8cfc4' },
  accesoLabel: { fontSize: '10px', fontWeight: '700', color: '#9a8866', letterSpacing: '0.15em', whiteSpace: 'nowrap' },

  // Tabs
  tabs: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    border: '1px solid #ddd4c4', borderRadius: '10px', overflow: 'hidden',
    backgroundColor: '#ece6da',
  },
  tabBtn: {
    padding: '11px', border: 'none', background: 'transparent',
    cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#7a6a58',
    transition: 'all 0.2s',
  },
  tabActivo: {
    backgroundColor: 'white', color: DARK, fontWeight: '700',
    boxShadow: '0 2px 8px rgba(44,24,16,0.1)',
    borderRadius: '8px',
  },

  // Formulario
  form:  { display: 'flex', flexDirection: 'column', gap: '14px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', fontWeight: '700', color: '#9a8866', letterSpacing: '0.12em' },
  input: {
    padding: '12px 14px', borderRadius: '8px',
    border: '1px solid #d8cfc4', fontSize: '14px',
    outline: 'none', backgroundColor: 'white', color: DARK,
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px',
  },
  error: { fontSize: '12px', color: '#c0392b', textAlign: 'center', margin: 0 },
  btnSubmit: {
    padding: '14px', backgroundColor: DARK, color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '13px',
    cursor: 'pointer', fontWeight: '700', letterSpacing: '0.1em',
    marginTop: '4px', transition: 'opacity 0.2s',
  },
  nota: {
    fontSize: '12px', color: '#9a8866', textAlign: 'center',
    lineHeight: '1.5', margin: 0,
  },
  linkPass: {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '12px', color: '#9a8866', textAlign: 'center',
  textDecoration: 'underline', padding: '4px 0', fontFamily: 'inherit',
},
overlay: {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(44,24,16,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '20px',
},
modalPass: {
  backgroundColor: CREAM, borderRadius: '14px', padding: '28px',
  width: '100%', maxWidth: '360px', position: 'relative',
  boxShadow: '0 12px 40px rgba(44,24,16,0.25)',
},
modalCerrar: {
  position: 'absolute', top: '12px', right: '14px',
  background: 'none', border: 'none', fontSize: '18px',
  cursor: 'pointer', color: '#9a8866',
},
modalTitulo: { fontSize: '18px', fontWeight: '700', color: DARK, margin: '0 0 8px' },
modalDesc:   { fontSize: '13px', color: '#7a6a58', margin: '0 0 16px', lineHeight: '1.5' },
mensajeReset: {
  padding: '14px', backgroundColor: '#f0fff4', borderRadius: '8px',
  border: '1px solid #c6f6d5', fontSize: '13px', color: '#2d7a45', textAlign: 'center',
},
}