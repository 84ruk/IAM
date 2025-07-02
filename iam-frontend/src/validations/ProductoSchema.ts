// src/validations/productoSchema.ts
import { z } from 'zod'

export const productoSchema = z.object({
  nombre: z.string({
    required_error: 'El nombre es obligatorio.',
    invalid_type_error: 'El nombre debe ser un texto.',
  }).min(1, 'El nombre no puede estar vacío.'),

  descripcion: z.string().optional(),

  stock: z.number({
    required_error: 'El stock es obligatorio.',
    invalid_type_error: 'El stock debe ser un número.'
  }).min(0, 'El stock no puede ser negativo.'),

  stockMinimo: z.number({
    required_error: 'El stock mínimo es obligatorio.',
    invalid_type_error: 'El stock mínimo debe ser un número.'
  }).min(0, 'El stock mínimo no puede ser negativo.'),

  precioCompra: z.number({
    required_error: 'El precio de compra es obligatorio.',
    invalid_type_error: 'El precio de compra debe ser un número.'
  }).min(0, 'El precio de compra no puede ser negativo.'),

  precioVenta: z.number({
    required_error: 'El precio de venta es obligatorio.',
    invalid_type_error: 'El precio de venta debe ser un número.'
  }).min(0, 'El precio de venta no puede ser negativo.'),

  unidad: z.string({
    required_error: 'La unidad de medida es obligatoria.',
    invalid_type_error: 'La unidad debe ser un texto.'
  }).min(1, 'Debes seleccionar una unidad de medida.'),

  etiquetas: z.array(z.string()).optional(),
  codigoBarras: z.string().optional(),
  rfid: z.string().optional(),
  ubicacion: z.string().optional(),

  temperaturaOptima: z.union([
    z.number({ invalid_type_error: 'La temperatura debe ser un número.' }),
    z.nan()
  ]).optional(),

  humedadOptima: z.union([
    z.number({ invalid_type_error: 'La humedad debe ser un número.' }),
    z.nan()
  ]).optional(),

  proveedorId: z.union([
    z.string().min(1, 'El ID del proveedor debe ser un texto válido.'),
    z.literal('')
  ]).optional(),
});
