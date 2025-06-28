import EditarMovimientoClient from './EditarMovimientoClient'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditarMovimientoPage({ params }: { params: { id: string } }) {
  return <EditarMovimientoClient />
} 