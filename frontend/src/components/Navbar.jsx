import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!usuario) return null

  return (
    <nav style={styles.nav}>
      <span style={styles.logo}>⛪ CofraLink</span>
      <div style={styles.links}>
        <Link to="/"               style={styles.link}>Publicaciones</Link>
        <Link to="/eventos"        style={styles.link}>Eventos</Link>
        <Link to="/procesional"    style={styles.link}>Procesional</Link>
        <Link to="/comunicaciones" style={styles.link}>Comunicaciones</Link>
        {usuario.is_staff && (
          <>
            <Link to="/hermanos"   style={styles.link}>Hermanos</Link>
            <Link to="/inventario" style={styles.link}>Inventario</Link>
          </>
        )}
      </div>
      <button onClick={handleLogout} style={styles.btn}>Cerrar sesión</button>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: '56px',
    backgroundColor: '#1a1a2e', color: 'white',
  },
  logo:  { fontWeight: '700', fontSize: '18px', color: 'white' },
  links: { display: 'flex', gap: '20px' },
  link:  { color: '#ccc', textDecoration: 'none', fontSize: '14px' },
  btn: {
    background: 'transparent', border: '1px solid #ccc',
    color: '#ccc', padding: '6px 14px', borderRadius: '6px',
    cursor: 'pointer', fontSize: '13px',
  },
}