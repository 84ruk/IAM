import { useImportacionUnified } from './useImportacionUnified'

export const useImportacionSafe = () => {
  // Usar el hook unificado que ya maneja todos los casos de forma segura
  return useImportacionUnified()
} 