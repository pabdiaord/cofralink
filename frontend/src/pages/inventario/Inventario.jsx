import { useState, useEffect } from 'react'
import api from '../../api/axios'

const TIPOS = {
  IMAGEN: { label: 'Imagen devocional', emoji: '🕍' },
  ENSER:  { label: 'Enser',             emoji: '⚙️' },
  UTIL:   { label: 'Útil',              emoji: '🧰' },
}

const ENDPOINTS = {
  IMAGEN: 'imagenes',
  ENSER:  'enseres',
  UTIL:   'utiles',
}

const CAMPOS_EXTRA = {
  IMAGEN: [
    { key: 'fecha_realizacion',        label: 'Fecha de realización',   type: 'date' },
    { key: 'fecha_ultima_restauracion', label: 'Última restauración',    type: 'date' },
    { key: 'conservacion',             label: 'Estado de conservación', type: 'text' },
    { key: 'lugar_culto',              label: 'Lugar de culto',         type: 'text' },
  ],
  ENSER: [
    { key: 'fecha_realizacion',        label: 'Fecha de realización',   type: 'date' },
    { key: 'fecha_ultima_restauracion', label: 'Última restauración',    type: 'date' },
    { key: 'conservacion',             label: 'Estado de conservación', type: 'text' },
    { key: 'ubicacion',               label: 'Ubicación',              type: 'text' },
  ],
  UTIL: [
    { key: 'ubicacion', label: 'Ubicación', type: 'text' },
    { key: 'cantidad',  label: 'Cantidad',  type: 'number' },
  ],
}

const formBase = (tipo) => ({
  nombre:                  '',
  tipo_objeto:             tipo,
  fecha_realizacion:       '',
  fecha_ultima_restauracion: '',
  conservacion:            '',
  lugar_culto:             '',
  ubicacion:               '',
  cantidad:                1,
})

