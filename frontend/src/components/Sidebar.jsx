import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppIcon from './AppIcon'
import logo from '../assets/logo.png'
import nazareni from '../assets/nazareni.png'

const navItems = [
  { to: '/',                  icon: 'home',     label: 'Inicio' },
  { to: '/publicaciones',     icon: 'news',     label: 'Publicaciones' },
  { to: '/eventos',           icon: 'calendar', label: 'Eventos' },
  { to: '/procesional',       icon: 'document', label: 'Procesional' },
  { to: '/comunicaciones',    icon: 'chat',     label: 'Comunicaciones' },
  { to: '/donaciones',        icon: 'coin',     label: 'Donaciones' },
  { to: '/solicitud-ingreso', icon: 'request',  label: 'Solicitud de ingreso' },
]

const adminItems = [
  { to: '/hermanos',   icon: 'people',    label: 'Hermanos' },
  { to: '/inventario', icon: 'inventory', label: 'Inventario' },
]

function SidebarLink({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => `sidebar-nav-link${isActive ? ' sidebar-nav-link--active' : ''}`}
      onClick={onClick}
    >
      <span className="sidebar-nav-icon"><AppIcon name={item.icon} size={18} /></span>
      <span className="sidebar-nav-text">{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar({ abierto, onClose }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    onClose()
    logout()
    navigate('/login')
  }

  return (
    <aside
      id="main-navigation"
      className={`app-sidebar ${abierto ? 'app-sidebar--open' : ''}`}
      aria-label="Navegación principal"
    >
      <div className="sidebar-brand">
        <img src={logo} alt="CofraLink" className="sidebar-brand-logo" />
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">
          ×
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Principal</p>
        <div className="sidebar-link-group">
          {navItems.map(item => <SidebarLink key={item.to} item={item} onClick={onClose} />)}
        </div>

        {usuario?.is_staff && (
          <>
            <p className="sidebar-section-label sidebar-section-label--spaced">Junta de Gobierno</p>
            <div className="sidebar-link-group">
              {adminItems.map(item => <SidebarLink key={item.to} item={item} onClick={onClose} />)}
            </div>
          </>
        )}
      </nav>

      <footer className="sidebar-footer">
        <NavLink
          to="/perfil"
          className={({ isActive }) => `sidebar-profile${isActive ? ' sidebar-profile--active' : ''}`}
          onClick={onClose}
        >
          <img src={nazareni} alt="" className="sidebar-profile-avatar" />
          <span className="sidebar-profile-copy">
            <span className="sidebar-profile-email">{usuario?.email}</span>
            <span className="sidebar-profile-role">
              {usuario?.is_staff ? 'Junta de Gobierno' : 'Hermano'}
            </span>
          </span>
          <span className="sidebar-profile-arrow" aria-hidden="true">›</span>
        </NavLink>

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <AppIcon name="logout" size={17} />
          <span>Cerrar sesión</span>
        </button>
      </footer>
    </aside>
  )
}
