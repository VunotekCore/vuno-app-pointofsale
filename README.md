# VUNO POS - Sistema de Punto de Venta
![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)
![TypeScript](https://img.shields.io/badge/TypeScript-No-3178C6)
![License](https://img.shields.io/badge/License-MIT-yellow)
> Sistema de Punto de Venta completo con gestión de inventario, caja, ventas multisede y soporte offline.
## Características Principales
- **Punto de Venta (POS)** - Interfaz rápida para realizar ventas con múltiples métodos de pago
- **Gestión de Inventario** - Control de stock, transferencias entre ubicaciones, categorías
- **Caja y Arqueo** - Apertura/cierre de caja, faltantes/sobrantes, cuentas por cobrar
- **Multi-Sede** - Gestión de múltiples ubicaciones y almacenes
- **Modo Offline** - Ventas sin conexión con sincronización automática
- **Multi-Tenant** - Soporte para múltiples empresas en una sola instalación
- **PWA** - Aplicación instalable en dispositivos móviles y escritorio
- **Dashboard Analítico** - Estadísticas de ventas, productos destacados, alertas de stock
- **Sistema de Permisos** - Roles y permisos granulares por usuario
- **Customer Display** - Pantalla para el cliente con WebSocket en tiempo real
## Tech Stack
### Backend
- Node.js + Express.js
- MySQL (Aiven Cloud)
- Socket.io (WebSocket)
- JWT Authentication
- bcryptjs (encriptación)
- Multer (archivos)
### Frontend
- Vue.js 3 (Composition API)
- Vite
- Pinia (State Management)
- Tailwind CSS
- Dexie (IndexedDB - Offline)
- Socket.io-client
- Lucide Icons
## Requisitos
- Node.js 18+
- MySQL 8.0+
- pnpm (gestor de paquetes)
## Instalación Local
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/vuno-pos.git
cd vuno-pos
# Instalar dependencias
pnpm install
# Backend - Configurar variables de entorno
cd backend
cp .env.example .env
# Editar .env con tu configuración de MySQL
# Backend - Ejecutar migraciones
mysql -u tu_usuario -p tu_base_datos < migrations/001_initial.sql
# ... ejecutar las demás migraciones en orden
# Backend - Iniciar desarrollo
pnpm dev
# Frontend - En otra terminal
cd ../frontend
cp .env.example .env
pnpm dev
Despliegue en Producción
Backend (Render)
1. Crear Web Service en Render (https://render.com)
2. Conectar repositorio de GitHub
3. Configurar:
   - Root Directory: backend
   - Build Command: pnpm install
   - Start Command: pnpm start
4. Agregar environment variables:
   - MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
   - JWT_SECRET
   - NODE_ENV=production
Frontend (Netlify)
1. Crear nuevo sitio desde Git en Netlify (https://netlify.com)
2. Configurar:
   - Base Directory: frontend
   - Build Command: pnpm build
   - Publish Directory: dist
3. Agregar variable de entorno:
   - VITE_API_URL=https://tu-backend.onrender.com
4. Configurar redirects en netlify.toml para SPA
Base de Datos (Aiven MySQL)
1. Crear servicio MySQL en Aiven (https://aiven.io)
2. Configurar SSL connections
3. Importar schema desde production_dump.sql
Estructura del Proyecto
vuno-pos/
├── backend/              # API REST
│   ├── src/
│   │   ├── config/       # Configuración BD
│   │   ├── controllers/   # Controladores HTTP
│   │   ├── errors/        # Clases de errores
│   │   ├── middleware/     # Auth, RBAC, errores
│   │   ├── models/        # Lógica de negocio
│   │   ├── repository/     # Acceso a datos
│   │   ├── router/        # Rutas API
│   │   └── utils/         # Helpers
│   └── migrations/        # Scripts SQL
├── frontend/             # Aplicación Vue
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── composables/   # Hooks Vue
│   │   ├── layouts/       # Layouts de página
│   │   ├── pages/         # Vistas de la app
│   │   ├── services/      # Cliente API
│   │   └── stores/        # Pinia stores
│   └── public/            # Assets estáticos
└── docs/                 # Documentación
API Endpoints Principales
Módulo	Endpoints
Auth	POST /login, POST /password/forgot
Ventas	GET/POST /sales, POST /sales/:id/complete
Productos	GET/POST /items, GET /inventory/stock
Caja	GET/POST /payments/drawers, POST /payments/drawers/:id/close
Usuarios	GET/POST/PUT/DELETE /users
Dashboard	GET /dashboard/admin, GET /dashboard/cashier
