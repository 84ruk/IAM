const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function checkMovements() {
  try {
    console.log('🔍 Verificando movimientos en el backend...')
    
    // Verificar si el backend está disponible
    const healthCheck = await fetch(`${API_URL}/health`)
    if (!healthCheck.ok) {
      console.log('❌ Backend no disponible')
      return
    }
    
    console.log('✅ Backend disponible')
    
    // Verificar movimientos (esto requeriría autenticación en producción)
    const movementsResponse = await fetch(`${API_URL}/movimientos`)
    if (movementsResponse.ok) {
      const movements = await movementsResponse.json()
      console.log(`📊 Movimientos encontrados: ${movements.length}`)
      
      if (movements.length === 0) {
        console.log('⚠️ No hay movimientos. Para crear datos de ejemplo:')
        console.log('1. Inicia sesión en la aplicación')
        console.log('2. Ve a la sección "Movimientos"')
        console.log('3. Crea algunos movimientos de entrada y salida')
        console.log('4. Regresa a la página de KPIs')
      } else {
        console.log('✅ Hay movimientos disponibles')
        console.log('Muestra de movimientos:', movements.slice(0, 3))
      }
    } else {
      console.log('❌ Error al obtener movimientos:', movementsResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkMovements() 