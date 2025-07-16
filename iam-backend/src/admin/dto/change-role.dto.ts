import { IsEnum, IsNotEmpty } from 'class-validator';
import { Rol } from '@prisma/client';

export class ChangeRoleDto {
  @IsEnum(Rol, { message: 'El rol debe ser válido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  rol: Rol;
}
