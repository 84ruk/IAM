// dashboard/productos/page.tsx
import ProductosClient from './ProductosClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductosPage() {
  return <ProductosClient />
}
