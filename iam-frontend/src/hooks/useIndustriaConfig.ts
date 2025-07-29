'use client'

import { useMemo } from 'react'
import { useServerUser } from '@/context/ServerUserContext'
import { INDUSTRIAS, TipoIndustria } from '@/config/industrias.config'

export function useIndustriaConfig() {
  const user = useServerUser()

  const config = useMemo(() => {
    if (!user) {
      return INDUSTRIAS.GENERICA
    }

    const tipoIndustria = user.tipoIndustria || 'GENERICA'
    const validTipo = Object.keys(INDUSTRIAS).includes(tipoIndustria) 
      ? tipoIndustria as TipoIndustria 
      : 'GENERICA'
    
    return INDUSTRIAS[validTipo as TipoIndustria]
  }, [user])

  return {
    config,
    tipoIndustria: user?.tipoIndustria || 'GENERICA',
    isDefault: !user?.tipoIndustria || user.tipoIndustria === 'GENERICA'
  }
} 