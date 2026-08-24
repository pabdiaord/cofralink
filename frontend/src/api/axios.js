import axios from 'axios'

const api = axios.create({
  // En producción se recomienda publicar el frontend y /api en el mismo
  // origen. VITE_API_URL es pública: nunca debe contener secretos.
  baseURL: import.meta.env.VITE_API_URL || (
    import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'
  ),
})

// Añade el token JWT automáticamente a todas las peticiones
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expira (401), limpia la sesión
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
