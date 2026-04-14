# 09. Configuración

## Índice

1. [Empresas](#empresas)
2. [Ubicaciones](#ubicaciones)
3. [Categorías](#categorías)
4. [Usuarios](#usuarios)
5. [Roles y Permisos](#roles-y-permisos)

---

## Empresas

### Descripción

El módulo de Empresas gestiona las empresas/negocios en la plataforma multi-tenant. Cada empresa tiene su propio conjunto de usuarios, ubicaciones y datos.

### Acceder

**Configuración → Empresas** (solo disponible para super admins de plataforma)

### Crear Empresa

1. Haz clic en **"Nueva Empresa"**
2. Completa los campos de información básica
3. Configura el administrador inicial
4. Haz clic en **"Crear"**

### Campos del Formulario

#### Información de la Empresa

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Razón social de la empresa |
| NIT | Sí | Identificación fiscal |
| Logo | No | Imagen de marca |
| Dirección | No | Dirección fiscal |
| Teléfono | No | Teléfono de contacto |
| Correo empresarial | No | Email principal |

#### Configuración de ImageKit (Opcional)

| Campo | Descripción |
|-------|-------------|
| ImageKit URL Endpoint | Endpoint de ImageKit para subir imágenes |
| ImageKit Private Key | Clave privada de ImageKit |

#### Administrador de la Empresa (al crear)

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre de usuario | Sí | Login del admin |
| Correo electrónico | Sí | Email del admin |
| Contraseña | Sí | Mínimo 6 caracteres |

### Cambiar Contraseña del Admin

1. Edita la empresa
2. Expande la sección "Administrador de la empresa"
3. Clic en "Cambiar contraseña del admin"
4. Ingresa la nueva contraseña y confirmación

### Estados de Empresa

| Estado | Descripción |
|--------|-------------|
| Activa | La empresa puede operar normalmente |
| Inactiva | La empresa está desactivada |

### Marcar como Principal

Solo una empresa puede ser la principal (por defecto). Clic en el ícono de estrella para cambiarla.

### Entrar como Admin

Permite impersonar al administrador de la empresa seleccionada para acceder a su panel.

---

## Ubicaciones

### Descripción

Las ubicaciones representan tus sucursales y almacenes. Son fundamentales para el sistema multi-ubicación.

### Acceder

**Inventario → Ubicaciones**

### Tipos de Ubicación

| Tipo | Descripción | Vende |
|------|-------------|-------|
| **Sucursal** | Punto de venta al público | Sí |
| **Almacén** | Solo almacenamiento | No |

### Crear Ubicación

1. Haz clic en **"Nueva Ubicación"**
2. Completa los campos
3. Haz clic en **"Crear"**

### Campos del Formulario

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Nombre de la sucursal (ej: "Tienda Centro") |
| Código | Sí | Código único (ej: "CEN", "ALM01") |
| Dirección | No | Dirección física |
| Teléfono | No | Teléfono de contacto |
| Email | No | Correo electrónico |
| Zona Horaria | No | Zona horaria (default: America/Santiago) |
| Solo almacén | No | Marcar si no es punto de venta |
| Activo | Sí | Si la ubicación está operativa |

### Zonas Horarias Disponibles

- America/Santiago
- America/Lima
- America/Bogota
- America/Mexico_City

### Editar Ubicación

1. Clic en el botón de editar
2. Modifica los campos necesarios
3. Guarda los cambios

### Eliminar Ubicación

1. Clic en el botón de eliminar
2. Confirma la eliminación

> **Nota**: Las ubicaciones con transacciones activas no pueden eliminarse.

---

## Categorías

### Descripción

Las categorías permiten organizar tus productos en una estructura jerárquica.

### Acceder

**Inventario → Categorías**

### Crear Categoría

1. Haz clic en **"Nueva Categoría"**
2. Completa los campos
3. Haz clic en **"Crear"**

### Campos del Formulario

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Nombre de la categoría |
| Descripción | No | Descripción opcional |
| Categoría Padre | No | Para crear subcategorías |
| Activo | Sí | Si la categoría está disponible |

### Estructura Jerárquica

Las categorías pueden tener múltiples niveles:

```
├── Electrónica
│   ├── Teléfonos
│   │   ├── Smartphones
│   │   └── Celulares Básicos
│   ├── Computadoras
│   └── Accesorios
├── Ropa
│   ├── Hombre
│   ├── Mujer
│   └── Niños
└── Alimentos
```

### Expandir/Contraer

En la lista de categorías:
- Haz clic en el ícono `▶` para expandir una categoría con subcategorías
- Haz clic en `▼` para contraer's

### Editar Categoría

1. Clic en el botón de editar
2. Modifica los campos necesarios
3. Guarda los cambios

### Eliminar Categoría

1. Clic en el botón de eliminar
2. Confirma la eliminación

> **Nota**: Las categorías con productos asociados no pueden eliminarse.

---

## Usuarios

### Descripción

Gestiona los usuarios que accederán al sistema de cada empresa.

### Acceder

**Configuración → Usuarios**

### Crear Usuario

1. Haz clic en **"Nuevo Usuario"**
2. Completa los datos en la pestaña **Usuario**
3. (Opcional) Agrega información de empleado en la pestaña **Empleado**
4. Haz clic en **"Crear"**

### Campos del Formulario

#### Pestaña: Usuario

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Usuario | Sí | Nombre de usuario único |
| Email | Sí | Correo electrónico único |
| Contraseña | Sí* | Mínimo 6 caracteres (*al crear) |
| Rol | Sí | Perfil de permisos |
| Ubicaciones | Sí | Sucursales a las que tiene acceso |
| Avatar | No | Imagen de perfil |

#### Pestaña: Empleado

| Campo | Descripción |
|-------|-------------|
| Nombre(s) | Nombre del empleado |
| Apellido(s) | Apellidos del empleado |
| Teléfono | Número de contacto |
| Ciudad | Ciudad de residencia |
| Dirección | Dirección completa |
| Puesto | Cargo o posición |
| Departamento | Área de trabajo |
| Fecha de Contratación | Fecha de ingreso |
| Salario | Remuneración |

#### Contacto de Emergencia

| Campo | Descripción |
|-------|-------------|
| Nombre | Persona de contacto |
| Teléfono | Teléfono de emergencia |

### Asignar Ubicaciones

1. En el campo "Ubicaciones", marca las sucursales que el usuario puede acceder
2. Puedes seleccionar una o múltiples ubicaciones

> **Nota**: Si un usuario no tiene ubicaciones asignadas, solo podrá ver la ubicación por defecto.

### Cambiar Contraseña

1. Edita el usuario
2. Ingresa la nueva contraseña en el campo "Contraseña"
3. Deja vacío para no cambiar la contraseña actual

### Eliminar Usuario

1. Clic en el botón de eliminar
2. Confirma la eliminación

---

## Roles y Permisos

### Descripción

Los roles definen qué pueden hacer los usuarios en el sistema. Cada rol tiene permisos de menú (vista) y permisos de tabla (operaciones CRUD).

### Acceder

**Configuración → Roles**

### Tipos de Permisos

#### Permisos de Menú (Vista)

Controlan qué opciones del menú puede ver cada rol. Se configuran por sección del menú.

| Sección | Opciones |
|---------|---------|
| Dashboard | Dashboard, Reportes |
| Inventario | Inventario, Stock, Productos, Transferencias, Ubicaciones, Categorías |
| Compras | Proveedores, Órdenes de Compra, Recepciones |
| Ventas | Punto de Venta, Lista de Ventas, Devoluciones, Clientes |
| Cajero | Gestión de Caja, Historial de Cierres, Faltantes/Sobrantes, Cuentas por Cobrar |
| Configuración | Configuración, Datos de Empresa, Turnos, Usuarios, Moneda, Roles, Permisos |

#### Permisos de Tabla (CRUD)

Controlan las operaciones en la base de datos.

| Operación | Descripción |
|-----------|-------------|
| Leer | Ver registros |
| Crear | Agregar nuevos registros |
| Editar | Modificar registros existentes |
| Eliminar | Borrar registros |

### Roles Predeterminados

El sistema incluye roles base que pueden personalizarse:

| Rol | Descripción |
|-----|-------------|
| Admin | Acceso completo |
| Cajero | Acceso a ventas y caja |
| Vendedor | Solo ventas |

> **Nota**: El rol "admin" no puede eliminarse ni cambiar su nombre.

### Crear Rol

1. Haz clic en **"Nuevo Rol"**
2. Ingresa el nombre y descripción
3. Selecciona los permisos de menú
4. Configura los permisos de tabla
5. Haz clic en **"Guardar"**

### Permisos de Menú por Sección

```
Permisos de Menú (Vista)
├── Dashboard
│   ├── Dashboard
│   └── Reportes
├── Inventario
│   ├── Inventario
│   ├── Stock
│   ├── Productos
│   ├── Transferencias
│   ├── Ubicaciones
│   └── Categorías
├── Compras
│   ├── Proveedores
│   ├── Órdenes de Compra
│   └── Recepciones
├── Ventas
│   ├── Punto de Venta
│   ├── Lista de Ventas
│   ├── Devoluciones
│   └── Clientes
├── Cajero
│   ├── Gestión de Caja
│   ├── Historial de Cierres
│   ├── Faltantes/Sobrantes
│   └── Cuentas por Cobrar
└── Configuración
    ├── Configuración
    ├── Datos de Empresa
    ├── Turnos
    ├── Usuarios
    ├── Moneda
    ├── Roles
    └── Permisos
```

### Permisos de Tabla

Los permisos de tabla controlan operaciones CRUD en cada tabla del sistema.

---

## Módulo de Permisos (Avanzado)

### Descripción

El módulo de Permisos permite visualizar y sincronizar los permisos del sistema.

### Acceder

**Configuración → Permisos**

### Pestaña: Permisos de Tabla

Muestra todas las tablas del sistema con sus permisos CRUD.

### Pestaña: Permisos de Menú

Muestra los permisos de menú organizados por sección del menú.

### Sincronizar

| Acción | Descripción |
|--------|-------------|
| Sincronizar Tablas | Crea/actualiza permisos de tablas en la base de datos |
| Sincronizar Menú | Crea/actualiza permisos de menú del menú config |

> **Importante**: Usa "Sincronizar Tablas" cuando agregues nuevas tablas al sistema. Usa "Sincronizar Menú" cuando modifiques el archivo de configuración del menú.

---

## Orden Recomendado de Configuración

```
1. Roles y Permisos     → Definir perfiles de acceso
2. Usuarios             → Crear cuentas para el equipo
3. Ubicaciones          → Crear sucursales y almacenes
4. Categorías            → Organizar productos
5. Empresa               → Configurar datos comerciales
```

---

## Resumen de Módulos de Configuración

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Empresas | Configuración → Empresas | Gestión multi-tenant (super admin) |
| Ubicaciones | Inventario → Ubicaciones | Sucursales y almacenes |
| Categorías | Inventario → Categorías | Organización de productos |
| Usuarios | Configuración → Usuarios | Cuentas de usuario |
| Roles | Configuración → Roles | Perfiles de permisos |
| Permisos | Configuración → Permisos | Sincronización de permisos |

---

[Anterior: Cuentas por Cobrar](./08-RECEIVABLES.md) | [Siguiente: Reportes](./10-REPORTS.md)
