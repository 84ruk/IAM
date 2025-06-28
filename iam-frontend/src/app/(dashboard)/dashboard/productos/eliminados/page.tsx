import ProductosEliminadosClient from './ProductosEliminadosClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductosEliminadosPage() {
  return <ProductosEliminadosClient />
} 