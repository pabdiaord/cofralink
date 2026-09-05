import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchField from '../../components/SearchField'
import AppIcon from '../../components/AppIcon'
import Pagination, { getPageData } from '../../components/Pagination'
import { coincideBusqueda } from '../../utils/search'

const DARK  = '#2c1810'
const GOLD  = '#c9a84c'
const CREAM = '#f5f0e8'

export default function Publicaciones() {
  const { usuario } = useAuth()
  const [publicaciones, setPublicaciones] = useState([])
  const [busqueda, setBusqueda]           = useState('')
  const [paginaActual, setPaginaActual]   = useState(1)
  const [cargando, setCargando]           = useState(true)
  const [error, setError]                 = useState('')

  // Modales
  const [modalCrear, setModalCrear]     = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null) // pub seleccionada
  const [editando, setEditando]         = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // Formularios
  const [form, setForm]         = useState({ titular: '', descripcion: '', imagen: null })
  const [formEdit, setFormEdit] = useState({ titular: '', descripcion: '', imagen: null })
  const [imagenEditPreview, setImagenEditPreview] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => () => {
    if (imagenEditPreview.startsWith('blob:')) URL.revokeObjectURL(imagenEditPreview)
  }, [imagenEditPreview])

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
  const openConfirm = (action, payload = null) => {
    setPendingAction({ action, payload })
    setConfirmOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    const { action, payload } = pendingAction
    setConfirmOpen(false)

    if (action === 'create-publicacion') {
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

    if (action === 'edit-publicacion') {
      setGuardando(true)
      try {
        const data = new FormData()
        data.append('titular', payload.data.titular)
        data.append('descripcion', payload.data.descripcion)
        if (payload.data.imagen) data.append('imagen', payload.data.imagen)

        const res = await api.patch(`/publicaciones/${payload.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        cerrarEdicion()
        if (modalDetalle?.id === payload.id) {
          setModalDetalle(res.data)
        }
        await recargar()
      } catch {
        setError('Error al editar la publicación.')
      } finally {
        setGuardando(false)
      }
    }

    if (action === 'delete-publicacion') {
      try {
        await api.delete(`/publicaciones/${payload}/`)
        setPublicaciones(prev => prev.filter(p => p.id !== payload))
        if (modalDetalle?.id === payload) setModalDetalle(null)
      } catch {
        setError('Error al eliminar la publicación.')
      }
    }

    setPendingAction(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    openConfirm('create-publicacion')
  }

  // ── Editar ────────────────────────────────────────────────────
  const abrirEdicion = (pub, e) => {
    e.stopPropagation() // evita abrir el detalle al pulsar Editar
    setEditando(pub)
    setFormEdit({ titular: pub.titular, descripcion: pub.descripcion, imagen: null })
    setImagenEditPreview(pub.imagen ? imgUrl(pub.imagen) : '')
  }

  const handleImagenEditChange = e => {
    const imagen = e.target.files?.[0] || null
    setFormEdit(prev => ({ ...prev, imagen }))
    setImagenEditPreview(imagen ? URL.createObjectURL(imagen) : (editando?.imagen ? imgUrl(editando.imagen) : ''))
  }

  const handleGuardarEdicion = async e => {
    e.preventDefault()
    openConfirm('edit-publicacion', { id: editando.id, data: formEdit })
  }

  // ── Eliminar ──────────────────────────────────────────────────
  const handleEliminar = async (id, e) => {
    e.stopPropagation()
    openConfirm('delete-publicacion', id)
  }

  // ── URL imagen ────────────────────────────────────────────────
  const imgUrl = src =>
    src?.startsWith('http') ? src : `http://localhost:8000${src}`

  const cerrarEdicion = () => {
    setEditando(null)
    setImagenEditPreview('')
  }

  const publicacionesFiltradas = publicaciones.filter(publicacion => (
    coincideBusqueda(busqueda, publicacion.titular, publicacion.descripcion, publicacion.hermano_nombre)
  ))
  const { currentPage, pageItems: publicacionesPaginadas } = getPageData(publicacionesFiltradas, paginaActual, 5)

  if (cargando) return <p style={ps.info}>Cargando publicaciones...</p>

  return (
    <div className="content-page publicaciones-page" style={ps.page}>

      {/* ── Cabecera ── */}
      <div className="page-header" style={ps.header}>
        <div>
          <p style={ps.eyebrow}>Diario de la Hermandad</p>
          <h2 style={ps.titulo}>Noticias y publicaciones</h2>
        </div>
        {usuario?.is_staff && (
          <button style={ps.btnPrimary} onClick={() => setModalCrear(true)}>
            + Nueva publicación
          </button>
        )}
      </div>

      {error && <p style={ps.error}>{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction?.action === 'delete-publicacion' ? 'Eliminar publicación' : pendingAction?.action === 'create-publicacion' ? 'Crear publicación' : 'Guardar cambios'}
        message={pendingAction?.action === 'delete-publicacion'
          ? '¿Seguro que quieres eliminar esta publicación?'
          : pendingAction?.action === 'create-publicacion'
            ? '¿Quieres publicar esta noticia con el contenido actual?'
            : '¿Deseas guardar los cambios de esta publicación?'}
        confirmText={pendingAction?.action === 'delete-publicacion' ? 'Eliminar' : 'Confirmar'}
        danger={pendingAction?.action === 'delete-publicacion'}
        onConfirm={executePendingAction}
        onCancel={() => { setConfirmOpen(false); setPendingAction(null) }}
      />

      <div className="publication-layout" style={ps.layout}>
        <main style={ps.feedColumn}>

          {publicaciones.length === 0 ? (
            <p style={ps.info}>No hay publicaciones todavía.</p>
          ) : publicacionesFiltradas.length === 0 ? (
            <p style={ps.info}>No se han encontrado publicaciones con esa búsqueda.</p>
          ) : (
            <div className="publication-list" style={ps.lista}>
              {publicacionesPaginadas.map((pub, index) => {
                const esDestacada = currentPage === 1 && index === 0 && Boolean(pub.imagen)
                const descripcion = pub.descripcion || 'Consulta esta publicación para conocer todos los detalles.'

                return (
                  <article
                    key={pub.id}
                    className={`publication-card${esDestacada ? ' publication-card--featured' : ''}`}
                    style={{ ...ps.card, ...(esDestacada ? ps.cardDestacada : {}) }}
                    onClick={() => setModalDetalle(pub)}
                  >
                    {pub.imagen && (
                      <img
                        src={imgUrl(pub.imagen)}
                        alt={pub.titular}
                        style={esDestacada ? ps.imagenDestacada : ps.imagen}
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    )}
                    <div style={ps.cardBody}>
                      <div style={ps.postHeader}>
                        <span aria-hidden="true" style={ps.avatar}><AppIcon name="news" size={18} /></span>
                        <div>
                          <p style={ps.autor}>{pub.hermano_nombre || 'Hermandad del Perdón'}</p>
                          <p style={ps.metaPublicacion}>
                            {new Date(pub.fecha).toLocaleDateString('es-ES', {
                              day: '2-digit', month: 'long', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <h3 style={ps.cardTitulo}>{pub.titular}</h3>

                      <p style={ps.descripcionPreview}>
                        {descripcion.length > 190 ? `${descripcion.slice(0, 190)}…` : descripcion}
                      </p>

                      <div style={ps.cardFooter}>
                        <span style={ps.leerMas}>Leer publicación <span aria-hidden="true">→</span></span>
                        {usuario?.is_staff && (
                          <div style={ps.adminActions}>
                            <button
                              className="action-button action-button--edit"
                              onClick={e => abrirEdicion(pub, e)}
                            >
                              Editar
                            </button>
                            <button
                              className="action-button action-button--danger"
                              onClick={e => handleEliminar(pub.id, e)}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalItems={publicacionesFiltradas.length}
            onPageChange={setPaginaActual}
            itemLabel="publicaciones"
            pageSize={5}
          />
        </main>

        <aside className="publication-sidebar" style={ps.sidebar}>
          <p style={ps.sidebarEyebrow}>Explora el archivo</p>
          <h3 style={ps.sidebarTitle}>Toda la actualidad</h3>
          <p style={ps.sidebarText}>Busca comunicados, cultos y avisos de la Hermandad.</p>
          <SearchField
            value={busqueda}
            onChange={valor => { setBusqueda(valor); setPaginaActual(1) }}
            placeholder="Buscar publicaciones"
            ariaLabel="Buscar publicaciones"
            style={ps.search}
          />
          <div style={ps.sidebarStat}>
            <span aria-hidden="true" style={ps.sidebarStatIcon}><AppIcon name="news" size={20} /></span>
            <div>
              <strong style={ps.sidebarStatValue}>{publicaciones.length}</strong>
              <span style={ps.sidebarStatLabel}>publicaciones disponibles</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ══ MODAL: Detalle de noticia ══ */}
      {modalDetalle && (
        <div style={ps.overlay} onClick={() => setModalDetalle(null)}>
          <div className="responsive-modal publication-detail" style={ps.modalDetalle} onClick={e => e.stopPropagation()}>

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
                    className="action-button action-button--edit"
                    onClick={e => { abrirEdicion(modalDetalle, e); setModalDetalle(null) }}
                  >
                    Editar
                  </button>
                  <button
                    className="action-button action-button--danger"
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
          <div className="responsive-modal" style={ps.modal} onClick={e => e.stopPropagation()}>
            <div style={ps.modalHeader}>
              <h3 style={ps.modalTitulo}>Nueva publicación</h3>
              <button style={ps.btnCerrar} onClick={() => setModalCrear(false)}>✕</button>
            </div>

            <form className="data-form" onSubmit={handleSubmit} style={ps.form}>
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
        <div style={ps.overlay} onClick={cerrarEdicion}>
          <div className="responsive-modal" style={ps.modal} onClick={e => e.stopPropagation()}>
            <div style={ps.modalHeader}>
              <h3 style={ps.modalTitulo}>Editar publicación</h3>
              <button style={ps.btnCerrar} onClick={cerrarEdicion}>✕</button>
            </div>

            <form className="data-form" onSubmit={handleGuardarEdicion} style={ps.form}>
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

              <label style={ps.label}>Imagen de la publicación</label>
              <div style={ps.imageEditBox}>
                {imagenEditPreview ? (
                  <img
                    src={imagenEditPreview}
                    alt="Previsualización de la imagen de la publicación"
                    style={ps.imageEditPreview}
                  />
                ) : (
                  <div style={ps.imageEditEmpty}>
                    <AppIcon name="news" size={22} />
                    <span>Esta publicación no tiene imagen</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={ps.input}
                  onChange={handleImagenEditChange}
                />
                <p style={ps.imageEditHelp}>
                  Selecciona una imagen solo si quieres sustituir la actual.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" disabled={guardando} style={ps.btnPrimary}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button" style={ps.btnCancelar}
                  onClick={cerrarEdicion}
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
  page:    { padding: '28px 32px', maxWidth: '1240px', width: '100%', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '28px' },
  eyebrow: { margin: '0 0 3px', color: '#95713a', fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase' },
  titulo:  { fontSize: '30px', fontWeight: '700', color: DARK, margin: 0 },
  intro:   { margin: '5px 0 0', color: '#765f4d', fontSize: '15px' },
  info:    { textAlign: 'center', color: '#888', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '12px', fontSize: '14px' },
  layout: {
    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 290px', gridTemplateAreas: "'feed sidebar'",
    alignItems: 'start', gap: '28px',
  },
  feedColumn: { gridArea: 'feed', minWidth: 0 },
  feedHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' },
  feedTitle: { margin: 0, color: DARK, fontSize: '18px' },
  feedCount: { padding: '4px 9px', borderRadius: '999px', color: '#765b45', background: 'rgba(201,168,76,0.12)', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' },

  // Columna lateral
  sidebar: {
    gridArea: 'sidebar', position: 'sticky', top: '24px', padding: '22px', borderRadius: '18px',
    background: 'linear-gradient(145deg, rgba(255,253,250,0.96), rgba(244,234,222,0.9))',
    border: '1px solid rgba(117,82,52,0.14)', boxShadow: '0 12px 26px rgba(44,24,16,0.06)',
  },
  sidebarEyebrow: { margin: 0, color: '#95713a', fontSize: '10px', fontWeight: '800', letterSpacing: '0.13em', textTransform: 'uppercase' },
  sidebarTitle: { margin: '4px 0 7px', color: DARK, fontSize: '19px', lineHeight: '1.35' },
  sidebarText: { margin: '0 0 17px', color: '#705945', fontSize: '13px', lineHeight: '1.5' },
  search: { marginBottom: '18px', minHeight: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '14px' },
  sidebarStat: { display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(117,82,52,0.12)' },
  sidebarStatIcon: { width: '38px', height: '38px', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#775420', background: '#f2e6cf', borderRadius: '11px' },
  sidebarStatValue: { display: 'block', color: DARK, fontSize: '18px', lineHeight: 1.1 },
  sidebarStatLabel: { display: 'block', marginTop: '2px', color: '#7f6956', fontSize: '12px' },

  // Lista
  lista: { display: 'flex', flexDirection: 'column', gap: '18px' },
  card: {
    display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,245,241,0.98))', borderRadius: '16px',
    boxShadow: '0 12px 24px rgba(44,24,16,0.06)',
    overflow: 'hidden', cursor: 'pointer',
    border: '1px solid rgba(117, 82, 52, 0.12)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  cardDestacada: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.03fr) minmax(0, 1fr)' },
  imagen: { width: '100%', aspectRatio: '16 / 8', maxHeight: '280px', objectFit: 'cover', background: CREAM },
  imagenDestacada: { width: '100%', minHeight: '100%', height: '100%', objectFit: 'cover', background: CREAM },
  cardBody: { padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' },
  postHeader: { display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '15px' },
  avatar: { width: '36px', height: '36px', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#775420', background: '#f2e6cf', borderRadius: '50%' },
  autor: { margin: 0, color: '#4c3628', fontSize: '13px', fontWeight: '700', lineHeight: 1.2 },
  metaPublicacion: { margin: '2px 0 0', color: '#9a8866', fontSize: '11px', textTransform: 'capitalize' },
  etiqueta: { color: '#95713a', fontWeight: '700' },
  cardTitulo: { margin: '0 0 9px', fontSize: '21px', fontWeight: '700', color: DARK, lineHeight: '1.35' },
  descripcionPreview: { margin: '0 0 18px', fontSize: '14px', color: '#5a4a3a', lineHeight: '1.65' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(117,82,52,0.1)' },
  leerMas: { fontSize: '13px', color: '#79522c', fontWeight: '700', cursor: 'pointer' },
  adminActions: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },

  // Botones
  btnPrimary: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee',
    border: 'none', borderRadius: '10px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '700', boxShadow: '0 8px 16px rgba(44, 24, 16, 0.17)',
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
  imageEditBox: { display: 'flex', flexDirection: 'column', gap: '10px' },
  imageEditPreview: { width: '100%', height: '190px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e8e0d0', background: CREAM },
  imageEditEmpty: { height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '7px', borderRadius: '10px', border: '1px dashed #d8c9b8', color: '#8b765f', background: '#faf7f2', fontSize: '13px' },
  imageEditHelp: { margin: '-3px 0 0', color: '#8b765f', fontSize: '12px', lineHeight: 1.45 },

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
