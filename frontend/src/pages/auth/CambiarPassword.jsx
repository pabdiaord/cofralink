import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import logo   from '../../assets/logo.png'
import escudo from '../../assets/escudo.png'
import sidebarPhoto from '../../assets/sidebar.jpg'

const DARK = '#241813'
const GOLD = '#b89b52'

function validarPasswordLocal(password) {
  const errores = []
  if (password.length < 12) {
    errores.push('Debe tener al menos 12 caracteres.')
  }
  if (password && /^\d+$/.test(password)) {
    errores.push('No puede estar formada únicamente por números.')
  }
  return errores
}

export default function CambiarPassword() {
  const { uid, token } = useParams()
  const navigate       = useNavigate()
  const [form, setForm]   = useState({ password1: '', password2: '' })
  const [error, setError] = useState('')
  const [erroresPassword, setErroresPassword] = useState([])
  const [mostrarValidacion, setMostrarValidacion] = useState(false)
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(false)

  const actualizarPassword = password1 => {
    setForm(prev => ({ ...prev, password1 }))
    if (mostrarValidacion) {
      setErroresPassword(validarPasswordLocal(password1))
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setMostrarValidacion(true)

    const erroresLocales = validarPasswordLocal(form.password1)
    if (erroresLocales.length > 0) {
      setErroresPassword(erroresLocales)
      return
    }

    setErroresPassword([])
    if (form.password1 !== form.password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setCargando(true)
    try {
      const res = await api.post('/auth/confirmar-cambio-password/', {
        uid, token,
        password1: form.password1,
        password2: form.password2,
      })
      setExito(res.data.mensaje)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const data = err.response?.data
      const erroresServidor = data?.password1
      if (Array.isArray(erroresServidor)) {
        setErroresPassword(erroresServidor)
        setError('Revisa los requisitos de la contraseña.')
      } else {
        setError(data?.error || 'Error al cambiar la contraseña.')
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-page password-page" style={cs.page}>
      <div className="auth-panel auth-panel--brand" style={cs.left}>
        <div style={cs.leftInner}>
          <div style={cs.fundacion}>
            <div style={cs.lineaOro} />
            <span style={cs.fundText}>FUND. 1986</span>
            <div style={cs.lineaOro} />
          </div>
          <img src={escudo} alt="Escudo" style={cs.escudo} />
          <div style={cs.hermandadInfo}>
            <p style={cs.hermandadLabel}>HERMANDAD Y COFRADÍA</p>
            <h2 style={cs.hermandadNombre}>Santísimo Cristo<br />del Perdón</h2>
            <div style={cs.separador}>
              <div style={cs.lineaOroFina} />
              <span style={cs.cruz}>+</span>
              <div style={cs.lineaOroFina} />
            </div>
            <p style={cs.lema}>LXX VECES VII</p>
          </div>
        </div>
      </div>

      <div className="auth-panel auth-panel--form" style={cs.right}>
        <div className="auth-login-panel" style={cs.rightInner}>

          <div style={cs.logoWrap}>
            <div style={cs.logoBox}>
              <img src={logo} alt="CofraLink" style={cs.logoImg} />
            </div>
            <p style={cs.appSub}>PLATAFORMA DE GESTIÓN COFRADE</p>
          </div>

          <div style={cs.welcomeBlock}>
            <h1 style={cs.welcomeTitle}>Nueva contraseña</h1>
            <p style={cs.welcomeText}>Elige una contraseña segura para volver a acceder a tu espacio de hermano.</p>
          </div>

          {exito ? (
            <div style={cs.exitoBox}>
              <span aria-hidden="true" style={cs.exitoIcon}>✓</span>
              <p style={cs.exitoTexto}>{exito}</p>
              <p style={cs.exitoSub}>Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={cs.form}>
              <div style={cs.campo}>
                <label htmlFor="new-password" style={cs.label}>Nueva contraseña</label>
                <input
                  id="new-password"
                  className="auth-login-input"
                  type="password" value={form.password1} required
                  style={{ ...cs.input, ...cs.loginInput }} placeholder="Mínimo 12 caracteres"
                  autoComplete="new-password"
                  aria-describedby="password-requisitos"
                  onBlur={() => {
                    setMostrarValidacion(true)
                    setErroresPassword(validarPasswordLocal(form.password1))
                  }}
                  onChange={e => actualizarPassword(e.target.value)}
                />
                <p id="password-requisitos" style={cs.requisitos}>
                  Usa al menos 12 caracteres; evita contraseñas comunes, solo numéricas o parecidas a tu email.
                </p>
                {mostrarValidacion && erroresPassword.length > 0 && (
                  <ul style={cs.listaErrores} role="alert">
                    {erroresPassword.map(errorPassword => (
                      <li key={errorPassword}>{errorPassword}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={cs.campo}>
                <label htmlFor="confirm-password" style={cs.label}>Confirmar contraseña</label>
                <input
                  id="confirm-password"
                  className="auth-login-input"
                  type="password" value={form.password2} required
                  style={{ ...cs.input, ...cs.loginInput }} placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  onChange={e => setForm({ ...form, password2: e.target.value })}
                />
              </div>

              {error && <p style={cs.error}>{error}</p>}

              <button type="submit" disabled={cargando} style={cs.btnSubmit}>
                {cargando ? 'Guardando…' : 'Guardar nueva contraseña  →'}
              </button>
            </form>
          )}

          <p style={cs.backNotice}>
            <Link to="/login" style={cs.backLink}>Volver al inicio de sesión</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

const cs = {
  page: { display: 'flex', minHeight: '100vh' },
  left: {
    width: '50%', flexShrink: 0,
    background: `linear-gradient(180deg, rgba(30,20,17,0.6), rgba(30,20,17,0.9)), url(${sidebarPhoto}) center 30%/cover no-repeat`,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', alignItems: 'center',
    padding: '40px 36px 28px', position: 'relative',
  },
  leftInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px', flex: 1, justifyContent: 'center' },
  fundacion: { display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center' },
  lineaOro: { flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.4)', maxWidth: '80px' },
  fundText: { fontSize: '11px', fontWeight: '700', color: GOLD, letterSpacing: '0.18em' },
  escudo: { width: '148px', height: '148px', objectFit: 'contain', filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.32))' },
  hermandadInfo: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  hermandadLabel: { fontSize: '10px', color: 'rgba(201,168,76,0.7)', letterSpacing: '0.2em', margin: 0 },
  hermandadNombre: { color: 'white', fontSize: '30px', fontWeight: '700', margin: 0, lineHeight: '1.2', textAlign: 'center' },
  separador: { display: 'flex', alignItems: 'center', gap: '10px', width: '120px' },
  lineaOroFina: { flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.5)' },
  cruz: { color: GOLD, fontSize: '14px', fontWeight: '300' },
  lema: { fontSize: '13px', fontWeight: '700', color: GOLD, letterSpacing: '0.25em', margin: 0 },
  right: { flex: 1, background: 'linear-gradient(180deg, #241813 0%, #1e1411 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px' },
  rightInner: { width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', padding: '24px 22px', border: 'none', background: 'transparent', boxShadow: 'none' },
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '34px', textAlign: 'center' },
  logoBox: { width: '170px', height: '92px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none', border: 'none' },
  logoImg: { width: '164px', height: '88px', objectFit: 'contain', objectPosition: 'center' },
  appSub: { fontSize: '10px', fontWeight: '700', color: '#bda966', letterSpacing: '0.13em', margin: 0 },
  welcomeBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', textAlign: 'center' },
  welcomeTitle: { margin: '0 0 8px', color: '#fffaf5', fontSize: '34px', fontWeight: '700', lineHeight: 1.15, letterSpacing: '-0.025em' },
  welcomeText: { maxWidth: '390px', margin: 0, color: '#aa9d95', fontSize: '14px', lineHeight: 1.55 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#e4dad4', letterSpacing: '0.01em' },
  input: { minHeight: '48px', padding: '11px 14px', borderRadius: '10px', border: '1px solid #d8cfc4', fontSize: '15px', outline: 'none', backgroundColor: '#f8f6f4', color: DARK, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  loginInput: { border: '1px solid rgba(255,255,255,0.11)', background: 'rgba(255,255,255,0.055)', color: '#fffaf5', caretColor: GOLD },
  requisitos: { fontSize: '11px', color: '#91847c', margin: '2px 0 0', lineHeight: '1.45' },
  listaErrores: { fontSize: '12px', color: '#ffc7c1', margin: 0, padding: '10px 12px 10px 28px', border: '1px solid rgba(255,140,130,0.18)', borderRadius: '9px', background: 'rgba(166,61,50,0.14)', lineHeight: '1.45' },
  error: { fontSize: '13px', color: '#ffc7c1', textAlign: 'left', margin: 0, padding: '10px 12px', border: '1px solid rgba(255,140,130,0.18)', borderRadius: '9px', background: 'rgba(166,61,50,0.14)' },
  btnSubmit: { minHeight: '50px', padding: '13px 16px', background: GOLD, color: '#1e1411', border: 'none', borderRadius: '11px', fontSize: '15px', cursor: 'pointer', fontWeight: '700', letterSpacing: '0.01em', marginTop: '2px' },
  exitoBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px', background: 'rgba(72,137,88,0.1)', borderRadius: '12px', border: '1px solid rgba(119,188,135,0.22)' },
  exitoIcon: { display: 'grid', placeItems: 'center', width: '36px', height: '36px', marginBottom: '12px', borderRadius: '50%', color: '#c8ebd0', background: 'rgba(119,188,135,0.14)', fontSize: '20px', fontWeight: '800' },
  exitoTexto: { color: '#d9f0de', fontWeight: '700', fontSize: '15px', margin: '0 0 8px' },
  exitoSub: { color: '#9aaea0', fontSize: '13px', margin: 0 },
  backNotice: { margin: '26px 0 0', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', fontSize: '12px' },
  backLink: { color: '#b9aaa1', fontWeight: '600', textDecorationColor: 'rgba(185,170,161,0.42)', textUnderlineOffset: '3px' },
}
