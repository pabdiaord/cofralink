import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout        from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Home          from './pages/home/Home'
import Login          from './pages/auth/Login'
import Hermanos       from './pages/hermanos/Hermanos'
import Eventos        from './pages/eventos/Eventos'
import Publicaciones  from './pages/publicaciones/Publicaciones'
import Inventario     from './pages/inventario/Inventario'
import Procesional    from './pages/procesional/Procesional'
import Comunicaciones from './pages/comunicaciones/Comunicaciones'
import Navbar         from './components/Navbar'
import Perfil from './pages/perfil/Perfil'
import SolicitudIngreso from './pages/solicitud/SolicitudIngreso'
import Error404 from './pages/error/Error404'
import CambiarPassword from './pages/auth/CambiarPassword'



// Ruta protegida: redirige al login si no hay sesión
function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <p style={{ padding: '40px', textAlign: 'center' }}>Cargando...</p>
  return usuario ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />

      <Route path="/" element={
        <RutaProtegida><Home /></RutaProtegida>
      }/>
      <Route path="/publicaciones" element={
        <RutaProtegida><Publicaciones /></RutaProtegida>
      }/>
      <Route path="/eventos" element={
        <RutaProtegida><Eventos /></RutaProtegida>
      }/>
      <Route path="/hermanos" element={
        <RutaProtegida><Hermanos /></RutaProtegida>
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
      <Route path="/perfil" element={
        <RutaProtegida><Perfil /></RutaProtegida>
      }/>
      <Route path="/solicitud-ingreso" element={
        <RutaProtegida><SolicitudIngreso /></RutaProtegida>
      }/>
      
      {/* Ruta catch-all para 404 */}
      <Route path="*" element={<Error404 />} />
      <Route path="/cambiar-password/:uid/:token" element={<CambiarPassword />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}