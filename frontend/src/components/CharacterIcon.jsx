import { CHARACTER_INFO } from '../constants/characterInfo'

export default function CharacterIcon({ caracter, alt, style, className }) {
  const info = CHARACTER_INFO[caracter]
  if (!info) return null

  return (
    <img
      src={info.icon}
      alt={alt ?? info.label}
      className={className}
      style={style}
    />
  )
}
