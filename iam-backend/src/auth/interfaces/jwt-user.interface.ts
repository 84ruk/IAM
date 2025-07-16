import { Rol } from '@prisma/client';

export interface JwtUser {
  id: number;
  email: string;
  rol: Rol;
  empresaId?: number;
  tipoIndustria?: string;
  setupCompletado?: boolean;
  jti?: string; // JWT ID para posible revocación futura
  sessionId?: string; // ID de sesión para tracking
}
