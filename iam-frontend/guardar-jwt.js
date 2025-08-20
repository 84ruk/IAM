// Script para guardar el JWT en el localStorage del navegador
// Ejecuta esto en la consola del navegador

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTUyMTMwMDgsImp0aSI6Ijk4YjU5YjgwLTg5NzktNDg0OS1iNTdkLWUxZTE0OTBhMTk3NCIsInN1YiI6IjIiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiRUxFQ1RST05JQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTUyOTk0MDgsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.R1Yy8fWyYVkA62HycPv-xIjNdWzJlIWPdWu_ZciNtOs'

console.log('🔐 Guardando JWT en localStorage...')

// Guardar el JWT en localStorage
localStorage.setItem('jwt', JWT_TOKEN)

// Verificar que se guardó correctamente
const jwtGuardado = localStorage.getItem('jwt')
if (jwtGuardado === JWT_TOKEN) {
  console.log('✅ JWT guardado correctamente en localStorage')
  console.log('   Token:', jwtGuardado.substring(0, 50) + '...')
} else {
  console.log('❌ Error al guardar JWT')
}

// También guardar en cookies como respaldo
document.cookie = `jwt=${JWT_TOKEN}; path=/; max-age=86400` // 24 horas

console.log('🍪 JWT también guardado en cookies como respaldo')
console.log('💡 Ahora puedes usar el sistema de alertas sin problemas de autenticación')
