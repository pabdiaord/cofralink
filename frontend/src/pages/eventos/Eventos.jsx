import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const TIPOS = {
  TODOS:   { label: 'Todos',     emoji: '📋' },
  CULTO:   { label: 'Culto',     emoji: '🕯️' },
  ENSAYO:  { label: 'Ensayo',    emoji: '🥁' },
  REUNION: { label: 'Reunión',   emoji: '📋' },
  PRIOSTIA:{ label: 'Priostía',  emoji: '⚙️' },
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const colorTipo = {
  CULTO:    { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  ENSAYO:   { bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6' },
  REUNION:  { bg: '#dbeafe', border: '#2563eb', text: '#1e40af' },
  PRIOSTIA: { bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
}

export default function Eventos() {
  const { usuario } = useAuth()
  const [eventos, setEventos]           = useState([])
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState('')
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [enviando, setEnviando]         = useState(false)
  const [editando, setEditando]         = useState(null)
  const [guardando, setGuardando]       = useState(false)

  // ── Filtros ────────────────────────────────────────────────────
  const [busqueda, setBusqueda]         = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('TODOS')

  // ── Vista: 'lista' | 'mes' | 'semana' ──────────────────────────
  const [vista, setVista]               = useState('lista')
  const [fechaRef, setFechaRef]         = useState(new Date())

  const [form, setForm] = useState({
    nombre_evento: '', tipo_evento: 'CULTO',
    fecha: '', lugar: '', descripcion: '',
  })
  const [formEdit, setFormEdit] = useState({
    nombre_evento: '', tipo_evento: 'CULTO',
    fecha: '', lugar: '', descripcion: '',
  })

  // ── Cargar ────────────────────────────────────────────────────
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

  // ── Filtrado ──────────────────────────────────────────────────
  const eventosFiltrados = eventos.filter(ev => {
    const matchTipo = filtroTipo === 'TODOS' || ev.tipo_evento === filtroTipo
    const matchBusqueda = ev.nombre_evento.toLowerCase().includes(busqueda.toLowerCase()) ||
                          ev.lugar.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchBusqueda
  })

  // ── Crear ─────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post('/eventos/', form)
      setForm({ nombre_evento: '', tipo_evento: 'CULTO', fecha: '', lugar: '', descripcion: '' })
      setMostrarForm(false)
      await recargar()
    } catch { setError('Error al crear el evento.') }
    finally { setEnviando(false) }
  }

  // ── Editar ────────────────────────────────────────────────────
  const abrirEdicion = ev => {
    setEditando(ev)
    setFormEdit({
      nombre_evento: ev.nombre_evento,
      tipo_evento:   ev.tipo_evento,
      fecha:         new Date(ev.fecha).toISOString().slice(0, 16),
      lugar:         ev.lugar,
      descripcion:   ev.descripcion,
    })
  }

  const handleGuardarEdicion = async e => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.patch(`/eventos/${editando.id}/`, formEdit)
      setEditando(null)
      await recargar()
    } catch { setError('Error al editar.') }
    finally { setGuardando(false) }
  }

  // ── Eliminar ──────────────────────────────────────────────────
  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar este evento?')) return
    try {
      await api.delete(`/eventos/${id}/`)
      setEventos(prev => prev.filter(e => e.id !== id))
    } catch { setError('Error al eliminar.') }
  }

  // ── Inscribirse ───────────────────────────────────────────────
  const handleInscribirse = async id => {
    try {
      await api.post(`/eventos/${id}/inscribirse/`)
      await recargar()
      alert('✅ Inscripción confirmada.')
    } catch (err) {
      alert(err.response?.data?.error || 'Error al inscribirse.')
    }
  }

  if (cargando) return <p style={s.info}>Cargando eventos...</p>

  return (
    <div style={s.page}>

      {/* ── Cabecera ── */}
      <div style={s.header}>
        <h2 style={s.titulo}>Eventos</h2>
        {usuario?.is_staff && (
          <button style={s.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo evento'}
          </button>
        )}
      </div>

      {error && <p style={s.error}>{error}</p>}

      {/* ── Formulario nuevo evento ── */}
      {mostrarForm && (
        <FormEvento
          form={form} setForm={setForm}
          onSubmit={handleSubmit} enviando={enviando}
          titulo="Nuevo evento" btnLabel="Crear evento"
        />
      )}

      {/* ── Barra de filtros ── */}
      <div style={s.filtrosBar}>
        {/* Búsqueda */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Buscar evento o lugar..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button style={s.clearBtn} onClick={() => setBusqueda('')}>✕</button>
          )}
        </div>

        {/* Filtros por tipo */}
        <div style={s.tipoFiltros}>
          {Object.entries(TIPOS).map(([key, val]) => (
            <button
              key={key}
              style={{
                ...s.tipoBtn,
                ...(filtroTipo === key ? s.tipoBtnActivo : {}),
                ...(filtroTipo === key && key !== 'TODOS'
                  ? { backgroundColor: colorTipo[key]?.bg, borderColor: colorTipo[key]?.border, color: colorTipo[key]?.text }
                  : {})
              }}
              onClick={() => setFiltroTipo(key)}
            >
              {val.emoji} {val.label}
            </button>
          ))}
        </div>

        {/* Toggle vista */}
        <div style={s.vistaToggle}>
          {[
            { key: 'lista',  icon: '☰',  label: 'Lista' },
            { key: 'mes',    icon: '📅',  label: 'Mes' },
            { key: 'semana', icon: '📆',  label: 'Semana' },
          ].map(v => (
            <button
              key={v.key}
              style={{ ...s.vistaBtn, ...(vista === v.key ? s.vistaBtnActivo : {}) }}
              onClick={() => setVista(v.key)}
              title={v.label}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contador de resultados ── */}
      <p style={s.contador}>
        {eventosFiltrados.length === 0
          ? 'No hay eventos con estos filtros.'
          : `${eventosFiltrados.length} evento${eventosFiltrados.length !== 1 ? 's' : ''} encontrado${eventosFiltrados.length !== 1 ? 's' : ''}`}
      </p>

      {/* ── Contenido según vista ── */}
      {vista === 'lista' && (
        <ListaEventos
          eventos={eventosFiltrados}
          usuario={usuario}
          onEditar={abrirEdicion}
          onEliminar={handleEliminar}
          onInscribirse={handleInscribirse}
        />
      )}

      {vista === 'mes' && (
        <CalendarioMes
          eventos={eventosFiltrados}
          fechaRef={fechaRef}
          setFechaRef={setFechaRef}
          usuario={usuario}
          onEditar={abrirEdicion}
          onEliminar={handleEliminar}
          onInscribirse={handleInscribirse}
        />
      )}

      {vista === 'semana' && (
        <CalendarioSemana
          eventos={eventosFiltrados}
          fechaRef={fechaRef}
          setFechaRef={setFechaRef}
          usuario={usuario}
          onEditar={abrirEdicion}
          onEliminar={handleEliminar}
          onInscribirse={handleInscribirse}
        />
      )}

      {/* ── Modal edición ── */}
      {editando && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.formTitulo}>Editar evento</h3>
            <FormEvento
              form={formEdit} setForm={setFormEdit}
              onSubmit={handleGuardarEdicion} enviando={guardando}
              titulo="" btnLabel="Guardar cambios"
              extra={
                <button type="button" style={s.btnCancelar} onClick={() => setEditando(null)}>
                  Cancelar
                </button>
              }
            />
          </div>
        </div>
      )}

    </div>
  )
}

