import MovimientoEliminadoDetalleClient from './MovimientoEliminadoDetalleClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MovimientoEliminadoDetallePage({ params }: { params: { id: string } }) {
  return <MovimientoEliminadoDetalleClient />
} 