import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function Publicaciones() {
  const { usuario } = useAuth()
  const [publicaciones, setPublicaciones] = useState([])
  const [cargando, setCargando]           = useState(true)
  const [error, setError]                 = useState('')
  const [mostrarForm, setMostrarForm]     = useState(false)
  const [form, setForm] = useState({ titular: '', descripcion: '', imagen: null })
  const [enviando, setEnviando]           = useState(false)

  // ── Cargar publicaciones ──────────────────────────────────────────
  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        const res = await api.get('/publicaciones/')
        if (activo) setPublicaciones(res.data)
      } catch {
        if (activo) setError('No se pudieron cargar las publicaciones.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  // ── Crear publicación ─────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    setEnviando(true)
    try {
      const data = new FormData()
      data.append('titular',     form.titular)
      data.append('descripcion', form.descripcion)
      if (form.imagen) data.append('imagen', form.imagen)

      await api.post('/publicaciones/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm({ titular: '', descripcion: '', imagen: null })
      setMostrarForm(false)
      // Recargar lista
      const res = await api.get('/publicaciones/')
      setPublicaciones(res.data)
    } catch {
      setError('Error al crear la publicación.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Eliminar publicación ──────────────────────────────────────────
  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    try {
      await api.delete(`/publicaciones/${id}/`)
      setPublicaciones(prev => prev.filter(p => p.id !== id))
    } catch {
      setError('Error al eliminar la publicación.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  if (cargando) return <p style={styles.info}>Cargando publicaciones...</p>

  return (
    <div style={styles.page}>

      {/* Cabecera */}
      <div style={styles.header}>
        <h2 style={styles.titulo}>Publicaciones</h2>
        {usuario?.is_staff && (
          <button
            style={styles.btnPrimary}
            onClick={() => setMostrarForm(!mostrarForm)}
          >
            {mostrarForm ? 'Cancelar' : '+ Nueva publicación'}
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Formulario nueva publicación (solo admin) */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitulo}>Nueva publicación</h3>

          <label style={styles.label}>Titular</label>
          <input
            style={styles.input}
            value={form.titular}
            onChange={e => setForm({ ...form, titular: e.target.value })}
            required
            placeholder="Título de la publicación"
          />

          <label style={styles.label}>Descripción</label>
          <textarea
            style={{ ...styles.input, height: '100px', resize: 'vertical' }}
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            required
            placeholder="Contenido de la publicación..."
          />

          <label style={styles.label}>Imagen (opcional)</label>
          <input
            type="file" accept="image/*"
            style={styles.input}
            onChange={e => setForm({ ...form, imagen: e.target.files[0] })}
          />

          <button type="submit" disabled={enviando} style={styles.btnPrimary}>
            {enviando ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      )}

      {/* Lista de publicaciones */}
      {publicaciones.length === 0 ? (
        <p style={styles.info}>No hay publicaciones todavía.</p>
      ) : (
        <div style={styles.lista}>
          {publicaciones.map(pub => (
            <div key={pub.id} style={styles.card}>

              {pub.imagen && (
                <img
                  src={`http://localhost:8000${pub.imagen}`}
                  alt={pub.titular}
                  style={styles.imagen}
                />
              )}

              <div style={styles.cardBody}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitulo}>{pub.titular}</h3>
                  <span style={styles.fecha}>
                    {new Date(pub.fecha).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>

                <p style={styles.descripcion}>{pub.descripcion}</p>

                <div style={styles.cardFooter}>
                  <span style={styles.autor}>✍️ {pub.hermano_nombre}</span>
                  {usuario?.is_staff && (
                    <button
                      style={styles.btnEliminar}
                      onClick={() => handleEliminar(pub.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page:    { padding: '24px', maxWidth: '800px', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },
  form: {
    background: 'white', borderRadius: '10px',
    padding: '24px', marginBottom: '28px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formTitulo: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  label:  { fontSize: '13px', fontWeight: '600', color: '#444' },
  input: {
    padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    padding: '10px 20px', backgroundColor: '#1a1a2e',
    color: 'white', border: 'none', borderRadius: '8px',
    fontSize: '14px', cursor: 'pointer', fontWeight: '600',
    alignSelf: 'flex-start',
  },
  btnEliminar: {
    padding: '6px 14px', backgroundColor: 'transparent',
    color: '#e53e3e', border: '1px solid #e53e3e',
    borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
  },
  lista:       { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    background: 'white', borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  imagen:      { width: '100%', maxHeight: '260px', objectFit: 'cover' },
  cardBody:    { padding: '20px' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  cardTitulo:  { fontSize: '17px', fontWeight: '700', color: '#1a1a2e', flex: 1 },
  fecha:       { fontSize: '12px', color: '#888', whiteSpace: 'nowrap', marginLeft: '12px' },
  descripcion: { fontSize: '14px', color: '#444', lineHeight: '1.6', marginBottom: '16px' },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  autor:       { fontSize: '13px', color: '#666' },
}