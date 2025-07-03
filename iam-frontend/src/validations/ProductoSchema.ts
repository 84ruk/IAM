// src/validations/productoSchema.ts
import { z } from 'zod'

// Esquema base con validaciones robustas
export const productoSchema = z.object({
  nombre: z.string({
    required_error: 'El nombre es obligatorio.',
    invalid_type_error: 'El nombre debe ser un texto.',
  })
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(100, 'El nombre no puede exceder 100 caracteres.')
  .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/, 'El nombre contiene caracteres no permitidos.'),

  descripcion: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres.')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()!?]*$/, 'La descripción contiene caracteres no permitidos.')
    .optional(),

  stock: z.number({
    required_error: 'El stock es obligatorio.',
    invalid_type_error: 'El stock debe ser un número.'
  })
  .int('El stock debe ser un número entero.')
  .min(0, 'El stock no puede ser negativo.')
  .max(999999, 'El stock no puede exceder 999,999.'),

  stockMinimo: z.number({
    required_error: 'El stock mínimo es obligatorio.',
    invalid_type_error: 'El stock mínimo debe ser un número.'
  })
  .int('El stock mínimo debe ser un número entero.')
  .min(0, 'El stock mínimo no puede ser negativo.')
  .max(999999, 'El stock mínimo no puede exceder 999,999.'),

  precioCompra: z.number({
    required_error: 'El precio de compra es obligatorio.',
    invalid_type_error: 'El precio de compra debe ser un número.'
  })
  .min(0, 'El precio de compra no puede ser negativo.')
  .max(999999.99, 'El precio de compra no puede exceder 999,999.99.'),

  precioVenta: z.number({
    required_error: 'El precio de venta es obligatorio.',
    invalid_type_error: 'El precio de venta debe ser un número.'
  })
  .min(0, 'El precio de venta no puede ser negativo.')
  .max(999999.99, 'El precio de venta no puede exceder 999,999.99.'),

  unidad: z.string({
    required_error: 'La unidad de medida es obligatoria.',
    invalid_type_error: 'La unidad debe ser un texto.'
  })
  .min(1, 'Debes seleccionar una unidad de medida.')
  .refine((val) => ['UNIDAD', 'KILO', 'LITRO', 'CAJA', 'PAQUETE'].includes(val), {
    message: 'Unidad de medida no válida.'
  }),

  etiquetas: z.array(z.string()
    .min(1, 'Cada etiqueta debe tener al menos 1 carácter.')
    .max(10, 'Cada etiqueta no puede exceder 10 caracteres.')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/, 'Las etiquetas contienen caracteres no permitidos.')
  )
  .max(5, 'No puedes tener más de 5 etiquetas.')
  .optional(),

  codigoBarras: z.string()
    .max(50, 'El código de barras no puede exceder 50 caracteres.')
    .regex(/^[0-9\-_]*$/, 'El código de barras solo puede contener números, guiones y guiones bajos.')
    .optional(),

  rfid: z.string()
    .max(50, 'El RFID no puede exceder 50 caracteres.')
    .regex(/^[a-zA-Z0-9\-_]*$/, 'El RFID solo puede contener letras, números, guiones y guiones bajos.')
    .optional(),

  ubicacion: z.string()
    .max(100, 'La ubicación no puede exceder 100 caracteres.')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]*$/, 'La ubicación contiene caracteres no permitidos.')
    .optional(),

  temperaturaOptima: z.number()
    .min(-50, 'La temperatura óptima no puede ser menor a -50°C.')
    .max(100, 'La temperatura óptima no puede ser mayor a 100°C.')
    .optional(),

  humedadOptima: z.number()
    .min(0, 'La humedad óptima no puede ser menor a 0%.')
    .max(100, 'La humedad óptima no puede ser mayor a 100%.')
    .optional(),

  proveedorId: z.string()
    .optional()
    .or(z.literal(""))
    .transform((val) => {
      if (!val || val === "") return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .pipe(
      z.number()
        .positive('El ID del proveedor debe ser un número positivo.')
        .optional()
    ),

  sku: z.string()
    .max(50, 'El SKU no puede exceder 50 caracteres.')
    .regex(/^[a-zA-Z0-9\-_]*$/, 'El SKU solo puede contener letras, números, guiones y guiones bajos.')
    .optional(),

  talla: z.string()
    .max(10, 'La talla no puede exceder 10 caracteres.')
    .regex(/^[a-zA-Z0-9\-_]*$/, 'La talla solo puede contener letras, números, guiones y guiones bajos.')
    .optional(),

  color: z.string()
    .max(20, 'El color no puede exceder 20 caracteres.')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'El color solo puede contener letras y espacios.')
    .optional(),

  tipoProducto: z.string()
    .refine((val) => ['GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO'].includes(val), {
      message: 'Tipo de producto no válido.'
    })
    .optional(),
}).refine((data) => {
  // Validación de negocio: precio de venta debe ser mayor o igual al de compra
  if (data.precioVenta && data.precioCompra) {
    return data.precioVenta >= data.precioCompra;
  }
  return true;
}, {
  message: 'El precio de venta debe ser mayor o igual al precio de compra.',
  path: ['precioVenta'],
});

// Esquema para validación en tiempo real (más permisivo)
export const productoSchemaRealtime = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().optional(),
  stock: z.coerce.number().min(0, 'El stock no puede ser negativo.').optional(),
  stockMinimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo.').optional(),
  precioCompra: z.coerce.number().min(0, 'El precio de compra no puede ser negativo.').optional(),
  precioVenta: z.coerce.number().min(0, 'El precio de venta no puede ser negativo.').optional(),
  unidad: z.string().min(1, 'La unidad es obligatoria.'),
  tipoProducto: z.string().optional(),
  etiquetas: z.array(z.string()).optional(),
  codigoBarras: z.string().optional(),
  rfid: z.string().optional(),
  ubicacion: z.string().optional(),
  temperaturaOptima: z.coerce.number().optional(),
  humedadOptima: z.coerce.number().optional(),
  proveedorId: z.string()
    .optional()
    .or(z.literal(""))
    .transform((val) => {
      if (!val || val === "") return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }),
  sku: z.string().optional(),
  talla: z.string().optional(),
  color: z.string().optional(),
});
