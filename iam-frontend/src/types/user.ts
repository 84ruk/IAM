// src/types/user.ts
export interface User {
  // Compatibilidad: el backend puede exponer `id` (JwtStrategy) o `sub`
  id?: number;
  sub?: number;
  email: string;
  rol: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR';
  // Usuarios sin empresa durante el setup no tendrán empresaId
  empresaId?: number;
  // No siempre está presente en todos los flujos
  tipoIndustria?: string;
  setupCompletado?: boolean;
}
