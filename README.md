## 🧰 Tecnologías

- NestJS (backend)
- Prisma ORM + PostgreSQL
- Docker (base de datos)
- JWT para autenticación
- Thunder Client para pruebas
- GitHub para control de versiones

## 🚀 Requisitos previos

- Node.js ≥ 18
- Docker + Docker Compose
- Git

## 🐳 Iniciar base de datos con Docker

```bash
docker-compose up -d

⚙️ Variables de entorno
Crea un archivo .env.

📦 Instalar dependencias
npm install

🛠️ Iniciar servidor NestJS
npm run start:dev

🔄 Sincronizar base de datos
npx prisma migrate dev --name init
npx prisma generate





docker-compose up -d
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run start:dev
