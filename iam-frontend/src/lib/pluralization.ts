
const PLURALES_UNIDADES: Record<string, string> = {
  'UNIDAD': 'UNIDADES',
  'KILO': 'KILOS',
  'KILOGRAMO': 'KILOGRAMOS', 
  'LITRO': 'LITROS',
  'CAJA': 'CAJAS',
  'PAQUETE': 'PAQUETES',
  'METRO': 'METROS',
  'PIEZA': 'PIEZAS',
  'BOTELLA': 'BOTELLAS',
  'LATA': 'LATAS',
  'BOLSA': 'BOLSAS',
  'GRAMO': 'GRAMOS',
  'MILILITRO': 'MILILITROS'
}


export const pluralizarUnidad = (cantidad: number, unidad: string): string => {
  // devolver la unidad en singular
  if (cantidad === 1) {
    return unidad
  }
  
  // Convertir a mayúsculas para la búsqueda
  const unidadUpper = unidad.toUpperCase()
  
  // Buscar el plural específico
  const plural = PLURALES_UNIDADES[unidadUpper]
  
  // Si existe un plural específico, usarlo; sino, agregar 'S'
  return plural || `${unidad}S`
}

export const formatearCantidadConUnidad = (cantidad: number, unidad: string): string => {
  const unidadPluralizada = pluralizarUnidad(cantidad, unidad)
  return `${cantidad} ${unidadPluralizada}`
}


export const usePluralizacion = () => {
  return {
    pluralizarUnidad,
    formatearCantidadConUnidad
  }
} 