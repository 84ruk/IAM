import ProductoDetalleClient from './ProductoDetalleClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProductoDetalleClient id={id} />
} 