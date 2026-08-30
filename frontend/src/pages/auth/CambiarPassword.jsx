import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import logo   from '../../assets/logo.png'
import escudo from '../../assets/escudo.png'

const DARK = '#2c1810'
const GOLD = '#c9a84c'
const CREAM = '#f5f0e8'

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
        <div style={cs.rightInner}>

          <div style={cs.logoWrap}>
            <div style={cs.logoBox}>
              <img src={logo} alt="CofraLink" style={cs.logoImg} />
            </div>
            <h1 style={cs.appName}>CofraLink</h1>
            <p style={cs.appSub}>CAMBIO DE CONTRASEÑA</p>
          </div>

          <div style={cs.accesoRow}>
            <div style={cs.lineaGris} />
            <span style={cs.accesoLabel}>NUEVA CONTRASEÑA</span>
            <div style={cs.lineaGris} />
          </div>

          {exito ? (
            <div style={cs.exitoBox}>
              <p style={cs.exitoTexto}>✅ {exito}</p>
              <p style={cs.exitoSub}>Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={cs.form}>
              <div style={cs.campo}>
                <label style={cs.label}>NUEVA CONTRASEÑA</label>
                <input
                  type="password" value={form.password1} required
                  style={cs.input} placeholder="Mínimo 12 caracteres"
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
                <label style={cs.label}>CONFIRMAR CONTRASEÑA</label>
                <input
                  type="password" value={form.password2} required
                  style={cs.input} placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  onChange={e => setForm({ ...form, password2: e.target.value })}
                />
              </div>

              {error && <p style={cs.error}>{error}</p>}

              <button type="submit" disabled={cargando} style={cs.btnSubmit}>
                {cargando ? 'GUARDANDO...' : 'ESTABLECER NUEVA CONTRASEÑA'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

const cs = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  left: {
    width: '50%', flexShrink: 0,
    background: 'radial-gradient(ellipse at 30% 40%, #4a2c1a 0%, #2c1810 40%, #150c08 100%)',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', alignItems: 'center',
    padding: '48px 40px 28px',
  },
  leftInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', flex: 1, justifyContent: 'center' },
  fundacion: { display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center' },
  lineaOro: { flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.4)', maxWidth: '80px' },
  fundText: { fontSize: '11px', fontWeight: '700', color: GOLD, letterSpacing: '0.18em' },
  escudo: { width: '180px', height: '180px', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' },
  hermandadInfo: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  hermandadLabel: { fontSize: '10px', color: 'rgba(201,168,76,0.7)', letterSpacing: '0.2em', margin: 0 },
  hermandadNombre: { color: 'white', fontSize: '32px', fontWeight: '700', margin: 0, lineHeight: '1.2', textAlign: 'center', fontFamily: 'Georgia, serif' },
  separador: { display: 'flex', alignItems: 'center', gap: '10px', width: '120px' },
  lineaOroFina: { flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.5)' },
  cruz: { color: GOLD, fontSize: '14px', fontWeight: '300' },
  lema: { fontSize: '13px', fontWeight: '700', color: GOLD, letterSpacing: '0.25em', margin: 0 },
  right: { flex: 1, backgroundColor: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  rightInner: { width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '20px' },
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  logoBox: { width: '64px', height: '64px', borderRadius: '16px', backgroundColor: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(44,24,16,0.25)' },
  logoImg: { width: '44px', height: '44px', objectFit: 'contain' },
  appName: { fontSize: '24px', fontWeight: '700', color: DARK, margin: 0, fontFamily: 'Georgia, serif' },
  appSub: { fontSize: '10px', fontWeight: '700', color: GOLD, letterSpacing: '0.15em', margin: 0 },
  accesoRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  lineaGris: { flex: 1, height: '1px', backgroundColor: '#d8cfc4' },
  accesoLabel: { fontSize: '10px', fontWeight: '700', color: '#9a8866', letterSpacing: '0.15em', whiteSpace: 'nowrap' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', fontWeight: '700', color: '#9a8866', letterSpacing: '0.12em' },
  input: { padding: '12px 14px', borderRadius: '8px', border: '1px solid #d8cfc4', fontSize: '14px', outline: 'none', backgroundColor: 'white', color: DARK, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  requisitos: { fontSize: '11px', color: '#746653', margin: '2px 0 0', lineHeight: '1.4' },
  listaErrores: { fontSize: '12px', color: '#c0392b', margin: '0', paddingLeft: '18px', lineHeight: '1.45' },
  error: { fontSize: '12px', color: '#c0392b', textAlign: 'center', margin: 0 },
  btnSubmit: { padding: '14px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '700', letterSpacing: '0.1em', marginTop: '4px' },
  exitoBox: { textAlign: 'center', padding: '24px', backgroundColor: '#f0fff4', borderRadius: '12px', border: '1px solid #c6f6d5' },
  exitoTexto: { color: '#2d7a45', fontWeight: '700', fontSize: '15px', margin: '0 0 8px' },
  exitoSub: { color: '#9a8866', fontSize: '13px', margin: 0 },
}
