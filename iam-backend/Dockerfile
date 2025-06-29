# Etapa 1: Construcción
FROM node:20-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala dependencias (sin las dev)
RUN npm ci 

# Copia el esquema de Prisma antes de generar el cliente
COPY prisma ./prisma

# Genera el cliente de Prisma
RUN npx prisma generate

# Copia el resto del código del backend
COPY . .

# Compila el código TypeScript
RUN npm run build

# Etapa 2: Imagen final para producción
FROM node:20-alpine

WORKDIR /app

# Instala dumb-init para manejar señales correctamente
RUN apk add --no-cache dumb-init

# Copia solo lo necesario desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Crea un usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Cambia la propiedad de los archivos al usuario no-root
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expone el puerto 8080
EXPOSE 8080

# Usa dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--"]

# Comando para ejecutar la aplicación
CMD ["node", "dist/main"]
