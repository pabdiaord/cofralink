import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const ESTADOS = {
  PENDIENTE: { texto: 'Pendiente', color: '#9a6700', fondo: '#fff3cd' },
  PAGADA: { texto: 'Confirmada', color: '#166534', fondo: '#dcfce7' },
  FALLIDA: { texto: 'Fallida', color: '#b42318', fondo: '#fee4e2' },
  CANCELADA: { texto: 'Cancelada', color: '#555', fondo: '#eee' },
  REEMBOLSADA: { texto: 'Reembolsada', color: '#6b21a8', fondo: '#f3e8ff' },
}

const formatearEuros = (centimos) => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR',
}).format((centimos || 0) / 100)

function eurosACentimos(valor) {
  const normalizado = String(valor || '').trim().replace(',', '.')
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalizado)) return null
  const [euros, decimales = ''] = normalizado.split('.')
  return Number(euros) * 100 + Number(decimales.padEnd(2, '0'))
}

function ErrorMessage({ error }) {
  return error ? <p style={styles.error}>{error}</p> : null
}

export default function Donaciones() {
  const { usuario } = useAuth()
  const [huchas, setHuchas] = useState([])
  const [misDonaciones, setMisDonaciones] = useState([])
  const [donacionesAdmin, setDonacionesAdmin] = useState([])
  const [importes, setImportes] = useState({})
  const [cargando, setCargando] = useState(true)
  const [enviandoId, setEnviandoId] = useState(null)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardandoHucha, setGuardandoHucha] = useState(false)
  const [formHucha, setFormHucha] = useState({ nombre: '', descripcion: '', objetivo: '' })

  const cargar = async () => {
    const peticiones = [api.get('/donaciones/huchas/'), api.get('/donaciones/mis-donaciones/')]
    if (usuario?.is_staff) peticiones.push(api.get('/donaciones/admin/donaciones/'))

    const resultados = await Promise.all(peticiones)
    setHuchas(resultados[0].data)
    setMisDonaciones(resultados[1].data)
    if (usuario?.is_staff) setDonacionesAdmin(resultados[2].data)
  }

  useEffect(() => {
    let activa = true
    const cargarInicial = async () => {
      try {
        const peticiones = [api.get('/donaciones/huchas/'), api.get('/donaciones/mis-donaciones/')]
        if (usuario?.is_staff) peticiones.push(api.get('/donaciones/admin/donaciones/'))
        const resultados = await Promise.all(peticiones)
        if (!activa) return
        setHuchas(resultados[0].data)
        setMisDonaciones(resultados[1].data)
        if (usuario?.is_staff) setDonacionesAdmin(resultados[2].data)
      } catch {
        if (activa) setError('No se pudieron cargar las donaciones.')
      } finally {
        if (activa) setCargando(false)
      }
    }
    cargarInicial()
    return () => { activa = false }
  }, [usuario?.is_staff])

  const donar = async (hucha) => {
    const importeCentimos = eurosACentimos(importes[hucha.id] ?? '10,00')
    if (!importeCentimos || importeCentimos < 100 || importeCentimos > 1_000_000) {
      setError('Indica un importe entre 1,00 € y 10.000,00 €.')
      return
    }

    setError('')
    setEnviandoId(hucha.id)
    try {
      const respuesta = await api.post('/donaciones/checkout/', {
        hucha_id: hucha.id,
        importe_centimos: importeCentimos,
      })
      window.location.assign(respuesta.data.checkout_url)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo iniciar el pago simulado.')
      setEnviandoId(null)
    }
  }

  const crearHucha = async (event) => {
    event.preventDefault()
    const objetivoCentimos = formHucha.objetivo ? eurosACentimos(formHucha.objetivo) : null
    if (formHucha.objetivo && (!objetivoCentimos || objetivoCentimos < 100)) {
      setError('El objetivo debe ser de al menos 1,00 € o quedar vacío.')
      return
    }

    setGuardandoHucha(true)
    setError('')
    try {
      await api.post('/donaciones/huchas/', {
        nombre: formHucha.nombre,
        descripcion: formHucha.descripcion,
        objetivo_centimos: objetivoCentimos,
        activa: true,
      })
      setFormHucha({ nombre: '', descripcion: '', objetivo: '' })
      setMostrarForm(false)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo crear la hucha de proyecto.')
    } finally {
      setGuardandoHucha(false)
    }
  }

  const cerrarHucha = async (hucha) => {
    if (!window.confirm(`¿Cerrar la hucha “${hucha.nombre}”? Se conservará su histórico.`)) return
    setError('')
    try {
      await api.patch(`/donaciones/huchas/${hucha.id}/`, { activa: false })
      await cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cerrar la hucha.')
    }
  }

  if (cargando) return <p style={styles.info}>Cargando donaciones...</p>

  const huchasActivas = huchas.filter(hucha => hucha.activa)

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Donaciones</h1>
          <p style={styles.subtitle}>Apoya la vida diaria de la Hermandad o uno de sus proyectos.</p>
        </div>
        {usuario?.is_staff && (
          <button style={styles.secondaryButton} onClick={() => setMostrarForm(value => !value)}>
            {mostrarForm ? 'Cancelar' : '+ Crear proyecto'}
          </button>
        )}
      </header>

      <div style={styles.sandboxNotice}>
        <span aria-hidden="true">ℹ</span>
        <div>
          <strong>Donaciones simuladas.</strong> Este entorno académico usa Stripe Sandbox:
          no se carga dinero real ni se vincula ninguna cuenta bancaria.
        </div>
      </div>

      <ErrorMessage error={error} />

      {mostrarForm && (
        <form style={styles.projectForm} onSubmit={crearHucha}>
          <h2 style={styles.sectionTitle}>Nueva hucha de proyecto</h2>
          <div style={styles.formGrid}>
            <label style={styles.label}>
              Nombre del proyecto
              <input
                required
                maxLength="150"
                style={styles.input}
                value={formHucha.nombre}
                onChange={event => setFormHucha({ ...formHucha, nombre: event.target.value })}
                placeholder="Ej. Restauración del paso"
              />
            </label>
            <label style={styles.label}>
              Objetivo en euros <small style={styles.optional}>(opcional)</small>
              <input
                inputMode="decimal"
                style={styles.input}
                value={formHucha.objetivo}
                onChange={event => setFormHucha({ ...formHucha, objetivo: event.target.value })}
                placeholder="Ej. 2500,00"
              />
            </label>
          </div>
          <label style={styles.label}>
            Descripción
            <textarea
              style={{ ...styles.input, minHeight: '86px', resize: 'vertical' }}
              value={formHucha.descripcion}
              onChange={event => setFormHucha({ ...formHucha, descripcion: event.target.value })}
              placeholder="Explica para qué se destinarán las donaciones."
            />
          </label>
          <button type="submit" disabled={guardandoHucha} style={styles.primaryButton}>
            {guardandoHucha ? 'Creando...' : 'Crear hucha de proyecto'}
          </button>
        </form>
      )}

      <section>
        {huchasActivas.length === 0 ? (
          <>
            <h2 style={styles.sectionTitle}>Huchas activas</h2>
            <p style={styles.empty}>No hay huchas activas en este momento.</p>
          </>
        ) : (
          <HuchasCarousel
            huchas={huchasActivas}
            importes={importes}
            enviandoId={enviandoId}
            onImporteChange={(huchaId, valor) => setImportes({ ...importes, [huchaId]: valor })}
            onDonar={donar}
          />
        )}
      </section>

      <section style={styles.historySection}>
        <h2 style={styles.sectionTitle}>Mis donaciones</h2>
        <DonacionesTable donaciones={misDonaciones} mostrarDonante={false} />
      </section>

      {usuario?.is_staff && (
        <section style={styles.adminSection}>
          <h2 style={styles.sectionTitle}>Gestión de Junta</h2>
          <div style={styles.adminHuchas}>
            {huchas.filter(hucha => hucha.tipo === 'PROYECTO').map(hucha => (
              <div style={styles.adminHucha} key={hucha.id}>
                <div>
                  <strong>{hucha.nombre}</strong>
                  <p style={styles.adminText}>
                    {hucha.activa ? 'Activa' : 'Cerrada'} · {formatearEuros(hucha.recaudado_centimos)} recaudados
                  </p>
                </div>
                {hucha.activa && (
                  <button style={styles.closeButton} onClick={() => cerrarHucha(hucha)}>Cerrar hucha</button>
                )}
              </div>
            ))}
          </div>
          <h3 style={styles.tableTitle}>Todas las donaciones</h3>
          <DonacionesTable donaciones={donacionesAdmin} mostrarDonante />
        </section>
      )}
    </div>
  )
}