export default function Inventario() {
  const [tipoActivo, setTipoActivo]   = useState('IMAGEN')
  const [objetos, setObjetos]         = useState([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando]       = useState(false)
  const [form, setForm]               = useState(formBase('IMAGEN'))
  const [editando, setEditando]       = useState(null)
  const [formEdit, setFormEdit]       = useState({})
  const [guardando, setGuardando]     = useState(false)

  //Cargar objetos del tipo elegido 
  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    const cargar = async () => {
      try {
        const res = await api.get(`/${ENDPOINTS[tipoActivo]}/`)
        if (activo) setObjetos(res.data)
      } catch {
        if (activo) setError('No se pudo cargar el inventario.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [tipoActivo])

  const recargar = async () => {
    const res = await api.get(`/${ENDPOINTS[tipoActivo]}/`)
    setObjetos(res.data)
  }

  //Crear nuevo objeto
  const handleSubmit = async e => {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post(`/${ENDPOINTS[tipoActivo]}/`, { ...form, tipo_objeto: tipoActivo })
      setForm(formBase(tipoActivo))
      setMostrarForm(false)
      await recargar()
    } catch {
      setError('Error al crear el objeto.')
    } finally {
      setEnviando(false)
    }
  }

  // Abrir edición
  const abrirEdicion = obj => {
    setEditando(obj)
    setFormEdit({ ...obj })
  }

  // Guardar edición
  const handleGuardarEdicion = async e => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.patch(`/${ENDPOINTS[tipoActivo]}/${editando.id}/`, formEdit)
      setEditando(null)
      await recargar()
    } catch {
      setError('Error al editar el objeto.')
    } finally {
      setGuardando(false)
    }
  }

  // Eliminar objeto
  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar este objeto del inventario?')) return
    try {
      await api.delete(`/${ENDPOINTS[tipoActivo]}/${id}/`)
      setObjetos(prev => prev.filter(o => o.id !== id))
    } catch {
      setError('Error al eliminar el objeto.')
    }
  }

  // Cambiar tipo de objeto
  const cambiarTipo = tipo => {
    setTipoActivo(tipo)
    setMostrarForm(false)
    setForm(formBase(tipo))
    setEditando(null)
    setError('')
  }

  const camposExtra = CAMPOS_EXTRA[tipoActivo]

  return (
    <div style={styles.page}>

      {/* Cabecera */}
      <div style={styles.header}>
        <h2 style={styles.titulo}>Inventario</h2>
        <button style={styles.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : `+ Nuevo ${TIPOS[tipoActivo].label.toLowerCase()}`}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Tabs de tipo */}
      <div style={styles.tabs}>
        {Object.entries(TIPOS).map(([key, val]) => (
          <button
            key={key}
            style={{ ...styles.tab, ...(tipoActivo === key ? styles.tabActivo : {}) }}
            onClick={() => cambiarTipo(key)}
          >
            {val.emoji} {val.label}
          </button>
        ))}
      </div>

      {/* Formulario nuevo objeto */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitulo}>Nuevo {TIPOS[tipoActivo].label.toLowerCase()}</h3>

          <label style={styles.label}>Nombre</label>
          <input
            style={styles.input} value={form.nombre} required
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            placeholder={`Nombre del ${TIPOS[tipoActivo].label.toLowerCase()}`}
          />

          <div style={styles.grid2}>
            {camposExtra.map(campo => (
              <div key={campo.key}>
                <label style={styles.label}>{campo.label}</label>
                <input
                  type={campo.type} style={styles.input}
                  value={form[campo.key] || ''}
                  onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                  placeholder={campo.label}
                />
              </div>
            ))}
          </div>

          <button type="submit" disabled={enviando} style={styles.btnPrimary}>
            {enviando ? 'Guardando...' : 'Añadir al inventario'}
          </button>
        </form>
      )}

      {/* Lista de objetos */}
      {cargando ? (
        <p style={styles.info}>Cargando inventario...</p>
      ) : objetos.length === 0 ? (
        <p style={styles.info}>No hay {TIPOS[tipoActivo].label.toLowerCase()}s registradas.</p>
      ) : (
        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span style={{ flex: 1 }}>Nombre</span>
            {camposExtra.map(c => (
              <span key={c.key} style={{ width: '160px' }}>{c.label}</span>
            ))}
            <span style={{ width: '140px' }}>Acciones</span>
          </div>

          {objetos.map(obj => (
            <div key={obj.id} style={styles.fila}>
              <span style={{ flex: 1, fontWeight: '600', color: '#1a1a2e' }}>
                {TIPOS[tipoActivo].emoji} {obj.nombre}
              </span>
              {camposExtra.map(c => (
                <span key={c.key} style={{ width: '160px', fontSize: '13px', color: '#555' }}>
                  {obj[c.key] || '—'}
                </span>
              ))}
              <div style={{ width: '140px', display: 'flex', gap: '6px' }}>
                <button style={styles.btnEditar} onClick={() => abrirEdicion(obj)}>
                  Editar
                </button>
                <button style={styles.btnEliminar} onClick={() => handleEliminar(obj.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal edición */}
      {editando && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.formTitulo}>
              Editar {TIPOS[tipoActivo].label.toLowerCase()}
            </h3>
            <form
              onSubmit={handleGuardarEdicion}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <label style={styles.label}>Nombre</label>
              <input
                style={styles.input} value={formEdit.nombre || ''} required
                onChange={e => setFormEdit({ ...formEdit, nombre: e.target.value })}
              />

              <div style={styles.grid2}>
                {camposExtra.map(campo => (
                  <div key={campo.key}>
                    <label style={styles.label}>{campo.label}</label>
                    <input
                      type={campo.type} style={styles.input}
                      value={formEdit[campo.key] || ''}
                      onChange={e => setFormEdit({ ...formEdit, [campo.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

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
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },

  // Tabs
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: {
    padding: '8px 18px', borderRadius: '8px', border: '1px solid #ddd',
    background: 'white', color: '#555', cursor: 'pointer',
    fontSize: '14px', fontWeight: '500',
  },
  tabActivo: {
    background: `linear-gradient(135deg, rgba(28,18,15,0.96) 0%, rgba(54,37,27,0.94) 45%, rgba(16,16,26,0.96) 100%)`, color: 'white', borderColor: '#1a1a2e',
  },

  // Formulario
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

  // Tabla
  tabla: {
    background: 'white', borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden',
  },
  tablaHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 20px', background: `linear-gradient(135deg, rgba(28,18,15,0.96) 0%, rgba(54,37,27,0.94) 45%, rgba(16,16,26,0.96) 100%)`,
    color: 'white', fontSize: '13px', fontWeight: '600',
  },
  fila: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontSize: '14px',
  },

  // Botones
  btnPrimary: {
    padding: '10px 20px', background: `linear-gradient(135deg, rgba(28,18,15,0.96) 0%, rgba(54,37,27,0.94) 45%, rgba(16,16,26,0.96) 100%)`, color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start',
  },
  btnEditar: {
    padding: '5px 12px', backgroundColor: 'transparent',
    color: '#1a1a2e', border: '1px solid #1a1a2e',
    borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
  },
  btnEliminar: {
    padding: '5px 12px', backgroundColor: 'transparent',
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
    width: '100%', maxWidth: '580px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
    maxHeight: '90vh', overflowY: 'auto',
  },
}