import { FieldError } from 'react-hook-form'

export const getErrorMessage = (error: FieldError | { message?: unknown } | undefined): string | undefined => {
  if (!error) return undefined
  if (typeof error.message === 'string') return error.message
  return undefined
}
