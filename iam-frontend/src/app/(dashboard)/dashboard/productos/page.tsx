// dashboard/productos/page.tsx
'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Producto } from '@/types/producto'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowUpIcon, CopyIcon } from 'lucide-react'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
  }).then(res => res.json())

export default function ProductosPage() {
  const { data: productos, isLoading, error, mutate } = useSWR<Producto[]>('/productos', fetcher)
  const [filtro, setFiltro] = useState('')
  const [orden, setOrden] = useState<'asc' | 'desc'>('asc')
  const [columnaOrden, setColumnaOrden] = useState<keyof Producto>('nombre')
  const [pagina, setPagina] = useState(1)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  const itemsPorPagina = 5

  const productosFiltrados = useMemo(() => {
    const filtrados = productos?.filter((p) =>
      p.nombre.toLowerCase().includes(filtro.toLowerCase())
    ) || []

    const ordenados = filtrados.sort((a, b) => {
      const valorA = a[columnaOrden] ?? ''
      const valorB = b[columnaOrden] ?? ''
      return orden === 'asc'
        ? String(valorA).localeCompare(String(valorB))
        : String(valorB).localeCompare(String(valorA))
    })

    return ordenados.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina)
  }, [productos, filtro, orden, columnaOrden, pagina])

  const cambiarOrden = (columna: keyof Producto) => {
    if (columna === columnaOrden) {
      setOrden(orden === 'asc' ? 'desc' : 'asc')
    } else {
      setColumnaOrden(columna)
      setOrden('asc')
    }
  }


  const eliminarProducto = async (id: number) => {
  const confirmar = confirm('¿Deseas eliminar este producto? Esta acción no se puede deshacer.')
  if (!confirmar) return

  try {
    setEliminandoId(id)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    console.log(res)
    if (!res.ok) throw new Error('No se pudo eliminar')
    mutate()
  } catch (e) {
    
    alert('Error al eliminar producto')
  } finally {
    setEliminandoId(null)
  }
}


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <Link
          href="/dashboard/productos/nuevo"
          className="bg-[#8E94F2] hover:bg-[#7278e0] text-white text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          Nuevo producto
        </Link>
      </div>

      <input
        type="text"
        placeholder="Buscar producto..."
        className="w-full max-w-sm mb-4 px-3 py-2 text-sm shadow-sm rounded"
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
      />

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded shadow-sm" />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-600">Error al cargar productos</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md bg-white">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs uppercase bg-gray-50 text-gray-500">
              <tr>
                {['nombre', 'stock', 'unidad', 'categoria', 'precioCompra', 'precioVenta'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 cursor-pointer select-none"
                    onClick={() => cambiarOrden(col as keyof Producto)}
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}{' '}
                    {columnaOrden === col && (orden === 'asc' ? <ArrowUpIcon className="inline h-4 w-4" /> : <ArrowDownIcon className="inline h-4 w-4" />)}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto) => (
                <tr key={producto.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{producto.nombre}</td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      'inline-block px-2 py-1 text-xs rounded font-semibold',
                      producto.stock < producto.stockMinimo
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    )}>
                      {producto.stock}
                    </span>
                  </td>
                  <td className="px-4 py-2 capitalize">{producto.unidad.toLowerCase()}</td>
                  <td className="px-4 py-2 capitalize">{producto.categoria || '-'}</td>
                  <td className="px-4 py-2">${producto.precioCompra.toFixed(2)}</td>
                  <td className="px-4 py-2">${producto.precioVenta.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <Link
                      href={`/dashboard/productos/${producto.id}/editar`}
                      className="text-sm text-[#8E94F2] hover:underline"
                    >
                      Editar
                    </Link>
                  <button
                    onClick={() => eliminarProducto(producto.id)}
                    className="text-sm text-red-500 hover:underline hover:cursor-pointer disabled:opacity-50"
                    disabled={eliminandoId === producto.id}
                    >
                  {eliminandoId === producto.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  </td>
                </tr>
              ))}
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-center text-gray-400">
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center py-4 px-2">
            <button
              onClick={() => setPagina(p => Math.max(p - 1, 1))}
              disabled={pagina === 1}
              className="text-sm text-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">Página {pagina}</span>
            <button
              onClick={() => setPagina(p => p + 1)}
              disabled={productosFiltrados.length < itemsPorPagina}
              className="text-sm text-gray-700 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
