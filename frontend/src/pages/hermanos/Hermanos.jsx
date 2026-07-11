import { useState, useEffect } from 'react'
import api from '../../api/axios'

const CARACTERES = {
  NAZARENO:      '🕯️ Nazareno',
  COSTALERO:     '💪 Costalero',
  MIEMBRO_JUNTA: '📋 Miembro de Junta',
}

const ESTADOS_CUOTA = {
  PAGADO:    { label: 'Pagado',     color: '#38a169' },
  NO_PAGADO: { label: 'No pagado',  color: '#e53e3e' },
}

export default function Hermanos() {
  const [hermanos, setHermanos]       = useState([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [busqueda, setBusqueda]       = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando]       = useState(false)
  const [editando, setEditando]       = useState(null)
  const [guardando, setGuardando]     = useState(false)

  const formVacio = {
    nombre: '', apellidos: '', direccion: '',
    numero_hermano: '', estado_cuota: 'NO_PAGADO', caracter: 'NAZARENO',
  }
  const [form, setForm]         = useState(formVacio)
  const [formEdit, setFormEdit] = useState(formVacio)

  //Cargar
  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        const res = await api.get('/hermanos/')
        if (activo) setHermanos(res.data)
      } catch {
        if (activo) setError('No se pudieron cargar los hermanos.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  const recargar = async () => {
    const res = await api.get('/hermanos/')
    setHermanos(res.data)
  }

  //Crear
 const handleSubmit = async e => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await api.post('/hermanos/crear-completo/', {
        nombre:         form.nombre,
        apellidos:      form.apellidos,
        direccion:      form.direccion,
        numero_hermano: form.numero_hermano,
        estado_cuota:   form.estado_cuota,
        caracter:       form.caracter,
      })
      setForm(formVacio)
      setMostrarForm(false)
      await recargar()
    } catch (err) {
      const data = err.response?.data
      const msg  = data?.error || Object.values(data || {}).flat().join(' ') || 'Error al crear el hermano.'
      setError(msg)
    } finally {
      setEnviando(false)
    }
  }

  // Abrir edición
  const abrirEdicion = h => {
    setEditando(h)
    setFormEdit({
      nombre:         h.nombre,
      apellidos:      h.apellidos,
      direccion:      h.direccion || '',
      numero_hermano: h.numero_hermano,
      estado_cuota:   h.estado_cuota,
      caracter:       h.caracter || 'NAZARENO',
    })
  }

  //Guardar edición
  const handleGuardarEdicion = async e => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.patch(`/hermanos/${editando.id}/`, formEdit)
      setEditando(null)
      await recargar()
    } catch {
      setError('Error al editar el hermano.')
    } finally {
      setGuardando(false)
    }
  }

  //Dar de baja
  const handleBaja = async h => {
    if (!window.confirm(`¿Dar de baja a ${h.nombre} ${h.apellidos}? Esta acción desactivará su cuenta.`)) return
    try {
      await api.delete(`/hermanos/${h.id}/`)
      await recargar()
    } catch {
      setError('Error al dar de baja al hermano.')
    }
  }

  //Filtro búsqueda
  const hermonosFiltrados = hermanos.filter(h =>
    `${h.nombre} ${h.apellidos} ${h.numero_hermano}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  if (cargando) return <p style={styles.info}>Cargando hermanos...</p>

  return (
    <div style={styles.page}>

      {/* Cabecera */}
      <div style={styles.header}>
        <h2 style={styles.titulo}>Hermanos <span style={styles.count}>({hermanos.length})</span></h2>
        <button style={styles.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo hermano'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Buscador */}
      <input
        style={{ ...styles.input, marginBottom: '20px' }}
        placeholder="🔍 Buscar por nombre o número..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      {/* Formulario nuevo hermano */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitulo}>Nuevo hermano</h3>

          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Nombre</label>
              <input
                style={styles.input} value={form.nombre} required
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre"
              />
            </div>
            <div>
              <label style={styles.label}>Apellidos</label>
              <input
                style={styles.input} value={form.apellidos} required
                onChange={e => setForm({ ...form, apellidos: e.target.value })}
                placeholder="Apellidos"
              />
            </div>
          </div>

          <label style={styles.label}>Dirección</label>
          <input
            style={styles.input} value={form.direccion}
            onChange={e => setForm({ ...form, direccion: e.target.value })}
            placeholder="Dirección (opcional)"
          />

          <div style={styles.grid3}>
            <div>
              <label style={styles.label}>Nº Hermano</label>
              <input
                type="number" style={styles.input} value={form.numero_hermano} required
                onChange={e => setForm({ ...form, numero_hermano: e.target.value })}
                placeholder="001"
              />
            </div>
            <div>
              <label style={styles.label}>Estado cuota</label>
              <select
                style={styles.input} value={form.estado_cuota}
                onChange={e => setForm({ ...form, estado_cuota: e.target.value })}
              >
                <option value="PAGADO">Pagado</option>
                <option value="NO_PAGADO">No pagado</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Carácter</label>
              <select
                style={styles.input} value={form.caracter}
                onChange={e => setForm({ ...form, caracter: e.target.value })}
              >
                <option value="NAZARENO">Nazareno</option>
                <option value="COSTALERO">Costalero</option>
                <option value="MIEMBRO_JUNTA">Miembro de Junta</option>
              </select>
            </div>
          </div>

          <p style={styles.nota}>
            💡 Se creará un usuario con email <strong>hermanoNUM@cofralink.com</strong> y contraseña temporal <strong>Cofralink123!</strong>
          </p>

          <button type="submit" disabled={enviando} style={styles.btnPrimary}>
            {enviando ? 'Creando...' : 'Crear hermano'}
          </button>
        </form>
      )}

      {/* Tabla de hermanos */}
      {hermonosFiltrados.length === 0 ? (
        <p style={styles.info}>No se encontraron hermanos.</p>
      ) : (
        <div style={styles.tabla}>
          {/* Cabecera tabla */}
          <div style={styles.tablaHeader}>
            <span style={{ width: '60px' }}>Nº</span>
            <span style={{ flex: 1 }}>Nombre</span>
            <span style={{ width: '140px' }}>Carácter</span>
            <span style={{ width: '110px' }}>Cuota</span>
            <span style={{ width: '140px' }}>Acciones</span>
          </div>

          {/* Filas */}
          {hermonosFiltrados.map(h => (
            <div key={h.id} style={styles.fila}>
              <span style={{ width: '60px', fontWeight: '700', color: '#1a1a2e' }}>
                #{h.numero_hermano}
              </span>
              <span style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1a1a2e' }}>{h.nombre} {h.apellidos}</div>
                {h.direccion && <div style={{ fontSize: '12px', color: '#888' }}>{h.direccion}</div>}
              </span>
              <span style={{ width: '140px', fontSize: '13px' }}>
                {CARACTERES[h.caracter] || h.caracter}
              </span>
              <span style={{ width: '110px' }}>
                <span style={{
                  ...styles.badge,
                  backgroundColor: ESTADOS_CUOTA[h.estado_cuota]?.color || '#888',
                }}>
                  {ESTADOS_CUOTA[h.estado_cuota]?.label || h.estado_cuota}
                </span>
              </span>
              <div style={{ width: '140px', display: 'flex', gap: '6px' }}>
                <button style={styles.btnEditar} onClick={() => abrirEdicion(h)}>
                  Editar
                </button>
                <button style={styles.btnEliminar} onClick={() => handleBaja(h)}>
                  Baja
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
              Editar hermano #{editando.numero_hermano}
            </h3>
            <form
              onSubmit={handleGuardarEdicion}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Nombre</label>
                  <input
                    style={styles.input} value={formEdit.nombre} required
                    onChange={e => setFormEdit({ ...formEdit, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label style={styles.label}>Apellidos</label>
                  <input
                    style={styles.input} value={formEdit.apellidos} required
                    onChange={e => setFormEdit({ ...formEdit, apellidos: e.target.value })}
                  />
                </div>
              </div>

              <label style={styles.label}>Dirección</label>
              <input
                style={styles.input} value={formEdit.direccion}
                onChange={e => setFormEdit({ ...formEdit, direccion: e.target.value })}
              />

              <div style={styles.grid3}>
                <div>
                  <label style={styles.label}>Nº Hermano</label>
                  <input
                    type="number" style={styles.input} value={formEdit.numero_hermano} required
                    onChange={e => setFormEdit({ ...formEdit, numero_hermano: e.target.value })}
                  />
                </div>
                <div>
                  <label style={styles.label}>Estado cuota</label>
                  <select
                    style={styles.input} value={formEdit.estado_cuota}
                    onChange={e => setFormEdit({ ...formEdit, estado_cuota: e.target.value })}
                  >
                    <option value="PAGADO">Pagado</option>
                    <option value="NO_PAGADO">No pagado</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Carácter</label>
                  <select
                    style={styles.input} value={formEdit.caracter}
                    onChange={e => setFormEdit({ ...formEdit, caracter: e.target.value })}
                  >
                    <option value="NAZARENO">Nazareno</option>
                    <option value="COSTALERO">Costalero</option>
                    <option value="MIEMBRO_JUNTA">Miembro de Junta</option>
                  </select>
                </div>
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
  page:    { padding: '24px', maxWidth: '960px', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  count:   { fontSize: '16px', fontWeight: '400', color: '#888' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },
  nota:    { fontSize: '12px', color: '#888', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px' },

  form: {
    background: 'white', borderRadius: '10px', padding: '24px',
    marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formTitulo: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  label:  { fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '4px' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },

  // Tabla
  tabla: {
    background: 'white', borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden',
  },
  tablaHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 20px', backgroundColor: '#1a1a2e',
    color: 'white', fontSize: '13px', fontWeight: '600',
  },
  fila: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
  },
  badge: {
    display: 'inline-block', padding: '3px 10px',
    borderRadius: '20px', fontSize: '12px',
    fontWeight: '600', color: 'white',
  },

  // Botones
  btnPrimary: {
    padding: '10px 20px', backgroundColor: '#1a1a2e', color: 'white',
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
    width: '100%', maxWidth: '520px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
  },
}