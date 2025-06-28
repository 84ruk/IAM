# Etapa 1: Construcción
FROM node:20-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala dependencias (sin las dev)
RUN npm install


ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
# Copia el esquema de Prisma antes de generar el cliente
COPY prisma ./prisma

RUN npx prisma generate

# Copia el resto del código
COPY . .

# Compila el código TypeScript
RUN npm run build


# Etapa 2: Imagen final para producción
FROM node:20-alpine

WORKDIR /app

# Copia solo lo necesario desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Instala Prisma Client para producción
RUN npm install --omit=dev

# Expone el puerto donde NestJS corre (por defecto 3001 en tu proyecto)
EXPOSE 3001

# Comando para correr la app
CMD ["node", "dist/main"]
