import React, { useState } from 'react'
import { useDestinatariosAsociadosAlerta } from '@/hooks/useDestinatariosAsociadosAlerta'
import { useAsociarDestinatariosAlerta } from '@/hooks/useAsociarDestinatariosAlerta'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

interface GestionDestinatariosAlertaProps {
  ubicacionId: string | number
}

export const GestionDestinatariosAlerta: React.FC<GestionDestinatariosAlertaProps> = ({ ubicacionId }) => {
  const { destinatarios: asociados, loading: loadingAsociados, error: errorAsociados, refetch: refetchAsociados, alertaId } = useDestinatariosAsociadosAlerta(ubicacionId)
  const { reemplazar, loading: loadingAccion, error: errorAccion, success } = useAsociarDestinatariosAlerta(alertaId)

  const [seleccionados, setSeleccionados] = useState<{ id: string, tipo: 'EMAIL' | 'SMS' | 'AMBOS' }[]>([])

  // Filtrar los disponibles que no están asociados

  const handleAsociar = async () => {
    if (seleccionados.length === 0) return;
    await reemplazar(
      seleccionados.map(sel => {
        const dest = asociados.find(d => d.id === sel.id);
        return {
          email: dest?.email,
          telefono: dest?.telefono,
          tipo: sel.tipo
        };
      })
    );
    setSeleccionados([]);
    refetchAsociados();
  };

  const handleDesasociar = async (id: string) => {
    const dest = asociados.find(d => d.id === id);
    const tipo = dest?.tipo || 'EMAIL';
    await reemplazar([{ email: dest?.email, telefono: dest?.telefono, tipo }]);
    refetchAsociados();
  };

  if (loadingAsociados) {
    return <Skeleton className="h-40 w-full" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Destinatarios de Alerta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Destinatarios asociados */}
        <div>
          <h3 className="font-semibold mb-2">Asociados a la alerta</h3>
          {asociados.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay destinatarios asociados.</p>
          ) : (
            <ul className="space-y-2">
              {asociados.map(dest => (
                <li key={dest.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-900">{dest.nombre}</span>
                    <span className="ml-2 text-xs text-gray-500">{dest.email}</span>
                    <Badge className="ml-2" variant="outline">{dest.tipo}</Badge>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleDesasociar(dest.id)} disabled={loadingAccion}>
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Destinatarios disponibles para asociar */}
        <div>
          <h3 className="font-semibold mb-2">Agregar destinatarios</h3>
            {asociados.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay más destinatarios disponibles.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {asociados.map(dest => {
                  const seleccionado = seleccionados.find(s => s.id === dest.id);
                  return (
                    <li key={dest.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">{dest.nombre}</span>
                        <span className="ml-2 text-xs text-gray-500">{dest.email}</span>
                        <Badge className="ml-2" variant="secondary">{dest.tipo}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!seleccionado}
                          onChange={e => {
                            if (e.target.checked) {
                              setSeleccionados(prev => [...prev, { id: dest.id, tipo: 'EMAIL' }]);
                            } else {
                              setSeleccionados(prev => prev.filter(s => s.id !== dest.id));
                            }
                          }}
                          disabled={loadingAccion}
                        />
                        {seleccionado && (
                          <select
                            value={seleccionado.tipo}
                            onChange={e => {
                              setSeleccionados(prev =>
                                prev.map(s =>
                                  s.id === dest.id ? { ...s, tipo: e.target.value as 'EMAIL' | 'SMS' | 'AMBOS' } : s
                                )
                              );
                            }}
                            className="ml-2 border rounded px-2 py-1 text-xs"
                            disabled={loadingAccion}
                          >
                            <option value="EMAIL">Email</option>
                            <option value="SMS">SMS</option>
                            <option value="AMBOS">Ambos</option>
                          </select>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Button className="mt-3" onClick={handleAsociar} disabled={seleccionados.length === 0 || loadingAccion}>
                Asociar seleccionados
              </Button>
            </>
          )}
        </div>
        {/* Mensajes de error o éxito */}
        {errorAsociados && <p className="text-red-500 text-sm">{errorAsociados}</p>}
        {errorAccion && <p className="text-red-500 text-sm">{errorAccion}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </CardContent>
    </Card>
  )
}


