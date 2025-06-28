import ProveedorDetalleClient from './ProveedorDetalleClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProveedorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProveedorDetalleClient id={id} />
} 