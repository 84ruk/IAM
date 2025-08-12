'use client'

import { createContext, useContext, useMemo } from 'react'
import { User } from '@/types/user'

export const ServerUserContext = createContext<User | null>(null)
export const useServerUser = () => useContext(ServerUserContext)

function normalizeUser(input: User | null | undefined): User | null {
  if (!input) return null

  const resolvedId = input.id ?? input.sub

  return {
    ...input,
    // Garantizar que ambos existan para compatibilidad
    id: resolvedId,
    sub: resolvedId,
    // Defaults seguros
    tipoIndustria: input.tipoIndustria ?? 'GENERICA',
    setupCompletado: input.setupCompletado ?? false,
    // Mantener empresaId opcional
    empresaId: typeof input.empresaId === 'number' ? input.empresaId : undefined,
  }
}

export function UserContextProvider({ user, children }: { user?: User, children: React.ReactNode }) {
  const normalizedUser = useMemo(() => normalizeUser(user), [user])
  return <ServerUserContext.Provider value={normalizedUser}>{children}</ServerUserContext.Provider>
}