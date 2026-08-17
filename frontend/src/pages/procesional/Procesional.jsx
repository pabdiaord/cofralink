import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const ESTADOS = {
  pendiente:  { label: 'Pendiente',  color: '#d69e2e', bg: '#fffff0' },
  aprobada:   { label: 'Aprobada',   color: '#38a169', bg: '#f0fff4' },
  rechazada:  { label: 'Rechazada',  color: '#e53e3e', bg: '#fff5f5' },
}

export default function Procesional() {
  const { usuario } = useAuth()
  const [papeletas, setPapeletas]     = useState([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando]       = useState(false)
  const [editando, setEditando]       = useState(null)
  const [guardando, setGuardando]     = useState(false)

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
  const handleSubmit = async e => {
    e.preventDefault()
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
    setGuardando(true)
    try {
      await api.patch(`/papeletas/${editando.id}/`, formEdit)
      setEditando(null)
      await recargar()
    } catch {
      setError('Error al actualizar la papeleta.')
    } finally {
      setGuardando(false)
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────────
  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar esta papeleta?')) return
    try {
      await api.delete(`/papeletas/${id}/`)
      setPapeletas(prev => prev.filter(p => p.id !== id))
    } catch {
      setError('Error al eliminar la papeleta.')
    }
  }

  if (cargando) return <p style={styles.info}>Cargando papeletas...</p>

  return (
    <div style={styles.page}>

      {/* Cabecera */}
      <div style={styles.header}>
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

      {/* Formulario solicitud (solo hermano) */}
      {mostrarForm && !usuario?.is_staff && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitulo}>Solicitud de papeleta de sitio</h3>

          <label style={styles.label}>Paso</label>
          <input
            style={styles.input} value={form.paso} required
            onChange={e => setForm({ ...form, paso: e.target.value })}
            placeholder="Ej: Paso del Cristo"
          />

          <div style={styles.grid2}>
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

      {/* Lista de papeletas */}
      {papeletas.length === 0 ? (
        <p style={styles.info}>
          {usuario?.is_staff
            ? 'No hay solicitudes de papeletas todavía.'
            : 'No has solicitado ninguna papeleta todavía.'}
        </p>
      ) : (
        <div style={styles.lista}>
          {papeletas.map(p => {
            const estado = ESTADOS[p.estado] || ESTADOS.pendiente
            return (
              <div key={p.id} style={styles.card}>

                {/* Header card */}
                <div style={styles.cardTop}>
                  <div>
                    <h3 style={styles.cardTitulo}>⛪ {p.paso}</h3>
                    {usuario?.is_staff && (
                      <p style={styles.cardSub}>
                        👤 {p.usuario_email}
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
                  <span>📅 {new Date(p.fecha).toLocaleDateString('es-ES', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                  })}</span>
                  <span>📍 {p.tramo}</span>
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
          <div style={styles.modal}>
            <h3 style={styles.formTitulo}>
              Gestionar papeleta — {editando.paso}
            </h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              👤 {editando.usuario_email}
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

              <div style={styles.grid2}>
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
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  count:   { fontSize: '16px', fontWeight: '400', color: '#888' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },

  form: {
    background: 'white', borderRadius: '10px', padding: '24px',
    marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formTitulo: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '4px' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },

  // Cards
  lista:    { display: 'flex', flexDirection: 'column', gap: '14px' },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
  },
  cardTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  cardTitulo:{ fontSize: '17px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  cardSub:   { fontSize: '13px', color: '#666' },
  badge: {
    display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
  },
  meta: {
    display: 'flex', flexWrap: 'wrap', gap: '16px',
    fontSize: '13px', color: '#555', marginBottom: '12px',
  },
  cardFooter: { display: 'flex', gap: '8px', marginTop: '8px' },

  // Botones
  btnPrimary: {
    padding: '10px 20px', backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start',
  },
  btnEditar: {
    padding: '6px 14px', backgroundColor: 'transparent',
    color: '#1a1a2e', border: '1px solid #1a1a2e',
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