import { useState, useEffect } from 'react'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormModal from '../../components/FormModal'
import CharacterIcon from '../../components/CharacterIcon'
import StatusBadge from '../../components/StatusBadge'
import SelectField from '../../components/SelectField'
import SearchField from '../../components/SearchField'
import Pagination, { getPageData } from '../../components/Pagination'
import { CHARACTER_INFO } from '../../constants/characterInfo'

const ESTADOS_CUOTA = {
  PAGADO:    { label: 'Pagado', tone: 'success' },
  NO_PAGADO: { label: 'No pagado', tone: 'danger' },
}

const OPCIONES_ESTADO_CUOTA = [
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'NO_PAGADO', label: 'No pagado' },
]

const OPCIONES_CARACTER = [
  { value: 'NAZARENO', label: 'Nazareno' },
  { value: 'COSTALERO', label: 'Costalero' },
  { value: 'MIEMBRO_JUNTA', label: 'Miembro de Junta' },
]

export default function Hermanos() {
  const [hermanos, setHermanos]       = useState([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [busqueda, setBusqueda]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroCaracter, setFiltroCaracter] = useState('TODOS')
  const [paginaActual, setPaginaActual] = useState(1)
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
    setError('')
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
  const { currentPage, pageItems: hermanosPaginados } = getPageData(hermonosFiltrados, paginaActual)

  if (cargando) return <p style={styles.info}>Cargando hermanos...</p>

  return (
    <div className="content-page hermanos-page" style={styles.page}>

      {/* Cabecera */}
      <div className="page-header" style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Gestión de la Hermandad</p>
          <h2 style={styles.titulo}>Hermanos</h2>
          <div style={styles.headerMeta}>
          <span style={styles.totalBadge}>{totalHermanos} hermano{totalHermanos !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button style={styles.btnPrimary} onClick={() => { setError(''); setMostrarForm(true) }}>
          + Nuevo hermano
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
                aria-pressed={filtroEstado === opcion}
                onClick={() => { setFiltroEstado(opcion); setPaginaActual(1) }}
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
                aria-pressed={filtroCaracter === opcion}
                onClick={() => { setFiltroCaracter(opcion); setPaginaActual(1) }}
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
      <SearchField
        className="search-wrap"
        style={styles.searchWrap}
        value={busqueda}
        onChange={valor => { setBusqueda(valor); setPaginaActual(1) }}
        placeholder="Buscar por nombre o número..."
        ariaLabel="Buscar hermanos"
      />

      {/* Formulario nuevo hermano */}
      {mostrarForm && (
        <FormModal
          title="Nuevo hermano"
          onClose={() => setMostrarForm(false)}
          error={error}
          closeDisabled={enviando || confirmOpen}
          maxWidth="680px"
        >
          <form className="data-form" onSubmit={handleSubmit} style={styles.form}>

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
              <SelectField
                value={form.estado_cuota}
                onChange={value => setForm({ ...form, estado_cuota: value })}
                options={OPCIONES_ESTADO_CUOTA}
                ariaLabel="Estado de la cuota"
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Carácter</label>
              <SelectField
                value={form.caracter}
                onChange={value => setForm({ ...form, caracter: value })}
                options={OPCIONES_CARACTER}
                ariaLabel="Carácter del hermano"
                style={styles.input}
              />
            </div>
          </div>

          <p style={styles.nota}>
            💡 Se enviará al email indicado un enlace único para que el hermano establezca su contraseña.
            No se crea ninguna contraseña temporal y el enlace caduca en 24 horas.
          </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="submit" disabled={enviando} style={styles.btnPrimary}>
                {enviando ? 'Creando...' : 'Crear hermano'}
              </button>
              <button type="button" style={styles.btnCancelar} onClick={() => setMostrarForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </FormModal>
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
          {hermanosPaginados.map(h => (
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
                <StatusBadge tone={ESTADOS_CUOTA[h.estado_cuota]?.tone}>
                  {ESTADOS_CUOTA[h.estado_cuota]?.label || h.estado_cuota}
                </StatusBadge>
              </span>
              <div style={{ width: '140px', display: 'flex', gap: '6px' }}>
                <button className="action-button action-button--edit" onClick={() => abrirEdicion(h)}>
                  Editar
                </button>
                <button className="action-button action-button--danger" onClick={() => handleBaja(h)}>
                  Baja
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal edición */}
      <Pagination
        currentPage={currentPage}
        totalItems={hermonosFiltrados.length}
        onPageChange={setPaginaActual}
        itemLabel="hermanos"
      />

      {editando && (
        <FormModal
          title={`Editar hermano #${editando.numero_hermano}`}
          onClose={() => setEditando(null)}
          error={error}
          closeDisabled={guardando || confirmOpen}
          maxWidth="620px"
        >
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
                  <SelectField
                    value={formEdit.estado_cuota}
                    onChange={value => setFormEdit({ ...formEdit, estado_cuota: value })}
                    options={OPCIONES_ESTADO_CUOTA}
                    ariaLabel="Estado de la cuota"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Carácter</label>
                  <SelectField
                    value={formEdit.caracter}
                    onChange={value => setFormEdit({ ...formEdit, caracter: value })}
                    options={OPCIONES_CARACTER}
                    ariaLabel="Carácter del hermano"
                    style={styles.input}
                  />
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
        </FormModal>
      )}

    </div>
  )
}

const styles = {
  page:    { padding: '32px', maxWidth: '1440px', width: '100%', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '28px' },
  eyebrow: { margin: '0 0 3px', color: '#95713a', fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase' },
  titulo:  { margin: 0, fontSize: '30px', fontWeight: '700', color: '#2c1810' },
  headerMeta: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '9px', marginTop: '5px' },
  intro: { margin: 0, color: '#765f4d', fontSize: '15px' },
  totalBadge: { padding: '4px 9px', borderRadius: '999px', color: '#765b45', background: 'rgba(201,168,76,0.12)', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '16px', fontSize: '14px' },
  nota:    { fontSize: '12px', color: '#888', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px' },
  filtersPanel: {
    background: '#ffffff',
    border: '1px solid #e3dedb',
    borderRadius: '14px',
    padding: '16px 16px 12px',
    boxShadow: '0 5px 18px rgba(36,24,19,0.045)',
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
    background: '#241813',
    borderColor: '#241813',
    color: '#fffaf5',
    boxShadow: 'none',
    transform: 'none',
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
    padding: 0, margin: 0,
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
    background: '#ffffff', borderRadius: '14px',
    boxShadow: '0 5px 18px rgba(36,24,19,0.045)', overflow: 'hidden', border: '1px solid #e3dedb',
  },
  tablaHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 20px', background: '#f8f6f4',
    color: '#625853', fontSize: '12px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  fila: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 20px', borderBottom: '1px solid rgba(117, 82, 52, 0.08)',
    fontSize: '14px',
  },
  characterCell: { display: 'flex', alignItems: 'center', gap: '7px' },
  characterIcon: { width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 },

  // Botones
  btnPrimary: {
    padding: '10px 20px', background: '#241813', color: '#fffaf5',
    border: 'none', borderRadius: '10px', fontSize: '14px',
    cursor: 'pointer', fontWeight: '700', alignSelf: 'flex-start', boxShadow: 'none',
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
