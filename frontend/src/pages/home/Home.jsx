import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import escudo from '../../assets/escudo.png'
import CharacterIcon from '../../components/CharacterIcon'
import AppIcon from '../../components/AppIcon'
import { CHARACTER_INFO } from '../../constants/characterInfo'
import api from '../../api/axios'
import bienvenida from '../../assets/bienvenida.jpg'
import footer from '../../assets/footer.jpg'

const GOLD  = '#c9a84c'
const DARK  = '#2c1810'
const CREAM = '#efe3d7'
const TIPO_EVENTO = { CULTO: 'Culto', ENSAYO: 'Ensayo', REUNION: 'Reunión', PRIOSTIA: 'Priostía' }

const formatearEuros = centimos => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR',
}).format((centimos || 0) / 100)

const formatearFecha = (fecha, opciones = { day: '2-digit', month: 'short' }) => (
  new Intl.DateTimeFormat('es-ES', opciones).format(new Date(fecha))
)

export default function Home() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()
  const [hermano, setHermano] = useState(null)
  const [dashboard, setDashboard] = useState({ eventos: [], publicaciones: [], totalDonado: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      const peticiones = [
        api.get('/eventos/'),
        api.get('/publicaciones/'),
        api.get('/donaciones/mis-donaciones/'),
      ]
      if (!usuario?.is_staff) peticiones.push(api.get('/mi-perfil/'))

      const resultados = await Promise.allSettled(peticiones)
      if (!activo) return

      const obtenerDatos = (indice, valorInicial) => (
        resultados[indice]?.status === 'fulfilled' ? resultados[indice].value.data : valorInicial
      )
      const donaciones = obtenerDatos(2, [])

      setHermano(usuario?.is_staff ? null : obtenerDatos(3, null))
      setDashboard({
        eventos: obtenerDatos(0, []),
        publicaciones: obtenerDatos(1, []),
        totalDonado: donaciones
          .filter(donacion => donacion.estado === 'PAGADA')
          .reduce((total, donacion) => total + donacion.importe_centimos, 0),
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
        <div style={hs.bannerContent}>
          <p style={hs.bannerLema}>Hermandad Franciscana del Santísimo Sacramento, Inmaculada Concepción
            y Cofradía de Nazarenos del Santísimo Cristo del Perdón, Nuestra Señora de las Angustias, Santa Clara de Asís y San Juan Evangelista</p>
          <h1 style={hs.bannerTitulo}>Bienvenido {nombre}</h1>
        </div>
        <div style={hs.bannerEscudo}>
            <img src={escudo} alt="Escudo de la hermandad" style={hs.escudoImg} />
        </div>
      </div>

      <main style={hs.dashboard}>
        {error && <p style={hs.error}>{error}</p>}

        <section style={hs.dashboardSection}>
          <SectionHeading eyebrow="Tu situación" title="Todo a un vistazo" />
          <div style={hs.overviewGrid}>
            <MetricCard icon={estadoCuota.icono} label="Estado de cuota" value={estadoCuota.texto} color={estadoCuota.color} />
            <MetricCard icon={iconoRol} label="Tu carácter" value={rolVisible} />
            <MetricCard icon={<AppIcon name="coin" />} label="Donado a la Hermandad" value={formatearEuros(dashboard.totalDonado)} />
            <MetricCard icon={<AppIcon name="calendar" />} label="Próxima cita" value={proximoEvento ? formatearFecha(proximoEvento.fecha) : 'Sin eventos'} onClick={proximoEvento ? () => navigate('/eventos') : undefined} />
          </div>
        </section>

        <section style={hs.activityGrid} aria-label="Actividad de la Hermandad">
          <article style={hs.nextEventCard}>
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

          <article style={hs.newsCard}>
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
            <p style={hs.footerHeading}>
              #PerdónDeAlcalá
            </p>
            <p style={hs.footerHeading}>
              #ReinaAngustias
            </p>
            <p style={hs.footerHeading}>
              #MartesSantoAlcalá
            </p>
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
    ? <button type="button" style={{ ...hs.overviewCard, ...hs.overviewButton }} onClick={onClick}>{contenido}</button>
    : <div style={hs.overviewCard}>{contenido}</div>
}

function QuickAccess({ icon, title, description, onClick }) {
  return (
    <button type="button" style={hs.quickAccess} onClick={onClick}>
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
  background: '#efe3d7',
  borderRadius: '24px',
  boxShadow: '0 18px 45px rgba(44, 24, 16, 0.08)',
  boxSizing: 'border-box',
},

  // Banner
  banner: {
    background: `linear-gradient(135deg, rgba(25,17,15,0.88), rgba(65,42,26,0.72)), url(${bienvenida}) center/cover no-repeat`,
    borderRadius: '22px',
    padding: '30px 34px',
    marginBottom: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '28px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 18px 32px rgba(44, 24, 16, 0.16)',
  },
  bannerContent: {
    flex: 1,
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  bannerLema: {
    color: '#e7c777',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '72px',
    textAlign: 'justify',
    lineHeight: '1.6',
  },
  bannerTitulo: {
    color: '#fffaf5',
    fontSize: '54px',
    fontWeight: '700',
    margin: 0,
    lineHeight: '1.05',
    letterSpacing: '-0.04em',
  },
  bannerEscudo: {
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    border: '2px solid rgba(201,168,76,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: 'radial-gradient(circle at 30% 30%, rgba(255,245,216,0.12), rgba(201,168,76,0.05))',
    boxShadow: 'inset 0 0 0 8px rgba(201,168,76,0.06)',
  },
  escudoImg: {
    width: '260px',
    height: '260px',
    objectFit: 'contain',
    opacity: 0.95,
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
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
    boxShadow: '0 18px 35px rgba(44, 24, 16, 0.12)',
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

  dashboard: { marginTop: '30px' },
  error: { margin: '0 0 18px', padding: '11px 14px', borderRadius: '10px', color: '#8d2b1e', background: '#fee8e5', border: '1px solid #f0b9ae', fontSize: '14px' },
  dashboardSection: { marginTop: '30px' },
  sectionHeading: { marginBottom: '13px' },
  panelEyebrow: { margin: 0, color: '#95713a', fontSize: '12px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' },
  sectionTitle: { margin: '3px 0 0', color: DARK, fontSize: '22px' },
  overviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '13px' },
  overviewCard: { minHeight: '92px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '15px', background: '#fffdfa', border: '1px solid rgba(117,82,52,0.15)', boxShadow: '0 8px 18px rgba(44,24,16,0.05)', textAlign: 'left' },
  overviewButton: { width: '100%', cursor: 'pointer', fontFamily: 'inherit' },
  overviewIcon: { width: '42px', height: '42px', flexShrink: 0, display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: '12px', color: '#775420', background: '#f2e6cf', fontSize: '21px' },
  overviewImage: { width: '100%', height: '100%', objectFit: 'contain', padding: '4px' },
  overviewLabel: { margin: 0, color: '#836c57', fontSize: '12px', fontWeight: '700', letterSpacing: '0.035em', textTransform: 'uppercase' },
  overviewValue: { margin: '3px 0 0', color: DARK, fontSize: '17px', fontWeight: '700', lineHeight: 1.2 },
  cardArrow: { marginLeft: 'auto', color: '#9b7b4d', fontSize: '20px', lineHeight: 1 },
  activityGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: '18px', marginTop: '30px' },
  nextEventCard: { minHeight: '300px', padding: '26px', borderRadius: '20px', color: '#fffaf4', background: 'linear-gradient(135deg, #251813, #593a28 65%, #242830)', boxShadow: '0 16px 30px rgba(44,24,16,0.16)', border: '1px solid rgba(201,168,76,0.45)' },
  newsCard: { minHeight: '300px', padding: '26px', borderRadius: '20px', background: '#fffdfa', border: '1px solid rgba(117,82,52,0.15)', boxShadow: '0 12px 28px rgba(44,24,16,0.06)' },
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
