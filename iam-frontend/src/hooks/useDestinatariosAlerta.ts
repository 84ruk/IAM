import { useEffect, useState } from 'react'

export interface DestinatarioAlerta {
  id: string
  nombre: string
  email: string
  telefono: string
  tipo: 'EMAIL' | 'SMS' | 'AMBOS'
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  activo: boolean
}

interface UseDestinatariosAlertaResult {
  destinatarios: DestinatarioAlerta[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDestinatariosAlerta(): UseDestinatariosAlertaResult {
  const [destinatarios, setDestinatarios] = useState<DestinatarioAlerta[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const fetchDestinatarios = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiUrl}/alertas/destinatarios-alerta`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Error al obtener destinatarios')
      const data = await res.json()
      setDestinatarios(data)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        setError((err as { message: string }).message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDestinatarios()
  }, [fetchDestinatarios])

  return {
    destinatarios,
    loading,
    error,
    refetch: fetchDestinatarios,
  }
}


