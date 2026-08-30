import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'

const ESTADOS = {
  PENDIENTE: { titulo: 'Confirmando donación ', descripcion: 'Stripe Sandbox está notificando el resultado al servidor. Esta pantalla se actualizará automáticamente.', color: '#8a6200' },
  PAGADA: { titulo: 'Donación  confirmada', descripcion: 'La aportación se ha registrado correctamente en la hucha seleccionada. No se ha realizado ningún cargo real.', color: '#166534' },
  FALLIDA: { titulo: 'El pago  no se completó', descripcion: 'Puedes volver a intentarlo con otra tarjeta de prueba.', color: '#b42318' },
  CANCELADA: { titulo: 'Donación  cancelada', descripcion: 'No se ha registrado ningún cargo ni donación confirmada.', color: '#5a5a5a' },
  REEMBOLSADA: { titulo: 'Donación  reembolsada', descripcion: 'La aportación figura como reembolsada en el entorno de pruebas.', color: '#6b21a8' },
}

const formatearEuros = (centimos) => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR',
}).format((centimos || 0) / 100)

export default function DonacionResultado() {
  const [params] = useSearchParams()
  const donacionId = params.get('donacion')
  const [donacion, setDonacion] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!donacionId) return undefined

    let activa = true
    let intentos = 0
    let temporizador
    const consultar = async () => {
      try {
        const respuesta = await api.get(`/donaciones/mis-donaciones/${donacionId}/`)
        if (!activa) return
        setDonacion(respuesta.data)
        intentos += 1
        if (respuesta.data.estado === 'PENDIENTE' && intentos < 10) {
          temporizador = window.setTimeout(consultar, 1000)
        }
      } catch {
        if (activa) setError('No se pudo consultar el resultado de la donación.')
      }
    }
    consultar()
    return () => {
      activa = false
      window.clearTimeout(temporizador)
    }
  }, [donacionId])

  if (!donacionId) {
    return (
      <main className="donation-result-page" style={styles.page}>
        <section className="donation-result-card" style={styles.card}><h1 style={styles.title}>No se ha encontrado la donación solicitada.</h1><Link style={styles.button} to="/donaciones">Volver a Donaciones</Link></section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="donation-result-page" style={styles.page}>
        <section className="donation-result-card" style={styles.card}><h1 style={styles.title}>{error}</h1><Link style={styles.button} to="/donaciones">Volver a Donaciones</Link></section>
      </main>
    )
  }

  if (!donacion) return <p style={styles.loading}>Consultando el resultado de Stripe Sandbox...</p>

  const estado = ESTADOS[donacion.estado] || ESTADOS.PENDIENTE
  return (
    <main className="donation-result-page" style={styles.page}>
      <section className="donation-result-card" style={styles.card}>
        <span style={{ ...styles.icon, color: estado.color }} aria-hidden="true">{donacion.estado === 'PAGADA' ? '✓' : 'ℹ'}</span>
        <p style={styles.eyebrow}>COFRALINK · STRIPE SANDBOX</p>
        <h1 style={{ ...styles.title, color: estado.color }}>{estado.titulo}</h1>
        <p style={styles.description}>{estado.descripcion}</p>
        <div style={styles.summary}>
          <span>Destino</span><strong>{donacion.hucha_nombre}</strong>
          <span>Importe</span><strong>{formatearEuros(donacion.importe_centimos)}</strong>
        </div>
        <Link style={styles.button} to="/donaciones">Volver a Donaciones</Link>
      </section>
    </main>
  )
}

const styles = {
  page: { minHeight: '100vh', padding: '64px 24px', display: 'grid', placeItems: 'start center', color: '#2c1810' },
  card: { maxWidth: '580px', width: '100%', textAlign: 'center', background: 'rgba(255,253,250,0.95)', border: '1px solid rgba(117,82,52,0.18)', borderRadius: '20px', padding: '38px', boxShadow: '0 16px 38px rgba(44,24,16,0.1)' },
  icon: { display: 'inline-grid', placeItems: 'center', width: '52px', height: '52px', border: '2px solid currentColor', borderRadius: '50%', fontSize: '28px', fontWeight: '800' },
  eyebrow: { margin: '18px 0 4px', color: '#8a6b3f', fontSize: '11px', letterSpacing: '0.12em', fontWeight: '800' },
  title: { fontSize: '27px', margin: '8px 0 11px' },
  description: { color: '#684f3d', lineHeight: 1.55, margin: '0 auto 24px', maxWidth: '460px' },
  summary: { display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'left', gap: '10px 20px', borderTop: '1px solid rgba(117,82,52,0.16)', borderBottom: '1px solid rgba(117,82,52,0.16)', padding: '17px 0', marginBottom: '24px', color: '#735c48', fontSize: '14px' },
  button: { display: 'inline-block', textDecoration: 'none', background: '#4c2e20', color: '#fff9ef', padding: '11px 16px', borderRadius: '10px', fontWeight: '800' },
  loading: { textAlign: 'center', color: '#705743', paddingTop: '52px' },
}
