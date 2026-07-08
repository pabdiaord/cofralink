import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'

export default function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: ''
  })
  const [error, setError]     = useState('')
  const [cargando, setCargando] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setCargando(true)
    try {
      await api.post('/auth/registro/', form)
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      const msg  = data ? Object.values(data).flat().join(' ') : 'Error al registrarse.'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>⛪ CofraLink</h1>
        <p style={styles.subtitle}>Crea tu cuenta</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Nombre de usuario</label>
          <input
            name="username" value={form.username}
            onChange={handleChange} required style={styles.input}
            placeholder="pablogomez"
          />

          <label style={styles.label}>Email</label>
          <input
            name="email" type="email" value={form.email}
            onChange={handleChange} required style={styles.input}
            placeholder="hermano@cofralink.com"
          />

          <label style={styles.label}>Contraseña</label>
          <input
            name="password" type="password" value={form.password}
            onChange={handleChange} required style={styles.input}
            placeholder="••••••••"
          />

          <label style={styles.label}>Repetir contraseña</label>
          <input
            name="password2" type="password" value={form.password2}
            onChange={handleChange} required style={styles.input}
            placeholder="••••••••"
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={cargando} style={styles.btn}>
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p style={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={styles.link}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  card: {
    background: 'white', borderRadius: '12px',
    padding: '40px', width: '100%', maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title:    { textAlign: 'center', fontSize: '26px', marginBottom: '6px', color: '#1a1a2e' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: '28px', fontSize: '14px' },
  form:     { display: 'flex', flexDirection: 'column', gap: '12px' },
  label:    { fontSize: '13px', fontWeight: '600', color: '#333' },
  input: {
    padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', outline: 'none',
  },
  error:  { color: '#e53e3e', fontSize: '13px', textAlign: 'center' },
  btn: {
    marginTop: '8px', padding: '12px',
    backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '8px',
    fontSize: '15px', cursor: 'pointer', fontWeight: '600',
  },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' },
  link:   { color: '#1a1a2e', fontWeight: '600' },
}