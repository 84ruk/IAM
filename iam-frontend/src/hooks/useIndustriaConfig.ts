import { useMemo } from 'react'
import { useServerUser } from '@/context/ServerUserContext'
import { INDUSTRIAS, TipoIndustria } from '@/config/industrias.config'

export interface IndustriaConfig {
  label: string
  camposRelevantes: string[]
  sensoresActivos?: boolean
  mostrarTemperaturaHumedad?: boolean
}

export function useIndustriaConfig() {
  const user = useServerUser()
  console.log('Tipo de industria detectado:', user?.tipoIndustria);
  console.log('Usuario en contexto:', user);
  const config = useMemo(() => {
    const tipoIndustria = (user?.tipoIndustria || 'GENERICA') as TipoIndustria
    return INDUSTRIAS[tipoIndustria] || INDUSTRIAS.GENERICA
  }, [user?.tipoIndustria])

  const isCampoRelevante = (campo: string) => config.camposRelevantes.includes(campo)

  return {
    config,
    isCampoRelevante,
    camposRelevantes: config.camposRelevantes,
    tieneSensores: config.sensoresActivos || false,
    mostrarTemperaturaHumedad: config.mostrarTemperaturaHumedad || false,
    tipoIndustria: user?.tipoIndustria || 'GENERICA'
  }
} 