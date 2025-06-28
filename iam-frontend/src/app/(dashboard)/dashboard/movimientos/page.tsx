// src/app/dashboard/movimientos/page.tsx
import MovimientosClient from './MovimientosClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MovimientosPage() {
  return <MovimientosClient />
}
