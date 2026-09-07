import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'
import CharacterIcon from '../../components/CharacterIcon'
import AppIcon from '../../components/AppIcon'

export default function Comunicaciones() {
  const { usuario } = useAuth()
  const [tab, setTab] = useState('privado') // 'privado' | 'general'

  return (
    <div className="content-page comunicaciones-page" style={styles.page}>
      {/* Tabs */}
      <div className="chat-tabs" style={styles.tabs}>
        <button
          type="button"
          aria-selected={tab === 'privado'}
          style={{ ...styles.tab, ...(tab === 'privado' ? styles.tabActivo : {}) }}
          onClick={() => setTab('privado')}
        >
          <AppIcon name="chat" size={17} />{usuario?.is_staff ? 'Mensajes privados' : 'Chat con la Junta'}
        </button>
        <button
          type="button"
          aria-selected={tab === 'general'}
          style={{ ...styles.tab, ...(tab === 'general' ? styles.tabActivo : {}) }}
          onClick={() => setTab('general')}
        >
          <AppIcon name="chat" size={17} />Chat general
        </button>
      </div>

      {tab === 'privado'
        ? usuario?.is_staff
          ? <ChatAdminPrivado />
          : <ChatHermanoPrivado />
        : <ChatGeneral />
      }
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// CHAT PRIVADO — Vista del HERMANO
// ══════════════════════════════════════════════════════════
function ChatHermanoPrivado() {
  const [convId, setConvId]       = useState(null)
  const [mensajes, setMensajes]   = useState([])
  const [texto, setTexto]         = useState('')
  const [enviando, setEnviando]   = useState(false)
  const bottomRef                 = useRef(null)

  // Obtener o crear conversación
  useEffect(() => {
    let activo = true
    const init = async () => {
      const res = await api.get('/mi-conversacion/')
      if (activo) setConvId(res.data.id)
    }
    init()
    return () => { activo = false }
  }, [])

  // Cargar mensajes + polling cada 4s
  useEffect(() => {
    if (!convId) return
    const cargar = async () => {
      const res = await api.get(`/conversaciones/${convId}/mensajes/`)
      setMensajes(res.data)
    }
    cargar()
    const interval = setInterval(cargar, 4000)
    return () => clearInterval(interval)
  }, [convId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleEnviar = async e => {
    e.preventDefault()
    if (!texto.trim() || !convId) return
    setEnviando(true)
    try {
      await api.post('/mi-conversacion/', { contenido: texto.trim() })
      setTexto('')
      const res = await api.get(`/conversaciones/${convId}/mensajes/`)
      setMensajes(res.data)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="chat-wrap" style={styles.chatWrap}>
      <div className="chat-header" style={styles.chatHeader}>
        <span style={styles.chatHeaderTitle}><AppIcon name="chat" size={17} />Junta de Gobierno</span>
        <span style={styles.chatHeaderSub}>Escríbenos cualquier consulta o solicitud</span>
      </div>

      <div className="chat-body" style={styles.chatBody}>
        {mensajes.length === 0 && (
          <p style={styles.chatVacio}>Aún no hay mensajes. ¡Escríbenos!</p>
        )}
        {mensajes.map(msg => (
          <BurbujaMensaje key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={handleEnviar} style={styles.chatInput}>
        <input
          style={styles.inputChat}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={enviando}
        />
        <button type="submit" disabled={enviando || !texto.trim()} style={styles.btnEnviar}>
          <AppIcon name="send" size={18} />
        </button>
      </form>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// CHAT PRIVADO — Vista del ADMIN
// ══════════════════════════════════════════════════════════
function ChatAdminPrivado() {
  const [conversaciones, setConversaciones] = useState([])
  const [convActiva, setConvActiva]         = useState(null)
  const [mensajes, setMensajes]             = useState([])
  const [texto, setTexto]                   = useState('')
  const [enviando, setEnviando]             = useState(false)
  const bottomRef                           = useRef(null)

  // Cargar lista de conversaciones
  useEffect(() => {
    let activo = true
    const cargar = async () => {
      const res = await api.get('/conversaciones/')
      if (activo) setConversaciones(res.data)
    }
    cargar()
    const interval = setInterval(cargar, 5000)
    return () => { activo = false; clearInterval(interval) }
  }, [])

  // Cargar mensajes de conversación activa + polling
  useEffect(() => {
    if (!convActiva) return
    const cargar = async () => {
      const res = await api.get(`/conversaciones/${convActiva.id}/mensajes/`)
      setMensajes(res.data)
    }
    cargar()
    const interval = setInterval(cargar, 4000)
    return () => clearInterval(interval)
  }, [convActiva])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleEnviar = async e => {
    e.preventDefault()
    if (!texto.trim() || !convActiva) return
    setEnviando(true)
    try {
      await api.post(`/conversaciones/${convActiva.id}/enviar/`, { contenido: texto.trim() })
      setTexto('')
      const [res, conversacionesRes] = await Promise.all([
        api.get(`/conversaciones/${convActiva.id}/mensajes/`),
        api.get('/conversaciones/')
      ])
      setMensajes(res.data)
      setConversaciones(conversacionesRes.data)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="chat-admin-wrap" style={styles.adminWrap}>
      {/* Panel izquierdo: lista de conversaciones */}
      <div className="chat-conversation-list" style={styles.listaConv}>
        <div style={styles.listaConvHeader}>Conversaciones</div>
        {conversaciones.length === 0 && (
          <p style={{ padding: '16px', color: '#888', fontSize: '13px' }}>
            No hay mensajes todavía.
          </p>
        )}
        {conversaciones.map(conv => (
          <div
            key={conv.id}
            style={{
              ...styles.convItem,
              ...(convActiva?.id === conv.id ? styles.convItemActivo : {})
            }}
            onClick={() => { setConvActiva(conv); setMensajes([]) }}
          >
            <div style={styles.convItemNombre}>
              {conv.hermano_nombre}
              {conv.no_leidos > 0 && (
                <span style={styles.badge}>{conv.no_leidos}</span>
              )}
            </div>
            {conv.ultimo_mensaje && (
              <div style={styles.convItemPreview}>
                {conv.ultimo_mensaje.contenido}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Panel derecho: chat activo */}
      {convActiva ? (
        <div style={styles.chatWrapAdmin}>
          <div className="chat-header" style={styles.chatHeader}>
            <span style={styles.chatHeaderTitle}>
              <AppIcon name="chat" size={17} />{convActiva.hermano_nombre}
            </span>
            <span style={styles.chatHeaderSub}>{convActiva.hermano_email}</span>
          </div>

          <div className="chat-body" style={styles.chatBody}>
            {mensajes.map(msg => (
              <BurbujaMensaje key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          <form className="chat-input" onSubmit={handleEnviar} style={styles.chatInput}>
            <input
              style={styles.inputChat}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Responder..."
              disabled={enviando}
            />
            <button
              type="submit" disabled={enviando || !texto.trim()}
              style={styles.btnEnviar}
            >
              <AppIcon name="send" size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div style={styles.sinSeleccion}>
          <p style={styles.emptyChatState}><AppIcon name="chat" size={18} />Selecciona una conversación para responder</p>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// CHAT GENERAL
// ══════════════════════════════════════════════════════════
const EMOJIS_DISPONIBLES = ['❤️', '👏', '🙏', '😮', '😢', '😂', '⛪', '🕯️']
function ChatGeneral() {
  const { usuario } = useAuth()
  const [mensajes, setMensajes]       = useState([])
  const [texto, setTexto]             = useState('')
  const [enviando, setEnviando]       = useState(false)
  const [selectorMsg, setSelectorMsg] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const bottomRef                     = useRef(null)

  useEffect(() => {
    const cargar = async () => {
      const res = await api.get('/chat-general/')
      setMensajes(res.data)
    }
    cargar()
    const interval = setInterval(cargar, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const openConfirm = (action, payload = null) => {
    setPendingAction({ action, payload })
    setConfirmOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    const { action, payload } = pendingAction
    setConfirmOpen(false)

    if (action === 'create-chat-general') {
      setEnviando(true)
      try {
        await api.post('/chat-general/', { contenido: texto.trim() })
        setTexto('')
        const res = await api.get('/chat-general/')
        setMensajes(res.data)
      } finally {
        setEnviando(false)
      }
    }

    if (action === 'delete-chat-general') {
      await api.delete(`/chat-general/${payload}/`)
      setMensajes(prev => prev.filter(m => m.id !== payload))
    }

    setPendingAction(null)
  }

  const handleEnviar = async e => {
    e.preventDefault()
    if (!texto.trim() || !usuario?.is_staff) return
    openConfirm('create-chat-general')
  }

  const handleEliminar = async id => {
    openConfirm('delete-chat-general', id)
  }

  const handleReaccionar = async (mensajeId, emoji) => {
    setSelectorMsg(null)
    await api.post(`/chat-general/${mensajeId}/reaccionar/`, { emoji })
    const res = await api.get('/chat-general/')
    setMensajes(res.data)
  }

  return (
    <div className="chat-wrap" style={styles.chatWrap} onClick={() => setSelectorMsg(null)}>
      <div className="chat-header" style={styles.chatHeader}>
        <span style={styles.chatHeaderTitle}><AppIcon name="news" size={17} />Canal de la Hermandad</span>
        <span style={styles.chatHeaderSub}>
          {usuario?.is_staff
            ? 'Publica comunicados para todos los hermanos'
            : 'Solo la Junta de Gobierno puede publicar · puedes reaccionar a los mensajes'}
        </span>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction?.action === 'delete-chat-general' ? 'Eliminar comunicado' : 'Publicar comunicado'}
        message={pendingAction?.action === 'delete-chat-general'
          ? '¿Seguro que quieres eliminar este comunicado del canal?'
          : '¿Quieres publicar este comunicado para toda la hermandad?'}
        confirmText={pendingAction?.action === 'delete-chat-general' ? 'Eliminar' : 'Publicar'}
        danger={pendingAction?.action === 'delete-chat-general'}
        onConfirm={executePendingAction}
        onCancel={() => { setConfirmOpen(false); setPendingAction(null) }}
      />

      <div className="chat-body" style={styles.chatBody}>
        {mensajes.length === 0 && (
          <p style={styles.chatVacio}>
            {usuario?.is_staff
              ? 'Publica el primer comunicado de la hermandad.'
              : 'Aún no hay comunicados. La Junta publicará novedades aquí.'}
          </p>
        )}
        {mensajes.map(msg => (
          <MensajeCanal
            key={msg.id}
            msg={msg}
            usuario={usuario}
            selectorAbierto={selectorMsg === msg.id}
            onAbrirSelector={e => { e.stopPropagation(); setSelectorMsg(msg.id) }}
            onReaccionar={handleReaccionar}
            onEliminar={handleEliminar}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {usuario?.is_staff ? (
        <form className="chat-input" onSubmit={handleEnviar} style={styles.chatInput}>
          <input
            style={styles.inputChat}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Escribe un comunicado para la hermandad..."
            disabled={enviando}
          />
          <button type="submit" disabled={enviando || !texto.trim()} style={styles.btnEnviar}>
            <AppIcon name="send" size={18} />
          </button>
        </form>
      ) : (
        <div style={canalStyles.soloLectura}>
          <AppIcon name="lock" size={15} />Solo la Junta de Gobierno puede publicar en este canal
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// COMPONENTE: Mensaje del canal con reacciones
// ══════════════════════════════════════════════════════════
function MensajeCanal({ msg, usuario, selectorAbierto, onAbrirSelector, onReaccionar, onEliminar }) {
  return (
    <div style={canalStyles.mensajeWrap}>
      <div style={canalStyles.burbuja}>

        {/* Cabecera: autor + hora */}
        <div style={canalStyles.burbujaHeader}>
          <span style={canalStyles.burbujaAutor}>
            <CharacterIcon caracter="MIEMBRO_JUNTA" alt="" style={canalStyles.burbujaAutorIcon} />
            {msg.autor_nombre || msg.autor_email}
          </span>
          <span style={canalStyles.burbujaHora}>
            {new Date(msg.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Contenido */}
        <p style={canalStyles.burbujaTexto}>{msg.contenido}</p>

        {/* Pastillas de reacciones existentes */}
        {Object.keys(msg.reacciones || {}).length > 0 && (
          <div style={canalStyles.reaccionesRow}>
            {Object.entries(msg.reacciones).map(([emoji, count]) => (
              <button
                key={emoji}
                style={{
                  ...canalStyles.reaccionPill,
                  ...(msg.mi_reaccion === emoji ? canalStyles.reaccionPillPropia : {})
                }}
                onClick={() => onReaccionar(msg.id, emoji)}
                title={`${count} reacción${count !== 1 ? 'es' : ''}`}
              >
                {emoji} <span style={canalStyles.reaccionCount}>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Fila de acciones */}
        <div style={canalStyles.acciones}>

          {/* Botón reaccionar con selector */}
          <div style={{ position: 'relative' }}>
            <button style={canalStyles.btnReaccionar} onClick={onAbrirSelector}>
              {msg.mi_reaccion ? `${msg.mi_reaccion} Cambiar` : 'Reaccionar'}
            </button>

            {selectorAbierto && (
              <div style={canalStyles.selectorEmoji} onClick={e => e.stopPropagation()}>
                {EMOJIS_DISPONIBLES.map(e => (
                  <button
                    key={e}
                    style={{
                      ...canalStyles.emojiBtn,
                      ...(msg.mi_reaccion === e ? canalStyles.emojiBtnActivo : {})
                    }}
                    onClick={() => onReaccionar(msg.id, e)}
                    title={msg.mi_reaccion === e ? 'Quitar reacción' : 'Reaccionar'}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Eliminar solo admin */}
          {usuario?.is_staff && (
            <button className="action-button action-button--danger" onClick={() => onEliminar(msg.id)}>
              <AppIcon name="trash" size={14} />Eliminar
            </button>
          )}

        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// COMPONENTE: Burbuja de mensaje estilo WhatsApp (chat privado)
// ══════════════════════════════════════════════════════════
function BurbujaMensaje({ msg, onEliminar, mostrarNombre = false }) {
  const mio = msg.es_mio
  return (
    <div style={{ display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
      <div style={{ maxWidth: '70%' }}>
        {mostrarNombre && !mio && (
          <div style={styles.burbujaAutor}>{msg.autor_nombre || msg.autor_email}</div>
        )}
        <div style={{ ...styles.burbuja, ...(mio ? styles.burbujaPropia : styles.burbujaAjena) }}>
          <p style={styles.burbujaTexto}>{msg.contenido}</p>
          <div style={styles.burbujaFooter}>
            <span style={styles.burbujaHora}>
              {new Date(msg.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {onEliminar && (
              <button aria-label="Eliminar mensaje" title="Eliminar mensaje" className="action-button action-button--danger action-button--icon" onClick={onEliminar}>✕</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════
const styles = {
  page: { padding: '32px', maxWidth: '1440px', width: '100%', margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' },

  tabs: { display: 'flex', gap: '8px', marginBottom: '16px', flexShrink: 0 },
  tab: {
    padding: '10px 22px', borderRadius: '12px', border: '1px solid rgba(117, 82, 52, 0.18)',
    background: 'rgba(255,255,255,0.6)', color: '#3d2a20', cursor: 'pointer', fontSize: '14px', fontWeight: '700',
    boxShadow: '0 8px 16px rgba(44, 24, 16, 0.04)', display: 'inline-flex', alignItems: 'center', gap: '7px',
  },
  tabActivo: { background: '#241813', color: '#fffaf5', borderColor: '#241813', boxShadow: 'none' },

  chatWrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    background: '#ffffff', borderRadius: '14px',
    boxShadow: '0 5px 18px rgba(36,24,19,0.045)', overflow: 'hidden', border: '1px solid #e3dedb',
  },
  chatHeader: {
    padding: '16px 20px', background: '#241813',
    display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0,
  },
  chatHeaderTitle: { color: '#f5e6c8', fontWeight: '700', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '7px' },
  chatHeaderSub:   { color: 'rgba(255,255,255,0.7)', fontSize: '12px' },
  chatBody: {
    flex: 1, overflowY: 'auto', padding: '16px',
    background: '#f8f6f4', display: 'flex', flexDirection: 'column',
  },
  chatVacio: { textAlign: 'center', color: '#888', marginTop: '40px', fontSize: '14px' },
  chatInput: {
    display: 'flex', gap: '8px', padding: '12px 16px',
    borderTop: '1px solid #eee', backgroundColor: 'white', flexShrink: 0,
  },
  inputChat: {
    flex: 1, padding: '10px 16px', borderRadius: '24px',
    border: '1px solid #ddd', fontSize: '14px', outline: 'none', fontFamily: 'inherit',
  },
  btnEnviar: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: '#241813', color: '#fffaf5', border: 'none',
    cursor: 'pointer', fontSize: '16px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },

  burbuja: { padding: '8px 14px', borderRadius: '16px', maxWidth: '100%', wordBreak: 'break-word' },
  burbujaPropia: { background: '#241813', color: '#fffaf5', borderBottomRightRadius: '4px' },
  burbujaAjena:  { backgroundColor: 'white', color: '#111', borderBottomLeftRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  burbujaAutor:  { fontSize: '11px', color: '#555', marginBottom: '2px', paddingLeft: '4px', fontWeight: '600' },
  burbujaTexto:  { margin: 0, fontSize: '14px', lineHeight: '1.4' },
  burbujaFooter: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '4px' },
  burbujaHora:   { fontSize: '10px', opacity: 0.6 },

  adminWrap: {
    flex: 1, display: 'flex', borderRadius: '14px', border: '1px solid #e3dedb',
    boxShadow: '0 5px 18px rgba(36,24,19,0.045)', overflow: 'hidden', minHeight: 0,
  },
  listaConv: {
    width: '280px', flexShrink: 0, backgroundColor: 'white',
    borderRight: '1px solid #eee', overflowY: 'auto', display: 'flex', flexDirection: 'column',
  },
  listaConvHeader: { padding: '16px 20px', fontWeight: '700', fontSize: '14px', color: '#2c1810', borderBottom: '1px solid #eee', flexShrink: 0 },
  convItem: { padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s' },
  convItemActivo: { backgroundColor: '#f0f4ff' },
  convItemNombre: { fontWeight: '600', fontSize: '14px', color: '#2c1810', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  convItemPreview: { fontSize: '12px', color: '#888', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badge: { backgroundColor: '#e53e3e', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' },
  chatWrapAdmin: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  sinSeleccion:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '15px', backgroundColor: '#f9f9f9' },
  emptyChatState: { display: 'inline-flex', alignItems: 'center', gap: '7px' },
}

const canalStyles = {
  soloLectura: {
    padding: '12px 20px', backgroundColor: '#f9f9f9',
    borderTop: '1px solid #eee', textAlign: 'center',
    fontSize: '13px', color: '#888', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  },
  mensajeWrap: { marginBottom: '14px' },
  burbuja: {
    background: 'white', borderRadius: '12px', padding: '14px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #f0ece4',
  },
  burbujaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  burbujaAutor:  { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '700', color: '#2c1810' },
  burbujaAutorIcon: { width: '18px', height: '18px', objectFit: 'contain' },
  burbujaHora:   { fontSize: '11px', color: '#aaa' },
  burbujaTexto:  { margin: '0 0 10px', fontSize: '14px', color: '#222', lineHeight: '1.5' },

  reaccionesRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' },
  reaccionPill: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '20px', border: '1px solid #e0dbd0',
    background: '#faf7f2', cursor: 'pointer', fontSize: '14px',
  },
  reaccionPillPropia: { background: '#fef3c7', borderColor: '#d97706' },
  reaccionCount: { fontSize: '12px', fontWeight: '600', color: '#555' },

  acciones: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
  btnReaccionar: {
    fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
    border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer', color: '#555',
  },

  selectorEmoji: {
    position: 'absolute', bottom: '34px', left: 0,
    background: 'white', borderRadius: '12px', padding: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #eee',
    display: 'flex', gap: '4px', flexWrap: 'wrap', width: '220px', zIndex: 100,
  },
  emojiBtn: {
    fontSize: '22px', padding: '4px', borderRadius: '8px',
    border: 'none', background: 'transparent', cursor: 'pointer',
  },
  emojiBtnActivo: { background: '#fef3c7' },
}
