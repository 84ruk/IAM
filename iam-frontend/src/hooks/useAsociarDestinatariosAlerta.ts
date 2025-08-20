import { useState } from 'react'

export function useAsociarDestinatariosAlerta(sensorId: string | number | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // Reemplazar la lista completa de destinatarios (POST)
  const reemplazar = async (destinatarios: { email?: string; telefono?: string; tipo: 'EMAIL' | 'SMS' | 'AMBOS' }[]) => {
    if (!sensorId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${apiUrl}/sensor-alerts/sensores/${sensorId}/destinatarios`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinatarios }),
      });
      if (!res.ok) throw new Error('Error al asociar destinatarios');
      setSuccess('Destinatarios asociados correctamente');
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

  return {
    reemplazar,
    loading,
    error,
    success,
  }
}


