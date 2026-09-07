import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'
import politicaPrivacidad from '../../../docs_frontend/Politica-de-privacidad.md?raw'
import terminosServicio from '../../../docs_frontend/Terminos-servicio.md?raw'

const DOCUMENTOS = {
  privacidad: politicaPrivacidad,
  terminos: terminosServicio,
}

function renderInline(texto) {
  return texto.split(/(\*\*[^*]+\*\*|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g).map((parte, indice) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return <strong key={indice}>{parte.slice(2, -2)}</strong>
    }
    if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(parte)) {
      return <a key={indice} href={`mailto:${parte}`}>{parte}</a>
    }
    return parte
  })
}

function renderMarkdown(markdown) {
  const bloques = []
  let parrafo = []
  let elementosLista = []

  const vaciarParrafo = () => {
    if (!parrafo.length) return
    bloques.push(<p key={`p-${bloques.length}`}>{renderInline(parrafo.join(' '))}</p>)
    parrafo = []
  }

  const vaciarLista = () => {
    if (!elementosLista.length) return
    bloques.push(
      <ul key={`ul-${bloques.length}`}>
        {elementosLista.map((elemento, indice) => <li key={indice}>{renderInline(elemento)}</li>)}
      </ul>
    )
    elementosLista = []
  }

  markdown.split(/\r?\n/).forEach((linea) => {
    const encabezado = linea.match(/^(#{1,3})\s+(.+)$/)
    const elementoLista = linea.match(/^-\s+(.+)$/)

    if (encabezado) {
      vaciarParrafo()
      vaciarLista()
      const nivel = encabezado[1].length
      const TextoEncabezado = `h${nivel}`
      bloques.push(<TextoEncabezado key={`h-${bloques.length}`}>{renderInline(encabezado[2])}</TextoEncabezado>)
      return
    }

    if (elementoLista) {
      vaciarParrafo()
      elementosLista.push(elementoLista[1])
      return
    }

    if (!linea.trim()) {
      vaciarParrafo()
      vaciarLista()
      return
    }

    if (linea.trim() !== '---') parrafo.push(linea.trim())
  })

  vaciarParrafo()
  vaciarLista()
  return bloques
}

export default function LegalDocument({ tipo }) {
  const { usuario } = useAuth()
  const documento = DOCUMENTOS[tipo]
  const volverA = usuario ? '/' : '/login'

  return (
    <main className="legal-page">
      <div className="legal-page__bar">
        <Link className="legal-page__brand" to={volverA} aria-label="CofraLink: volver al inicio">
          <img src={logo} alt="CofraLink" />
        </Link>
        <Link className="legal-page__back" to={volverA}>
          {usuario ? 'Volver al inicio' : 'Volver al inicio de sesión'}
        </Link>
      </div>

      <article className="legal-document">
        {renderMarkdown(documento)}
      </article>
    </main>
  )
}
