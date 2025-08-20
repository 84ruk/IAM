'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Skeleton } from '@/components/ui/Skeleton'
import Button  from '@/components/ui/Button'
import { useAsociarDestinatariosAlerta } from '@/hooks/useAsociarDestinatariosAlerta'

interface DestinatarioAlerta {
  id: string
  nombre: string
  email: string
  telefono: string
  tipo: 'EMAIL' | 'SMS' | 'AMBOS'
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  activo: boolean
}

interface ConfiguracionEscalamiento {
  activo: boolean
  tiempoEscalamientoMinutos: number
  niveles: NivelEscalamiento[]
}

interface NivelEscalamiento {
  id: string
  nivel: number
  tiempoMinutos: number
  destinatarios: string[]
  mensaje: string
}

interface ConfiguracionHorario {
  activo: boolean
  horaInicio: string
  horaFin: string
  diasSemana: number[] // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  zonaHoraria: string
}

interface ConfiguracionAlertas {
  tiposNotificacion: {
    email: boolean
    sms: boolean
    webSocket: boolean
    push: boolean
  }
  destinatarios: DestinatarioAlerta[]
  escalamiento: ConfiguracionEscalamiento
  horario: ConfiguracionHorario
  retrasoNotificacionMinutos: number
  maxIntentosNotificacion: number
}

export function ConfiguracionAlertas({ sensorId }: { sensorId: string | number }) {
  const [destinatarios, setDestinatarios] = useState<{ email?: string; telefono?: string; tipo: 'EMAIL' | 'SMS' | 'AMBOS' }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [nuevo, setNuevo] = useState<{ email: string; telefono: string; tipo: 'EMAIL' | 'SMS' | 'AMBOS' }>({ email: '', telefono: '', tipo: 'EMAIL' })
  const [isLoading, setIsLoading] = useState(true)
  const { reemplazar, loading: loadingAsociar } = useAsociarDestinatariosAlerta(sensorId)

  useEffect(() => {
    const cargar = async () => {
      setError(null)
      setIsLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensor-alerts/sensores/${sensorId}/alertas/configuracion`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (!res.ok) {
          if (res.status === 401) throw new Error('No autorizado. Inicia sesión nuevamente.')
          if (res.status === 403) throw new Error('No tienes permisos para ver los destinatarios.')
          throw new Error('Error al cargar destinatarios')
        }
        const data = await res.json()
        setDestinatarios(data.data?.destinatarios || [])
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
          setError((err as { message: string }).message);
        } else {
          setError('Error desconocido');
        }
      } finally {
        setIsLoading(false)
      }
    }
    if (sensorId) cargar()
  }, [sensorId])

  const handleGuardarDestinatarios = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    let destinatariosAGuardar = destinatarios
    // Si hay un destinatario en el input que no ha sido agregado, lo agregamos automáticamente
    if ((nuevo.email && nuevo.email.trim() !== '') || (nuevo.telefono && nuevo.telefono.trim() !== '')) {
      destinatariosAGuardar = [...destinatarios, { ...nuevo }]
      setDestinatarios(destinatariosAGuardar)
      setNuevo({ email: '', telefono: '', tipo: 'EMAIL' })
    }
    try {
      await reemplazar(destinatariosAGuardar)
      setSuccess('Destinatarios guardados correctamente')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
        if ((err as { message: string }).message.includes('401')) setError('No autorizado. Inicia sesión nuevamente.');
        else if ((err as { message: string }).message.includes('403')) setError('No tienes permisos para modificar los destinatarios.');
        else setError((err as { message: string }).message || 'Error al guardar destinatarios');
      } else {
        setError('Error al guardar destinatarios');
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAgregar = () => {
    if (!nuevo.email && !nuevo.telefono) return
    setDestinatarios([...destinatarios, { ...nuevo }])
    setNuevo({ email: '', telefono: '', tipo: 'EMAIL' })
  }

  const handleEditar = (idx: number) => {
    setEditIdx(idx)
    setNuevo({
      email: destinatarios[idx].email ?? '',
      telefono: destinatarios[idx].telefono ?? '',
      tipo: destinatarios[idx].tipo ?? 'EMAIL',
    })
  }

  const handleGuardarEdicion = () => {
    if (editIdx === null) return
    const arr = [...destinatarios]
    arr[editIdx] = { ...nuevo }
    setDestinatarios(arr)
    setEditIdx(null)
    setNuevo({ email: '', telefono: '', tipo: 'EMAIL' })
  }

  const handleEliminar = (idx: number) => {
    setDestinatarios(destinatarios.filter((_, i) => i !== idx))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Destinatarios de Alerta</CardTitle>
        <CardDescription>Agrega, edita o elimina los contactos que recibirán alertas para este sensor.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {destinatarios.length === 0 && (
              <div className="text-center text-gray-400 py-6">No hay destinatarios registrados.</div>
            )}
            {destinatarios.length > 0 && (
              <Table className="mb-4 min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destinatarios.map((d, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{editIdx === idx ? (
                        <Input value={nuevo.email} onChange={e => setNuevo({ ...nuevo, email: e.target.value })} placeholder="Email" />
                      ) : (
                        d.email || <span className="text-gray-300">-</span>
                      )}</TableCell>
                      <TableCell>{editIdx === idx ? (
                        <Input value={nuevo.telefono} onChange={e => setNuevo({ ...nuevo, telefono: e.target.value })} placeholder="Teléfono" />
                      ) : (
                        d.telefono || <span className="text-gray-300">-</span>
                      )}</TableCell>
                      <TableCell>{editIdx === idx ? (
                        <Select value={nuevo.tipo} onValueChange={tipo => setNuevo({ ...nuevo, tipo: tipo as 'EMAIL' | 'SMS' | 'AMBOS' })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMAIL">Email</SelectItem>
                            <SelectItem value="SMS">SMS</SelectItem>
                            <SelectItem value="AMBOS">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">{d.tipo}</Badge>
                      )}</TableCell>
                      <TableCell className="flex gap-2 flex-wrap">
                        {editIdx === idx ? (
                          <>
                            <Button size="sm" onClick={handleGuardarEdicion} variant="default">Guardar</Button>
                            <Button size="sm" onClick={() => setEditIdx(null)} variant="outline">Cancelar</Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" onClick={() => handleEditar(idx)} variant="outline">Editar</Button>
                            <Button size="sm" onClick={() => handleEliminar(idx)} variant="destructive">Eliminar</Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
        {/* Formulario para agregar nuevo destinatario */}
        <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
          <Input
            type="email"
            placeholder="Email"
            value={nuevo.email}
            onChange={e => setNuevo({ ...nuevo, email: e.target.value })}
            className="w-full md:w-48"
          />
          <Input
            type="tel"
            placeholder="Teléfono"
            value={nuevo.telefono}
            onChange={e => setNuevo({ ...nuevo, telefono: e.target.value })}
            className="w-full md:w-40"
          />
          <Select value={nuevo.tipo} onValueChange={tipo => setNuevo({ ...nuevo, tipo: tipo as 'EMAIL' | 'SMS' | 'AMBOS' })}>
            <SelectTrigger className="w-full md:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="AMBOS">Ambos</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={handleAgregar} variant="default">+ Agregar destinatario</Button>
        </div>
        <Button type="button" onClick={handleGuardarDestinatarios} disabled={isSaving || loadingAsociar} className="w-full mt-2">
          {isSaving || loadingAsociar ? 'Guardando...' : 'Guardar Destinatarios'}
        </Button>
        {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
        {success && <div className="text-green-600 mt-2 text-center">{success}</div>}
      </CardContent>
    </Card>
  )
}
