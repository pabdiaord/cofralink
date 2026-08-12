import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import escudo from '../../assets/escudo.png'
import api from '../../api/axios'

const GOLD  = '#c9a84c'
const DARK  = '#2c1810'
const CREAM = '#f5f0e8'

const CARACTER_LABEL = {
  NAZARENO:      'Nazareno',
  COSTALERO:     'Costalero',
  MIEMBRO_JUNTA: 'Junta de Gobierno',
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
  const rolVisible = usuario?.is_staff
    ? 'Junta de Gobierno'
    : (CARACTER_LABEL[hermano?.caracter] || 'Hermano')

  // Estado cuota
  const estadoVisible = hermano
    ? (hermano.estado_cuota === 'PAGADO' ? 'Al corriente' : 'Pendiente')
    : 'Activo'

  return (
    <div style={hs.page}>

      {/* ── Banner de bienvenida ── */}
      <div style={hs.banner}>
        <div style={hs.bannerContent}>
          <p style={hs.bannerLema}>Hermandad Franciscana del Santísimo Sacramento, Inmaculada Concepción
            y Cofradía de Nazarenos del Santísimo Cristo del Perdón, Nuestra Señora de las Angustias, Santa Clara de Asís y San Juan Evangelista</p>
          <h1 style={hs.bannerTitulo}>Bienvenido {nombre}</h1>
          <p style={hs.bannerDesc}>
            {usuario?.is_staff
              ? 'Esta es tu área en CofraLink. Aquí encontrarás la comunicación con los hermanos, las notificaciones de la hermandad y tu actividad como miembro de la Junta de Gobierno.'
              : 'Esta es tu área en CofraLink. Aquí encontrarás los eventos, las noticias y toda la información de tu hermandad.'}
          </p>
        </div>
        <div style={hs.bannerEscudo}>
            <img src={escudo} alt="Escudo de la hermandad" style={hs.escudoImg} />
        </div>
      </div>

      {/* ── Tarjetas de datos ── */}
      <div style={hs.statsGrid}>
        <StatCard icon="📅" label="AÑO FUNDACIONAL" value="1986" />
        <StatCard icon="📜" label="LEMA"             value="LXX Veces VII" />
        <StatCard icon="👤" label="TU ROL"           value={rolVisible} />
        <StatCard icon="🛡️"  label="ESTADO"           value={estadoVisible}
          valueColor={hermano?.estado_cuota === 'NO_PAGADO' ? '#b45309' : '#2d7a45'} />
      </div>

      {/* ── Tarjetas de acceso rápido ── */}
      <div style={hs.accesoGrid}>
        <AccesoCard
          icon="💬"
          titulo="Chat con la hermandad"
          desc={usuario?.is_staff
            ? 'Atiende las consultas de los hermanos y publica comunicados oficiales.'
            : 'Habla directamente con la Junta de Gobierno.'}
          onClick={() => navigate('/comunicaciones')}
        />
        <AccesoCard
          icon="🔔"
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
          icon="⛪"
          titulo="Papeleta de sitio"
          desc={usuario?.is_staff
            ? 'Gestiona las solicitudes de papeleta de los hermanos.'
            : 'Consulta o solicita tu papeleta para la estación de penitencia.'}
          onClick={() => navigate('/procesional')}
        />
      </div>

    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────
function StatCard({ icon, label, value, valueColor }) {
  return (
    <div style={hs.statCard}>
      <div style={hs.statHeader}>
        <span style={hs.statLabel}>{label}</span>
        <span style={hs.statIcon}>{icon}</span>
      </div>
      <div style={{ ...hs.statValue, ...(valueColor ? { color: valueColor } : {}) }}>
        {value}
      </div>
    </div>
  )
}

function AccesoCard({ icon, titulo, desc, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{ ...hs.accesoCard, ...(hover ? hs.accesoCardHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={hs.accesoIcon}>{icon}</div>
      <h3 style={hs.accesoTitulo}>{titulo}</h3>
      <p style={hs.accesoDesc}>{desc}</p>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────
const hs = {
  page: {
    padding: '24px',
    maxWidth: '1180px',
    margin: '0 auto',
    background: '#f4efe9',
    borderRadius: '24px',
    boxShadow: '0 18px 45px rgba(44, 24, 16, 0.08)',
  },

  // Banner
  banner: {
    background: 'linear-gradient(135deg, #2f1d16 0%, #3d261d 100%)',
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
    marginBottom: '12px',
    textAlign: 'justify',
    lineHeight: '1.6',
  },
  bannerTitulo: {
    color: '#fffaf5',
    fontSize: '54px',
    fontWeight: '700',
    margin: '0 0 14px',
    lineHeight: '1.05',
    letterSpacing: '-0.04em',
  },
  bannerDesc: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: '15px',
    lineHeight: '1.6',
    maxWidth: '620px',
    margin: 0,
    textAlign: 'justify',
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
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
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
  statIcon: { fontSize: '16px', opacity: 0.78 },
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
  },
  accesoCardHover: {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(201,168,76,0.45)',
    boxShadow: '0 18px 28px rgba(44, 24, 16, 0.08)',
  },
  accesoIcon: { fontSize: '28px', marginBottom: '12px', color: '#b68d3d' },
  accesoTitulo: { fontSize: '18px', fontWeight: '700', color: DARK, margin: '0 0 8px' },
  accesoDesc: { fontSize: '13px', color: '#6d564d', lineHeight: '1.55', margin: 0 },
}