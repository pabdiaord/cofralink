import { useNavigate } from 'react-router-dom'
import escudo from '../../assets/escudo.png'

function Crest() {
  return <img src={escudo} alt="Escudo de la hermandad" style={{ width: '120px', height: '120px', objectFit: 'contain', display: 'block' }} />
}

export default function SolicitudIngreso() {
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .print-shell, .print-shell * { visibility: visible !important; }
          .print-shell {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-actions { display: none !important; }
        }
      `}</style>

      <div className="print-shell request-page" style={styles.page}>
        <div className="print-actions request-toolbar" style={styles.toolbar}>
          <button style={styles.primaryBtn} onClick={() => window.print()}>
            Descargar / Imprimir
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>

        <div className="request-paper" style={styles.paper}>
          <div style={styles.headerWrap}>
            <div style={styles.crestWrap}>
              <Crest />
            </div>
            <div style={styles.headerText}>
              Hermandad Franciscana y Cofradía de Nazarenos del Santísimo Cristo del Perdón,<br />
              Nuestra Señora de las Angustias, Santa Clara de Asís y San Juan Evangelista.
            </div>
          </div>

          <h1 style={styles.title}>SOLICITUD DE HERMANO</h1>

        <div style={styles.formRow}>
          <span style={styles.label}>Nombre y Apellidos</span>
          <span style={styles.lineLong} />
        </div>

        <div style={styles.formRow}>
          <span style={styles.label}>Nacido en</span>
          <span style={styles.lineMid} />
          <span style={styles.label}>el</span>
          <span style={styles.lineMid} />
        </div>

        <div style={styles.formRow}>
          <span style={styles.label}>Residente en</span>
          <span style={styles.lineLong} />
        </div>

        <div style={styles.formRow}>
          <span style={styles.label}>Calle</span>
          <span style={styles.lineWide} />
          <span style={styles.label}>nº</span>
          <span style={styles.lineShort} />
        </div>

        <div style={styles.formRow}>
          <span style={styles.label}>Profesión</span>
          <span style={styles.lineLong} />
        </div>

        <div style={styles.formRow}>
          <span style={styles.label}>D.N.I</span>
          <span style={styles.lineMid} />
          <span style={styles.label}>Teléfono</span>
          <span style={styles.lineMid} />
          <span style={styles.label}>Correo Electrónico</span>
          <span style={styles.lineMid} />
        </div>

        <div style={styles.formRowLong}>
          <span style={styles.label}>Bautizado en la parroquia de</span>
          <span style={styles.lineLonger} />
        </div>

        <div style={styles.formRowLong}>
          <span style={styles.lineLongerUnder} />
          <span style={styles.label}>de</span>
          <span style={styles.lineShort} />
        </div>

        <div style={styles.paragraph}>
          Deseo pertenecer a esta Hermandad, y me comprometo a cumplir en su totalidad sus REGLAS y enriquecerla con el amor hacia el próximo.
        </div>

        <div style={styles.paragraph}>Y para que conste y surta los efectos oportunos.</div>

        <div style={styles.fecha}>En Alcalá de Guadaíra, a <span style={styles.lineInline} /> de <span style={styles.lineInline} />.</div>

        <div style={styles.signature}>Fdo. <span style={styles.signatureLine} /></div>

          <div style={styles.footerText}>
            C/ Nuestra Señora de las Angustias, s/n. Parroquia de la Inmaculada. Alcalá de Guadaíra, Sevilla.
          </div>
        </div>
      </div>
    </>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '32px 22px 48px',
    background: '#f2eee9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px',
  },
  toolbar: {
    width: '100%',
    maxWidth: '980px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #2c1810, #563522)',
    color: '#fff8ee',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(44, 24, 16, 0.14)',
  },
  secondaryBtn: {
    background: '#f5efe7',
    color: '#2c1810',
    border: '1px solid rgba(44, 24, 16, 0.2)',
    borderRadius: '10px',
    padding: '10px 18px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  paper: {
    width: '100%',
    maxWidth: '980px',
    minHeight: '1250px',
    background: '#f7f5f3',
    border: '1px solid rgba(0,0,0,0.12)',
    boxShadow: '0 22px 40px rgba(0,0,0,0.1)',
    padding: '28px 42px 18px',
    position: 'relative',
    boxSizing: 'border-box',
  },
  headerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  crestWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '6px',
  },
  headerText: {
    fontSize: '18px',
    lineHeight: '1.4',
    color: '#111',
    fontStyle: 'normal',
    fontWeight: '600',
    letterSpacing: '0.01em',
    maxWidth: '860px',
  },
  title: {
    textAlign: 'center',
    fontSize: '26px',
    fontWeight: '900',
    letterSpacing: '0.04em',
    margin: '28px 0 34px',
    color: '#0f0f0f',
  },
  formRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    marginBottom: '12px',
    fontSize: '15px',
    color: '#111',
  },
  formRowLong: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    marginBottom: '12px',
    fontSize: '15px',
    color: '#111',
  },
  label: {
    whiteSpace: 'nowrap',
    fontWeight: '500',
  },
  lineLong: {
    flex: 1,
    borderBottom: '1px solid #111',
    minHeight: '20px',
    display: 'inline-block',
  },
  lineMid: {
    width: '220px',
    borderBottom: '1px solid #111',
    minHeight: '20px',
    display: 'inline-block',
  },
  lineWide: {
    flex: 1,
    borderBottom: '1px solid #111',
    minHeight: '20px',
    display: 'inline-block',
  },
  lineShort: {
    width: '90px',
    borderBottom: '1px solid #111',
    minHeight: '20px',
    display: 'inline-block',
  },
  lineLonger: {
    flex: 1,
    borderBottom: '1px solid #111',
    minHeight: '20px',
    display: 'inline-block',
    marginLeft: '8px',
  },
  lineLongerUnder: {
    width: '360px',
    borderBottom: '1px solid #111',
    minHeight: '20px',
    display: 'inline-block',
  },
  paragraph: {
    marginTop: '34px',
    fontSize: '21px',
    lineHeight: '1.6',
    color: '#111',
    maxWidth: '750px',
  },
  fecha: {
    marginTop: '26px',
    fontSize: '19px',
    color: '#111',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  lineInline: {
    minWidth: '110px',
    borderBottom: '1px solid #111',
    display: 'inline-block',
    height: '24px',
  },
  signature: {
    marginTop: '32px',
    fontSize: '18px',
    color: '#111',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  signatureLine: {
    width: '360px',
    borderBottom: '1px solid #111',
    display: 'inline-block',
    height: '24px',
  },
  footerText: {
    position: 'absolute',
    bottom: '22px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    textAlign: 'center',
    fontSize: '15px',
    color: '#0d0d0d',
    fontWeight: '600',
    padding: '0 34px',
    boxSizing: 'border-box',
  },
}
