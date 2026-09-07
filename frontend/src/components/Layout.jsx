import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setMenuAbierto(false)
    }
    window.addEventListener('keydown', cerrarConEscape)
    return () => window.removeEventListener('keydown', cerrarConEscape)
  }, [])

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--app-background)' }}>
      <button
        type="button"
        className="menu-toggle"
        aria-label={menuAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
        aria-controls="main-navigation"
        aria-expanded={menuAbierto}
        onClick={() => setMenuAbierto(abierto => !abierto)}
      >
        <span aria-hidden="true">☰</span>
        <span>Menú</span>
      </button>
      <Sidebar abierto={menuAbierto} onClose={() => setMenuAbierto(false)} />
      <button
        type="button"
        className={`sidebar-backdrop ${menuAbierto ? 'sidebar-backdrop--visible' : ''}`}
        aria-label="Cerrar menú"
        tabIndex={menuAbierto ? 0 : -1}
        onClick={() => setMenuAbierto(false)}
      />
      <main className="app-main" style={{
        marginLeft: '240px',
        flex: 1,
        minWidth: 0,
        minHeight: '100vh',
        backgroundColor: 'var(--app-background)',
        overflowY: 'auto',
      }}>
        {children}
      </main>
    </div>
  )
}