// ══════════════════════════════════════════════════════
// COMPONENTE: Formulario de evento (crear / editar)
// ══════════════════════════════════════════════════════
function FormEvento({ form, setForm, onSubmit, enviando, titulo, btnLabel, extra }) {
  return (
    <form onSubmit={onSubmit} style={s.form}>
      {titulo && <h3 style={s.formTitulo}>{titulo}</h3>}

      <label style={s.label}>Nombre del evento</label>
      <input style={s.input} value={form.nombre_evento} required
        onChange={e => setForm({ ...form, nombre_evento: e.target.value })}
        placeholder="Ej: Ensayo general de costaleros" />

      <label style={s.label}>Tipo</label>
      <select style={s.input} value={form.tipo_evento}
        onChange={e => setForm({ ...form, tipo_evento: e.target.value })}>
        <option value="CULTO">🕯️ Culto</option>
        <option value="ENSAYO">🥁 Ensayo</option>
        <option value="REUNION">📋 Reunión</option>
        <option value="PRIOSTIA">⚙️ Priostía</option>
      </select>

      <label style={s.label}>Fecha y hora</label>
      <input type="datetime-local" style={s.input} value={form.fecha} required
        onChange={e => setForm({ ...form, fecha: e.target.value })} />

      <label style={s.label}>Lugar</label>
      <input style={s.input} value={form.lugar} required
        onChange={e => setForm({ ...form, lugar: e.target.value })}
        placeholder="Ej: Casa de Hermandad" />

      <label style={s.label}>Descripción (opcional)</label>
      <textarea style={{ ...s.input, height: '72px', resize: 'vertical' }}
        value={form.descripcion}
        onChange={e => setForm({ ...form, descripcion: e.target.value })}
        placeholder="Detalles del evento..." />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" disabled={enviando} style={s.btnPrimary}>
          {enviando ? 'Guardando...' : btnLabel}
        </button>
        {extra}
      </div>
    </form>
  )
}

