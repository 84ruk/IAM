// src/app/dashboard/movimientos/nuevo/page.tsx
import NuevoMovimientoClient from './NuevoMovimientoClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NuevoMovimientoPage() {
  return <NuevoMovimientoClient />
}
