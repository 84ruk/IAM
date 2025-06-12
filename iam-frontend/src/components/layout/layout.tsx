// src/components/layout/Sidebar.tsx
import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white h-screen p-4">
      <h2 className="text-xl font-bold mb-4">IAM</h2>
      <nav className="flex flex-col gap-2">
        <Link href="/dashboard" className="hover:bg-gray-700 p-2 rounded">Dashboard</Link>
        <Link href="/productos" className="hover:bg-gray-700 p-2 rounded">Productos</Link>
        <Link href="/movimientos" className="hover:bg-gray-700 p-2 rounded">Movimientos</Link>
        <Link href="/proveedores" className="hover:bg-gray-700 p-2 rounded">Proveedores</Link>
      </nav>
    </aside>
  )
}
