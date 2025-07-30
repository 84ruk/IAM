import { FieldError } from 'react-hook-form'

export const getErrorMessage = (error: FieldError | { message?: unknown } | undefined): string | undefined => {
  if (!error) return undefined
  if (typeof error.message === 'string') return error.message
  return undefined
}

/**
 * Limpia valores vacíos de un objeto de formulario
 * Convierte strings vacíos, null y undefined a undefined para que @IsOptional() funcione correctamente
 * @param formData - Objeto con los datos del formulario
 * @returns Objeto limpio sin valores vacíos
 */
export function cleanFormData<T extends Record<string, unknown>>(formData: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(formData).map(([key, value]) => {
      // Si el valor es string vacío, null o undefined, no incluirlo
      if (value === '' || value === null || value === undefined) {
        return [key, undefined]
      }
      // Si es un número y es 0, mantenerlo (puede ser válido)
      if (typeof value === 'number') {
        return [key, value]
      }
      // Si es un array vacío, mantenerlo (puede ser válido para limpiar)
      if (Array.isArray(value)) {
        return [key, value]
      }
      return [key, value]
    }).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}

/**
 * Limpia valores vacíos específicos para IDs de proveedor
 * @param formData - Objeto con los datos del formulario
 * @returns Objeto limpio sin valores vacíos
 */
export function cleanFormDataWithProveedor<T extends Record<string, unknown>>(formData: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(formData).map(([key, value]) => {
      // Si el valor es string vacío, null o undefined, no incluirlo
      if (value === '' || value === null || value === undefined) {
        return [key, undefined]
      }
      // Si es proveedorId y es 0 o string vacío, no incluirlo
      if (key === 'proveedorId' && (value === 0 || value === '')) {
        return [key, undefined]
      }
      return [key, value]
    }).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}
