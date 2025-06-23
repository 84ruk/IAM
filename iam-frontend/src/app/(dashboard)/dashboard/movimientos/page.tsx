// src/app/dashboard/movimientos/page.tsx
'use client'

import useSWR from 'swr'
import { Movimiento } from '@/types/movimiento'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function MovimientosPage() {
  const { data: movimientos, error, isLoading } = useSWR<Movimiento[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/movimientos`,
    fetcher
  )

  const router = useRouter()

  if (isLoading) return <p className="text-center mt-6 text-sm text-gray-500">Cargando movimientos...</p>
  if (error) return <p className="text-center text-red-500">Error al cargar movimientos.</p>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Movimientos de Inventario</h1>
        <Button onClick={() => router.push('/dashboard/movimientos/nuevo')}>
          Registrar Movimiento
        </Button>
      </div>

      {movimientos?.length === 0 ? (
        <p className="text-gray-500">No hay movimientos registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600">
                <th className="py-2 px-4 text-left">Fecha</th>
                <th className="py-2 px-4 text-left">Producto</th>
                <th className="py-2 px-4 text-left">Tipo</th>
                <th className="py-2 px-4 text-left">Cantidad</th>
                <th className="py-2 px-4 text-left">Unidad</th>
                <th className="py-2 px-4 text-left">Categoría</th>
                <th className="py-2 px-4 text-left">Motivo</th>
                <th className="py-2 px-4 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {movimientos?.map((m) => (
                <tr key={m.id} className="border-t text-sm hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {format(new Date(m.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="py-2 px-4 font-medium text-gray-800">{m.producto.nombre}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded font-semibold uppercase tracking-wide ${
                        m.tipo === 'ENTRADA'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="py-2 px-4">{m.cantidad}</td>
                  <td className="py-2 px-4">{m.producto.unidad}</td>
                  <td className="py-2 px-4 text-gray-600">{m.producto.categoria}</td>
                  <td className="py-2 px-4 text-gray-600">{m.motivo || '-'}</td>
                  <td className="py-2 px-4 text-gray-600">{m.descripcion || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
