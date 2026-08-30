import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'
import AppIcon from '../../components/AppIcon'
import SearchField from '../../components/SearchField'
import { coincideBusqueda } from '../../utils/search'

const ESTADOS = {
  pendiente:  { label: 'Pendiente',  color: '#d69e2e', bg: '#fffff0' },
  aprobada:   { label: 'Aprobada',   color: '#38a169', bg: '#f0fff4' },
  rechazada:  { label: 'Rechazada',  color: '#e53e3e', bg: '#fff5f5' },
}

export default function Procesional() {
  const { usuario } = useAuth()
  const [papeletas, setPapeletas]     = useState([])
  const [busqueda, setBusqueda]       = useState('')
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando]       = useState(false)
  const [editando, setEditando]       = useState(null)
  const [guardando, setGuardando]     = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const formVacio = { paso: '', fecha: '', tramo: '' }
  const [form, setForm]         = useState(formVacio)
  const [formEdit, setFormEdit] = useState(formVacio)

  // ── Cargar papeletas ──────────────────────────────────────────────
  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        const res = await api.get('/papeletas/')
        if (activo) setPapeletas(res.data)
      } catch {
        if (activo) setError('No se pudieron cargar las papeletas.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  const recargar = async () => {
    const res = await api.get('/papeletas/')
    setPapeletas(res.data)
  }

  // ── Crear papeleta (hermano) ──────────────────────────────────────
  const openConfirm = (action, payload = null) => {
    setPendingAction({ action, payload })
    setConfirmOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    const { action, payload } = pendingAction
    setConfirmOpen(false)

    if (action === 'create-papeleta') {
      setEnviando(true)
      try {
        await api.post('/papeletas/', form)
        setForm(formVacio)
        setMostrarForm(false)
        await recargar()
      } catch (err) {
        const msg = err.response?.data?.detail ||
                    Object.values(err.response?.data || {}).flat().join(' ') ||
                    'Error al solicitar la papeleta.'
        setError(msg)
      } finally {
        setEnviando(false)
      }
    }

    if (action === 'edit-papeleta') {
      setGuardando(true)
      try {
        await api.patch(`/papeletas/${payload.id}/`, payload.data)
        setEditando(null)
        await recargar()
      } catch {
        setError('Error al actualizar la papeleta.')
      } finally {
        setGuardando(false)
      }
    }

    if (action === 'delete-papeleta') {
      try {
        await api.delete(`/papeletas/${payload}/`)
        setPapeletas(prev => prev.filter(p => p.id !== payload))
      } catch {
        setError('Error al eliminar la papeleta.')
      }
    }

    setPendingAction(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    openConfirm('create-papeleta')
  }

  // ── Abrir edición (admin: aprobar/rechazar/asignar tramo) ─────────
  const abrirEdicion = p => {
    setEditando(p)
    setFormEdit({
      paso:   p.paso,
      fecha:  p.fecha,
      tramo:  p.tramo,
      estado: p.estado || 'pendiente',
    })
  }

  // ── Guardar edición ───────────────────────────────────────────────
  const handleGuardarEdicion = async e => {
    e.preventDefault()
    openConfirm('edit-papeleta', { id: editando.id, data: formEdit })
  }

  // ── Eliminar ──────────────────────────────────────────────────────
  const handleEliminar = async id => {
    openConfirm('delete-papeleta', id)
  }

  if (cargando) return <p style={styles.info}>Cargando papeletas...</p>

  const papeletasFiltradas = papeletas.filter(papeleta => (
    coincideBusqueda(
      busqueda,
      papeleta.paso,
      papeleta.tramo,
      papeleta.usuario_email,
      ESTADOS[papeleta.estado]?.label,
    )
  ))

  return (
    <div className="content-page procesional-page" style={styles.page}>

      {/* Cabecera */}
      <div className="page-header" style={styles.header}>
        <h2 style={styles.titulo}>
          Procesional
          <span style={styles.count}> ({papeletas.length})</span>
        </h2>
        {!usuario?.is_staff && (
          <button
            style={styles.btnPrimary}
            onClick={() => setMostrarForm(!mostrarForm)}
          >
            {mostrarForm ? 'Cancelar' : '+ Solicitar papeleta'}
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction?.action === 'delete-papeleta' ? 'Eliminar papeleta' : pendingAction?.action === 'create-papeleta' ? 'Solicitar papeleta' : 'Guardar cambios'}
        message={pendingAction?.action === 'delete-papeleta'
          ? '¿Seguro que quieres eliminar esta papeleta?'
          : pendingAction?.action === 'create-papeleta'
            ? '¿Quieres enviar esta solicitud de papeleta?'
            : '¿Deseas guardar los cambios de esta papeleta?'}
        confirmText={pendingAction?.action === 'delete-papeleta' ? 'Eliminar' : 'Confirmar'}
        danger={pendingAction?.action === 'delete-papeleta'}
        onConfirm={executePendingAction}
        onCancel={() => { setConfirmOpen(false); setPendingAction(null) }}
      />

      {/* Formulario solicitud (solo hermano) */}
      {mostrarForm && !usuario?.is_staff && (
        <form className="data-form" onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitulo}>Solicitud de papeleta de sitio</h3>

          <label style={styles.label}>Paso</label>
          <input
            style={styles.input} value={form.paso} required
            onChange={e => setForm({ ...form, paso: e.target.value })}
            placeholder="Ej: Paso del Cristo"
          />

          <div className="form-grid-2" style={styles.grid2}>
            <div>
              <label style={styles.label}>Fecha de la procesión</label>
              <input
                type="date" style={styles.input} value={form.fecha} required
                onChange={e => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Tramo solicitado</label>
              <input
                style={styles.input} value={form.tramo} required
                onChange={e => setForm({ ...form, tramo: e.target.value })}
                placeholder="Ej: Tramo 3 - Nazarenos"
              />
            </div>
          </div>

          <button type="submit" disabled={enviando} style={styles.btnPrimary}>
            {enviando ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      )}

      <SearchField
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por paso, tramo, hermano o estado"
        ariaLabel="Buscar papeletas de sitio"
        style={styles.search}
      />

      {/* Lista de papeletas */}
      {papeletas.length === 0 ? (
        <p style={styles.info}>
          {usuario?.is_staff
            ? 'No hay solicitudes de papeletas todavía.'
            : 'No has solicitado ninguna papeleta todavía.'}
        </p>
      ) : papeletasFiltradas.length === 0 ? (
        <p style={styles.info}>No se han encontrado papeletas con esa búsqueda.</p>
      ) : (
        <div style={styles.lista}>
          {papeletasFiltradas.map(p => {
            const estado = ESTADOS[p.estado] || ESTADOS.pendiente
            return (
              <div key={p.id} style={styles.card}>

                {/* Header card */}
                <div style={styles.cardTop}>
                  <div>
                    <h3 style={styles.cardTitulo}><AppIcon name="document" size={18} style={styles.cardTitleIcon} />{p.paso}</h3>
                    {usuario?.is_staff && (
                      <p style={styles.cardSub}>
                        <AppIcon name="people" size={15} />{p.usuario_email}
                      </p>
                    )}
                  </div>
                  <span style={{
                    ...styles.badge,
                    color: estado.color,
                    backgroundColor: estado.bg,
                    border: `1px solid ${estado.color}`,
                  }}>
                    {estado.label}
                  </span>
                </div>

                {/* Detalles */}
                <div style={styles.meta}>
                  <span style={styles.metaItem}><AppIcon name="calendar" size={15} />{new Date(p.fecha).toLocaleDateString('es-ES', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                  })}</span>
                  <span style={styles.metaItem}><AppIcon name="pin" size={15} />{p.tramo}</span>
                </div>

                {/* Acciones */}
                {usuario?.is_staff && (
                  <div style={styles.cardFooter}>
                    <button style={styles.btnEditar} onClick={() => abrirEdicion(p)}>
                      Gestionar
                    </button>
                    <button style={styles.btnEliminar} onClick={() => handleEliminar(p.id)}>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal gestión admin */}
      {editando && (
        <div style={styles.overlay}>
          <div className="responsive-modal" style={styles.modal}>
            <h3 style={styles.formTitulo}>
              Gestionar papeleta — {editando.paso}
            </h3>
            <p style={styles.modalUser}>
              <AppIcon name="people" size={15} />{editando.usuario_email}
            </p>
            <form
              onSubmit={handleGuardarEdicion}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <label style={styles.label}>Paso</label>
              <input
                style={styles.input} value={formEdit.paso || ''} required
                onChange={e => setFormEdit({ ...formEdit, paso: e.target.value })}
              />

              <div className="form-grid-2" style={styles.grid2}>
                <div>
                  <label style={styles.label}>Fecha</label>
                  <input
                    type="date" style={styles.input} value={formEdit.fecha || ''}
                    onChange={e => setFormEdit({ ...formEdit, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <label style={styles.label}>Tramo asignado</label>
                  <input
                    style={styles.input} value={formEdit.tramo || ''}
                    onChange={e => setFormEdit({ ...formEdit, tramo: e.target.value })}
                    placeholder="Tramo definitivo"
                  />
                </div>
              </div>

              <label style={styles.label}>Estado</label>
              <select
                style={styles.input} value={formEdit.estado || 'pendiente'}
                onChange={e => setFormEdit({ ...formEdit, estado: e.target.value })}
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
              </select>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" disabled={guardando} style={styles.btnPrimary}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button" style={styles.btnCancelar}
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

const styles = {
  page:    { padding: '32px', maxWidth: '1440px', width: '100%', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#2c1810' },
  count:   { fontSize: '16px', fontWeight: '400', color: '#888' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },
  search:  { marginBottom: '20px' },

  form: {
    background: 'linear-gradient(135deg, rgba(255,250,245,0.98), rgba(239,227,215,0.96))', borderRadius: '18px', padding: '24px',
    marginBottom: '24px', boxShadow: '0 12px 26px rgba(44, 24, 16, 0.06)', border: '1px solid rgba(117, 82, 52, 0.15)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formTitulo: { fontSize: '16px', fontWeight: '700', color: '#2c1810', marginBottom: '4px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#7d5f42', display: 'block', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid rgba(117, 82, 52, 0.2)', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'rgba(255,255,255,0.54)',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },

  // Cards
  lista:    { display: 'flex', flexDirection: 'column', gap: '14px' },
  card: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,245,241,0.98))', borderRadius: '16px', padding: '20px',
    boxShadow: '0 10px 20px rgba(44,24,16,0.06)', border: '1px solid rgba(117, 82, 52, 0.12)',
  },
  cardTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  cardTitulo:{ fontSize: '17px', fontWeight: '700', color: '#2c1810', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '7px' },
  cardTitleIcon: { color: '#775420', flexShrink: 0 },
  cardSub:   { fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' },
  badge: {
    display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
  },
  meta: {
    display: 'flex', flexWrap: 'wrap', gap: '16px',
    fontSize: '13px', color: '#555', marginBottom: '12px',
  },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  modalUser: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666', marginBottom: '16px' },
  cardFooter: { display: 'flex', gap: '8px', marginTop: '8px' },

  // Botones
  btnPrimary: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start',
  },
  btnEditar: {
    padding: '6px 14px', backgroundColor: 'transparent',
    color: '#2c1810', border: '1px solid #2c1810',
    borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
  },
  btnEliminar: {
    padding: '6px 14px', backgroundColor: 'transparent',
    color: '#e53e3e', border: '1px solid #e53e3e',
    borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
  },
  btnCancelar: {
    padding: '10px 20px', backgroundColor: '#eee', color: '#333',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '600',
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'white', borderRadius: '12px', padding: '32px',
    width: '100%', maxWidth: '500px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
  },
}
