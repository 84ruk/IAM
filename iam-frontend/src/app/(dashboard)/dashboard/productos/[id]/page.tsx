import ProductoDetalleClient from './ProductoDetalleClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductoDetallePage({ params }: { params: { id: string } }) {
  return <ProductoDetalleClient id={params.id} />
} 