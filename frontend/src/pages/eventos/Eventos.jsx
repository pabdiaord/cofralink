import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const TIPOS = {
  CULTO:    '🕯️ Culto',
  ENSAYO:   '🥁 Ensayo',
  REUNION:  '📋 Reunión',
  PRIOSTIA: '⚙️ Priostía',
}

export default function Eventos() {
  const { usuario } = useAuth()
  const [eventos, setEventos]         = useState([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando]       = useState(false)
  const [form, setForm] = useState({
    nombre_evento: '', tipo_evento: 'CULTO',
    fecha: '', lugar: '', descripcion: '',
  })

  const [editando, setEditando]   = useState(null)
  const [formEdit, setFormEdit]   = useState({
    nombre_evento: '', tipo_evento: 'CULTO',
    fecha: '', lugar: '', descripcion: '',
  })
  const [guardando, setGuardando] = useState(false)

  //Cargar eventos
  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        const res = await api.get('/eventos/')
        if (activo) setEventos(res.data)
      } catch {
        if (activo) setError('No se pudieron cargar los eventos.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  const recargar = async () => {
    const res = await api.get('/eventos/')
    setEventos(res.data)
  }

  //Crear evento 
  const handleSubmit = async e => {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post('/eventos/', form)
      setForm({ nombre_evento: '', tipo_evento: 'CULTO', fecha: '', lugar: '', descripcion: '' })
      setMostrarForm(false)
      await recargar()
    } catch {
      setError('Error al crear el evento.')
    } finally {
      setEnviando(false)
    }
  }

  // Abrir editor 
  const abrirEdicion = ev => {
    setEditando(ev)
    // Convertir fecha ISO a formato datetime-local (YYYY-MM-DDTHH:MM)
    const fechaLocal = new Date(ev.fecha).toISOString().slice(0, 16)
    setFormEdit({
      nombre_evento: ev.nombre_evento,
      tipo_evento:   ev.tipo_evento,
      fecha:         fechaLocal,
      lugar:         ev.lugar,
      descripcion:   ev.descripcion,
    })
  }

  //Guardar edición
  const handleGuardarEdicion = async e => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.patch(`/eventos/${editando.id}/`, formEdit)
      setEditando(null)
      await recargar()
    } catch {
      setError('Error al editar el evento.')
    } finally {
      setGuardando(false)
    }
  }

  //Eliminar evento 
  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar este evento?')) return
    try {
      await api.delete(`/eventos/${id}/`)
      setEventos(prev => prev.filter(e => e.id !== id))
    } catch {
      setError('Error al eliminar el evento.')
    }
  }

  // Inscribirse a evento
  const handleInscribirse = async id => {
    try {
      await api.post(`/eventos/${id}/inscribirse/`)
      await recargar()
      alert('✅ Inscripción confirmada.')
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al inscribirse.'
      alert(msg)
    }
  }

  //Render 
  if (cargando) return <p style={styles.info}>Cargando eventos...</p>

  return (
    <div style={styles.page}>

      {/* Cabecera */}
      <div style={styles.header}>
        <h2 style={styles.titulo}>Eventos</h2>
        {usuario?.is_staff && (
          <button style={styles.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo evento'}
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Formulario nuevo evento */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitulo}>Nuevo evento</h3>

          <label style={styles.label}>Nombre del evento</label>
          <input
            style={styles.input} value={form.nombre_evento} required
            onChange={e => setForm({ ...form, nombre_evento: e.target.value })}
            placeholder="Ej: Ensayo general de costaleros"
          />

          <label style={styles.label}>Tipo</label>
          <select
            style={styles.input} value={form.tipo_evento}
            onChange={e => setForm({ ...form, tipo_evento: e.target.value })}
          >
            <option value="CULTO">Culto</option>
            <option value="ENSAYO">Ensayo</option>
            <option value="REUNION">Reunión</option>
            <option value="PRIOSTIA">Priostía</option>
          </select>

          <label style={styles.label}>Fecha y hora</label>
          <input
            type="datetime-local" style={styles.input}
            value={form.fecha} required
            onChange={e => setForm({ ...form, fecha: e.target.value })}
          />

          <label style={styles.label}>Lugar</label>
          <input
            style={styles.input} value={form.lugar} required
            onChange={e => setForm({ ...form, lugar: e.target.value })}
            placeholder="Ej: Casa de Hermandad"
          />

          <label style={styles.label}>Descripción (opcional)</label>
          <textarea
            style={{ ...styles.input, height: '80px', resize: 'vertical' }}
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Detalles del evento..."
          />

          <button type="submit" disabled={enviando} style={styles.btnPrimary}>
            {enviando ? 'Guardando...' : 'Crear evento'}
          </button>
        </form>
      )}

       {/* Lista de eventos */}
      {eventos.length === 0 ? (
        <p style={styles.info}>No hay eventos programados.</p>
      ) : (
        <div style={styles.lista}>
          {eventos.map(ev => (
            <div key={ev.id} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.badge}>{TIPOS[ev.tipo_evento] || ev.tipo_evento}</span>
                {usuario?.is_staff && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={styles.btnEditar} onClick={() => abrirEdicion(ev)}>
                      Editar
                    </button>
                    <button style={styles.btnEliminar} onClick={() => handleEliminar(ev.id)}>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              <h3 style={styles.cardTitulo}>{ev.nombre_evento}</h3>

              <div style={styles.meta}>
                <span>📅 {new Date(ev.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                })}</span>
                <span>🕐 {new Date(ev.fecha).toLocaleTimeString('es-ES', {
                  hour: '2-digit', minute: '2-digit'
                })}</span>
                <span>📍 {ev.lugar}</span>
              </div>

              {ev.descripcion && <p style={styles.descripcion}>{ev.descripcion}</p>}

              <div style={styles.cardFooter}>
                <span style={styles.inscritos}>👥 {ev.total_inscritos} inscritos</span>
                {!usuario?.is_staff && (
                  <button style={styles.btnInscribirse} onClick={() => handleInscribirse(ev.id)}>
                    Inscribirme
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal edición */}
      {editando && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.formTitulo}>Editar evento</h3>
            <form
              onSubmit={handleGuardarEdicion}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <label style={styles.label}>Nombre del evento</label>
              <input
                style={styles.input} value={formEdit.nombre_evento} required
                onChange={e => setFormEdit({ ...formEdit, nombre_evento: e.target.value })}
              />

              <label style={styles.label}>Tipo</label>
              <select
                style={styles.input} value={formEdit.tipo_evento}
                onChange={e => setFormEdit({ ...formEdit, tipo_evento: e.target.value })}
              >
                <option value="CULTO">Culto</option>
                <option value="ENSAYO">Ensayo</option>
                <option value="REUNION">Reunión</option>
                <option value="PRIOSTIA">Priostía</option>
              </select>

              <label style={styles.label}>Fecha y hora</label>
              <input
                type="datetime-local" style={styles.input}
                value={formEdit.fecha} required
                onChange={e => setFormEdit({ ...formEdit, fecha: e.target.value })}
              />

              <label style={styles.label}>Lugar</label>
              <input
                style={styles.input} value={formEdit.lugar} required
                onChange={e => setFormEdit({ ...formEdit, lugar: e.target.value })}
              />

              <label style={styles.label}>Descripción (opcional)</label>
              <textarea
                style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                value={formEdit.descripcion}
                onChange={e => setFormEdit({ ...formEdit, descripcion: e.target.value })}
              />

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
  page:    { padding: '24px', maxWidth: '800px', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },
  form: {
    background: 'white', borderRadius: '10px', padding: '24px',
    marginBottom: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formTitulo: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  label:  { fontSize: '13px', fontWeight: '600', color: '#444' },
  input: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
  },
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
  btnInscribirse: {
    padding: '8px 18px', backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '13px',
    cursor: 'pointer', fontWeight: '600',
  },
  btnCancelar: {
    padding: '10px 20px', backgroundColor: '#eee', color: '#333',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '600',
  },
  lista: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    background: 'white', borderRadius: '10px',
    padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  badge: {
    display: 'inline-block', padding: '4px 12px', backgroundColor: '#f0f0f0',
    borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#444',
  },
  cardTitulo:  { fontSize: '17px', fontWeight: '700', color: '#1a1a2e', marginBottom: '10px' },
  meta:        { display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#555', marginBottom: '10px' },
  descripcion: { fontSize: '14px', color: '#444', lineHeight: '1.6', marginBottom: '12px' },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' },
  inscritos:   { fontSize: '13px', color: '#666' },
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'white', borderRadius: '12px', padding: '32px',
    width: '100%', maxWidth: '480px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
  },
}