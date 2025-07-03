import { useMemo } from 'react'
import { useServerUser } from '@/context/ServerUserContext'
import { INDUSTRIAS, TipoIndustria } from '@/config/industrias.config'

export interface IndustriaConfig {
  label: string
  camposRelevantes: string[]
  sensoresActivos?: boolean
  mostrarTemperaturaHumedad?: boolean
  validaciones?: {
    temperaturaMin?: number
    temperaturaMax?: number
    humedadMin?: number
    humedadMax?: number
  }
  opciones?: {
    tallas?: string[]
    colores?: string[]
  }
}

export function useIndustriaConfig() {
  const user = useServerUser()
  console.log('Tipo de industria detectado:', user?.tipoIndustria);
  console.log('Usuario completo en contexto:', user);
  console.log('Industrias disponibles:', Object.keys(INDUSTRIAS));
  
  const config = useMemo(() => {
    const tipoIndustria = (user?.tipoIndustria || 'GENERICA') as TipoIndustria
    console.log('Tipo de industria a usar:', tipoIndustria);
    console.log('Configuración encontrada:', INDUSTRIAS[tipoIndustria]);
    return INDUSTRIAS[tipoIndustria] || INDUSTRIAS.GENERICA
  }, [user?.tipoIndustria])

  const isCampoRelevante = (campo: string) => config.camposRelevantes.includes(campo as any)

  return {
    config,
    isCampoRelevante,
    camposRelevantes: config.camposRelevantes,
    tieneSensores: config.sensoresActivos || false,
    mostrarTemperaturaHumedad: config.mostrarTemperaturaHumedad || false,
    tipoIndustria: user?.tipoIndustria || 'GENERICA'
  }
} 