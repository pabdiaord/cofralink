export default function AppIcon({ name, size = 22, style, title }) {
  const props = {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style,
    'aria-hidden': title ? undefined : 'true',
  }

  const contenido = {
    home: <><path d="M3.5 10.5 12 3.7l8.5 6.8v9.2H14v-5.2h-4v5.2H3.5z" /><path d="M8 19.7v-5.2h8v5.2" /></>,
    news: <><path d="M4 5h16v14H4z" /><path d="M7 8h6M7 11h10M7 14h10M7 17h6" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01" /></>,
    document: <><path d="M7 3.5h6l4 4v13H7z" /><path d="M13 3.5v4h4M9.5 12h5M9.5 15.5h5" /></>,
    chat: <><path d="M5 5.5h14v10H11l-4.5 3v-3H5z" /><path d="M8.5 10h7M8.5 12.8h4.5" /></>,
    coin: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="5.8" opacity="0.5" /><text x="12" y="15.2" textAnchor="middle" fill="currentColor" stroke="none" fontSize="10.5" fontWeight="700">€</text></>,
    request: <><path d="M7 3.5h6l4 4v13H7z" /><path d="M13 3.5v4h4M9.5 12h5M9.5 15.5h2" /><path d="M15.5 14v4M13.5 16h4" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3.8 19.5c.5-3.2 2.4-5 5.2-5s4.7 1.8 5.2 5" /><path d="M16 5.5a3 3 0 0 1 0 5.8M16.5 14.7c2 .5 3.3 2.1 3.7 4.8" /></>,
    inventory: <><path d="m4 8 8-4 8 4-8 4zM4 8v8l8 4 8-4V8M12 12v8" /></>,
    logout: <><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4M8 12h10" /></>,
  }[name] || <circle cx="12" cy="12" r="7" />

  return <svg {...props}>{title && <title>{title}</title>}{contenido}</svg>
}
