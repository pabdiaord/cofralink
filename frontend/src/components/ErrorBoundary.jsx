import { Component } from 'react'
import logo from '../assets/LOGO-MARR-RECO.png'
import escudo from '../assets/escudo.png'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.page}>
          <div style={styles.container}>
            
            {/* Icono principal */}
            <div style={styles.icon}>
              <img src={logo} alt="CofraLink" style={styles.logoImg} />
            </div>

            {/* Texto de error */}
            <h1 style={styles.titulo}>¡Algo salió mal!</h1>
            <p style={styles.codigo}>Error de aplicación</p>
            
            <p style={styles.descripcion}>
              Hemos encontrado un problema inesperado.
              <br />
              No te preocupes, recargaremos la página para ti.
            </p>

            {/* Detalles técnicos (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={styles.detalles}>
                <p style={styles.detallesLabel}>Detalles del error:</p>
                <pre style={styles.detallesText}>
                  {this.state.error?.toString()}
                </pre>
              </div>
            )}

            {/* Botones de acción */}
            <div style={styles.botones}>
              <button style={styles.btnPrimary} onClick={this.handleReset}>
                🏠 Volver al inicio
              </button>
              <button style={styles.btnSecondary} onClick={() => window.location.reload()}>
                🔄 Recargar página
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

    return this.props.children
  }
}

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(249,245,241,0.9) 0%, rgba(245,240,235,0.9) 100%)',
    padding: '20px',
  },
  container: {
    textAlign: 'center',
    maxWidth: '500px',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(44, 24, 16, 0.15)',
    border: '2px solid rgba(185, 28, 28, 0.15)',
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
    opacity: 0.8,
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
    color: '#b45309',
    margin: '0 0 20px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  descripcion: {
    fontSize: '15px',
    color: '#4b352d',
    lineHeight: '1.7',
    margin: '0 0 20px',
  },
  detalles: {
    background: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '10px',
    padding: '15px',
    margin: '20px 0',
    textAlign: 'left',
  },
  detallesLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#92400e',
    margin: '0 0 8px',
    textTransform: 'uppercase',
  },
  detallesText: {
    fontSize: '11px',
    color: '#78350f',
    background: '#fef9e7',
    padding: '10px',
    borderRadius: '6px',
    overflow: 'auto',
    maxHeight: '150px',
    margin: 0,
    fontFamily: 'monospace',
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
    border: '2px solid #b45309',
    borderRadius: '12px',
    background: 'transparent',
    color: '#b45309',
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
