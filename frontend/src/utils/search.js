const normalizar = valor => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es-ES')

export const coincideBusqueda = (busqueda, ...valores) => {
  const termino = normalizar(busqueda).trim()
  return !termino || valores.some(valor => normalizar(valor).includes(termino))
}
