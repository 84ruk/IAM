import { useEffect, useState } from 'react'

import { DestinatarioAlerta } from './useDestinatariosAlerta'

interface UseDestinatariosAsociadosAlertaResult {
  destinatarios: DestinatarioAlerta[]
  loading: boolean
  error: string | null
  refetch: () => void
  alertaId: string | null
}

export function useDestinatariosAsociadosAlerta(ubicacionId: string | number | undefined): UseDestinatariosAsociadosAlertaResult {
  const [destinatarios, setDestinatarios] = useState<DestinatarioAlerta[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [alertaId, setAlertaId] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const fetchAsociados = async () => {
    if (!ubicacionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/sensor-alerts/ubicaciones/${ubicacionId}/destinatarios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Error al obtener destinatarios asociados a la ubicación');
      const data = await res.json();
      setDestinatarios(data.data || []);
      setAlertaId(null); // No hay alertaId en este flujo
    } catch (err: unknown) {
      if (err && typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        setError((err as { message: string }).message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsociados()
  }, [ubicacionId, fetchAsociados])

  return {
    destinatarios,
    loading,
    error,
    refetch: fetchAsociados,
    alertaId,
  }
}


