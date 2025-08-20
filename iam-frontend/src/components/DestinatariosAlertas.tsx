'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Destinatario, TipoDestinatarioAlerta, SeveridadAlerta } from '@/types/alertas';
import { Badge } from '@/components/ui/Badge';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';

interface DestinatariosAlertasProps {
  destinatarios: Destinatario[];
  onAgregar: (destinatario: Omit<Destinatario, 'id'>) => void;
  onEliminar: (destinatarioId: number) => void;
  disabled?: boolean;
  configuracionAlertaId: number;
}

const tiposAlerta = [
  { value: SeveridadAlerta.BAJA, label: 'Baja' },
  { value: SeveridadAlerta.MEDIA, label: 'Media' },
  { value: SeveridadAlerta.ALTA, label: 'Alta' },
  { value: SeveridadAlerta.CRITICA, label: 'Crítica' },
];

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  tipo: z.nativeEnum(TipoDestinatarioAlerta),
  configuracionAlertaId: z.number()
}).superRefine((data, ctx) => {
  if ((data.tipo === TipoDestinatarioAlerta.SMS || data.tipo === TipoDestinatarioAlerta.AMBOS) && (!data.telefono || data.telefono.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El teléfono es requerido para notificaciones SMS',
      path: ['telefono']
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

export const DestinatariosAlertas: React.FC<DestinatariosAlertasProps> = ({
  destinatarios,
  onAgregar,
  onEliminar,
  disabled = false,
  configuracionAlertaId
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      tipo: TipoDestinatarioAlerta.EMAIL,
      configuracionAlertaId
    }
  });

  const { addToast } = useToast();

  const onSubmit = async (values: FormValues) => {
    try {
      onAgregar(values);
      form.reset();
      addToast({
        type: 'success',
        title: 'Éxito',
        message: 'Destinatario agregado correctamente',
        duration: 4000
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo agregar el destinatario',
        duration: 4000
      });
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">Destinatarios de Alertas</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage>{form.formState.errors.nombre?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage>{form.formState.errors.email?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage>{form.formState.errors.telefono?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Alerta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tipos de Alerta</SelectLabel>
                        <SelectItem value={TipoDestinatarioAlerta.EMAIL}>Email</SelectItem>
                        <SelectItem value={TipoDestinatarioAlerta.SMS}>SMS</SelectItem>
                        <SelectItem value={TipoDestinatarioAlerta.AMBOS}>Ambos</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage>{form.formState.errors.tipo?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled}>
              Agregar Destinatario
            </Button>
          </form>
        </Form>

        <div className="mt-6 space-y-2">
          {destinatarios.map((destinatario) => (
            <div 
              key={destinatario.id} 
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{destinatario.nombre}</p>
                <p className="text-sm text-gray-600">
                  {destinatario.email} - {destinatario.telefono || 'Sin teléfono'}
                  <Badge variant="outline" className="ml-2">
                    {destinatario.tipo}
                  </Badge>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8"
                onClick={() => destinatario.id && onEliminar(destinatario.id)}
                disabled={disabled}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
