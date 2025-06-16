export interface JwtUser {
  id: number;
  email: string;
  rol: 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR';
  empresaId: number;
}
