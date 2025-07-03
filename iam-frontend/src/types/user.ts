// src/types/user.ts
export interface User {
  sub: number;
  email: string;
  rol: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR';
  empresaId: number;
  tipoIndustria: string;
}
