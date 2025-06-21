'use client'

import { useState } from 'react'
import { useUser } from '@/lib/useUser'
import { useRouter } from 'next/navigation'

export default function CrearEmpresaPage() {
  const { data: user } = useUser()
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '',
    industria: '',
    emailContacto: '',
    direccion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/empresas`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.refresh()
  }

  return (
    <div className="p-4 max-w-xl mx-auto bg-white rounded shadow-md">
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Crear nueva empresa</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="input shadow-sm w-full"
          placeholder="Nombre de la empresa"
          onChange={e => setForm({ ...form, nombre: e.target.value })}
        />
        <input
          className="input shadow-sm w-full"
          placeholder="Industria (ej. Alimentos)"
          onChange={e => setForm({ ...form, industria: e.target.value })}
        />
        <input
          className="input shadow-sm w-full"
          placeholder="Email de contacto"
          onChange={e => setForm({ ...form, emailContacto: e.target.value })}
        />
        <input
          className="input shadow-sm w-full"
          placeholder="Dirección"
          onChange={e => setForm({ ...form, direccion: e.target.value })}
        />
        <button className="btn bg-[#8E94F2] text-white w-full">Crear empresa</button>
      </form>
    </div>
  )
}
