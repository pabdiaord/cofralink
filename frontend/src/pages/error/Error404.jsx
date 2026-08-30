import { useNavigate } from 'react-router-dom'
import logo from '../../assets/LOGO-MARR-RECO.png'
import escudo from '../../assets/escudo.png'

export default function Error404() {
  const navigate = useNavigate()

  return (
    <div className="error-page" style={styles.page}>
      <div className="error-card" style={styles.container}>
        
        {/* Icono principal */}
        <div style={styles.icon}>
          <img src={logo} alt="CofraLink" style={styles.logoImg} />
        </div>

        {/* Texto de error */}
        <h1 style={styles.titulo}>Página no encontrada</h1>
        <p style={styles.codigo}>Error 404</p>
        
        <p style={styles.descripcion}>
          La página que buscas no existe o ha sido movida.
          <br />
          Como en la Semana Santa, a veces nos perdemos en las calles...
        </p>

        {/* Botones de acción */}
        <div style={styles.botones}>
          <button style={styles.btnPrimary} onClick={() => navigate('/')}>
            ← Volver al inicio
          </button>
          <button style={styles.btnSecondary} onClick={() => navigate(-1)}>
            ↶ Ir atrás
          </button>
        </div>

        {/* Decoración */}
        <div style={styles.decoracion}>
          <img src={escudo} alt="Escudo" style={styles.escudoDecoracion} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(249,245,241,0.9) 0%, rgba(245,240,235,0.9) 100%)',
    padding: '20px',
    fontFamily: '"Crimson Text", serif, system-ui',
  },
  container: {
    textAlign: 'center',
    maxWidth: '500px',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(44, 24, 16, 0.15)',
    border: '2px solid rgba(117, 82, 52, 0.15)',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    minHeight: '80px',
  },
  logoImg: {
    width: '100%',
    maxWidth: '120px',
    height: 'auto',
    opacity: 0.9,
    filter: 'drop-shadow(0 4px 8px rgba(44, 24, 16, 0.15))',
  },
  titulo: {
    fontSize: '36px',
    fontWeight: '900',
    color: '#2c1810',
    margin: '10px 0 5px',
    letterSpacing: '-0.5px',
  },
  codigo: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#a87c3c',
    margin: '0 0 20px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  descripcion: {
    fontSize: '15px',
    color: '#4b352d',
    lineHeight: '1.7',
    margin: '0 0 30px',
  },
  botones: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    margin: '30px 0 20px',
  },
  btnPrimary: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #2c1810, #563522)',
    color: '#fff8ee',
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(44,24,16,0.2)',
    transition: 'all 0.3s ease',
  },
  btnSecondary: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '700',
    border: '2px solid #a87c3c',
    borderRadius: '12px',
    background: 'transparent',
    color: '#a87c3c',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  decoracion: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  escudoDecoracion: {
    width: '60px',
    height: '60px',
    opacity: 1,
  },
}
