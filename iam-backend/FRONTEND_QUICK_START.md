# 🚀 GUÍA RÁPIDA - FRONTEND DE IMPORTACIÓN

## 📋 RESUMEN EJECUTIVO

### **¿Qué necesitas implementar?**

Un sistema de importación masiva con:
- 📥 **Descarga de plantillas** (Excel/CSV)
- 📤 **Subida de archivos** con validación
- 📊 **Seguimiento en tiempo real** del progreso
- 📋 **Gestión de trabajos** (listar, cancelar, descargar errores)

---

## 🌐 ENDPOINTS PRINCIPALES

### **📋 Plantillas (PÚBLICAS)**
```typescript
GET /importacion/plantillas                    // Listar plantillas
GET /importacion/plantillas/productos          // Descargar plantilla productos
GET /importacion/plantillas/proveedores        // Descargar plantilla proveedores
GET /importacion/plantillas/movimientos        // Descargar plantilla movimientos
```

### **📤 Importaciones (AUTENTICADAS)**
```typescript
POST /importacion/productos                    // Importar productos
POST /importacion/proveedores                  // Importar proveedores
POST /importacion/movimientos                  // Importar movimientos

// Body: multipart/form-data
{
  archivo: File,
  sobrescribirExistentes: boolean,
  validarSolo: boolean,
  notificarEmail: boolean,
  emailNotificacion?: string
}
```

### **📊 Gestión de Trabajos (AUTENTICADAS)**
```typescript
GET /importacion/trabajos                      // Listar trabajos
GET /importacion/trabajos/:id                  // Estado de trabajo
DELETE /importacion/trabajos/:id               // Cancelar trabajo
GET /importacion/trabajos/:id/errores          // Descargar errores
```

---

## 📊 ESTRUCTURAS CLAVE

### **TrabajoImportacion**
```typescript
{
  id: string;
  tipo: 'productos' | 'proveedores' | 'movimientos';
  estado: 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado';
  progreso: number; // 0-100
  totalRegistros: number;
  registrosExitosos: number;
  registrosConError: number;
  fechaCreacion: Date;
}
```

### **Plantillas de Archivos**

**📦 Productos**: nombre, codigo, stock, precio_compra, precio_venta, categoria, proveedor, ubicacion, tipo_producto, unidad, etiquetas

**🏢 Proveedores**: nombre, email, telefono, direccion, rfc, tipo_proveedor, estado

**📊 Movimientos**: tipo, producto_codigo, cantidad, motivo, fecha, proveedor, cliente, costo_unitario, precio_unitario

---

## 🎯 IMPLEMENTACIÓN MÍNIMA

### **1. Servicio API**
```typescript
// services/importacionApi.ts
export class ImportacionApi {
  private baseUrl = '/api/importacion';

  async downloadPlantilla(tipo: string) {
    const response = await fetch(`${this.baseUrl}/plantillas/${tipo}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla-${tipo}.xlsx`;
    a.click();
  }

  async importarArchivo(tipo: string, formData: FormData) {
    const response = await fetch(`${this.baseUrl}/${tipo}`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async getTrabajos() {
    const response = await fetch(`${this.baseUrl}/trabajos`);
    return response.json();
  }

  async getTrabajo(id: string) {
    const response = await fetch(`${this.baseUrl}/trabajos/${id}`);
    return response.json();
  }
}
```

### **2. Hook Personalizado**
```typescript
// hooks/useImportacion.ts
export function useImportacion() {
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = new ImportacionApi();

  const importarArchivo = async (tipo, archivo, opciones) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('sobrescribirExistentes', opciones.sobrescribirExistentes);
    formData.append('validarSolo', opciones.validarSolo);
    formData.append('notificarEmail', opciones.notificarEmail);
    
    const resultado = await api.importarArchivo(tipo, formData);
    setLoading(false);
    return resultado;
  };

  return { trabajos, loading, importarArchivo, downloadPlantilla };
}
```

### **3. Componente Básico**
```tsx
// components/ImportForm.tsx
export function ImportForm({ tipo }) {
  const [archivo, setArchivo] = useState(null);
  const { importarArchivo, downloadPlantilla, loading } = useImportacion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    const resultado = await importarArchivo(tipo, archivo, {
      sobrescribirExistentes: false,
      validarSolo: false,
      notificarEmail: false
    });
    
    console.log('Trabajo iniciado:', resultado.trabajoId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="button" onClick={() => downloadPlantilla(tipo)}>
        📥 Descargar Plantilla
      </button>
      
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => setArchivo(e.target.files[0])}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? '⏳ Procesando...' : '🚀 Importar'}
      </button>
    </form>
  );
}
```

---

## 🔄 FLUJO BÁSICO

### **1. Usuario descarga plantilla**
```typescript
await downloadPlantilla('productos');
// Se descarga: plantilla-productos-2025-07-20.xlsx
```

### **2. Usuario llena y sube archivo**
```typescript
const resultado = await importarArchivo('productos', archivo, opciones);
// Response: { trabajoId: 'abc123', estado: 'pendiente' }
```

### **3. Seguimiento del progreso**
```typescript
// Polling cada 2 segundos
const interval = setInterval(async () => {
  const trabajo = await api.getTrabajo(trabajoId);
  
  if (trabajo.estado === 'completado') {
    clearInterval(interval);
    // Mostrar éxito
  }
  
  // Actualizar progreso: trabajo.progreso (0-100)
}, 2000);
```

---

## 🎨 PÁGINAS RECOMENDADAS

### **1. Página Principal de Importación**
```
/importacion
├── 📥 Descargar plantillas
├── 📤 Subir archivos
└── 📊 Lista de trabajos recientes
```

### **2. Páginas Específicas**
```
/importacion/productos      // Importar productos
/importacion/proveedores    // Importar proveedores
/importacion/movimientos    // Importar movimientos
/importacion/trabajos       // Gestión de trabajos
```

---

## 🚀 PRÓXIMOS PASOS

1. **Implementar servicio API básico**
2. **Crear formulario de importación**
3. **Agregar seguimiento de progreso**
4. **Implementar gestión de trabajos**
5. **Mejorar UX con drag & drop, preview, etc.**

---

## 📞 RECURSOS

- **📖 Guía Completa**: `FRONTEND_IMPORTACION_GUIDE.md`
- **🧪 Testing**: Scripts en `scripts/`
- **🔍 Debugging**: Logs del servidor en puerto 3001
- **📊 Plantillas**: Endpoints públicos funcionando

**¡El backend está 100% listo! Solo necesitas conectar el frontend. 🎉** 