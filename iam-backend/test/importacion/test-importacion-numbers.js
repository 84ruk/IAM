// Script para probar la importación de productos-electronica.numbers con accessToken directo
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3001/importacion/productos';
const ARCHIVO = path.resolve(__dirname, 'productos-electronica.numbers');

// Token proporcionado por el usuario
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTM0MDIwMzYsImp0aSI6ImJiNjgyYTI3ZmM1YmI4ODU3MTM4ZjI0ZjJkODMzMTNlYWNhMDg5MDJjZmFhNTNiZjliZjVkYjgzODc0ZWNhMWIiLCJzdWIiOiIyMCIsInNlc3Npb25JZCI6IjAyMjhkMDA4YjQ5NzM3NDUxNzEyN2QxODkwODU1MmVmIiwiZW1haWwiOiJ0ZXN0QGlhbS5jb20iLCJyb2wiOiJBRE1JTiIsImVtcHJlc2FJZCI6MTIsInRpcG9JbmR1c3RyaWEiOiJFTEVDVFJPTklDQSIsInNldHVwQ29tcGxldGFkbyI6ZmFsc2UsImV4cCI6MTc1MzQ4ODQzNiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDozMDAxIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAxIn0.s0GgEOKCBdXKGMkPAGGJpiviji8GIVccuOdxV5045F4';

async function importarArchivo() {
  const form = new FormData();
  form.append('archivo', fs.createReadStream(ARCHIVO));
  form.append('sobrescribirExistentes', 'true');
  form.append('validarSolo', 'false');
  form.append('notificarEmail', 'false');

  const headers = {
    ...form.getHeaders(),
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };

  try {
    const res = await axios.post(API_URL, form, { headers });
    console.log('Respuesta de importación:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error de importación:', err.response.data);
      if (err.response.data && err.response.data.erroresDetallados) {
        console.error('Errores detallados:', err.response.data.erroresDetallados);
      }
    } else {
      console.error('Error de red:', err.message);
    }
  }
}

(async () => {
  if (!fs.existsSync(ARCHIVO)) {
    console.error('No se encontró el archivo:', ARCHIVO);
    process.exit(1);
  }
  await importarArchivo();
})(); 