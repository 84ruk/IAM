// src/types/user.ts
export interface User {
  id: number;
  email: string;
  rol: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR';
  empresaId: number;
  nombre?: string;
  tipoIndustria?: string;
}