function HuchasCarousel({ huchas, importes, enviandoId, onImporteChange, onDonar }) {
  const carruselRef = useRef(null)
  const [puedeRetroceder, setPuedeRetroceder] = useState(false)
  const [puedeAvanzar, setPuedeAvanzar] = useState(false)

  const actualizarControles = () => {
    const carrusel = carruselRef.current
    if (!carrusel) return

    const tolerancia = 2
    setPuedeRetroceder(carrusel.scrollLeft > tolerancia)
    setPuedeAvanzar(carrusel.scrollLeft < carrusel.scrollWidth - carrusel.clientWidth - tolerancia)
  }

  useEffect(() => {
    const carrusel = carruselRef.current
    if (!carrusel) return undefined

    actualizarControles()
    window.addEventListener('resize', actualizarControles)
    const observador = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(actualizarControles)
    observador?.observe(carrusel)

    return () => {
      window.removeEventListener('resize', actualizarControles)
      observador?.disconnect()
    }
  }, [huchas.length])

  const desplazar = (direccion) => {
    const carrusel = carruselRef.current
    if (!carrusel) return

    carrusel.scrollBy({
      left: direccion * Math.max(300, Math.round(carrusel.clientWidth * 0.9)),
      behavior: 'smooth',
    })
  }

  const manejarTecla = (event) => {
    if (event.key === 'ArrowLeft' && puedeRetroceder) {
      event.preventDefault()
      desplazar(-1)
    }
    if (event.key === 'ArrowRight' && puedeAvanzar) {
      event.preventDefault()
      desplazar(1)
    }
  }

  return (
    <>
      <div style={styles.carouselHeader}>
        <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Huchas activas</h2>
        <div style={styles.carouselControls} aria-label="Navegación de huchas">
          <button
            type="button"
            aria-label="Ver huchas anteriores"
            aria-controls="huchas-carrusel"
            disabled={!puedeRetroceder}
            onClick={() => desplazar(-1)}
            style={{ ...styles.carouselArrow, ...(!puedeRetroceder ? styles.carouselArrowDisabled : {}) }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Ver más huchas"
            aria-controls="huchas-carrusel"
            disabled={!puedeAvanzar}
            onClick={() => desplazar(1)}
            style={{ ...styles.carouselArrow, ...(!puedeAvanzar ? styles.carouselArrowDisabled : {}) }}
          >
            ›
          </button>
        </div>
      </div>
      <div
        ref={carruselRef}
        id="huchas-carrusel"
        tabIndex="0"
        role="region"
        aria-label="Listado horizontal de huchas activas"
        className="donation-carousel"
        onScroll={actualizarControles}
        onKeyDown={manejarTecla}
        style={styles.cardsViewport}
      >
        <div style={styles.cards}>
          {huchas.map(hucha => (
            <HuchaCard
              key={hucha.id}
              hucha={hucha}
              importe={importes[hucha.id] ?? '10,00'}
              enviando={enviandoId === hucha.id}
              onImporteChange={valor => onImporteChange(hucha.id, valor)}
              onDonar={() => onDonar(hucha)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function HuchaCard({ hucha, importe, enviando, onImporteChange, onDonar }) {
  const tieneObjetivo = hucha.objetivo_centimos !== null
  const porcentaje = tieneObjetivo
    ? Math.min(100, Math.round((hucha.recaudado_centimos / hucha.objetivo_centimos) * 100))
    : 0

  return (
    <article style={{ ...styles.card, ...(hucha.tipo === 'GENERAL' ? styles.generalCard : {}) }}>
      <div style={styles.cardTopLine}>
        <span style={styles.typeBadge}>{hucha.tipo === 'GENERAL' ? 'HUCHA PRINCIPAL' : 'PROYECTO'}</span>
        <span aria-hidden="true" style={styles.cardIcon}>{hucha.tipo === 'GENERAL' ? '⛪' : '🕯️'}</span>
      </div>
      <h3 style={styles.cardTitle}>{hucha.nombre}</h3>
      <p style={styles.cardDescription}>{hucha.descripcion || 'Apoya esta causa de la Hermandad.'}</p>
      <p style={styles.amount}>{formatearEuros(hucha.recaudado_centimos)}</p>
      <p style={styles.amountCaption}>recaudados en donaciones confirmadas</p>
      {tieneObjetivo && (
        <>
          <div style={styles.progressTrack} aria-label={`${porcentaje}% del objetivo alcanzado`}>
            <div style={{ ...styles.progressFill, width: `${porcentaje}%` }} />
          </div>
          <p style={styles.goalText}>{porcentaje}% de {formatearEuros(hucha.objetivo_centimos)}</p>
        </>
      )}
      <div style={styles.donateArea}>
        <label style={styles.donateLabel}>
          Mi aportación
          <div style={styles.amountInputWrap}>
            <input
              aria-label={`Importe para ${hucha.nombre}`}
              inputMode="decimal"
              style={styles.amountInput}
              value={importe}
              onChange={event => onImporteChange(event.target.value)}
            />
            <span style={styles.euroSymbol}>€</span>
          </div>
        </label>
        <div style={styles.quickAmounts}>
          {[5, 10, 20, 50].map(cantidad => (
            <button key={cantidad} type="button" style={styles.quickButton} onClick={() => onImporteChange(String(cantidad))}>
              {cantidad} €
            </button>
          ))}
        </div>
        <button disabled={enviando} style={styles.primaryButton} onClick={onDonar}>
          {enviando ? 'Abriendo Stripe Sandbox...' : 'Mandar donación'}
        </button>
      </div>
    </article>
  )
}

function DonacionesTable({ donaciones, mostrarDonante }) {
  if (donaciones.length === 0) return <p style={styles.empty}>Aún no hay donaciones registradas.</p>

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Fecha</th>
            {mostrarDonante && <th style={styles.th}>Donante</th>}
            <th style={styles.th}>Destino</th>
            <th style={styles.th}>Importe</th>
            <th style={styles.th}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {donaciones.map(donacion => {
            const estado = ESTADOS[donacion.estado] || ESTADOS.PENDIENTE
            return (
              <tr key={donacion.id}>
                <td style={styles.td}>{new Date(donacion.creada_en).toLocaleDateString('es-ES')}</td>
                {mostrarDonante && <td style={styles.td}>{donacion.donante_email}</td>}
                <td style={styles.td}>{donacion.hucha_nombre}</td>
                <td style={{ ...styles.td, fontWeight: '700' }}>{formatearEuros(donacion.importe_centimos)}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.status, color: estado.color, background: estado.fondo }}>{estado.texto}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  page: { padding: '34px', maxWidth: '1320px', margin: '0 auto', color: '#2c1810' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px', marginBottom: '22px' },
  eyebrow: { margin: 0, color: '#95713a', fontWeight: '800', fontSize: '11px', letterSpacing: '0.15em' },
  title: { margin: '5px 0 6px', fontSize: '32px', lineHeight: 1.1, color: '#2c1810' },
  subtitle: { margin: 0, color: '#6f5745', fontSize: '15px' },
  sandboxNotice: { display: 'flex', gap: '11px', alignItems: 'flex-start', color: '#624a1a', background: '#fff4d6', border: '1px solid #ecd089', borderRadius: '14px', padding: '14px 16px', marginBottom: '22px', lineHeight: 1.45, fontSize: '14px' },
  error: { color: '#9f1d1d', background: '#ffe4e4', border: '1px solid #f7b4b4', padding: '11px 14px', borderRadius: '10px', marginBottom: '18px' },
  sectionTitle: { fontSize: '19px', margin: '0 0 14px', color: '#2c1810' },
  carouselHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '14px' },
  carouselControls: { display: 'flex', gap: '8px', flexShrink: 0 },
  carouselArrow: { width: '35px', height: '35px', border: '1px solid rgba(117,82,52,0.3)', borderRadius: '50%', background: '#fffdfa', color: '#4b2d1f', fontSize: '27px', lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '0 0 3px', boxShadow: '0 4px 10px rgba(44,24,16,0.08)' },
  carouselArrowDisabled: { color: '#b9ab9c', borderColor: 'rgba(117,82,52,0.12)', background: 'rgba(255,253,250,0.55)', cursor: 'not-allowed', boxShadow: 'none' },
  cardsViewport: { overflowX: 'auto', overflowY: 'hidden', scrollBehavior: 'smooth', scrollSnapType: 'x proximity', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '0 1px 8px', outlineOffset: '4px' },
  cards: { display: 'flex', gap: '18px', width: '100%' },
  card: { flex: '0 0 calc((100% - 36px) / 3)', minWidth: '290px', scrollSnapAlign: 'start', background: 'rgba(255,253,250,0.92)', border: '1px solid rgba(117,82,52,0.16)', borderRadius: '20px', padding: '22px', boxShadow: '0 12px 28px rgba(44,24,16,0.07)', display: 'flex', flexDirection: 'column' },
  generalCard: { border: '1px solid rgba(201,168,76,0.65)', background: 'linear-gradient(155deg, #fffaf0, #f4e7c9)' },
  cardTopLine: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { color: '#775420', background: 'rgba(201,168,76,0.18)', borderRadius: '999px', padding: '5px 8px', fontSize: '10px', letterSpacing: '0.08em', fontWeight: '800' },
  cardIcon: { fontSize: '24px' },
  cardTitle: { fontSize: '20px', margin: '14px 0 7px' },
  cardDescription: { color: '#684f3d', minHeight: '43px', lineHeight: 1.45, fontSize: '14px', margin: 0 },
  amount: { margin: '22px 0 2px', color: '#2c1810', fontSize: '29px', fontWeight: '800' },
  amountCaption: { color: '#7a6655', margin: 0, fontSize: '12px' },
  progressTrack: { height: '8px', overflow: 'hidden', borderRadius: '999px', background: 'rgba(117,82,52,0.14)', marginTop: '16px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #8d6824, #c9a84c)', borderRadius: 'inherit' },
  goalText: { color: '#755c44', fontSize: '12px', margin: '6px 0 0' },
  donateArea: { borderTop: '1px solid rgba(117,82,52,0.16)', marginTop: '20px', paddingTop: '17px' },
  donateLabel: { display: 'block', color: '#765a3f', fontSize: '12px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' },
  amountInputWrap: { position: 'relative', marginTop: '7px' },
  amountInput: { width: '100%', boxSizing: 'border-box', padding: '11px 34px 11px 12px', borderRadius: '10px', border: '1px solid rgba(117,82,52,0.28)', background: '#fff', color: '#2c1810', fontSize: '16px', outline: 'none' },
  euroSymbol: { position: 'absolute', right: '12px', top: '10px', color: '#765a3f', fontWeight: '700' },
  quickAmounts: { display: 'flex', gap: '7px', margin: '10px 0 12px' },
  quickButton: { border: '1px solid rgba(117,82,52,0.24)', background: 'transparent', color: '#684a30', borderRadius: '8px', padding: '6px 8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
  primaryButton: { width: '100%', border: 'none', borderRadius: '10px', padding: '11px 15px', background: 'linear-gradient(135deg, #2c1810, #563522)', color: '#fff8ee', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 18px rgba(44,24,16,0.16)' },
  secondaryButton: { border: '1px solid #5b3927', borderRadius: '10px', padding: '10px 15px', color: '#fff9ef', background: '#5b3927', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' },
  projectForm: { background: 'rgba(255,253,250,0.82)', border: '1px solid rgba(117,82,52,0.18)', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 22px rgba(44,24,16,0.05)', marginBottom: '28px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' },
  label: { display: 'flex', flexDirection: 'column', gap: '6px', color: '#644a33', fontWeight: '700', fontSize: '13px', marginBottom: '13px' },
  optional: { fontWeight: '400', color: '#8d7966' },
  input: { boxSizing: 'border-box', width: '100%', borderRadius: '9px', border: '1px solid rgba(117,82,52,0.25)', padding: '10px 11px', font: 'inherit', background: '#fffdfa', color: '#2c1810' },
  historySection: { marginTop: '36px' },
  adminSection: { marginTop: '38px', borderTop: '2px solid rgba(201,168,76,0.35)', paddingTop: '27px' },
  adminHuchas: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' },
  adminHucha: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'rgba(255,253,250,0.85)', padding: '14px', border: '1px solid rgba(117,82,52,0.15)', borderRadius: '12px' },
  adminText: { margin: '4px 0 0', color: '#765f4e', fontSize: '12px' },
  closeButton: { border: '1px solid #a34a37', color: '#982d1f', background: '#fff7f5', borderRadius: '8px', padding: '7px 9px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' },
  tableTitle: { fontSize: '15px', color: '#593d2c', margin: '24px 0 11px' },
  tableWrap: { overflowX: 'auto', background: 'rgba(255,253,250,0.9)', border: '1px solid rgba(117,82,52,0.14)', borderRadius: '13px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '560px' },
  th: { color: '#f7ead5', background: '#3c2519', padding: '11px 14px', textAlign: 'left', fontSize: '11px', letterSpacing: '0.07em', textTransform: 'uppercase' },
  td: { padding: '12px 14px', borderBottom: '1px solid rgba(117,82,52,0.1)', fontSize: '13px', color: '#513a2c' },
  status: { borderRadius: '999px', padding: '4px 8px', fontSize: '11px', fontWeight: '800' },
  empty: { color: '#725d4b', background: 'rgba(255,253,250,0.55)', padding: '18px', borderRadius: '12px', margin: 0 },
  info: { textAlign: 'center', color: '#705743', marginTop: '42px' },
}
