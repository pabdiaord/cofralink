import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import escudo from '../../assets/escudo.png'
import CharacterIcon from '../../components/CharacterIcon'
import AppIcon from '../../components/AppIcon'
import { CHARACTER_INFO } from '../../constants/characterInfo'
import api from '../../api/axios'
import bienvenida from '../../assets/bienvenida.jpg'
import cristoVirgen from '../../assets/cristoVirgen.jpg'
import footer from '../../assets/footer.jpg'

const GOLD  = '#b89b52'
const DARK  = '#241813'
const CREAM = '#ece8e4'
const TIPO_EVENTO = { CULTO: 'Culto', ENSAYO: 'Ensayo', REUNION: 'Reunión', PRIOSTIA: 'Priostía' }

const FECHA_MARTES_SANTO_2027 = new Date(2027, 2, 23, 0, 0, 0)

const obtenerCuentaAtras = () => {
  let restante = Math.max(0, FECHA_MARTES_SANTO_2027.getTime() - Date.now())
  const dias = Math.floor(restante / 86_400_000)
  restante %= 86_400_000
  const horas = Math.floor(restante / 3_600_000)
  restante %= 3_600_000
  const minutos = Math.floor(restante / 60_000)
  const segundos = Math.floor((restante % 60_000) / 1_000)

  return { dias, horas, minutos, segundos }
}

const formatearFecha = (fecha, opciones = { day: '2-digit', month: 'short' }) => (
  new Intl.DateTimeFormat('es-ES', opciones).format(new Date(fecha))
)

