import ProveedorDetalleClient from './ProveedorDetalleClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProveedorDetallePage({ params }: { params: { id: string } }) {
  return <ProveedorDetalleClient id={params.id} />
} 