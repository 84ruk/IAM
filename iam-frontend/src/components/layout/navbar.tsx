// src/components/layout/Navbar.tsx
export default function Navbar() {
  return (
    <header className="w-full bg-white shadow px-6 py-4 flex justify-between items-center">
      <h1 className="text-lg font-semibold text-gray-800">Panel de administración</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Usuario</span>
        <button className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </div>
    </header>
  )
}
