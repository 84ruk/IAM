## 🧰 Tecnologías

- NestJS (backend)
- Prisma ORM + PostgreSQL
- Docker (base de datos)
- JWT para autenticación
- Thunder Client para pruebas
- GitHub para control de versiones

## 🚀 Tecnologias Utilizadas

- **NestJS** – Framework backend en Node.js
- **Prisma ORM** – Acceso y modelado de base de datos
- **PostgreSQL** – Motor de base de datos
- **Docker** – Contenedores y despliegue
- **TypeScript** – Tipado estático
- **JWT** – Autenticación
- **Thunder Client** – Testeo de API
- **Next.js (futuro)** – Frontend moderno
- **BullMQ + Redis (plan futuro)** – Procesamiento en background
- **IA externa (plan futuro)** – Predicción de quiebre de stock y marketing inteligente


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
