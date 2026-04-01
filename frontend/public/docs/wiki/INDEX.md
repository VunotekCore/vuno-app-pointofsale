# Wiki - Documentación del Sistema

## Bienvenido a la Wiki del Módulo de Inventario

Aquí encontrarás toda la documentación necesaria para entender y trabajar con el sistema.

## Documentación

### [📚 Guía para Desarrolladores](./DEVELOPER.md)

Documentación técnica detallada para desarrolladores que necesitan:
- Entender la arquitectura del sistema
- Extender o modificar funcionalidades
- Crear nuevos endpoints
- Trabajar con la base de datos
- Ejecutar pruebas

**Temas cubiertos:**
- Arquitectura de 3 capas (Frontend → Backend → Database)
- Estructura de todas las tablas
- API Endpoints disponibles
- Patrones de código (Repository, Controller)
- Flujos de datos
- Datos de prueba

### [👤 Guía de Usuario](./USER.md)

Documentación para usuarios finales que necesitan:
- Aprender a usar el sistema
- Configurar el sistema desde cero
- Gestionar roles y permisos
- Gestionar productos
- Controlar inventario
- Entender las funcionalidades

**Temas cubiertos:**
- Navegación del sistema
- Configuración inicial (orden recomendado)
- Roles y Permisos
- Gestión de usuarios
- Datos de empresa
- Gestión de ubicaciones y categorías
- Creación y gestión de productos
- Control de stock
- Transferencias entre ubicaciones
- Kits (Paquetes) con stock calculado
- Porcentaje de ganancia
- Proveedores
- Mejores prácticas
- Glosario de términos

---

## Estructura del Proyecto

```
docs/
└── wiki/
    ├── INDEX.md       ← Este archivo
    ├── DEVELOPER.md   ← Documentación técnica
    └── USER.md       ← Guía de usuario
```

---

## Información General

### Requisitos del Sistema

- **Backend**: Node.js + Express + MySQL
- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **Puerto Backend**: 1405
- **Puerto Frontend**: 5173 (dev)

### Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **Core** | Configuración base (ubicaciones, categorías) |
| **Inventory** | Gestión de inventario (productos, stock, proveedores, transferencias) |

### Tablas Principales

**Core:**
- `locations` - Sucursales y almacenes
- `categories` - Categorías de productos

**Inventory:**
- `items` - Productos
- `item_variations` - Variaciones (talla, color)
- `item_quantities` - Stock por ubicación
- `item_serials` - Números de serie
- `kit_components` - Componentes de kits
- `suppliers` - Proveedores

**Movimientos:**
- `purchase_orders` - Órdenes de compra
- `receivings` - Recepciones
- `transfers` - Transferencias entre ubicaciones
- `transfer_items` - Items de transferencias
- `inventory_adjustments` - Ajustes
- `inventory_movements` - Historial (auditoría)

---

## Primeros Pasos

### Para Desarrolladores

1. Lee la [Guía para Desarrolladores](./DEVELOPER.md)
2. Configura el entorno de desarrollo
3. Ejecuta las migraciones
4. Inicia el servidor
5. Revisa los ejemplos de API

### Para Usuarios

1. Lee la [Guía de Usuario](./USER.md)
2. Configura Roles y Permisos
3. Crea los usuarios del sistema
4. Configura los datos de empresa
5. Crea las ubicaciones (Core)
6. Crea las categorías (Core)
7. Agrega proveedores (Inventario)
8. Registra tus productos
9. Controla tu stock
10. Realiza transferencias entre ubicaciones

---

## Soporte

Si tienes dudas:
- Revisa la documentación técnica
- Consulta el glosario de términos
- Verifica los ejemplos de uso
