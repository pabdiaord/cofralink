import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import nazareni from '../assets/nazareni.png'
import sidebarBg from '../assets/sidebar.jpg'

const GOLD  = '#c9a84c'
const DARK  = '#2c1810'
const CREAM = '#5c4033 '

const navItems = [
  { to: '/',              icon: '🛖',  label: 'Inicio' },
  { to: '/publicaciones', icon: '📰', label: 'Noticias' },
  { to: '/eventos',       icon: '📅', label: 'Calendario' },
  { to: '/procesional',   icon: '⛪', label: 'Papeleta de sitio' },
  { to: '/comunicaciones',icon: '💬', label: 'Chat' },
  { to: '/donaciones',     icon: '🪙', label: 'Donaciones' },
  { to: '/solicitud-ingreso', icon: '📄', label: 'Solicitud ingreso' },
]

const adminItems = [
  { to: '/hermanos',   icon: '👥', label: 'Hermanos' },
  { to: '/inventario', icon: '📦', label: 'Inventario' },
]

export default function Sidebar({ abierto, onClose }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [hoveredItem, setHoveredItem] = React.useState(null)
  const [hoveredLogout, setHoveredLogout] = React.useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkStyle = (item) => ({ isActive }) => {
    const isHovered = hoveredItem === item.to
    return {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 14px', borderRadius: '14px', margin: '4px 0',
      textDecoration: 'none', fontSize: '16px', fontWeight: '600',
      color: isActive ? '#fff8ee' : '#e9ddd1',
      background: isActive || isHovered
        ? 'linear-gradient(135deg, #2c1810, #563522)'
        : 'rgba(255,255,255,0.04)',
      border: isActive || isHovered
        ? '1px solid rgba(201,168,76,0.45)'
        : '1px solid rgba(255,255,255,0.04)',
      boxShadow: isActive || isHovered ? '0 12px 24px rgba(0,0,0,0.20)' : 'none',
      transition: 'all 0.2s ease',
      letterSpacing: '0.01em',
      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      cursor: 'pointer',
    }
  }

  const profileCardStyle = ({ isActive }) => {
    const isHovered = hoveredItem === '/perfil'
    return {
      ...ss.profileCard,
      background: isActive || isHovered
        ? 'linear-gradient(135deg, #2c1810, #563522)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(201,168,76,0.08))',
      border: isActive || isHovered ? '1px solid rgba(201,168,76,0.45)' : '1px solid rgba(201,168,76,0.18)',
      boxShadow: isActive || isHovered ? '0 12px 24px rgba(0,0,0,0.20)' : '0 10px 24px rgba(0,0,0,0.12)',
      transition: 'all 0.2s ease',
      color: '#f2e7d8',
      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      cursor: 'pointer',
    }
  }

  return (
    <aside
      id="main-navigation"
      className={`app-sidebar ${abierto ? 'app-sidebar--open' : ''}`}
      aria-label="Navegación principal"
      style={ss.sidebar}
    >
      {/* Logo */}
      <div style={ss.logo}>
        <img src={logo} alt="CofraLink" style={ss.logoImg} />
      </div>

      {/* Navegación principal */}
      <nav style={ss.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={linkStyle(item)}
            onClick={onClose}
            onMouseEnter={() => setHoveredItem(item.to)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span style={ss.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Sección admin */}
        {usuario?.is_staff && (
          <>
            <div style={ss.seccion}>JUNTA DE GOBIERNO</div>
            {adminItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={linkStyle(item)}
                onClick={onClose}
                onMouseEnter={() => setHoveredItem(item.to)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span style={ss.icon}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer del sidebar */}
      <div style={ss.footer}>
        <NavLink
          to="/perfil"
          style={profileCardStyle}
          onClick={onClose}
          onMouseEnter={() => setHoveredItem('/perfil')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <img src={nazareni} alt="Avatar del usuario" style={ss.userAvatar} />
          <div style={ss.userTexts}>
            <div style={ss.userEmail}>{usuario?.email}</div>
            <div style={ss.userRol}>
              {usuario?.is_staff ? 'Junta de Gobierno' : 'Hermano'}
            </div>
          </div>
        </NavLink>
        <button
          style={hoveredLogout ? { ...ss.btnLogout, ...logoutButtonHover } : ss.btnLogout}
          onClick={handleLogout}
          onMouseEnter={() => setHoveredLogout(true)}
          onMouseLeave={() => setHoveredLogout(false)}
        >
          ↪ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

const logoutButtonHover = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(219,87,76,0.12))',
  border: '1px solid rgba(219,87,76,0.38)',
  boxShadow: '0 0 0 1px rgba(219,87,76,0.12), 0 10px 22px rgba(219,87,76,0.12)',
  transform: 'translateY(-1px)',
}

const ss = {
  sidebar: {
    width: '240px',
    flexShrink: 0,
    height: '100vh',
    background: `linear-gradient(180deg, rgba(17,12,9,0.92), rgba(35,21,18,0.76)), url(${sidebarBg}) center/cover no-repeat`,
    borderRight: '1px solid rgba(201,168,76,0.22)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 50,
    padding: '0 14px 14px',
    boxShadow: '18px 0 36px rgba(0,0,0,0.18)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 18px 22px',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(201,168,76,0.22)',
  },
  logoImg: {
    width: '100px',
    height: '100px',
    objectFit: 'contain',
    display: 'block',
    filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.18))',
  },
  logoText: { fontSize: '17px', fontWeight: '700', color: DARK },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 6px 10px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.6) transparent',
  },
  icon: { fontSize: '16px', width: '20px', textAlign: 'center', color: '#e8d7ba' },
  seccion: {
    fontSize: '12px', fontWeight: '700', color: '#d4b87b',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '18px 14px 8px',
  },
  footer: {
    borderTop: '1px solid rgba(201,168,76,0.22)',
    padding: '12px 8px 0',
  },
  profileCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 12px', borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(201,168,76,0.08))',
    border: '1px solid rgba(201,168,76,0.18)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    marginBottom: '10px',
    textDecoration: 'none',
  },
  userAvatar: {
    width: '38px', height: '38px', borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
    flexShrink: 0,
    border: '2px solid rgba(201, 168, 76, 0.95)',
    boxShadow: '0 0 0 2px rgba(0,0,0,0.18)',
  },
  userTexts: { flex: 1, minWidth: 0 },
  userEmail: {
    fontSize: '13px', fontWeight: '700', color: '#f2e7d8',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  userRol: { fontSize: '12px', color: '#d0bc8a', marginTop: '2px' },
  btnLogout: {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
    fontSize: '15px', color: '#f1e7d8', fontWeight: '600',
    textAlign: 'left', borderRadius: '12px',
    display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: 'none',
  },
  scrollBar: {
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255,255,255,0.7)',
      borderRadius: '999px',
    },
  },
}
