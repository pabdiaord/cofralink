import { useState, useEffect } from 'react'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'
import CharacterIcon from '../../components/CharacterIcon'
import { CHARACTER_INFO } from '../../constants/characterInfo'

const ESTADOS_CUOTA = {
  PAGADO:    { label: 'Pagado',     color: '#38a169' },
  NO_PAGADO: { label: 'No pagado',  color: '#e53e3e' },
}

export default function Hermanos() {
  const [hermanos, setHermanos]       = useState([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [busqueda, setBusqueda]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroCaracter, setFiltroCaracter] = useState('TODOS')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando]       = useState(false)
  const [editando, setEditando]       = useState(null)
  const [guardando, setGuardando]     = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const formVacio = {
  nombre: '', apellidos: '', direccion: '', email: '',
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

  const totalHermanos = hermanos.length
  const totalPagados = hermanos.filter(h => h.estado_cuota === 'PAGADO').length
  const totalPendientes = hermanos.filter(h => h.estado_cuota === 'NO_PAGADO').length
  const totalNazarenos = hermanos.filter(h => h.caracter === 'NAZARENO').length
  const totalCostaleros = hermanos.filter(h => h.caracter === 'COSTALERO').length
  const totalJunta = hermanos.filter(h => h.caracter === 'MIEMBRO_JUNTA').length

  //Crear
const openConfirm = (action, payload = null) => {
    setPendingAction({ action, payload })
    setConfirmOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    const { action, payload } = pendingAction
    setConfirmOpen(false)

    if (action === 'create-hermano') {
      setEnviando(true)
      setError('')
      try {
        await api.post('/hermanos/crear-completo/', {
          nombre:         form.nombre,
          apellidos:      form.apellidos,
          direccion:      form.direccion,
          email:          form.email,
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

    if (action === 'edit-hermano') {
      setGuardando(true)
      try {
        await api.patch(`/hermanos/${payload.id}/`, payload.data)
        setEditando(null)
        await recargar()
      } catch {
        setError('Error al editar el hermano.')
      } finally {
        setGuardando(false)
      }
    }

    if (action === 'delete-hermano') {
      try {
        await api.delete(`/hermanos/${payload.id}/`)
        await recargar()
      } catch {
        setError('Error al dar de baja al hermano.')
      }
    }

    setPendingAction(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    openConfirm('create-hermano')
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
    openConfirm('edit-hermano', { id: editando.id, data: formEdit })
  }

  //Dar de baja
  const handleBaja = async h => {
    openConfirm('delete-hermano', { id: h.id, nombre: `${h.nombre} ${h.apellidos}` })
  }

  //Filtro búsqueda y filtros rápidos
  const hermonosFiltrados = hermanos.filter(h => {
    const texto = `${h.nombre} ${h.apellidos} ${h.numero_hermano}`.toLowerCase()
    const coincideBusqueda = texto.includes(busqueda.toLowerCase())
    const coincideEstado = filtroEstado === 'TODOS' || h.estado_cuota === filtroEstado
    const coincideCaracter = filtroCaracter === 'TODOS' || h.caracter === filtroCaracter

    return coincideBusqueda && coincideEstado && coincideCaracter
  })

  if (cargando) return <p style={styles.info}>Cargando hermanos...</p>

  return (
    <div className="content-page hermanos-page" style={styles.page}>

      {/* Cabecera */}
      <div className="page-header" style={styles.header}>
        <h2 style={styles.titulo}>Hermanos <span style={styles.count}>({hermanos.length})</span></h2>
        <button style={styles.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo hermano'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction?.action === 'delete-hermano' ? 'Dar de baja' : pendingAction?.action === 'create-hermano' ? 'Crear hermano' : 'Guardar cambios'}
        message={pendingAction?.action === 'delete-hermano'
          ? `¿Seguro que quieres dar de baja a ${pendingAction.payload?.nombre}? Esta acción eliminará también su cuenta de usuario.`
          : pendingAction?.action === 'create-hermano'
            ? '¿Quieres crear este nuevo hermano con los datos introducidos?'
            : '¿Deseas guardar los cambios del hermano?'}
        confirmText={pendingAction?.action === 'delete-hermano' ? 'Dar de baja' : 'Confirmar'}
        danger={pendingAction?.action === 'delete-hermano'}
        onConfirm={executePendingAction}
        onCancel={() => { setConfirmOpen(false); setPendingAction(null) }}
      />

      <div className="filters-panel" style={styles.filtersPanel}>
        <div style={styles.filterBlock}>
          <span style={styles.filterLabel}>Estado de cuota</span>
          <div className="chip-row" style={styles.chipRow}>
            {['TODOS', 'PAGADO', 'NO_PAGADO'].map(opcion => (
              <button
                key={opcion}
                type="button"
                onClick={() => setFiltroEstado(opcion)}
                style={{
                  ...styles.filterChip,
                  ...(filtroEstado === opcion ? styles.filterChipActive : {}),
                }}
              >
                {opcion === 'TODOS' ? 'Todos' : opcion === 'PAGADO' ? 'Pagados' : 'Pendientes'}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.filterBlock}>
          <span style={styles.filterLabel}>Carácter</span>
          <div className="chip-row" style={styles.chipRow}>
            {['TODOS', 'NAZARENO', 'COSTALERO', 'MIEMBRO_JUNTA'].map(opcion => (
              <button
                key={opcion}
                type="button"
                onClick={() => setFiltroCaracter(opcion)}
                style={{
                  ...styles.filterChip,
                  ...(filtroCaracter === opcion ? styles.filterChipActive : {}),
                }}
              >
                {opcion === 'TODOS' ? 'Todos' : opcion === 'NAZARENO' ? 'Nazarenos' : opcion === 'COSTALERO' ? 'Costaleros' : 'Junta'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="search-wrap" style={styles.searchWrap}>
        <input
          style={styles.input}
          placeholder="🔍 Buscar por nombre o número..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Formulario nuevo hermano */}
      {mostrarForm && (
        <form className="data-form" onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitulo}>Nuevo hermano</h3>

          <div className="form-grid-2" style={styles.grid2}>
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
          <label style={styles.label}>Email del hermano</label>
          <input
            type="email"
            style={styles.input} value={form.email} required
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="hermano@ejemplo.com"
          />
          <div className="form-grid-3" style={styles.grid3}>
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
            💡 Se enviará al email indicado un enlace único para que el hermano establezca su contraseña.
            No se crea ninguna contraseña temporal y el enlace caduca en 24 horas.
          </p>

          <button type="submit" disabled={enviando} style={styles.btnPrimary}>
            {enviando ? 'Creando...' : 'Crear hermano'}
          </button>
        </form>
      )}

      <div style={styles.resultMeta}>
        <span>
          Mostrando <strong>{hermonosFiltrados.length}</strong> de <strong>{totalHermanos}</strong> hermanos
        </span>
      </div>

      {/* Tabla de hermanos */}
      {hermonosFiltrados.length === 0 ? (
        <p style={styles.info}>No se encontraron hermanos con esos filtros.</p>
      ) : (
        <div className="data-table" style={styles.tabla}>
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
              <span style={{ width: '60px', fontWeight: '700', color: '#2c1810' }}>
                #{h.numero_hermano}
              </span>
              <span style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#2c1810' }}>{h.nombre} {h.apellidos}</div>
                {h.direccion && <div style={{ fontSize: '12px', color: '#888' }}>{h.direccion}</div>}
              </span>
              <span style={{ ...styles.characterCell, width: '140px', fontSize: '13px' }}>
                <CharacterIcon caracter={h.caracter} alt="" style={styles.characterIcon} />
                {CHARACTER_INFO[h.caracter]?.label || h.caracter}
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
          <div className="responsive-modal" style={styles.modal}>
            <h3 style={styles.formTitulo}>
              Editar hermano #{editando.numero_hermano}
            </h3>
            <form
              onSubmit={handleGuardarEdicion}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div className="form-grid-2" style={styles.grid2}>
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

              <div className="form-grid-3" style={styles.grid3}>
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
  page:    { padding: '32px', maxWidth: '1440px', width: '100%', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#2c1810' },
  count:   { fontSize: '16px', fontWeight: '400', color: '#888' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },
  nota:    { fontSize: '12px', color: '#888', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px' },
  filtersPanel: {
    background: 'linear-gradient(135deg, rgba(255,250,245,0.96), rgba(244,234,222,0.9))',
    border: '1px solid rgba(117, 82, 52, 0.15)',
    borderRadius: '18px',
    padding: '18px 18px 12px',
    boxShadow: '0 12px 26px rgba(44, 24, 16, 0.06)',
    marginBottom: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  filterBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: { fontSize: '10px', fontWeight: '800', color: '#7d5f42', letterSpacing: '0.15em', textTransform: 'uppercase' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  filterChip: {
    border: '1px solid rgba(117, 82, 52, 0.25)',
    background: 'rgba(255,255,255,0.45)',
    color: '#3d2a20',
    borderRadius: '999px',
    fontSize: '12px',
    padding: '8px 13px',
    cursor: 'pointer',
    fontWeight: '700',
    letterSpacing: '0.02em',
    transition: 'all 0.18s ease',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
  },
  filterChipActive: {
    background: 'linear-gradient(135deg, #2c1810, #563522)',
    borderColor: '#2c1810',
    color: '#f5e6c8',
    boxShadow: '0 8px 16px rgba(44, 24, 16, 0.17)',
    transform: 'translateY(-1px)',
  },
  searchWrap: {
    marginBottom: '18px',
  },
  resultMeta: {
    fontSize: '13px',
    color: '#5c4d46',
    marginBottom: '12px',
    padding: '8px 12px',
    borderRadius: '10px',
    background: 'rgba(201,168,76,0.08)',
    border: '1px solid rgba(201,168,76,0.2)',
    display: 'inline-block',
  },

  form: {
    background: 'linear-gradient(135deg, rgba(255,250,245,0.98), rgba(239,227,215,0.96))', borderRadius: '18px', padding: '24px',
    marginBottom: '24px', boxShadow: '0 12px 26px rgba(44, 24, 16, 0.06)', border: '1px solid rgba(117, 82, 52, 0.14)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formTitulo: { fontSize: '16px', fontWeight: '700', color: '#2c1810', marginBottom: '4px' },
  label:  { fontSize: '13px', fontWeight: '700', color: '#7d5f42', display: 'block', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid rgba(117, 82, 52, 0.2)', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'rgba(255,255,255,0.54)',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },

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
    padding: '14px 20px', borderBottom: '1px solid rgba(117, 82, 52, 0.08)',
    fontSize: '14px',
  },
  badge: {
    display: 'inline-block', padding: '3px 10px',
    borderRadius: '20px', fontSize: '12px',
    fontWeight: '700', color: 'white',
  },
  characterCell: { display: 'flex', alignItems: 'center', gap: '7px' },
  characterIcon: { width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 },

  // Botones
  btnPrimary: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee',
    border: 'none', borderRadius: '10px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '700', alignSelf: 'flex-start', boxShadow: '0 8px 16px rgba(44, 24, 16, 0.17)',
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
    padding: '10px 20px', backgroundColor: '#efe4d9', color: '#2c1810',
    border: 'none', borderRadius: '10px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '700',
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,245,241,0.98))', borderRadius: '18px', padding: '32px',
    width: '100%', maxWidth: '520px', boxShadow: '0 10px 28px rgba(44,24,16,0.18)', border: '1px solid rgba(117, 82, 52, 0.12)',
  },
}
