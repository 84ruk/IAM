import ProveedoresEliminadosClient from './ProveedoresEliminadosClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProveedoresEliminadosPage() {
  return <ProveedoresEliminadosClient />
} 