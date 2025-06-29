import EditarProductoClient from './EditarProductoClient'

// Configurar para renderizado dinámico
// export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  await params // Solo para cumplir con el await requerido
  return <EditarProductoClient />
}
