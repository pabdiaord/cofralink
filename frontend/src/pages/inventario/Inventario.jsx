import { useState, useEffect } from 'react'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'

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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

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
  const openConfirm = (action, payload = null) => {
    setPendingAction({ action, payload })
    setConfirmOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    const { action, payload } = pendingAction
    setConfirmOpen(false)

    if (action === 'create-inventario') {
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

    if (action === 'edit-inventario') {
      setGuardando(true)
      try {
        await api.patch(`/${ENDPOINTS[tipoActivo]}/${payload.id}/`, payload.data)
        setEditando(null)
        await recargar()
      } catch {
        setError('Error al editar el objeto.')
      } finally {
        setGuardando(false)
      }
    }

    if (action === 'delete-inventario') {
      try {
        await api.delete(`/${ENDPOINTS[tipoActivo]}/${payload}/`)
        setObjetos(prev => prev.filter(o => o.id !== payload))
      } catch {
        setError('Error al eliminar el objeto.')
      }
    }

    setPendingAction(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    openConfirm('create-inventario')
  }

  // Abrir edición
  const abrirEdicion = obj => {
    setEditando(obj)
    setFormEdit({ ...obj })
  }

  // Guardar edición
  const handleGuardarEdicion = async e => {
    e.preventDefault()
    openConfirm('edit-inventario', { id: editando.id, data: formEdit })
  }

  // Eliminar objeto
  const handleEliminar = async id => {
    openConfirm('delete-inventario', id)
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
    <div className="content-page inventario-page" style={styles.page}>

      {/* Cabecera */}
      <div className="page-header" style={styles.header}>
        <h2 style={styles.titulo}>Inventario</h2>
        <button style={styles.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : `+ Nuevo ${TIPOS[tipoActivo].label.toLowerCase()}`}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction?.action === 'delete-inventario' ? 'Eliminar elemento' : pendingAction?.action === 'create-inventario' ? 'Crear elemento' : 'Guardar cambios'}
        message={pendingAction?.action === 'delete-inventario'
          ? '¿Seguro que quieres eliminar este elemento del inventario?'
          : pendingAction?.action === 'create-inventario'
            ? '¿Deseas añadir este nuevo elemento al inventario?'
            : '¿Deseas guardar los cambios realizados en este elemento?'}
        confirmText={pendingAction?.action === 'delete-inventario' ? 'Eliminar' : 'Confirmar'}
        danger={pendingAction?.action === 'delete-inventario'}
        onConfirm={executePendingAction}
        onCancel={() => { setConfirmOpen(false); setPendingAction(null) }}
      />

      {/* Tabs de tipo */}
      <div className="tabs-row" style={styles.tabs}>
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
        <form className="data-form" onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitulo}>Nuevo {TIPOS[tipoActivo].label.toLowerCase()}</h3>

          <label style={styles.label}>Nombre</label>
          <input
            style={styles.input} value={form.nombre} required
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            placeholder={`Nombre del ${TIPOS[tipoActivo].label.toLowerCase()}`}
          />

          <div className="form-grid-2" style={styles.grid2}>
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
        <div className="data-table" style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span style={{ flex: 1 }}>Nombre</span>
            {camposExtra.map(c => (
              <span key={c.key} style={{ width: '160px' }}>{c.label}</span>
            ))}
            <span style={{ width: '140px' }}>Acciones</span>
          </div>

          {objetos.map(obj => (
            <div key={obj.id} style={styles.fila}>
              <span style={{ flex: 1, fontWeight: '600', color: '#2c1810' }}>
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
          <div className="responsive-modal" style={styles.modal}>
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

              <div className="form-grid-2" style={styles.grid2}>
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
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#2c1810' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },

  // Tabs
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: {
    padding: '8px 18px', borderRadius: '12px', border: '1px solid rgba(117, 82, 52, 0.18)',
    background: 'rgba(255,255,255,0.6)', color: '#3d2a20', cursor: 'pointer',
    fontSize: '14px', fontWeight: '700', boxShadow: '0 8px 16px rgba(44, 24, 16, 0.04)',
  },
  tabActivo: {
    background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee', borderColor: '#2c1810', boxShadow: '0 8px 16px rgba(44, 24, 16, 0.17)',
  },

  // Formulario
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

  // Tabla
  tabla: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,245,241,0.98))', borderRadius: '16px',
    boxShadow: '0 12px 24px rgba(44,24,16,0.06)', overflow: 'hidden', border: '1px solid rgba(117, 82, 52, 0.12)',
  },
  tablaHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 20px', background: '#3c2519',
    color: '#f5e6c8', fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  fila: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 20px', borderBottom: '1px solid rgba(117, 82, 52, 0.08)', fontSize: '14px',
  },

  // Botones
  btnPrimary: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start',
  },
  btnEditar: {
    padding: '5px 12px', backgroundColor: 'transparent',
    color: '#2c1810', border: '1px solid #2c1810',
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
