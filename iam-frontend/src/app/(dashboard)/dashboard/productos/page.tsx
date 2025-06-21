'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
  }).then(res => res.json())

export default function ProductosPage() {
  const { data: productos, isLoading, error } = useSWR('/productos', fetcher)
  const [filtro, setFiltro] = useState('')

  const productosFiltrados = productos?.filter((p: any) =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
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
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Precio Compra</th>
                <th className="px-4 py-3">Precio Venta</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados?.map((producto: any) => (
                <tr key={producto.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{producto.nombre}</td>
                  <td className="px-4 py-2">{producto.stock}</td>
                  <td className="px-4 py-2">${producto.precioCompra.toFixed(2)}</td>
                  <td className="px-4 py-2">${producto.precioVenta.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">
                    <button className="text-sm text-[#8E94F2] hover:underline">Editar</button>
                    <button className="ml-2 text-sm text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {productosFiltrados?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
