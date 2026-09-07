import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import logo   from '../../assets/logo.png'
import escudo from '../../assets/escudo.png'
import sidebarPhoto from '../../assets/sidebar.jpg'

const DARK = '#241813'
const GOLD = '#b89b52'

// ══════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════
export default function Auth() {
  return (
    <div className="auth-page" style={as.page}>

      {/* ── Panel izquierdo ── */}
      <div className="auth-panel auth-panel--brand" style={as.left}>
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

      </div>

      {/* ── Panel derecho ── */}
      <div className="auth-panel auth-panel--form" style={as.right}>
        <div className="auth-login-panel" style={as.rightInner}>

          {/* Identidad de producto */}
          <div style={as.logoWrap}>
            <div style={as.logoBox}>
              <img src={logo} alt="CofraLink" style={as.logoImg} />
            </div>
            <p style={as.appSub}>PLATAFORMA DE GESTIÓN COFRADE</p>
          </div>

          <div style={as.welcomeBlock}>
            <h1 style={as.welcomeTitle}>¡Hola Hermano!</h1>
            <p style={as.welcomeText}>Accede a tu espacio de hermano y mantente conectado con la Hermandad.</p>
          </div>

          <FormLogin />

          <p style={as.legalNotice}>
            <Link to="/politica-de-privacidad" style={as.legalLink}>Política de privacidad</Link>
            <span aria-hidden="true"> · </span>
            <Link to="/terminos-de-servicio" style={as.legalLink}>Términos de servicio</Link>
          </p>

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
          <label htmlFor="login-email" style={as.label}>Correo electrónico</label>
          <input
            id="login-email"
            className="auth-login-input"
            type="email" value={form.email} required
            style={{ ...as.input, ...as.loginInput }} placeholder="tu@hermandad.es"
            autoComplete="email"
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div style={as.campo}>
          <label htmlFor="login-password" style={as.label}>Contraseña</label>
          <div style={as.passWrap}>
            <input
              id="login-password"
              className="auth-login-input"
              type={verPass ? 'text' : 'password'}
              value={form.password} required
              style={{ ...as.input, ...as.loginInput, paddingRight: '76px' }}
              placeholder="••••••••"
              autoComplete="current-password"
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="auth-password-toggle"
              style={as.eyeBtn}
              aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setVerPass(!verPass)}
            >
              {verPass ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        {error && <p style={as.error}>{error}</p>}

        <button
          type="button"
          style={as.linkPass}
          onClick={() => { setModalPass(true); setMensajeReset('') }}
        >
          ¿Has olvidado tu contraseña?
        </button>

        <button type="submit" disabled={cargando} style={as.btnSubmit}>
          {cargando ? 'Accediendo…' : 'Iniciar sesión  →'}
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
                  <label style={{ ...as.label, ...as.modalLabel }}>CORREO ELECTRÓNICO</label>
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
// ESTILOS
// ══════════════════════════════════════════════
const as = {
  page: {
    display: 'flex', minHeight: '100vh',
  },

  // ── Panel izquierdo ──
  left: {
    width: '50%', flexShrink: 0,
    background: `linear-gradient(180deg, rgba(30,20,17,0.6), rgba(30,20,17,0.9)), url(${sidebarPhoto}) center 30%/cover no-repeat`,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', alignItems: 'center',
    padding: '40px 36px 28px',
    position: 'relative',
  },
  leftInner: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '22px', flex: 1, justifyContent: 'center',
  },
  fundacion: {
    display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center',
  },
  lineaOro: { flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.4)', maxWidth: '80px' },
  fundText: { fontSize: '11px', fontWeight: '700', color: GOLD, letterSpacing: '0.18em' },
  escudo: { width: '148px', height: '148px', objectFit: 'contain', filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.32))' },
  hermandadInfo: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  hermandadLabel: { fontSize: '10px', color: 'rgba(201,168,76,0.7)', letterSpacing: '0.2em', margin: 0 },
  hermandadNombre: {
    color: 'white', fontSize: '30px', fontWeight: '700',
    margin: 0, lineHeight: '1.2', textAlign: 'center',
  },
  separador: { display: 'flex', alignItems: 'center', gap: '10px', width: '120px' },
  lineaOroFina: { flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.5)' },
  cruz: { color: GOLD, fontSize: '14px', fontWeight: '300' },
  lema: { fontSize: '13px', fontWeight: '700', color: GOLD, letterSpacing: '0.25em', margin: 0 },

  // ── Panel derecho ──
  right: {
    flex: 1, background: 'linear-gradient(180deg, #241813 0%, #1e1411 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '36px',
  },
  rightInner: {
    width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column',
    padding: '24px 22px', border: 'none', background: 'transparent',
    boxShadow: 'none',
  },

  // Logo
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '34px', textAlign: 'center' },
  logoBox: {
    width: '170px', height: '92px',
    backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'none', border: 'none',
  },
  logoImg:  { width: '164px', height: '88px', objectFit: 'contain', objectPosition: 'center' },
  appSub:   { fontSize: '10px', fontWeight: '700', color: '#bda966', letterSpacing: '0.13em', margin: 0 },

  // Bienvenida
  welcomeBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', textAlign: 'center' },
  welcomeTitle: { margin: '0 0 8px', color: '#fffaf5', fontSize: '34px', fontWeight: '700', lineHeight: 1.15, letterSpacing: '-0.025em' },
  welcomeText: { maxWidth: '390px', margin: 0, color: '#aa9d95', fontSize: '14px', lineHeight: 1.55 },

  // Formulario
  form:  { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#e4dad4', letterSpacing: '0.01em' },
  input: {
    minHeight: '48px', padding: '11px 14px', borderRadius: '10px',
    border: '1px solid #d8cfc4', fontSize: '15px',
    outline: 'none', backgroundColor: '#f8f6f4', color: DARK,
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  },
  loginInput: {
    border: '1px solid rgba(255,255,255,0.11)',
    background: 'rgba(255,255,255,0.055)',
    color: '#fffaf5',
    caretColor: GOLD,
  },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
    minWidth: '58px', minHeight: '32px', background: 'transparent', border: 'none', borderRadius: '7px',
    color: '#cdbb7c', cursor: 'pointer', fontSize: '11px', fontWeight: '700', padding: '5px 8px',
  },
  error: { fontSize: '13px', color: '#ffc7c1', textAlign: 'left', margin: 0, padding: '10px 12px', border: '1px solid rgba(255,140,130,0.18)', borderRadius: '9px', background: 'rgba(166,61,50,0.14)' },
  btnSubmit: {
    minHeight: '50px', padding: '13px 16px', background: GOLD, color: '#1e1411',
    border: 'none', borderRadius: '11px', fontSize: '15px',
    cursor: 'pointer', fontWeight: '700', letterSpacing: '0.01em',
    marginTop: '2px',
  },
  legalNotice: {
    fontSize: '11px', color: '#81746d', textAlign: 'center',
    lineHeight: '1.5', margin: '26px 0 0', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  legalLink: { color: '#b9aaa1', fontWeight: '600', textDecorationColor: 'rgba(185,170,161,0.42)', textUnderlineOffset: '3px' },
  linkPass: {
    alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', color: '#cdbb7c', textAlign: 'right',
    textDecoration: 'none', padding: '0', marginTop: '-6px', fontFamily: 'inherit',
  },
overlay: {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(44,24,16,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '20px',
},
modalPass: {
  backgroundColor: '#ffffff', borderRadius: '14px', padding: '28px',
  width: '100%', maxWidth: '360px', position: 'relative',
  boxShadow: '0 20px 48px rgba(36,24,19,0.16)', border: '1px solid #e3dedb',
},
modalCerrar: {
  position: 'absolute', top: '12px', right: '14px',
  background: 'none', border: 'none', fontSize: '18px',
  cursor: 'pointer', color: '#9a8866',
},
modalTitulo: { fontSize: '18px', fontWeight: '700', color: DARK, margin: '0 0 8px' },
modalDesc:   { fontSize: '13px', color: '#7a6a58', margin: '0 0 16px', lineHeight: '1.5' },
modalLabel:  { color: '#6f625b' },
mensajeReset: {
  padding: '14px', backgroundColor: '#f0fff4', borderRadius: '8px',
  border: '1px solid #c6f6d5', fontSize: '13px', color: '#2d7a45', textAlign: 'center',
},
}
