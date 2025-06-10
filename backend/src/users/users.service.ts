import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: hashedPassword,
        rol: data.rol,
        empresaId: Number(data.empresaId),
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }
}
