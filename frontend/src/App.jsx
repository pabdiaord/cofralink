import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login          from './pages/auth/Login'
import Registro       from './pages/auth/Registro'
import Hermanos       from './pages/hermanos/Hermanos'
import Eventos        from './pages/eventos/Eventos'
import Publicaciones  from './pages/publicaciones/Publicaciones'
import Inventario     from './pages/inventario/Inventario'
import Procesional    from './pages/procesional/Procesional'
import Comunicaciones from './pages/comunicaciones/Comunicaciones'
import Navbar         from './components/Navbar'

// Ruta protegida: redirige al login si no hay sesión
function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <p>Cargando...</p>
  return usuario ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route path="/" element={
          <RutaProtegida><Publicaciones /></RutaProtegida>
        }/>
        <Route path="/hermanos" element={
          <RutaProtegida><Hermanos /></RutaProtegida>
        }/>
        <Route path="/eventos" element={
          <RutaProtegida><Eventos /></RutaProtegida>
        }/>
        <Route path="/inventario" element={
          <RutaProtegida><Inventario /></RutaProtegida>
        }/>
        <Route path="/procesional" element={
          <RutaProtegida><Procesional /></RutaProtegida>
        }/>
        <Route path="/comunicaciones" element={
          <RutaProtegida><Comunicaciones /></RutaProtegida>
        }/>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}