export default function Home() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()
  const [hermano, setHermano] = useState(null)
  const [dashboard, setDashboard] = useState({ eventos: [], publicaciones: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      const peticiones = [
        api.get('/eventos/'),
        api.get('/publicaciones/'),
      ]
      if (!usuario?.is_staff) peticiones.push(api.get('/mi-perfil/'))

      const resultados = await Promise.allSettled(peticiones)
      if (!activo) return

      const obtenerDatos = (indice, valorInicial) => (
        resultados[indice]?.status === 'fulfilled' ? resultados[indice].value.data : valorInicial
      )
      setHermano(usuario?.is_staff ? null : obtenerDatos(2, null))
      setDashboard({
        eventos: obtenerDatos(0, []),
        publicaciones: obtenerDatos(1, []),
      })
      setError(resultados.some(resultado => resultado.status === 'rejected')
        ? 'Algunos datos no se han podido actualizar.'
        : '')
    }
    cargar()
    return () => { activo = false }
  }, [usuario?.id, usuario?.is_staff])

  // Nombre para el saludo
  const nombre = hermano
    ? `${hermano.nombre} ${hermano.apellidos}`
    : (usuario?.username || usuario?.email?.split('@')[0] || 'Hermano')

  // Rol visible
  const caracterCodigo = usuario?.is_staff ? 'MIEMBRO_JUNTA' : hermano?.caracter
  const caracter = CHARACTER_INFO[caracterCodigo]
  const rolVisible = caracter?.label || 'Hermano'
  const iconoRol = caracter
    ? <CharacterIcon caracter={caracterCodigo} alt="" style={hs.overviewImage} />
    : '⛪'
  const proximoEvento = dashboard.eventos
    .filter(evento => new Date(evento.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0]
  const ultimaPublicacion = dashboard.publicaciones[0]
  const estadoCuota = usuario?.is_staff
    ? { texto: 'Área de gestión', color: '#775420', icono: '⚜️' }
    : hermano?.estado_cuota === 'PAGADO'
      ? { texto: 'Al corriente', color: '#27633a', icono: '✓' }
      : { texto: hermano ? 'Pendiente' : 'Sin datos', color: '#a15d16', icono: '!' }

  return (
    <div className="home-page" style={hs.page}>

      {/* ── Banner de bienvenida ── */}
      <div className="home-banner" style={hs.banner}>
        <div className="home-banner-copy" style={hs.bannerContent}>
          <div style={hs.bannerKicker}>
            Tu casa, tu hermandad
          </div>
          <h1 style={hs.bannerTitulo}>
            Bienvenido,<br />
            <span style={hs.bannerNombre}>{nombre}</span>
          </h1>
          <p style={hs.bannerLema}>Hermandad Franciscana del Santísimo Sacramento, Inmaculada Concepción
            y Cofradía de Nazarenos del Santísimo Cristo del Perdón, Nuestra Señora de las Angustias, Santa Clara de Asís y San Juan Evangelista</p>
        </div>
        <div className="home-banner-seal" style={hs.bannerEscudo}>
          <img src={escudo} alt="Escudo de la hermandad" style={hs.escudoImg} />
        </div>
      </div>

      <main className="home-dashboard" style={hs.dashboard}>
        <section className="home-overview" style={hs.overviewSection} aria-label="Resumen personal">
          <div className="home-overview-grid" style={hs.overviewGrid}>
            <MetricCard icon={estadoCuota.icono} label="Estado de cuota" value={estadoCuota.texto} color={estadoCuota.color} />
            <MetricCard icon={iconoRol} label="Tu carácter" value={rolVisible} />
            <CountdownCard />
            <MetricCard icon={<AppIcon name="calendar" />} label="Próxima cita" value={proximoEvento ? formatearFecha(proximoEvento.fecha) : 'Sin eventos'} onClick={proximoEvento ? () => navigate('/eventos') : undefined} />
          </div>
        </section>

        {error && <p style={hs.error}>{error}</p>}

        <section style={hs.activityGrid} aria-label="Actividad de la Hermandad">
          <article className="home-feature-card home-feature-card--photo" style={hs.nextEventCard}>
            <div style={hs.cardHeader}>
              <div>
                <p style={hs.darkEyebrow}>Próximo en la Hermandad</p>
                <h2 style={hs.darkTitle}>Agenda destacada</h2>
              </div>
              <span aria-hidden="true" style={hs.darkCardIcon}><AppIcon name="calendar" size={21} /></span>
            </div>
            {proximoEvento ? (
              <>
                <span style={hs.eventType}>{TIPO_EVENTO[proximoEvento.tipo_evento] || proximoEvento.tipo_evento}</span>
                <h3 style={hs.eventTitle}>{proximoEvento.nombre_evento}</h3>
                <p style={hs.eventMeta}>{formatearFecha(proximoEvento.fecha, { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} · {proximoEvento.lugar}</p>
                {proximoEvento.descripcion && <p style={hs.eventDescription}>{proximoEvento.descripcion}</p>}
                <button type="button" style={hs.eventButton} onClick={() => navigate('/eventos')}>Consultar calendario →</button>
              </>
            ) : <EmptyState dark icon={<AppIcon name="calendar" size={19} />} title="Aún no hay próximos eventos" text="Las nuevas convocatorias aparecerán aquí." action="Ir al calendario" onClick={() => navigate('/eventos')} />}
          </article>

          <article className="home-feature-card" style={hs.newsCard}>
            <div style={hs.cardHeader}>
              <div>
                <p style={hs.panelEyebrow}>Actualidad</p>
                <h2 style={hs.panelTitle}>Último comunicado</h2>
              </div>
              <span aria-hidden="true" style={hs.lightCardIcon}><AppIcon name="news" size={21} /></span>
            </div>
            {ultimaPublicacion ? (
              <>
                <p style={hs.newsDate}>{formatearFecha(ultimaPublicacion.fecha, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <h3 style={hs.newsTitle}>{ultimaPublicacion.titular}</h3>
                <p style={hs.newsDescription}>{ultimaPublicacion.descripcion || 'Consulta esta publicación para conocer todos los detalles.'}</p>
                <button type="button" style={hs.textButton} onClick={() => navigate('/publicaciones')}>Leer publicaciones →</button>
              </>
            ) : <EmptyState icon={<AppIcon name="news" size={19} />} title="Sin publicaciones recientes" text="Los comunicados de la Hermandad aparecerán aquí." action="Ver noticias" onClick={() => navigate('/publicaciones')} />}
          </article>
        </section>

        <section style={hs.dashboardSection}>
          <SectionHeading eyebrow="Continúa desde aquí" title="Accesos rápidos" />
          <div style={hs.quickGrid}>
            <QuickAccess icon={<AppIcon name="chat" />} title="Atención al hermano" description={usuario?.is_staff ? 'Gestiona consultas y comunicados.' : 'Contacta con la Junta de Gobierno.'} onClick={() => navigate('/comunicaciones')} />
            <QuickAccess icon={<AppIcon name="news" />} title="Noticias y publicaciones" description="Avisos, cultos y comunicaciones oficiales." onClick={() => navigate('/publicaciones')} />
            <QuickAccess icon={<AppIcon name="document" />} title="Papeleta de sitio" description="Consulta o realiza tus solicitudes." onClick={() => navigate('/procesional')} />
            <QuickAccess icon={<AppIcon name="coin" />} title="Donaciones" description="Colabora con las huchas de la Hermandad." onClick={() => navigate('/donaciones')} />
          </div>
        </section>
      </main>

      <footer className="home-footer" style={hs.footer}>
        <div style={hs.footerOverlay} />
        <div className="home-footer-content" style={hs.footerContent}>
          <div style={hs.footerBrand}>
            <img src={escudo} alt="Escudo de la Hermandad" style={hs.footerLogo} />
            <div>
              <p style={hs.footerEyebrow}>No te digo siete veces, si,</p>
              <h3 style={hs.footerTitle}>LXX VECES VII</h3>
            </div>
          </div>

          <div style={hs.footerColumn}>
            <p style={hs.footerHeading}>Contacto</p>
            <a href="mailto:hermandadperdonalcala@gmail.com" style={hs.footerLink}>hermandadperdonalcala@gmail.com</a>
            <a href="mailto:cofralinkperdon@gmail.com" style={hs.footerLink}>cofralinkperdon@gmail.com</a>
            <a href="tel:+34900000000" style={hs.footerLink}>+34 693 271 545</a>
            <span style={hs.footerLink}>Pasaje Nuestra Señora de las Angustias • Alcalá de Guadaíra • Sevilla</span>
          </div>

          <div style={hs.footerColumn}>
            <p style={hs.footerHeading}>Redes sociales</p>
            <a href="https://www.instagram.com/hermandadperdon/" target="_blank" rel="noreferrer" style={hs.footerLink}>Instagram</a>
            <a href="https://www.facebook.com/perdondealcala/" target="_blank" rel="noreferrer" style={hs.footerLink}>Facebook</a>
            <a href="https://x.com/JuventudPerdon" target="_blank" rel="noreferrer" style={hs.footerLink}>X (antes Twitter)</a>
          </div>

          <div style={hs.footerColumn}>
            <p style={hs.footerHeading}>Información legal</p>
            <Link to="/politica-de-privacidad" style={hs.footerLink}>Política de privacidad</Link>
            <Link to="/terminos-de-servicio" style={hs.footerLink}>Términos de servicio</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────
function SectionHeading({ eyebrow, title }) {
  return (
    <div style={hs.sectionHeading}>
      <p style={hs.panelEyebrow}>{eyebrow}</p>
      <h2 style={hs.sectionTitle}>{title}</h2>
    </div>
  )
}

function MetricCard({ icon, label, value, color, onClick }) {
  const contenido = (
    <>
      <span aria-hidden="true" style={hs.overviewIcon}>{icon}</span>
      <div>
        <p style={hs.overviewLabel}>{label}</p>
        <p style={{ ...hs.overviewValue, ...(color ? { color } : {}) }}>{value}</p>
      </div>
      {onClick && <span aria-hidden="true" style={hs.cardArrow}>→</span>}
    </>
  )

  return onClick
    ? <button className="home-metric-card" type="button" style={{ ...hs.overviewCard, ...hs.overviewButton }} onClick={onClick}>{contenido}</button>
    : <div className="home-metric-card" style={hs.overviewCard}>{contenido}</div>
}

function CountdownCard() {
  const [cuentaAtras, setCuentaAtras] = useState(obtenerCuentaAtras)

  useEffect(() => {
    const intervalo = window.setInterval(() => setCuentaAtras(obtenerCuentaAtras()), 1_000)
    return () => window.clearInterval(intervalo)
  }, [])

  const unidades = [
    ['Días', cuentaAtras.dias],
    ['Horas', cuentaAtras.horas],
    ['Min.', cuentaAtras.minutos],
    ['Seg.', cuentaAtras.segundos],
  ]

  return (
    <div
      className="home-metric-card"
      style={{ ...hs.overviewCard, ...hs.countdownCard }}
      role="timer"
      aria-label={`Faltan ${cuentaAtras.dias} días, ${cuentaAtras.horas} horas, ${cuentaAtras.minutos} minutos y ${cuentaAtras.segundos} segundos para el Martes Santo de 2027`}
    >
      <span aria-hidden="true" style={hs.overviewIcon}><AppIcon name="hourglass" /></span>
      <div style={hs.countdownContent}>
        <p style={hs.overviewLabel}>Martes Santo 2027</p>
        <div style={hs.countdownValues}>
          {unidades.map(([etiqueta, valor]) => (
            <span key={etiqueta} style={hs.countdownUnit}>
              <strong style={hs.countdownNumber}>{valor}</strong>
              <small style={hs.countdownLabel}>{etiqueta}</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickAccess({ icon, title, description, onClick }) {
  return (
    <button className="home-quick-access" type="button" style={hs.quickAccess} onClick={onClick}>
      <span aria-hidden="true" style={hs.quickIcon}>{icon}</span>
      <span style={hs.quickText}>
        <strong style={hs.quickTitle}>{title}</strong>
        <span style={hs.quickDescription}>{description}</span>
      </span>
      <span aria-hidden="true" style={hs.cardArrow}>→</span>
    </button>
  )
}

function EmptyState({ icon, title, text, action, onClick, dark = false }) {
  return (
    <div style={hs.emptyState}>
      <span aria-hidden="true" style={{ ...hs.emptyIcon, ...(dark ? hs.emptyIconDark : {}) }}>{icon}</span>
      <div>
        <h3 style={{ ...hs.emptyTitle, ...(dark ? hs.emptyTitleDark : {}) }}>{title}</h3>
        <p style={{ ...hs.emptyText, ...(dark ? hs.emptyTextDark : {}) }}>{text}</p>
        <button type="button" style={dark ? hs.eventButton : hs.textButton} onClick={onClick}>{action} →</button>
      </div>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────
const hs = {
  page: {
    padding: '32px',
    maxWidth: '1440px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },

  // Banner
  banner: {
    minHeight: 'clamp(430px, 55vh, 580px)',
    background: `linear-gradient(90deg, rgba(20,14,12,0.94) 0%, rgba(25,18,15,0.76) 46%, rgba(20,26,30,0.32) 100%), linear-gradient(0deg, rgba(18,12,10,0.6), transparent 48%), url(${bienvenida}) center 30%/cover no-repeat`,
    borderRadius: '24px',
    padding: '46px 52px',
    marginBottom: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '48px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 22px 50px rgba(36, 24, 19, 0.18)',
  },
  bannerContent: {
    flex: 1,
    zIndex: 1,
    maxWidth: '800px',
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: '48px',
  },
  bannerKicker: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    color: '#e7c777',
    fontFamily: 'var(--font-app)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  },
  bannerLema: {
    maxWidth: '760px',
    color: 'rgba(255,250,245,0.9)',
    fontFamily: 'var(--font-app)',
    fontSize: '11px',
    fontWeight: '650',
    letterSpacing: '0.085em',
    textTransform: 'uppercase',
    margin: '22px 0 0',
    textAlign: 'left',
    lineHeight: '1.7',
    textShadow: '0 2px 12px rgba(0,0,0,0.65)',
  },
  bannerTitulo: {
    color: '#fffaf5',
    fontSize: 'clamp(48px, 5.4vw, 76px)',
    fontWeight: '700',
    margin: 'auto 0 0',
    lineHeight: '0.98',
    letterSpacing: '-0.045em',
    textShadow: '0 6px 24px rgba(0,0,0,0.24)',
  },
  bannerNombre: {
    color: '#ecd48d',
  },
  bannerEscudo: {
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    border: '1px solid rgba(231,199,119,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'absolute',
    top: '46px',
    right: '52px',
    zIndex: 1,
    background: 'rgba(30,22,18,0.34)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 18px 38px rgba(0,0,0,0.24), inset 0 0 0 8px rgba(255,255,255,0.025)',
  },
  escudoImg: {
    width: '204px',
    height: '204px',
    objectFit: 'contain',
    opacity: 0.98,
    filter: 'drop-shadow(0 7px 16px rgba(0,0,0,0.3))',
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',  // ← cuenta atrás más ancha
    gap: '16px',
    marginBottom: '18px',
  },
  statCard: {
    background: '#f9f5f1',
    borderRadius: '18px',
    padding: '18px 20px',
    border: '1px solid rgba(44, 24, 16, 0.08)',
    boxShadow: '0 10px 20px rgba(44, 24, 16, 0.04)',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    isolation: 'isolate',
  },
  statContent: { position: 'relative', zIndex: 1 },
  statCardButton: {
    width: '100%',
    appearance: 'none',
    border: '1px solid transparent',
    fontFamily: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  statLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#8b725d',
    letterSpacing: '0.08em',
  },
  statDecoration: {
    position: 'absolute', right: '16px', top: '50%', zIndex: 0,
    width: '96px', height: '96px', borderRadius: '50%',
    display: 'grid', placeItems: 'center', transform: 'translateY(-50%)',
    background: 'radial-gradient(circle, rgba(201,168,76,0.17), rgba(201,168,76,0.025) 68%, transparent 70%)',
    fontSize: '54px', lineHeight: 1, opacity: 0.4,
    filter: 'saturate(0.72) sepia(0.18)', pointerEvents: 'none',
  },
  statRoleDecoration: { width: '72px', height: '72px', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 3px 6px rgba(44,24,16,0.14))' },
  statValue: { fontSize: '24px', fontWeight: '700', color: DARK },

  // Acceso rápido
  accesoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
  },
  accesoCard: {
    background: '#f9f5f1',
    borderRadius: '18px',
    padding: '22px 22px 20px',
    border: '1px solid rgba(44, 24, 16, 0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 10px 20px rgba(44, 24, 16, 0.04)',
    minHeight: '170px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left',
    position: 'relative',
    overflow: 'hidden',
    isolation: 'isolate',
  },
  accesoCardHover: {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(201,168,76,0.45)',
    boxShadow: '0 18px 28px rgba(44, 24, 16, 0.08)',
  },
  accesoContent: { position: 'relative', zIndex: 1, maxWidth: '78%' },
  accesoDecoration: {
    position: 'absolute', right: '22px', top: '50%', zIndex: 0,
    width: '116px', height: '116px', borderRadius: '50%',
    display: 'grid', placeItems: 'center', transform: 'translateY(-50%)',
    background: 'radial-gradient(circle, rgba(201,168,76,0.18), rgba(201,168,76,0.03) 68%, transparent 70%)',
    fontSize: '62px', lineHeight: 1, opacity: 0.38,
    filter: 'saturate(0.72) sepia(0.18)', pointerEvents: 'none',
  },
  accesoTitulo: { fontSize: '18px', fontWeight: '700', color: DARK, margin: '0 0 8px' },
  accesoDesc: { fontSize: '13px', color: '#6d564d', lineHeight: '1.55', margin: 0 },

  footer: {
    position: 'relative',
    marginTop: '28px',
    borderRadius: '24px',
    overflow: 'hidden',
    background: `linear-gradient(135deg, rgba(25,17,15,0.88), rgba(65,42,26,0.78)), url(${footer}) center/cover no-repeat`,
    minHeight: '240px',
    boxShadow: '0 8px 24px rgba(36, 24, 19, 0.1)',
  },
  footerOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, rgba(16,11,11,0.85), rgba(29,20,15,0.3), rgba(16,11,11,0.78))',
  },
  footerContent: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr 1fr 1.4fr',
    gap: '26px',
    padding: '32px 28px',
    alignItems: 'start',
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minHeight: '84px',
  },
  footerLogo: {
    width: '64px',
    height: '64px',
    objectFit: 'contain',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    padding: '8px',
  },
  footerEyebrow: {
    margin: 0,
    color: '#e2c779',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: '700',
  },
  footerTitle: {
    margin: '6px 0 0',
    color: '#fffaf4',
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-0.04em',
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  footerHeading: {
    margin: 0,
    color: '#e9c980',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  footerLink: {
    color: '#f3e7d5',
    fontSize: '14px',
    lineHeight: '1.5',
    textDecoration: 'none',
    opacity: 0.92,
  },
  footerText: {
    margin: 0,
    color: '#f3e7d5',
    fontSize: '14px',
    lineHeight: '1.7',
    opacity: 0.92,
  },
  // Cuenta atrás
  cuentaCard: {
    background: '#f9f5f1',
    borderRadius: '18px',
    padding: '18px 24px',
    border: '1px solid rgba(44,24,16,0.08)',
    boxShadow: '0 10px 20px rgba(44,24,16,0.04)',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cuentaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  cuentaIcon: { fontSize: '16px', lineHeight: 1 },
  cuentaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  cuentaItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: DARK,
    borderRadius: '10px',
    padding: '8px 4px',
  },
  cuentaNumero: {
    fontSize: '22px',
    fontWeight: '800',
    color: GOLD,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  cuentaEtiqueta: {
    fontSize: '9px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: '4px',
  },

  dashboard: { marginTop: '-42px', position: 'relative', zIndex: 2 },
  error: { margin: '18px 24px 0', padding: '11px 14px', borderRadius: '10px', color: '#8d2b1e', background: '#fee8e5', border: '1px solid #f0b9ae', fontSize: '14px' },
  overviewSection: { marginTop: 0, padding: '0 24px' },
  dashboardSection: { marginTop: '30px' },
  sectionHeading: { marginBottom: '13px' },
  panelEyebrow: { margin: 0, color: '#95713a', fontSize: '12px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' },
  sectionTitle: { margin: '3px 0 0', color: DARK, fontSize: '22px' },
  overviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' },
  overviewCard: { minHeight: '112px', display: 'flex', alignItems: 'center', gap: '14px', padding: '18px', borderRadius: '14px', background: 'rgba(255,253,250,0.94)', border: '1px solid rgba(117,82,52,0.14)', boxShadow: '0 16px 34px rgba(44,24,16,0.12)', backdropFilter: 'blur(14px)', textAlign: 'left' },
  overviewButton: { width: '100%', cursor: 'pointer', fontFamily: 'inherit' },
  overviewIcon: { width: '46px', height: '46px', flexShrink: 0, display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: '12px', color: '#775420', background: '#f2e6cf', fontSize: '21px' },
  overviewImage: { width: '100%', height: '100%', objectFit: 'contain', padding: '4px' },
  overviewLabel: { margin: 0, color: '#836c57', fontSize: '12px', fontWeight: '700', letterSpacing: '0.035em', textTransform: 'uppercase' },
  overviewValue: { margin: '3px 0 0', color: DARK, fontSize: '17px', fontWeight: '700', lineHeight: 1.2 },
  countdownCard: { alignItems: 'center' },
  countdownContent: { minWidth: 0, flex: 1 },
  countdownDate: { margin: '2px 0 7px', color: DARK, fontSize: '13px', fontWeight: '700', lineHeight: 1.2 },
  countdownValues: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '5px' },
  countdownUnit: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  countdownNumber: { color: DARK, fontSize: '16px', lineHeight: 1.05 },
  countdownLabel: { marginTop: '2px', color: '#836c57', fontSize: '9px', fontWeight: '700', lineHeight: 1.1 },
  cardArrow: { marginLeft: 'auto', color: '#9b7b4d', fontSize: '20px', lineHeight: 1 },
  activityGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: '18px', marginTop: '42px' },
  nextEventCard: { minHeight: '300px', padding: '26px', borderRadius: '16px', color: '#fffaf4', background: `linear-gradient(90deg, rgba(30,20,17,0.94), rgba(30,20,17,0.7)), url(${cristoVirgen}) center 35%/cover no-repeat`, boxShadow: '0 8px 24px rgba(36,24,19,0.11)', border: '1px solid rgba(184,155,82,0.35)' },
  newsCard: { minHeight: '300px', padding: '26px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e3dedb', boxShadow: '0 5px 18px rgba(36,24,19,0.045)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '21px' },
  darkEyebrow: { margin: 0, color: '#e7c777', fontSize: '12px', fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase' },
  darkTitle: { margin: '3px 0 0', color: '#fffaf4', fontSize: '22px' },
  panelTitle: { margin: '3px 0 0', color: DARK, fontSize: '22px' },
  darkCardIcon: { width: '40px', height: '40px', display: 'grid', placeItems: 'center', borderRadius: '12px', color: '#e7c777', background: 'rgba(255,255,255,0.08)', fontSize: '21px' },
  lightCardIcon: { width: '40px', height: '40px', display: 'grid', placeItems: 'center', borderRadius: '12px', color: '#775420', background: '#f2e6cf', fontSize: '22px' },
  eventType: { display: 'inline-block', padding: '4px 8px', borderRadius: '999px', color: '#f7e3a0', background: 'rgba(201,168,76,0.16)', fontSize: '12px', fontWeight: '700' },
  eventTitle: { margin: '13px 0 7px', color: '#fffaf4', fontSize: '23px', lineHeight: 1.3 },
  eventMeta: { margin: 0, color: '#eedcbe', fontSize: '14px', lineHeight: 1.5, textTransform: 'capitalize' },
  eventDescription: { margin: '12px 0 0', color: 'rgba(255,250,244,0.78)', fontSize: '14px', lineHeight: 1.5 },
  eventButton: { marginTop: '20px', border: '1px solid rgba(231,199,119,0.65)', borderRadius: '9px', padding: '9px 12px', background: 'rgba(255,255,255,0.07)', color: '#fff6df', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
  newsDate: { margin: 0, color: '#95713a', fontSize: '13px', fontWeight: '700', textTransform: 'capitalize' },
  newsTitle: { margin: '9px 0 8px', color: DARK, fontSize: '21px', lineHeight: 1.35 },
  newsDescription: { margin: 0, color: '#684f3d', fontSize: '15px', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  textButton: { marginTop: '19px', padding: 0, border: 'none', background: 'transparent', color: '#79522c', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
  emptyState: { minHeight: '175px', display: 'flex', alignItems: 'flex-start', gap: '13px', paddingTop: '6px' },
  emptyIcon: { width: '38px', height: '38px', display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: '11px', color: '#775420', background: '#f2e6cf', fontSize: '18px' },
  emptyIconDark: { color: '#e7c777', background: 'rgba(255,255,255,0.08)' },
  emptyTitle: { margin: '1px 0 5px', color: DARK, fontSize: '17px' },
  emptyTitleDark: { color: '#fffaf4' },
  emptyText: { margin: 0, color: '#684f3d', fontSize: '14px', lineHeight: 1.5 },
  emptyTextDark: { color: 'rgba(255,250,244,0.76)' },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '12px' },
  quickAccess: { minHeight: '114px', display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', border: '1px solid rgba(117,82,52,0.15)', borderRadius: '15px', background: '#fffdfa', color: DARK, cursor: 'pointer', textAlign: 'left', boxShadow: '0 8px 18px rgba(44,24,16,0.04)' },
  quickIcon: { width: '40px', height: '40px', display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: '11px', color: '#775420', background: '#f2e6cf', fontSize: '20px' },
  quickText: { display: 'flex', flexDirection: 'column', gap: '3px' },
  quickTitle: { color: DARK, fontSize: '16px' },
  quickDescription: { color: '#705945', fontSize: '13px', lineHeight: 1.35 },
}
