import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const DARK  = '#2c1810'
const GOLD  = '#c9a84c'
const CREAM = '#f5f0e8'

export default function Publicaciones() {
  const { usuario } = useAuth()
  const [publicaciones, setPublicaciones] = useState([])
  const [cargando, setCargando]           = useState(true)
  const [error, setError]                 = useState('')

  // Modales
  const [modalCrear, setModalCrear]     = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null) // pub seleccionada
  const [editando, setEditando]         = useState(null)

  // Formularios
  const [form, setForm]         = useState({ titular: '', descripcion: '', imagen: null })
  const [formEdit, setFormEdit] = useState({ titular: '', descripcion: '' })
  const [enviando, setEnviando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // ── Cargar ────────────────────────────────────────────────────
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

  const recargar = async () => {
    const res = await api.get('/publicaciones/')
    setPublicaciones(res.data)
  }

  // ── Crear ─────────────────────────────────────────────────────
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
      setModalCrear(false)
      await recargar()
    } catch {
      setError('Error al crear la publicación.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Editar ────────────────────────────────────────────────────
  const abrirEdicion = (pub, e) => {
    e.stopPropagation() // evita abrir el detalle al pulsar Editar
    setEditando(pub)
    setFormEdit({ titular: pub.titular, descripcion: pub.descripcion })
  }

  const handleGuardarEdicion = async e => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.patch(`/publicaciones/${editando.id}/`, formEdit)
      setEditando(null)
      // Si el detalle estaba abierto con esa pub, actualizarlo
      if (modalDetalle?.id === editando.id) {
        setModalDetalle({ ...modalDetalle, ...formEdit })
      }
      await recargar()
    } catch {
      setError('Error al editar la publicación.')
    } finally {
      setGuardando(false)
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────
  const handleEliminar = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar esta publicación?')) return
    try {
      await api.delete(`/publicaciones/${id}/`)
      setPublicaciones(prev => prev.filter(p => p.id !== id))
      if (modalDetalle?.id === id) setModalDetalle(null)
    } catch {
      setError('Error al eliminar la publicación.')
    }
  }

  // ── URL imagen ────────────────────────────────────────────────
  const imgUrl = src =>
    src?.startsWith('http') ? src : `http://localhost:8000${src}`

  if (cargando) return <p style={ps.info}>Cargando publicaciones...</p>

  return (
    <div style={ps.page}>

      {/* ── Cabecera ── */}
      <div style={ps.header}>
        <h2 style={ps.titulo}>Noticias</h2>
        {usuario?.is_staff && (
          <button style={ps.btnPrimary} onClick={() => setModalCrear(true)}>
            + Nueva publicación
          </button>
        )}
      </div>

      {error && <p style={ps.error}>{error}</p>}

      {/* ── Lista de publicaciones ── */}
      {publicaciones.length === 0 ? (
        <p style={ps.info}>No hay publicaciones todavía.</p>
      ) : (
        <div style={ps.lista}>
          {publicaciones.map(pub => (
            <div
              key={pub.id}
              style={ps.card}
              onClick={() => setModalDetalle(pub)}
            >
              {pub.imagen && (
                <img
                  src={imgUrl(pub.imagen)}
                  alt={pub.titular}
                  style={ps.imagen}
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
              <div style={ps.cardBody}>
                <div style={ps.cardHeader}>
                  <h3 style={ps.cardTitulo}>{pub.titular}</h3>
                  <span style={ps.fecha}>
                    {new Date(pub.fecha).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Descripción recortada en la lista */}
                <p style={ps.descripcionPreview}>
                  {pub.descripcion.length > 160
                    ? pub.descripcion.slice(0, 160) + '…'
                    : pub.descripcion}
                </p>

                <div style={ps.cardFooter}>
                  <span style={ps.autor}>✍️ {pub.hermano_nombre}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={ps.leerMas}>Leer más →</span>
                    {usuario?.is_staff && (
                      <>
                        <button
                          style={ps.btnEditar}
                          onClick={e => abrirEdicion(pub, e)}
                        >
                          Editar
                        </button>
                        <button
                          style={ps.btnEliminar}
                          onClick={e => handleEliminar(pub.id, e)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ MODAL: Detalle de noticia ══ */}
      {modalDetalle && (
        <div style={ps.overlay} onClick={() => setModalDetalle(null)}>
          <div style={ps.modalDetalle} onClick={e => e.stopPropagation()}>

            {/* Imagen cabecera */}
            {modalDetalle.imagen && (
              <img
                src={imgUrl(modalDetalle.imagen)}
                alt={modalDetalle.titular}
                style={ps.detalleImagen}
                onError={e => { e.target.style.display = 'none' }}
              />
            )}

            <div style={ps.detalleBody}>
              {/* Cerrar */}
              <button style={ps.btnCerrar} onClick={() => setModalDetalle(null)}>
                ✕
              </button>

              {/* Fecha */}
              <p style={ps.detalleFecha}>
                {new Date(modalDetalle.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>

              {/* Titular */}
              <h2 style={ps.detalleTitulo}>{modalDetalle.titular}</h2>

              {/* Autor */}
              <p style={ps.detalleAutor}>✍️ {modalDetalle.hermano_nombre}</p>

              {/* Separador */}
              <div style={ps.separador} />

              {/* Contenido completo */}
              <p style={ps.detalleContenido}>{modalDetalle.descripcion}</p>

              {/* Acciones admin dentro del detalle */}
              {usuario?.is_staff && (
                <div style={ps.detalleAcciones}>
                  <button
                    style={ps.btnEditar}
                    onClick={e => { abrirEdicion(modalDetalle, e); setModalDetalle(null) }}
                  >
                    Editar
                  </button>
                  <button
                    style={ps.btnEliminar}
                    onClick={e => handleEliminar(modalDetalle.id, e)}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ══ MODAL: Crear publicación ══ */}
      {modalCrear && (
        <div style={ps.overlay} onClick={() => setModalCrear(false)}>
          <div style={ps.modal} onClick={e => e.stopPropagation()}>
            <div style={ps.modalHeader}>
              <h3 style={ps.modalTitulo}>Nueva publicación</h3>
              <button style={ps.btnCerrar} onClick={() => setModalCrear(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={ps.form}>
              <label style={ps.label}>Titular</label>
              <input
                style={ps.input} value={form.titular} required
                onChange={e => setForm({ ...form, titular: e.target.value })}
                placeholder="Título de la publicación"
              />

              <label style={ps.label}>Descripción</label>
              <textarea
                style={{ ...ps.input, height: '120px', resize: 'vertical' }}
                value={form.descripcion} required
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Contenido de la publicación..."
              />

              <label style={ps.label}>Imagen (opcional)</label>
              <input
                type="file" accept="image/*" style={ps.input}
                onChange={e => setForm({ ...form, imagen: e.target.files[0] })}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" disabled={enviando} style={ps.btnPrimary}>
                  {enviando ? 'Publicando...' : 'Publicar'}
                </button>
                <button
                  type="button" style={ps.btnCancelar}
                  onClick={() => setModalCrear(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Editar publicación ══ */}
      {editando && (
        <div style={ps.overlay} onClick={() => setEditando(null)}>
          <div style={ps.modal} onClick={e => e.stopPropagation()}>
            <div style={ps.modalHeader}>
              <h3 style={ps.modalTitulo}>Editar publicación</h3>
              <button style={ps.btnCerrar} onClick={() => setEditando(null)}>✕</button>
            </div>

            <form onSubmit={handleGuardarEdicion} style={ps.form}>
              <label style={ps.label}>Titular</label>
              <input
                style={ps.input} value={formEdit.titular} required
                onChange={e => setFormEdit({ ...formEdit, titular: e.target.value })}
              />

              <label style={ps.label}>Descripción</label>
              <textarea
                style={{ ...ps.input, height: '120px', resize: 'vertical' }}
                value={formEdit.descripcion} required
                onChange={e => setFormEdit({ ...formEdit, descripcion: e.target.value })}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" disabled={guardando} style={ps.btnPrimary}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button" style={ps.btnCancelar}
                  onClick={() => setEditando(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────
const ps = {
  page:    { padding: '28px 32px', maxWidth: '1110px', width: '100%', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titulo:  { fontSize: '22px', fontWeight: '700', color: DARK },
  info:    { textAlign: 'center', color: '#888', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '12px', fontSize: '14px' },

  // Lista
  lista: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,245,241,0.98))', borderRadius: '16px',
    boxShadow: '0 12px 24px rgba(44,24,16,0.06)',
    overflow: 'hidden', cursor: 'pointer',
    border: '1px solid rgba(117, 82, 52, 0.12)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  imagen:      { width: '100%', maxHeight: '240px', objectFit: 'cover' },
  cardBody:    { padding: '20px' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  cardTitulo:  { fontSize: '17px', fontWeight: '700', color: DARK, flex: 1 },
  fecha:       { fontSize: '12px', color: '#9a8866', whiteSpace: 'nowrap', marginLeft: '12px' },
  descripcionPreview: { fontSize: '14px', color: '#5a4a3a', lineHeight: '1.6', marginBottom: '14px' },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  autor:       { fontSize: '13px', color: '#9a8866' },
  leerMas:     { fontSize: '12px', color: GOLD, fontWeight: '600', cursor: 'pointer' },

  // Botones
  btnPrimary: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2c1810 0%, #4b2d1f 35%, #1d1823 100%)', color: 'white',
    border: 'none', borderRadius: '10px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '700', boxShadow: '0 8px 16px rgba(44, 24, 16, 0.17)',
  },
  btnEditar: {
    padding: '5px 12px', backgroundColor: 'transparent',
    color: '#2c1810', border: '1px solid rgba(44,24,16,0.7)',
    borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '700',
  },
  btnEliminar: {
    padding: '5px 12px', backgroundColor: 'transparent',
    color: '#b3261e', border: '1px solid rgba(179, 38, 30, 0.7)',
    borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '700',
  },
  btnCancelar: {
    padding: '10px 20px', backgroundColor: '#ece6da', color: DARK,
    border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
  },
  btnCerrar: {
    background: 'none', border: 'none', fontSize: '18px',
    cursor: 'pointer', color: '#9a8866', padding: '4px',
    lineHeight: 1,
  },

  // Overlay compartido
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(44,24,16,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },

  // Modal crear / editar
  modal: {
    background: 'white', borderRadius: '14px',
    width: '100%', maxWidth: '520px',
    boxShadow: '0 12px 40px rgba(44,24,16,0.25)',
    maxHeight: '90vh', overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px 0',
  },
  modalTitulo: { fontSize: '17px', fontWeight: '700', color: DARK, margin: 0 },
  form: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    padding: '16px 24px 24px',
  },
  label: { fontSize: '12px', fontWeight: '700', color: '#9a8866', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #e8e0d0', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit', color: DARK,
    backgroundColor: '#faf7f2',
  },

  // Modal detalle
  modalDetalle: {
    background: 'white', borderRadius: '14px',
    width: '100%', maxWidth: '680px',
    boxShadow: '0 12px 40px rgba(44,24,16,0.25)',
    maxHeight: '90vh', overflowY: 'auto',
  },
  detalleImagen: {
    width: '100%', maxHeight: '320px',
    objectFit: 'cover', borderRadius: '14px 14px 0 0',
  },
  detalleBody:    { padding: '28px 32px', position: 'relative' },
  detalleFecha:   { fontSize: '12px', color: GOLD, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' },
  detalleTitulo:  { fontSize: '26px', fontWeight: '700', color: DARK, margin: '0 0 10px', lineHeight: '1.3' },
  detalleAutor:   { fontSize: '13px', color: '#9a8866', marginBottom: '16px' },
  separador:      { height: '1px', backgroundColor: '#e8e0d0', marginBottom: '20px' },
  detalleContenido: { fontSize: '15px', color: '#3a2a1a', lineHeight: '1.8', whiteSpace: 'pre-wrap' },
  detalleAcciones:  { display: 'flex', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e8e0d0' },
}