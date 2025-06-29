import MovimientoEliminadoDetalleClient from './MovimientoEliminadoDetalleClient'

// Configurar para renderizado dinámico
// export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MovimientoEliminadoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await params // Solo para cumplir con el await requerido
  return <MovimientoEliminadoDetalleClient />
} 