// ══════════════════════════════════════════════════════
// COMPONENTE: Lista de eventos
// ══════════════════════════════════════════════════════
function ListaEventos({ eventos, usuario, onEditar, onEliminar, onInscribirse }) {
  if (eventos.length === 0) return null
  return (
    <div style={s.lista}>
      {eventos.map(ev => <TarjetaEvento key={ev.id} ev={ev} usuario={usuario}
        onEditar={onEditar} onEliminar={onEliminar} onInscribirse={onInscribirse} />)}
    </div>
  )
}

function TarjetaEvento({ ev, usuario, onEditar, onEliminar, onInscribirse }) {
  const col = colorTipo[ev.tipo_evento] || {}
  return (
    <div style={{ ...s.card, borderLeft: `4px solid ${col.border || '#ccc'}` }}>
      <div style={s.cardTop}>
        <span style={{ ...s.badge, backgroundColor: col.bg, color: col.text, borderColor: col.border }}>
          {TIPOS[ev.tipo_evento]?.emoji} {TIPOS[ev.tipo_evento]?.label}
        </span>
        {usuario?.is_staff && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={s.btnEditar} onClick={() => onEditar(ev)}>Editar</button>
            <button style={s.btnEliminar} onClick={() => onEliminar(ev.id)}>Eliminar</button>
          </div>
        )}
      </div>
      <h3 style={s.cardTitulo}>{ev.nombre_evento}</h3>
      <div style={s.meta}>
        <span>📅 {new Date(ev.fecha).toLocaleDateString('es-ES', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}</span>
        <span>🕐 {new Date(ev.fecha).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}</span>
        <span>📍 {ev.lugar}</span>
      </div>
      {ev.descripcion && <p style={s.descripcion}>{ev.descripcion}</p>}
      <div style={s.cardFooter}>
        <span style={s.inscritos}>👥 {ev.total_inscritos} inscritos</span>
        {!usuario?.is_staff && (
          <button style={s.btnInscribirse} onClick={() => onInscribirse(ev.id)}>Inscribirme</button>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// COMPONENTE: Calendario mensual
// ══════════════════════════════════════════════════════
function CalendarioMes({ eventos, fechaRef, setFechaRef, usuario, onEditar, onEliminar, onInscribirse }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  const year  = fechaRef.getFullYear()
  const month = fechaRef.getMonth()

  // Primer día del mes (0=Dom, ajustado a lunes)
  const primerDia = new Date(year, month, 1)
  const offsetLun = (primerDia.getDay() + 6) % 7  // 0=Lun
  const diasEnMes = new Date(year, month + 1, 0).getDate()

  // Eventos indexados por día "YYYY-MM-DD"
  const eventosPorDia = {}
  eventos.forEach(ev => {
    const key = new Date(ev.fecha).toLocaleDateString('sv-SE') // YYYY-MM-DD
    if (!eventosPorDia[key]) eventosPorDia[key] = []
    eventosPorDia[key].push(ev)
  })

  const celdas = []
  for (let i = 0; i < offsetLun; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  const hoy  = new Date()
  const esHoy = d => d && year === hoy.getFullYear() && month === hoy.getMonth() && d === hoy.getDate()

  const keyDia = d => {
    if (!d) return null
    return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  const eventosDiaSeleccionado = diaSeleccionado
    ? (eventosPorDia[keyDia(diaSeleccionado)] || [])
    : []

  return (
    <div>
      {/* Navegación mes */}
      <div style={s.calNav}>
        <button style={s.calNavBtn} onClick={() => setFechaRef(new Date(year, month-1, 1))}>‹</button>
        <span style={s.calNavTitulo}>{MESES[month]} {year}</span>
        <button style={s.calNavBtn} onClick={() => setFechaRef(new Date(year, month+1, 1))}>›</button>
        <button style={s.calHoyBtn} onClick={() => { setFechaRef(new Date()); setDiaSeleccionado(null) }}>Hoy</button>
      </div>

      {/* Cabecera días */}
      <div style={s.calGrid7}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={s.calDiaNombre}>{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div style={s.calGrid7}>
        {celdas.map((d, i) => {
          const key    = keyDia(d)
          const evs    = d ? (eventosPorDia[key] || []) : []
          const activo = diaSeleccionado === d
          return (
            <div
              key={i}
              style={{
                ...s.calCelda,
                ...(d ? s.calCeldaActiva : s.calCeldaVacia),
                ...(esHoy(d) ? s.calCeldaHoy : {}),
                ...(activo ? s.calCeldaSeleccionada : {}),
              }}
              onClick={() => d && setDiaSeleccionado(activo ? null : d)}
            >
              {d && (
                <>
                  <span style={{ ...s.calNumDia, ...(esHoy(d) ? { color: 'white' } : {}) }}>{d}</span>
                  <div style={s.calEventsWrap}>
                    {evs.slice(0, 3).map(ev => {
                      const col = colorTipo[ev.tipo_evento] || {}
                      return (
                        <div key={ev.id} style={{ ...s.calEventoPill, backgroundColor: col.bg, color: col.text, borderLeft: `2px solid ${col.border}` }}>
                          {TIPOS[ev.tipo_evento]?.emoji} {ev.nombre_evento.slice(0, 14)}{ev.nombre_evento.length > 14 ? '…' : ''}
                        </div>
                      )
                    })}
                    {evs.length > 3 && <div style={s.calMas}>+{evs.length - 3} más</div>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Detalle día seleccionado */}
      {diaSeleccionado && (
        <div style={s.detalleDia}>
          <h4 style={s.detalleDiaTitulo}>
            📅 {diaSeleccionado} de {MESES[month]}
            {eventosDiaSeleccionado.length === 0 && <span style={{ fontWeight: '400', color: '#888' }}> — Sin eventos</span>}
          </h4>
          {eventosDiaSeleccionado.map(ev => (
            <TarjetaEvento key={ev.id} ev={ev} usuario={usuario}
              onEditar={onEditar} onEliminar={onEliminar} onInscribirse={onInscribirse} />
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// COMPONENTE: Calendario semanal
// ══════════════════════════════════════════════════════
function CalendarioSemana({ eventos, fechaRef, setFechaRef, usuario, onEditar, onEliminar, onInscribirse }) {
  // Lunes de la semana
  const lunes = new Date(fechaRef)
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    return d
  })

  const hoy = new Date()
  const esHoy = d => d.toDateString() === hoy.toDateString()

  const keyFecha = d => d.toLocaleDateString('sv-SE')

  const eventosPorDia = {}
  eventos.forEach(ev => {
    const key = new Date(ev.fecha).toLocaleDateString('sv-SE')
    if (!eventosPorDia[key]) eventosPorDia[key] = []
    eventosPorDia[key].push(ev)
  })

  const irSemana = n => {
    const nueva = new Date(fechaRef)
    nueva.setDate(nueva.getDate() + n * 7)
    setFechaRef(nueva)
  }

  const inicioStr = `${dias[0].getDate()} ${MESES[dias[0].getMonth()]}`
  const finStr    = `${dias[6].getDate()} ${MESES[dias[6].getMonth()]} ${dias[6].getFullYear()}`

  return (
    <div>
      {/* Navegación semana */}
      <div style={s.calNav}>
        <button style={s.calNavBtn} onClick={() => irSemana(-1)}>‹</button>
        <span style={s.calNavTitulo}>{inicioStr} – {finStr}</span>
        <button style={s.calNavBtn} onClick={() => irSemana(1)}>›</button>
        <button style={s.calHoyBtn} onClick={() => setFechaRef(new Date())}>Hoy</button>
      </div>

      {/* Columnas de días */}
      <div style={s.semanaGrid}>
        {dias.map((dia, i) => {
          const evs = eventosPorDia[keyFecha(dia)] || []
          return (
            <div key={i} style={{ ...s.semanaCol, ...(esHoy(dia) ? s.semanaColHoy : {}) }}>
              <div style={s.semanaDiaNombre}>{DIAS_SEMANA[i]}</div>
              <div style={{ ...s.semanaDiaNum, ...(esHoy(dia) ? s.semanaDiaNumHoy : {}) }}>
                {dia.getDate()}
              </div>
              <div style={s.semanaEventos}>
                {evs.length === 0 && <div style={s.semanaVacio}>—</div>}
                {evs.map(ev => {
                  const col = colorTipo[ev.tipo_evento] || {}
                  return (
                    <div key={ev.id} style={{ ...s.semanaEvento, backgroundColor: col.bg, borderLeft: `3px solid ${col.border}`, color: col.text }}>
                      <div style={s.semanaEventoHora}>
                        🕐 {new Date(ev.fecha).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                      <div style={s.semanaEventoNombre}>
                        {TIPOS[ev.tipo_evento]?.emoji} {ev.nombre_evento}
                      </div>
                      <div style={s.semanaEventoLugar}>📍 {ev.lugar}</div>
                      {!usuario?.is_staff && (
                        <button style={s.semanaEventoBtn} onClick={() => onInscribirse(ev.id)}>
                          Inscribirme
                        </button>
                      )}
                      {usuario?.is_staff && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          <button style={s.semanaEditBtn} onClick={() => onEditar(ev)}>✏️</button>
                          <button style={s.semanaDeleteBtn} onClick={() => onEliminar(ev.id)}>🗑️</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════
const s = {
  page:    { padding: '24px', maxWidth: '1100px', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  titulo:  { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '12px', fontSize: '14px' },
  contador:{ fontSize: '13px', color: '#888', marginBottom: '16px' },

  // Filtros
  filtrosBar: {
    display: 'flex', flexWrap: 'wrap', gap: '12px',
    alignItems: 'center', marginBottom: '12px',
    padding: '14px 16px', backgroundColor: 'white',
    borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    border: '1px solid #ddd', borderRadius: '8px',
    padding: '6px 12px', flex: '1', minWidth: '200px',
    backgroundColor: '#fafafa',
  },
  searchIcon:  { fontSize: '14px', color: '#888' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', flex: 1, backgroundColor: 'transparent' },
  clearBtn:    { border: 'none', background: 'none', cursor: 'pointer', color: '#888', fontSize: '12px' },
  tipoFiltros: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tipoBtn: {
    padding: '5px 12px', borderRadius: '20px', border: '1px solid #ddd',
    background: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '500', color: '#555',
  },
  tipoBtnActivo: { fontWeight: '700' },
  vistaToggle: { display: 'flex', gap: '4px', marginLeft: 'auto' },
  vistaBtn: {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd',
    background: 'white', cursor: 'pointer', fontSize: '12px', color: '#555', fontWeight: '500',
  },
  vistaBtnActivo: { backgroundColor: '#1a1a2e', color: 'white', borderColor: '#1a1a2e' },

  // Formulario
  form: {
    background: 'white', borderRadius: '10px', padding: '20px',
    marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formTitulo: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#444' },
  input: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
  },

  // Cards lista
  lista: { display: 'flex', flexDirection: 'column', gap: '14px' },
  card:  { background: 'white', borderRadius: '10px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  badge: {
    display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600', border: '1px solid',
  },
  cardTitulo:  { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' },
  meta:        { display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#555', marginBottom: '8px' },
  descripcion: { fontSize: '13px', color: '#666', lineHeight: '1.5', marginBottom: '10px' },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  inscritos:   { fontSize: '13px', color: '#777' },

  // Botones
  btnPrimary: {
    padding: '10px 20px', backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600',
  },
  btnEditar: {
    padding: '5px 12px', background: 'transparent', color: '#1a1a2e',
    border: '1px solid #1a1a2e', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
  },
  btnEliminar: {
    padding: '5px 12px', background: 'transparent', color: '#e53e3e',
    border: '1px solid #e53e3e', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
  },
  btnInscribirse: {
    padding: '7px 16px', backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600',
  },
  btnCancelar: {
    padding: '10px 20px', backgroundColor: '#eee', color: '#333',
    border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600',
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'white', borderRadius: '12px', padding: '28px',
    width: '100%', maxWidth: '500px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
    maxHeight: '90vh', overflowY: 'auto',
  },

  // Calendario compartido
  calNav: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '12px', padding: '10px 0',
  },
  calNavBtn: {
    width: '34px', height: '34px', borderRadius: '50%', border: '1px solid #ddd',
    background: 'white', cursor: 'pointer', fontSize: '18px', color: '#1a1a2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  calNavTitulo: { fontWeight: '700', fontSize: '16px', color: '#1a1a2e', flex: 1, textAlign: 'center' },
  calHoyBtn: {
    padding: '6px 14px', border: '1px solid #1a1a2e', borderRadius: '6px',
    background: 'white', cursor: 'pointer', fontSize: '13px', color: '#1a1a2e', fontWeight: '600',
  },

  // Calendario mensual
  calGrid7: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px', background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden',
  },
  calDiaNombre: {
    background: '#1a1a2e', color: 'white', textAlign: 'center',
    padding: '8px 4px', fontSize: '12px', fontWeight: '700',
  },
  calCelda: { background: 'white', minHeight: '100px', padding: '6px', cursor: 'pointer', transition: 'background 0.15s' },
  calCeldaActiva: { background: 'white' },
  calCeldaVacia:  { background: '#f9fafb', cursor: 'default' },
  calCeldaHoy:    { background: '#1a1a2e' },
  calCeldaSeleccionada: { background: '#f0f4ff', outline: '2px solid #1a1a2e' },
  calNumDia: { fontSize: '13px', fontWeight: '700', color: '#1a1a2e', display: 'block', marginBottom: '4px' },
  calEventsWrap: { display: 'flex', flexDirection: 'column', gap: '2px' },
  calEventoPill: {
    fontSize: '10px', padding: '2px 4px', borderRadius: '3px',
    fontWeight: '500', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  },
  calMas: { fontSize: '10px', color: '#888', paddingLeft: '4px' },

  // Detalle día
  detalleDia: {
    marginTop: '20px', padding: '16px', background: '#f8faff',
    borderRadius: '10px', border: '1px solid #dde',
  },
  detalleDiaTitulo: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '14px' },

  // Calendario semanal
  semanaGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
  },
  semanaCol: {
    background: 'white', borderRadius: '8px', padding: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minHeight: '200px',
  },
  semanaColHoy: { outline: '2px solid #1a1a2e' },
  semanaDiaNombre: { fontSize: '11px', fontWeight: '700', color: '#888', textAlign: 'center', marginBottom: '4px' },
  semanaDiaNum: {
    fontSize: '18px', fontWeight: '700', color: '#1a1a2e',
    textAlign: 'center', marginBottom: '10px',
  },
  semanaDiaNumHoy: {
    width: '30px', height: '30px', borderRadius: '50%',
    backgroundColor: '#1a1a2e', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 10px', fontSize: '14px',
  },
  semanaEventos:    { display: 'flex', flexDirection: 'column', gap: '6px' },
  semanaVacio:      { textAlign: 'center', color: '#ccc', fontSize: '20px', marginTop: '20px' },
  semanaEvento: {
    borderRadius: '6px', padding: '8px',
    fontSize: '11px', lineHeight: '1.4',
  },
  semanaEventoHora:   { fontWeight: '600', marginBottom: '2px' },
  semanaEventoNombre: { fontWeight: '700', fontSize: '12px', marginBottom: '2px' },
  semanaEventoLugar:  { color: '#555', marginBottom: '4px' },
  semanaEventoBtn: {
    fontSize: '10px', padding: '3px 8px', backgroundColor: '#1a1a2e',
    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%',
  },
  semanaEditBtn: {
    flex: 1, fontSize: '11px', padding: '2px', background: 'transparent',
    border: 'none', cursor: 'pointer',
  },
  semanaDeleteBtn: {
    flex: 1, fontSize: '11px', padding: '2px', background: 'transparent',
    border: 'none', cursor: 'pointer',
  },
}