import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'
import SearchField from '../../components/SearchField'
import SelectField from '../../components/SelectField'
import AppIcon from '../../components/AppIcon'
import Pagination, { getPageData } from '../../components/Pagination'

const TIPOS = {
  TODOS:   { label: 'Todos' },
  CULTO:   { label: 'Culto' },
  ENSAYO:  { label: 'Ensayo' },
  REUNION: { label: 'Reunión' },
  PRIOSTIA:{ label: 'Priostía' },
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const colorTipo = {
  CULTO:    { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  ENSAYO:   { bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6' },
  REUNION:  { bg: '#dbeafe', border: '#2563eb', text: '#1e40af' },
  PRIOSTIA: { bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
}

// Tonos claros para conservar contraste sobre el fondo marrón del filtro activo.
const colorFiltroActivo = {
  CULTO:    '#ffd166',
  ENSAYO:   '#d8b4fe',
  REUNION:  '#93c5fd',
  PRIOSTIA: '#86efac',
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
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // ── Filtros ────────────────────────────────────────────────────
  const [busqueda, setBusqueda]         = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('TODOS')
  const [paginaActual, setPaginaActual] = useState(1)

  // ── Vista: 'lista' | 'mes' | 'semana' ──────────────────────────
  const [vista, setVista]               = useState('lista')
  const [seccionLista, setSeccionLista] = useState('proximos')
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
  const ahora = new Date()
  const eventosFuturos = eventosFiltrados.filter(ev => new Date(ev.fecha) >= ahora)
  const eventosPasados = eventosFiltrados.filter(ev => new Date(ev.fecha) < ahora)
  const eventosDeLista = seccionLista === 'proximos' ? eventosFuturos : eventosPasados
  const { currentPage, pageItems: eventosPaginados } = getPageData(eventosDeLista, paginaActual, 10)

  // ── Crear ─────────────────────────────────────────────────────
  const openConfirm = (action, payload = null) => {
    setPendingAction({ action, payload })
    setConfirmOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    const { action, payload } = pendingAction
    setConfirmOpen(false)

    if (action === 'delete-evento') {
      try {
        await api.delete(`/eventos/${payload}/`)
        setEventos(prev => prev.filter(e => e.id !== payload))
      } catch { setError('Error al eliminar.') }
      setPendingAction(null)
      return
    }

    if (action === 'create-evento') {
      setEnviando(true)
      try {
        await api.post('/eventos/', form)
        setForm({ nombre_evento: '', tipo_evento: 'CULTO', fecha: '', lugar: '', descripcion: '' })
        setMostrarForm(false)
        await recargar()
      } catch { setError('Error al crear el evento.') }
      finally { setEnviando(false) }
      setPendingAction(null)
      return
    }

    if (action === 'edit-evento') {
      setGuardando(true)
      try {
        await api.patch(`/eventos/${payload.id}/`, payload.data)
        setEditando(null)
        await recargar()
      } catch { setError('Error al editar.') }
      finally { setGuardando(false) }
      setPendingAction(null)
      return
    }

    if (action === 'inscribe-evento') {
      try {
        await api.post(`/eventos/${payload}/inscribirse/`)
        await recargar()
        setError('')
      } catch (err) {
        setError(err.response?.data?.error || 'Error al inscribirse.')
      }
      setPendingAction(null)
      return
    }

    setPendingAction(null)
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
    openConfirm('edit-evento', { id: editando.id, data: formEdit })
  }

  // ── Eliminar ──────────────────────────────────────────────────
  const handleEliminar = async id => {
    openConfirm('delete-evento', id)
  }

  // ── Inscribirse ───────────────────────────────────────────────
  const handleInscribirse = async id => {
    openConfirm('inscribe-evento', id)
  }

  if (cargando) return <p style={s.info}>Cargando eventos...</p>

  return (
    <div className="content-page eventos-page" style={s.page}>

      {/* ── Cabecera ── */}
      <div className="page-header" style={s.header}>
        <div>
          <p style={s.eyebrow}>Calendario de la Hermandad</p>
          <h2 style={s.titulo}>Eventos y convocatorias</h2>
          <div style={s.headerMeta}>
          </div>
        </div>
        {usuario?.is_staff && (
          <button style={s.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo evento'}
          </button>
        )}
      </div>

      {error && <p style={s.error}>{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction?.action === 'delete-evento' ? 'Eliminar evento' : pendingAction?.action === 'create-evento' ? 'Crear evento' : pendingAction?.action === 'edit-evento' ? 'Guardar cambios' : 'Confirmar inscripción'}
        message={pendingAction?.action === 'delete-evento'
          ? '¿Seguro que quieres eliminar este evento? Esta acción no se puede deshacer.'
          : pendingAction?.action === 'create-evento'
            ? '¿Quieres crear este evento con los datos introducidos?'
            : pendingAction?.action === 'edit-evento'
              ? '¿Deseas guardar los cambios realizados en este evento?'
              : '¿Quieres inscribirte a este evento?'}
        confirmText={pendingAction?.action === 'delete-evento' ? 'Eliminar' : pendingAction?.action === 'inscribe-evento' ? 'Inscribirse' : 'Confirmar'}
        danger={pendingAction?.action === 'delete-evento'}
        onConfirm={executePendingAction}
        onCancel={() => { setConfirmOpen(false); setPendingAction(null) }}
      />

      {/* ── Formulario nuevo evento ── */}
      {mostrarForm && (
        <FormEvento
          form={form} setForm={setForm}
          onSubmit={e => {
            e.preventDefault()
            openConfirm('create-evento')
          }} enviando={enviando}
          titulo="Nuevo evento" btnLabel="Crear evento"
        />
      )}

      {/* ── Barra de filtros ── */}
      <div className="event-filters" style={s.filtrosBar}>
        {/* Búsqueda */}
        <SearchField
          className="event-search"
          style={s.searchWrap}
          value={busqueda}
          onChange={valor => { setBusqueda(valor); setPaginaActual(1) }}
          placeholder="Buscar evento o lugar..."
          ariaLabel="Buscar eventos"
        />

        {/* Filtros por tipo */}
        <div className="chip-row" style={s.tipoFiltros}>
          {Object.entries(TIPOS).map(([key, val]) => (
            <button
              key={key}
              style={{
                ...s.tipoBtn,
                ...(filtroTipo === key ? s.tipoBtnActivo : {}),
                ...(filtroTipo === key && key !== 'TODOS'
                  ? {
                      borderColor: colorFiltroActivo[key],
                      color: colorFiltroActivo[key],
                      boxShadow: `0 7px 14px ${colorFiltroActivo[key]}38`,
                    }
                  : {})
              }}
              onClick={() => { setFiltroTipo(key); setPaginaActual(1) }}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Toggle vista */}
        <div className="view-toggle" style={s.vistaToggle}>
          {[
            { key: 'lista',  icon: <AppIcon name="news" size={15} />, label: 'Lista' },
            { key: 'mes',    icon: <AppIcon name="calendar" size={15} />, label: 'Mes' },
            { key: 'semana', icon: <AppIcon name="calendar" size={15} />, label: 'Semana' },
          ].map(v => (
            <button
              key={v.key}
              style={{ ...s.vistaBtn, ...(vista === v.key ? s.vistaBtnActivo : {}) }}
              onClick={() => { setVista(v.key); setPaginaActual(1) }}
              title={v.label}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      {/* ── Contenido según vista ── */}
      {vista === 'lista' && (
        <>
          <div style={s.listaSecciones}>
            <button
              style={{ ...s.listaSeccionBtn, ...(seccionLista === 'proximos' ? s.listaSeccionBtnActivo : {}) }}
              onClick={() => { setSeccionLista('proximos'); setPaginaActual(1) }}
            >
              Próximos eventos ({eventosFuturos.length})
            </button>
            <button
              style={{ ...s.listaSeccionBtn, ...(seccionLista === 'pasados' ? s.listaSeccionBtnActivo : {}) }}
              onClick={() => { setSeccionLista('pasados'); setPaginaActual(1) }}
            >
              Eventos ya sucedidos ({eventosPasados.length})
            </button>
          </div>
          <ListaEventos
            eventos={eventosPaginados}
            usuario={usuario}
            esPasado={seccionLista === 'pasados'}
            onEditar={abrirEdicion}
            onEliminar={handleEliminar}
            onInscribirse={handleInscribirse}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={eventosDeLista.length}
            onPageChange={setPaginaActual}
            itemLabel="eventos"
            pageSize={10}
          />
        </>
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
          <div className="responsive-modal" style={s.modal}>
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
    <form className="data-form" onSubmit={onSubmit} style={s.form}>
      {titulo && <h3 style={s.formTitulo}>{titulo}</h3>}

      <label style={s.label}>Nombre del evento</label>
      <input style={s.input} value={form.nombre_evento} required
        onChange={e => setForm({ ...form, nombre_evento: e.target.value })}
        placeholder="Ej: Ensayo general de costaleros" />

      <label style={s.label}>Tipo</label>
      <SelectField
        value={form.tipo_evento}
        onChange={value => setForm({ ...form, tipo_evento: value })}
        options={Object.entries(TIPOS)
          .filter(([value]) => value !== 'TODOS')
          .map(([value, tipo]) => ({ value, label: tipo.label }))}
        ariaLabel="Tipo de evento"
        style={s.input}
      />

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
function ListaEventos({ eventos, usuario, esPasado, onEditar, onEliminar, onInscribirse }) {
  if (eventos.length === 0) return null
  return (
    <div style={s.lista}>
      {eventos.map(ev => <TarjetaEvento key={ev.id} ev={ev} usuario={usuario}
        esPasado={esPasado}
        onEditar={onEditar} onEliminar={onEliminar} onInscribirse={onInscribirse} />)}
    </div>
  )
}

function TarjetaEvento({ ev, usuario, esPasado, onEditar, onEliminar, onInscribirse }) {
  const col = colorTipo[ev.tipo_evento] || {}
  const fecha = new Date(ev.fecha)
  return (
    <article className="event-card" style={s.card}>
      <div style={s.fechaCard} aria-label={fecha.toLocaleDateString('es-ES')}>
        <span style={s.fechaDia}>{fecha.toLocaleDateString('es-ES', { day: '2-digit' })}</span>
        <span style={s.fechaMes}>{fecha.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
      </div>

      <div style={s.cardContenido}>
        <div className="event-card-top" style={s.cardTop}>
          <span style={s.badge}>
            <span style={{ ...s.tipoPunto, backgroundColor: colorFiltroActivo[ev.tipo_evento] || col.border || '#95713a' }} />
            {TIPOS[ev.tipo_evento]?.label}
          </span>
          {usuario?.is_staff && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="action-button action-button--edit" onClick={() => onEditar(ev)}>Editar</button>
              <button className="action-button action-button--danger" onClick={() => onEliminar(ev.id)}>Eliminar</button>
            </div>
          )}
        </div>

        <h3 style={s.cardTitulo}>{ev.nombre_evento}</h3>
        <div style={s.meta}>
          <span style={s.metaItem}><AppIcon name="clock" size={15} />{fecha.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}</span>
          <span style={s.metaItem}><AppIcon name="pin" size={15} />{ev.lugar}</span>
        </div>
        {ev.descripcion && <p style={s.descripcion}>{ev.descripcion}</p>}
        <div className="event-card-footer" style={s.cardFooter}>
          <span style={s.inscritos}><AppIcon name="people" size={16} />{ev.total_inscritos} inscritos</span>
          {!usuario?.is_staff && !esPasado && (
            <button
              style={{ ...s.btnInscribirse, ...(ev.ya_inscrito ? s.btnInscrito : {}) }}
              onClick={() => !ev.ya_inscrito && onInscribirse(ev.id)}
              disabled={ev.ya_inscrito}
            >
              {ev.ya_inscrito ? 'Ya estás inscrito' : 'Inscribirme'}
            </button>
          )}
        </div>
      </div>
    </article>
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
    <div className="calendar-view">
      {/* Navegación mes */}
      <div className="calendar-nav" style={s.calNav}>
        <button style={s.calNavBtn} onClick={() => setFechaRef(new Date(year, month-1, 1))}>‹</button>
        <span style={s.calNavTitulo}>{MESES[month]} {year}</span>
        <button style={s.calNavBtn} onClick={() => setFechaRef(new Date(year, month+1, 1))}>›</button>
        <button style={s.calHoyBtn} onClick={() => { setFechaRef(new Date()); setDiaSeleccionado(null) }}>Hoy</button>
      </div>

      {/* Cabecera días */}
      <div className="calendar-grid" style={s.calGrid7}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={s.calDiaNombre}>{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div className="calendar-grid" style={s.calGrid7}>
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
                          {ev.nombre_evento.slice(0, 14)}{ev.nombre_evento.length > 14 ? '…' : ''}
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
            <AppIcon name="calendar" size={16} style={s.detalleDiaIcon} />{diaSeleccionado} de {MESES[month]}
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
    <div className="calendar-view">
      {/* Navegación semana */}
      <div className="calendar-nav" style={s.calNav}>
        <button style={s.calNavBtn} onClick={() => irSemana(-1)}>‹</button>
        <span style={s.calNavTitulo}>{inicioStr} – {finStr}</span>
        <button style={s.calNavBtn} onClick={() => irSemana(1)}>›</button>
        <button style={s.calHoyBtn} onClick={() => setFechaRef(new Date())}>Hoy</button>
      </div>

      {/* Columnas de días */}
      <div className="calendar-week" style={s.semanaGrid}>
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
                        <AppIcon name="clock" size={13} />{new Date(ev.fecha).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                      <div style={s.semanaEventoNombre}>
                        {ev.nombre_evento}
                      </div>
                      <div style={s.semanaEventoLugar}><AppIcon name="pin" size={13} />{ev.lugar}</div>
                      {!usuario?.is_staff && (
                        <button
                          style={{ ...s.semanaEventoBtn, ...(ev.ya_inscrito ? s.btnInscrito : {}) }}
                          onClick={() => !ev.ya_inscrito && onInscribirse(ev.id)}
                          disabled={ev.ya_inscrito}
                        >
                          {ev.ya_inscrito ? 'Ya estás inscrito' : 'Inscribirme'}
                        </button>
                      )}
                      {usuario?.is_staff && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          <button aria-label="Editar evento" title="Editar evento" className="action-button action-button--edit action-button--icon" onClick={() => onEditar(ev)}><AppIcon name="edit" size={13} /></button>
                          <button aria-label="Eliminar evento" title="Eliminar evento" className="action-button action-button--danger action-button--icon" onClick={() => onEliminar(ev.id)}><AppIcon name="trash" size={13} /></button>
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
  page:    { padding: '32px', maxWidth: '1440px', width: '100%', margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '28px' },
  eyebrow: { margin: '0 0 3px', color: '#95713a', fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase' },
  titulo:  { margin: 0, fontSize: '30px', fontWeight: '700', color: '#2c1810' },
  headerMeta: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '9px', marginTop: '5px' },
  intro: { margin: 0, color: '#765f4d', fontSize: '15px' },
  totalBadge: { padding: '4px 9px', borderRadius: '999px', color: '#765b45', background: 'rgba(201,168,76,0.12)', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' },
  info:    { textAlign: 'center', color: '#666', marginTop: '40px' },
  error:   { color: '#e53e3e', marginBottom: '12px', fontSize: '14px' },
  contador:{ fontSize: '13px', color: '#888', marginBottom: '16px' },

  // Filtros
  filtrosBar: {
    display: 'flex', flexWrap: 'wrap', gap: '12px',
    alignItems: 'center', marginBottom: '12px',
    padding: '16px 18px', background: 'linear-gradient(135deg, rgba(255,250,245,0.98), rgba(239,227,215,0.96))',
    borderRadius: '18px', boxShadow: '0 12px 26px rgba(44, 24, 16, 0.06)',
    border: '1px solid rgba(117, 82, 52, 0.16)',
  },
  searchWrap: {
    flex: '1 1 320px', minWidth: '200px',
  },
  tipoFiltros: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tipoBtn: {
    padding: '7px 12px', borderRadius: '999px', border: '1px solid rgba(117, 82, 52, 0.22)',
    background: 'rgba(255,255,255,0.48)', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#3d2a20',
  },
  tipoBtnActivo: {
    fontWeight: '700', transform: 'translateY(-1px)',
    background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee',
    borderColor: '#2c1810', boxShadow: '0 8px 16px rgba(44, 24, 16, 0.17)',
  },
  vistaToggle: { display: 'flex', gap: '4px', marginLeft: 'auto' },
  vistaBtn: {
    padding: '7px 12px', borderRadius: '10px', border: '1px solid rgba(117, 82, 52, 0.22)',
    background: 'rgba(255,255,255,0.48)', cursor: 'pointer', fontSize: '12px', color: '#3d2a20', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px',
  },
  vistaBtnActivo: { background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee', borderColor: '#2c1810', boxShadow: '0 8px 16px rgba(44, 24, 16, 0.17)' },

  // Formulario
  form: {
    background: 'linear-gradient(135deg, rgba(255,250,245,0.98), rgba(239,227,215,0.96))', borderRadius: '18px', padding: '22px',
    marginBottom: '20px', boxShadow: '0 12px 26px rgba(44, 24, 16, 0.06)', border: '1px solid rgba(117, 82, 52, 0.14)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formTitulo: { fontSize: '16px', fontWeight: '700', color: '#2c1810', marginBottom: '4px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#7d5f42', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: {
    padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(117, 82, 52, 0.2)',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255,255,255,0.52)',
  },

  // Cards lista
  lista: { display: 'flex', flexDirection: 'column', gap: '14px' },
  listaSecciones: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  listaSeccionBtn: {
    padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(117, 82, 52, 0.22)',
    background: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '13px', color: '#5d4a3d', fontWeight: '600',
  },
  listaSeccionBtnActivo: { background: '#5b3927', color: '#fff8ee', borderColor: '#5b3927' },
  card: {
    display: 'grid', gridTemplateColumns: '76px minmax(0, 1fr)', gap: '18px',
    background: 'rgba(255,253,250,0.94)', borderRadius: '18px', padding: '14px',
    boxShadow: '0 10px 22px rgba(44,24,16,0.055)', border: '1px solid rgba(117, 82, 52, 0.13)',
  },
  fechaCard: {
    minHeight: '118px', padding: '12px 8px', borderRadius: '13px',
    background: 'linear-gradient(155deg, #3c2519, #68432c)', color: '#fff8ee',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 7px 15px rgba(44, 24, 16, 0.16)',
  },
  fechaDia: { fontSize: '28px', fontWeight: '800', lineHeight: 1, letterSpacing: '-0.04em' },
  fechaMes: { marginTop: '7px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase' },
  cardContenido: { minWidth: 0, padding: '2px 2px 1px 0' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '9px' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12px',
    fontWeight: '800', color: '#6d5746', letterSpacing: '0.02em', textTransform: 'uppercase',
  },
  tipoPunto: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  cardTitulo:  { fontSize: '17px', fontWeight: '750', color: '#2c1810', margin: '0 0 9px', lineHeight: '1.3' },
  meta:        { display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#6b584a', marginBottom: '10px' },
  metaItem:    { display: 'inline-flex', alignItems: 'center', gap: '5px' },
  descripcion: { fontSize: '13px', color: '#5a4a3a', lineHeight: '1.55', margin: '0 0 12px' },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', paddingTop: '11px', borderTop: '1px solid rgba(117, 82, 52, 0.12)' },
  inscritos:   { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#7c5d49', fontWeight: '600' },

  // Botones
  btnPrimary: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee',
    border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600',
  },
  btnInscribirse: {
    padding: '7px 16px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee',
    border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600',
  },
  btnInscrito: { background: '#d8d2cc', color: '#655d57', cursor: 'default' },
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
    background: 'white', cursor: 'pointer', fontSize: '18px', color: '#2c1810',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  calNavTitulo: { fontWeight: '700', fontSize: '16px', color: '#2c1810', flex: 1, textAlign: 'center' },
  calHoyBtn: {
    padding: '6px 14px', border: '1px solid #2c1810', borderRadius: '6px',
    background: 'white', cursor: 'pointer', fontSize: '13px', color: '#2c1810', fontWeight: '600',
  },

  // Calendario mensual
  calGrid7: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px', background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden',
  },
  calDiaNombre: {
    background: '#3c2519', color: '#f7ead5', textAlign: 'center',
    padding: '8px 4px', fontSize: '12px', fontWeight: '700',
  },
  calCelda: { background: 'white', minHeight: '100px', padding: '6px', cursor: 'pointer', transition: 'background 0.15s' },
  calCeldaActiva: { background: 'white' },
  calCeldaVacia:  { background: '#f9fafb', cursor: 'default' },
  calCeldaHoy:    { background: '#563522' },
  calCeldaSeleccionada: { background: '#f6ead5', outline: '2px solid #5b3927' },
  calNumDia: { fontSize: '13px', fontWeight: '700', color: '#2c1810', display: 'block', marginBottom: '4px' },
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
  detalleDiaTitulo: { fontSize: '15px', fontWeight: '700', color: '#2c1810', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' },
  detalleDiaIcon: { color: '#775420', flexShrink: 0 },

  // Calendario semanal
  semanaGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
  },
  semanaCol: {
    background: 'white', borderRadius: '8px', padding: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minHeight: '200px',
  },
  semanaColHoy: { outline: '2px solid #5b3927' },
  semanaDiaNombre: { fontSize: '11px', fontWeight: '700', color: '#888', textAlign: 'center', marginBottom: '4px' },
  semanaDiaNum: {
    fontSize: '18px', fontWeight: '700', color: '#2c1810',
    textAlign: 'center', marginBottom: '10px',
  },
  semanaDiaNumHoy: {
    width: '30px', height: '30px', borderRadius: '50%',
    backgroundColor: '#5b3927', color: '#fff8ee',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 10px', fontSize: '14px',
  },
  semanaEventos:    { display: 'flex', flexDirection: 'column', gap: '6px' },
  semanaVacio:      { textAlign: 'center', color: '#ccc', fontSize: '20px', marginTop: '20px' },
  semanaEvento: {
    borderRadius: '6px', padding: '8px',
    fontSize: '11px', lineHeight: '1.4',
  },
  semanaEventoHora:   { fontWeight: '600', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' },
  semanaEventoNombre: { fontWeight: '700', fontSize: '12px', marginBottom: '2px' },
  semanaEventoLugar:  { color: '#555', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' },
  semanaEventoBtn: {
    fontSize: '10px', padding: '3px 8px', backgroundColor: '#5b3927',
    color: '#fff8ee', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%',
  },
}
