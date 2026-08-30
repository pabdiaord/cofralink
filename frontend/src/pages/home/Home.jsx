import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import escudo from '../../assets/escudo.png'
import CharacterIcon from '../../components/CharacterIcon'
import { CHARACTER_INFO } from '../../constants/characterInfo'
import api from '../../api/axios'
import bienvenida from '../../assets/bienvenida.jpg'
import footer from '../../assets/footer.jpg'

const GOLD  = '#c9a84c'
const DARK  = '#2c1810'
const CREAM = '#efe3d7'

function useCuentaAtras(fechaObjetivo) {
  const calcular = () => {
    const ahora    = new Date()
    const objetivo = new Date(fechaObjetivo)
    const diff     = objetivo - ahora

    if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 }

    return {
      dias:     Math.floor(diff / (1000 * 60 * 60 * 24)),
      horas:    Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutos:  Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      segundos: Math.floor((diff % (1000 * 60)) / 1000),
    }
  }

  const [tiempo, setTiempo] = useState(calcular)

  useEffect(() => {
    const interval = setInterval(() => setTiempo(calcular()), 1000)
    return () => clearInterval(interval)
  }, [])

  return tiempo
}

export default function Home() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()
  const [hermano, setHermano] = useState(null)
  const [stats, setStats]     = useState({ eventos: 0, publicaciones: 0 })

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        if (!usuario?.is_staff) {
          const res = await api.get('/mi-perfil/')
          if (activo) setHermano(res.data)
        }
        const [evRes, pubRes] = await Promise.all([
          api.get('/eventos/'),
          api.get('/publicaciones/'),
        ])
        if (activo) setStats({
          eventos:       evRes.data.length,
          publicaciones: pubRes.data.length,
        })
      } catch {}
    }
    cargar()
    return () => { activo = false }
  }, [usuario])

  // Nombre para el saludo
  const nombre = hermano
    ? `${hermano.nombre} ${hermano.apellidos}`
    : (usuario?.username || usuario?.email?.split('@')[0] || 'Hermano')

  // Rol visible
  const caracterCodigo = usuario?.is_staff ? 'MIEMBRO_JUNTA' : hermano?.caracter
  const caracter = CHARACTER_INFO[caracterCodigo]
  const rolVisible = caracter?.label || 'Hermano'
  const iconoRol = caracter
    ? <CharacterIcon caracter={caracterCodigo} alt={caracter.label} style={hs.statRoleDecoration} />
    : '⛪'

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

      {/* ── Tarjetas de datos ── */}
      <div className="home-stats-grid" style={hs.statsGrid}>
        <CuentaAtrasCard />
        <StatCard icon={iconoRol} label="ROL DE HERMANO"        value={rolVisible} />
        <StatCard
          icon="⛪"
          label="RESERVA TU"
          value="PAPELETA"
          onClick={() => navigate('/procesional')}
        />
      </div>

      {/* ── Tarjetas de acceso rápido ── */}
      <div className="home-access-grid" style={hs.accesoGrid}>
        <AccesoCard
          icon="💬"
          titulo="Atención al hermano"
          desc={usuario?.is_staff
            ? 'Atiende las consultas de los hermanos y publica comunicados oficiales.'
            : 'Habla directamente con la Junta de Gobierno.'}
          onClick={() => navigate('/comunicaciones')}
        />
        <AccesoCard
          icon="📰"
          titulo="Noticias y publicaciones"
          desc="Cabildos, cultos y avisos oficiales publicados por la Junta."
          onClick={() => navigate('/publicaciones')}
        />
        <AccesoCard
          icon="📅"
          titulo="Próximos eventos"
          desc={`Hay ${stats.eventos} evento${stats.eventos !== 1 ? 's' : ''} programado${stats.eventos !== 1 ? 's' : ''}. Consulta el calendario de la hermandad.`}
          onClick={() => navigate('/eventos')}
        />
        <AccesoCard
          icon="🪙"
          titulo="Donaciones"
          desc="Colabora con la hermandad realizando una aportación a nuestra hucha."
          onClick={() => navigate('/donaciones')}
        />
      </div>

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
function StatCard({ icon, label, value, valueColor, onClick }) {
  const [hover, setHover] = useState(false)
  const contenido = (
    <>
      <span aria-hidden="true" style={hs.statDecoration}>{icon}</span>
      <div style={hs.statContent}>
        <div style={hs.statHeader}>
          <span style={hs.statLabel}>{label}</span>
        </div>
        <div style={{ ...hs.statValue, ...(valueColor ? { color: valueColor } : {}) }}>
          {value}
        </div>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        style={{ ...hs.statCard, ...hs.statCardButton, ...(hover ? hs.accesoCardHover : {}) }}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {contenido}
      </button>
    )
  }

  return (
    <div style={hs.statCard}>
      {contenido}
    </div>
  )
}

function CuentaAtrasCard() {
  const { dias, horas, minutos, segundos } = useCuentaAtras('2027-03-23T00:00:00')

  return (
    <div style={hs.cuentaCard}>
      <div style={hs.cuentaHeader}>
        <span style={hs.statLabel}>MARTES SANTO · 23 MAR 2027</span>
        <span aria-hidden="true" style={hs.cuentaIcon}>⏳</span>
      </div>
      <div style={hs.cuentaGrid}>
        {[
          { valor: dias,     etiqueta: 'días' },
          { valor: horas,    etiqueta: 'horas' },
          { valor: minutos,  etiqueta: 'min' },
          { valor: segundos, etiqueta: 'seg' },
        ].map(({ valor, etiqueta }) => (
          <div key={etiqueta} style={hs.cuentaItem}>
            <span style={hs.cuentaNumero}>
              {String(valor).padStart(2, '0')}
            </span>
            <span style={hs.cuentaEtiqueta}>{etiqueta}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccesoCard({ icon, titulo, desc, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      className="home-access-card"
      style={{ ...hs.accesoCard, ...(hover ? hs.accesoCardHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span aria-hidden="true" style={hs.accesoDecoration}>{icon}</span>
      <div className="home-access-content" style={hs.accesoContent}>
        <h3 style={hs.accesoTitulo}>{titulo}</h3>
        <p style={hs.accesoDesc}>{desc}</p>
      </div>
    </button>
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
}
