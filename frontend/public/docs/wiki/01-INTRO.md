# 01. Introducción

## Índice

1. [Descripción del Sistema](#descripción-del-sistema)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Interfaz Principal](#interfaz-principal)
4. [Navegación](#navegación)
5. [Dashboard](#dashboard)
6. [Roles de Usuario](#roles-de-usuario)
7. [Primeros Pasos](#primeros-pasos)

---

## Descripción del Sistema

El sistema POS (Point of Sale) es una plataforma de gestión comercial que permite:

- **Ventas**: Realizar transacciones en el punto de venta
- **Inventario**: Control de productos y stock
- **Caja**: Gestión de caja, cierres y ajustes
- **Reportes**: Visualización de estadísticas y reportes
- **Multi-ubicación**: Gestión de múltiples sucursales

### Características Principales

- Interfaz moderna y responsive
- Funciona en escritorio, tablet y móvil
- Soporte multi-idioma
- Gestión de permisos por rol
- Sincronización en tiempo real

---

## Acceso al Sistema

### Login

1. Abre el navegador e ingresa la URL del sistema
2. Ingresa tu **Usuario** y **Contraseña**
3. Haz clic en **"Ingresar"**

### Selección de Ubicación

Después del login, si tienes acceso a múltiples ubicaciones:

1. Selecciona la **sucursal** donde trabajarás
2. Haz clic en **"Continuar"**

> **Nota**: La ubicación seleccionada determina qué productos, stock y transacciones ves.

### Pantalla de Login

```
┌─────────────────────────────────────────┐
│                                         │
│           [Logo de la Empresa]          │
│                                         │
│        Sistema de Punto de Venta        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Usuario                        │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Contraseña                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│        [ Ingresar ]                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Interfaz Principal

### Barra Superior

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [☰]  │  Dashboard  │                        [🔔] [📖] [📍 Sucursal] [👤]│
└──────────────────────────────────────────────────────────────────────────┘
```

| Elemento | Descripción |
|----------|-------------|
| Menú hamburguesa | Abre/cierra el menú lateral |
| Breadcrumb | Navegación actual |
| Campana | Notificaciones |
| Libro | Documentación (Wiki) |
| Ubicación | Selector de sucursal |
| Usuario | Perfil y opciones |

### Indicador de Ubicación

El selector de ubicación muestra la sucursal activa actual. Haz clic para cambiarla si tienes acceso a varias.

### Menú del Usuario

Al hacer clic en tu nombre de usuario:

- **Ver perfil**: Información de tu cuenta
- **Cambiar contraseña**: Modificar credenciales
- **Cerrar sesión**: Salir del sistema

---

## Navegación

### Estructura del Menú

El menú lateral se organiza en secciones:

```
┌─────────────────────────────────────┐
│ Dashboard                           │
├─────────────────────────────────────┤
│ 📦 Inventario                       │
│    • Inventario                     │
│    • Stock                          │
│    • Productos                      │
│    • Transferencias                 │
│    • Ubicaciones                    │
│    • Categorías                     │
├─────────────────────────────────────┤
│ 🚚 Compras                          │
│    • Proveedores                    │
│    • Órdenes de Compra              │
│    • Recepciones                    │
├─────────────────────────────────────┤
│ 🛒 Ventas                           │
│    • Punto de Venta                 │
│    • Lista de Ventas                │
│    • Devoluciones                   │
│    • Clientes                       │
├─────────────────────────────────────┤
│ 💰 Cajero                           │
│    • Gestión de Caja                │
│    • Historial de Cierres           │
│    • Faltantes/Sobrantes            │
│    • Cuentas por Cobrar             │
├─────────────────────────────────────┤
│ ⚙️ Configuración                    │
│    • Datos de Empresa               │
│    • Turnos                         │
│    • Usuarios                       │
│    • Moneda                         │
│    • Roles                          │
│    • Permisos                       │
└─────────────────────────────────────┘
```

### Iconos del Menú

| Sección | Icono |
|---------|-------|
| Dashboard | 📊 LayoutDashboard |
| Inventario | 📦 Package |
| Compras | 🚚 Truck |
| Ventas | 🛒 ShoppingCart |
| Cajero | 💰 Wallet |
| Configuración | ⚙️ Settings |

---

## Dashboard

El dashboard muestra información resumida según tu rol:

### Admin

Acceso completo con estadísticas generales:
- Ventas del día
- Productos con bajo stock
- Cierres de caja recientes
- Reportes rápidos

### Manager

Panel de gerente:
- Ventas del día
- Cierre de caja
- Reportes de ventas

### Cajero

Panel simplificado:
- Ventas del turno
- Estado de caja
- Acceso rápido al POS

### Saludo Personalizado

El dashboard muestra un saludo según la hora:

| Hora | Saludo |
|------|--------|
| 00:00 - 11:59 | Buenos días |
| 12:00 - 17:59 | Buenas tardes |
| 18:00 - 23:59 | Buenas noches |

---

## Roles de Usuario

El sistema tiene tres roles principales:

### Admin (Administrador)

- Acceso completo a todas las funciones
- Puede gestionar usuarios y roles
- Puede configurar la empresa
- Puede ver reportes de todas las ubicaciones

### Manager (Gerente)

- Gestión de ventas y caja
- Puede hacer cierres de caja
- Acceso a reportes
- Gestión de productos

### Cajero

- Solo puede usar el Punto de Venta
- Puede abrir/cerrar caja de su turno
- Ver ventas propias
- No puede acceder a configuración

---

## Primeros Pasos

### Configuración Inicial (Admin)

1. **Configurar Roles y Permisos**
   - Ve a Configuración → Roles
   - Revisa los permisos de cada rol

2. **Crear Usuarios**
   - Ve a Configuración → Usuarios
   - Crea cuentas para tu equipo
   - Asigna roles y ubicaciones

3. **Crear Ubicaciones**
   - Ve a Inventario → Ubicaciones
   - Agrega tus sucursales y almacenes

4. **Crear Categorías**
   - Ve a Inventario → Categorías
   - Organiza tus productos

5. **Agregar Productos**
   - Ve a Inventario → Productos
   - Registra tu catálogo

### Uso Diario

1. **Iniciar Sesión**
   - Ingresa usuario y contraseña
   - Selecciona tu ubicación

2. **Abrir Caja**
   - Ve a Cajero → Gestión de Caja
   - Clic en "Abrir Caja"
   - Ingresa el monto inicial

3. **Vender**
   - Ve a Ventas → Punto de Venta
   - Agrega productos al carrito
   - Cobra al cliente

4. **Cerrar Caja**
   - Ve a Cajero → Gestión de Caja
   - Clic en "Cerrar Caja"
   - Confirma el monto contado

---

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `F1` | Abrir búsqueda de productos (en POS) |
| `F2` | Abrir búsqueda de clientes |
| `Esc` | Cancelar/Cerrar modal |

---

## Documentación

Para más información, consulta las siguientes secciones:

- [02. Punto de Venta](./02-SALES.md)
- [03. Manejo de Caja](./03-CASH.md)
- [09. Configuración](./09-SETTINGS.md)
- [11. FAQ](./11-FAQ.md)

---

[Siguiente: Punto de Venta](./02-SALES.md)
