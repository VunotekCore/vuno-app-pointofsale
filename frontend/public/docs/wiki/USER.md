# Módulo de Ventas - Guía de Usuario

## Índice

### Módulo de Ventas
1. [Punto de Venta (POS)](#punto-de-venta-pos)
2. [Pantalla del Cliente (Customer Display)](#pantalla-del-cliente-customer-display)
3. [Cierre de Caja](#cierre-de-caja)
4. [Gestión de Ventas](#gestión-de-ventas)
5. [Devoluciones](#devoluciones)
6. [Clientes](#clientes)
7. [Faltantes/Sobrantes](#faltantessobrantes)
8. [Cuentas por Cobrar](#cuentas-por-cobrar)

### Módulo de Inventario
1. [Introducción](#introducción)
2. [Navegación](#navegación)
3. [Configuración Inicial](#configuración-inicial)
   - [3.1 Roles y Permisos](#31-roles-y-permisos)
   - [3.2 Usuarios](#32-usuarios)
   - [3.3 Datos de Empresa](#33-datos-de-empresa)
   - [3.4 Ubicaciones](#34-ubicaciones)
   - [3.5 Categorías](#35-categorías)
   - [3.6 Proveedores](#36-proveedores)
4. [Inventario](#inventario)
   - [4.1 Productos](#41-productos)
   - [4.2 Stock](#42-stock)
   - [4.3 Transferencias](#43-transferencias)
   - [4.4 Costo Promedio](#41-costo-promedio)
   - [4.5 Kits (Paquetes)](#44-kits-paquetes)
   - [4.6 Porcentaje de Ganancia](#45-porcentaje-de-ganancia)
5. [Funcionalidades Avanzadas](#funcionalidades-avanzadas)
   - [Productos Serializados](#productos-serializados)
   - [Alertas de Stock](#alertas-de-stock)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Glosario](#glosario)
8. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Punto de Venta (POS)

El Punto de Venta es la interfaz principal para realizar transacciones comerciales.

### Acceder al POS

1. Haz clic en **Punto de Venta** en el menú lateral
2. Selecciona la **ubicación** (sucursal) donde harás la venta

### Agregar Productos

1. **Por categoría**: Haz clic en una categoría para ver sus productos
2. **Por búsqueda**: Escribe el nombre o SKU del producto en el campo de búsqueda
3. Haz clic en un producto para agregarlo al carrito

### Carrito de Compras

- **Cantidad**: Usa los botones + y - para cambiar la cantidad
- **Descuento**: Ingresa un monto de descuento por línea
- **Eliminar**: Haz clic en el ícono de papelera para quitar un producto

### Cliente

1. Haz clic en **Agregar cliente** para buscar un cliente
2. Escribe el nombre o email para buscar
3. Selecciona el cliente de la lista

### Finalizar Venta

1. Haz clic en **Cobrar**
2. Selecciona el **método de pago** (efectivo, tarjeta)
3. Ingresa el **monto pagado**
4. Haz clic en **Finalizar**
5. El sistema imprimirá el ticket (si está configurado)

### Suspender Venta

Si necesitas dejar una venta pendiente:

1. Agrega los productos al carrito
2. Haz clic en **Suspender**
3. La venta se guardará para continuarla después

---

## Pantalla del Cliente (Customer Display)

La pantalla del cliente es un monitor secundario que muestra al cliente los productos, precios y totales en tiempo real.

### Activar la Pantalla

1. En el POS, haz clic en el ícono de **TV** junto al botón Suspender
2. Se abrirá una nueva ventana/ventana del navegador
3. Conecta esa ventana al segundo monitor/TV del cliente

### Características

- **Conexión en tiempo real**: Los productos aparecen instantáneamente
- **Nombre del cliente**: Muestra el nombre del cliente seleccionado
- **Totales actualizados**: Subtotal, descuentos y total se actualizan en tiempo real
- **Diseño optimizado**: Visible desde distancia para el cliente

### Usar en Producción

1. Abre la aplicación en dos ventanas del navegador
2. Mueve la ventana del POS a la pantalla del vendedor
3. Mueve la ventana del Customer Display a la pantalla del cliente
4. El vendedor trabaja en el POS normal
5. El cliente ve los productos y precios en su pantalla

---

## Cierre de Caja

El cierre de caja es el proceso al final del turno/día donde se verifica el dinero físico en la caja contra las ventas registradas.

### Acceder al Módulo

1. Haz clic en **Caja** en el menú lateral de Ventas
2. Selecciona la **ubicación** (sucursal)

### Estado de Caja

En el POS, verás un indicador de estado de caja:
- **Verde**: Caja abierta
- **Rojo**: Caja cerrada

Haz clic en el indicador para ir al módulo de caja.

### Abrir Caja

Al inicio del turno:

1. En el módulo de Caja, haz clic en **Abrir Caja**
2. Ingresa el **monto inicial** (dinero en efectivo que tienes)
3. Haz clic en **Abrir**

La caja queda abierta y puedes comenzar a vender.

### Cerrar Caja

Al final del turno:

1. Ve al módulo de Caja
2. Verás el resumen:
   - **Monto Inicial**: Dinero con el que abriste
   - **Ventas en Efectivo**: Total de ventas en efectivo
   - **Retiros**: Dinero retirado durante el día
   - **Monto Esperado**: Lo que debería haber (inicial + ventas - retiros)
3. Haz clic en **Cerrar Caja**
4. Ingresa el **dinero contado** físicamente
5. El sistema calculará la diferencia:
   - **Sobrante** (verde): Tienes más de lo esperado
   - **Faltante** (rojo): Tienes menos de lo esperado
   - **Cuadre perfecto**: Las cantidades coinciden
6. Agrega **notas** si es necesario
7. Confirma el cierre

### Indicador en el POS

En la barra superior del POS hay un botón de wallet que muestra:
- Si la caja está abierta o cerrada
- Un clic te lleva directamente al módulo de Caja

---

## Gestión de Ventas

### Lista de Ventas

1. Accede a **Ventas** en el menú
2. Verás la lista de todas las transacciones
3. Puedes filtrar por fecha, cliente, ubicación

### Ver Detalle

1. Haz clic en una venta para ver el detalle
2. Incluye: productos, pagos, información del cliente

### Estado de Ventas

| Estado | Descripción |
|--------|-------------|
| Completada | Venta pagada y finalizada |
| Suspendida | Venta guardada para continuar después |
| Devuelta | Venta con devolución procesada |

---

## Devoluciones

### Crear Devolución

1. Accede a **Devoluciones**
2. Selecciona la venta original
3. Elige los productos a devolver
4. Ingresa la cantidad a devolver
5. Confirma la devolución

### Nota

Las devoluciones incrementan el stock de los productos devueltos.

---

## Clientes

### Gestionar Clientes

1. Accede a **Clientes** en el menú
2. Verás la lista de clientes registrados

### Crear Cliente

1. Haz clic en **Nuevo Cliente**
2. Completa los datos:
   - Nombre
   - Apellido
   - Email
   - Teléfono
   - Dirección

### Cliente por Defecto

En el POS, si no seleccionas un cliente, se usará el cliente por defecto (configurable en la gestión de clientes).

---

## Faltantes/Sobrantes

El módulo de Faltantes/Sobrantes gestiona las diferencias de dinero al cerrar una caja.

### Acceder al Módulo

1. Haz clic en **Cajero** en el menú lateral
2. Selecciona **Faltantes/Sobrantes**

### Ver Ajustes

En esta página puedes ver:
- **Faltantes**: Cuando el dinero contado es menor al esperado
- **Sobrantes**: Cuando el dinero contado es mayor al esperado

#### Estados

| Estado | Descripción |
|--------|-------------|
| Pendiente | Ajuste registrado, esperando revisión |
| Aprobado | Ajuste revisado y aprobado |
| Rechazado | Ajuste no válido |

### Aprobación de Ajustes (Admin)

1. Ve al cierre de caja en **Cierres**
2. Expande el cierre para ver los detalles
3. Haz clic en **Aprobar** o **Rechazar**

#### Flujo de Faltantes

- Al cerrar caja con faltante → se crea ajuste "Pendiente"
- Al aprobar → se crea automáticamente una **Cuenta por Cobrar** al cajero

#### Flujo de Sobrantes

- Al cerrar caja con sobrante → se crea ajuste "Pendiente"
- Al aprobar → solo cambia el estado (queda documentado)

---

## Cuentas por Cobrar

El módulo de Cuentas por Cobrar permite gestionar las deudas de los empleados por faltantes de caja.

### Acceder al Módulo

1. Haz clic en **Cajero** en el menú lateral
2. Selecciona **Cuentas por Cobrar**

### Ver Cuentas

La página muestra:
- **Total Deuda**: Suma de todas las deudas
- **Total Pagado**: Suma de pagos realizados
- **Total Pendiente**: Deuda restante

#### Filtros

- **Por cajero**: Filtra las cuentas de un empleado específico
- **Por estado**: Todas, Pendiente, Parcial, Pagado

### Registrar Pago (Admin)

1. Localiza la cuenta del empleado
2. Haz clic en **Registrar Pago**
3. Ingresa el monto a pagar
4. Confirma el pago

#### Estados de Cuenta

| Estado | Descripción |
|--------|-------------|
| Pendiente | Deuda sin pagos |
| Parcial | Pago parcial realizado |
| Pagado | Deuda liquidada |

---

# Módulo de Inventario - Guía de Usuario

## Índice
1. [Introducción](#introducción)
2. [Navegación](#navegación)
3. [Configuración Inicial](#configuración-inicial)
   - [3.1 Roles y Permisos](#31-roles-y-permisos)
   - [3.2 Usuarios](#32-usuarios)
   - [3.3 Datos de Empresa](#33-datos-de-empresa)
   - [3.4 Ubicaciones](#34-ubicaciones)
   - [3.5 Categorías](#35-categorías)
   - [3.6 Proveedores](#36-proveedores)
4. [Inventario](#inventario)
   - [4.1 Productos](#productos)
   - [4.2 Stock](#stock)
   - [4.3 Transferencias](#43-transferencias)
   - [4.4 Costo Promedio](#41-costo-promedio)
   - [4.5 Kits (Paquetes)](#42-kits-paquetes)
   - [4.6 Porcentaje de Ganancia](#43-porcentaje-de-ganancia)
5. [Reportes](#reportes)

---

## Introducción

El módulo de inventario te permite gestionar:
- **Productos**: Catálogo completo con variaciones, precios y proveedores
- **Stock**: Control multi-ubicación de inventario
- **Movimientos**: Historial completo de entradas y salidas
- **Proveedores**: Gestión de proveedores para compras

### Estructura del Sistema

```
├── Dashboard              → Vista general
│
├── Inventario (colapsable)
│   ├── Stock             → Control de inventario por ubicación
│   ├── Productos         → Catálogo de items
│   ├── Proveedores       → Gestión de proveedores
│   └── Transferencias    → Mover stock entre ubicaciones
│
└── Configuración (colapsable)
    ├── Datos de Empresa  → Información de la empresa
    ├── Ubicaciones       → Sucursales y almacenes
    ├── Categorías        → Clasificación de productos
    ├── Usuarios          → Gestión de usuarios
    └── Roles y Permisos → Control de acceso
```

---

## Navegación

### Menú Principal

Al acceder al sistema, verás el menú lateral con las siguientes secciones:

1. **Dashboard** - Vista general del sistema
2. **Inventario** (colapsable)
   - **Stock** - Control de inventario por ubicación
   - **Productos** - Catálogo de productos
   - **Proveedores** - Gestión de proveedores
   - **Transferencias** - Mover stock entre ubicaciones
3. **Configuración** (colapsable)
   - **Datos de Empresa** - Información de la empresa
   - **Ubicaciones** - Sucursales y almacenes
   - **Categorías** - Clasificación de productos
   - **Usuarios** - Gestión de usuarios del sistema
   - **Roles y Permisos** - Control de acceso

---

## Configuración Inicial

Antes de comenzar a usar el sistema, es importante realizar la configuración inicial en el siguiente orden:

### 3.1 Roles y Permisos

Los Roles y Permisos permiten controlar qué pueden hacer los usuarios en el sistema.

#### Estructura de Permisos

El sistema cuenta con dos tipos de permisos:

1. **Permisos de Tabla**: Controlan el acceso a las diferentes funcionalidades
   - **Leer (Read)**: Ver registros
   - **Crear (Create)**: Agregar nuevos registros
   - **Actualizar (Update)**: Modificar registros existentes
   - **Eliminar (Delete)**: Borrar registros

2. **Permisos de Menú**: Controlan qué módulos del menú son visibles

#### Configurar Permisos

1. Accede a **Configuración → Roles y Permisos**
2. Verás dos pestañas:
   - **Permisos de Tabla**: Lista de tablas con permisos CRUD
   - **Permisos de Menú**: Opciones del menú lateral
3. Selecciona un rol para modificar sus permisos
4. Activa o desactiva los permisos necesarios
5. Haz clic en **Guardar**

#### Roles Predeterminados

El sistema incluye por defecto:
- **Administrador**: Acceso completo a todas las funcionalidades
- **Gerente**: Puede gestionar inventario pero no usuarios
- **Vendedor**: Solo puede vender y ver productos

#### Sincronizar Permisos

Si agregas nuevas tablas al sistema, sincroniza los permisos:

1. En **Configuración → Roles y Permisos**
2. Haz clic en **"Sincronizar Tablas"** para crear permisos de las nuevas tablas
3. Haz clic en **"Sincronizar Menú"** para actualizar permisos de menú

---

### 3.2 Usuarios

Gestiona los usuarios que accederán al sistema.

#### Crear Usuario

1. Accede a **Configuración → Usuarios**
2. Haz clic en **"Nuevo Usuario"**
3. Completa los campos:
   - **Nombre de Usuario**: Identificador único
   - **Email**: Correo electrónico
   - **Contraseña**: Contraseña de acceso
   - **Rol**: Perfil de acceso (Admin, Gerente, Vendedor)
   - **Activo**: Si el usuario puede acceder

#### Editar Usuario

1. Haz clic en el botón de editar (lápiz)
2. Modifica los campos necesarios
3. Haz clic en **Guardar**

#### Cambiar Contraseña

1. El usuario puede cambiar su contraseña desde su perfil
2. Solo el administrador puede resetear contraseñas

---

### 3.3 Datos de Empresa

Configura la información de tu empresa que aparecerá en facturas y reportes.

#### Configurar Empresa

1. Accede a **Configuración → Datos de Empresa**
2. Completa los campos:
   - **Nombre de la Empresa**: Razón social
   - **RUC/NIT**: Identificación fiscal
   - **Dirección**: Dirección fiscal
   - **Teléfono**: Teléfono de contacto
   - **Email**: Correo electrónico
   - **Logo**: Imagen de marca (opcional)

---

### 3.4 Ubicaciones

Las ubicaciones representan tus sucursales y almacenes. Es el primer paso antes de gestionar inventario.

#### Crear Ubicación

1. Accede a **Configuración → Ubicaciones**
2. Haz clic en **"Nueva Ubicación"**
3. Completa los campos:
   - **Nombre**: Nombre de la sucursal (ej: "Tienda Centro")
   - **Código**: Código corto único (ej: "CEN", "ALM01")
   - **Dirección**: Dirección física
   - **Teléfono**: Teléfono de contacto
   - **Email**: Correo electrónico
   - **Zona Horaria**: Zona horaria de la ubicación
   - **Solo almacén**: Si está marcado, no se permitirá vender directamente
   - **Activo**: Si la ubicación está operativa

#### Tipos de Ubicación

- **Sucursal (Tienda)**: Punto de venta donde se realizan transacciones
- **Almacén**: Solo para almacenamiento y gestión de inventario

---

### 3.5 Categorías

Las categorías permiten organizar tus productos jerárquicamente.

#### Crear Categoría

1. Accede a **Configuración → Categorías**
2. Haz clic en **"Nueva Categoría"**
3. Completa:
   - **Nombre**: Nombre de la categoría
   - **Descripción**: Descripción opcional
   - **Categoría Padre**: Opcional, para crear subcategorías
   - **Activo**: Si la categoría está disponible

### Ejemplo de Estructura

```
├── Electrónica
│   ├── Teléfonos
│   ├── Computadoras
│   └── Accesorios
├── Ropa
│   ├── Hombre
│   ├── Mujer
│   └── Niños
└── Alimentos
```

---

### 3.6 Proveedores

Gestiona los proveedores para tus órdenes de compra y recepciones.

#### Crear Proveedor

1. Accede a **Inventario → Proveedores**
2. Haz clic en **"Nuevo Proveedor"**
3. Completa:
   - **Nombre**: Razón social
   - **Persona de Contacto**: Nombre del vendedor/contacto
   - **Email**: Correo electrónico
   - **Teléfono**: Teléfono de contacto
   - **Dirección**: Dirección fiscal
   - **Activo**: Si el proveedor está disponible

---

## Inventario

### 4.1 Productos

Los productos son el núcleo del sistema. Cada producto puede tener:

- **Variaciones**: Tallas, colores, tamaños
- **Números de serie**: Para productos que requieren seguimiento individual
- **Kits/Paquetes**: Productos compuestos
- **Servicios**: Productos intangibles

#### Crear Producto

1. Accede a **Productos**
2. Haz clic en **"Nuevo Producto"**
3. Completa los datos:

**Datos Básicos**
| Campo | Descripción |
|-------|-------------|
| SKU | Código interno (se genera automáticamente si se deja vacío) |
| Nombre | Nombre del producto |
| Descripción | Descripción detallada |
| Categoría | Clasificación del producto |
| Proveedor | Proveedor principal |

**Precios**
| Campo | Descripción |
|-------|-------------|
| Costo | Precio de costo (para calcular ganancias) |
| % Ganancia | Porcentaje de ganancia sobre el costo |
| Precio Venta | Precio al público (se calcula automáticamente si hay % de ganancia) |

**Stock**
| Campo | Descripción |
|-------|-------------|
| Nivel Reorden | Cantidad mínima que activa alerta |
| Cantidad Reorden | Cantidad sugerida al reorder |

**Banderas**
| Campo | Descripción |
|-------|-------------|
| Serializado | Requiere número de serie |
| Servicio | Es un servicio (sin stock físico) |
| Kit/Paquete | Es un paquete de productos |

**Estado**
- **Activo**: Disponible para venta
- **Inactivo**: No disponible temporalmente
- **Descontinuado**: Ya no se vende

#### Ver Detalles del Producto

Al hacer clic en el icono de ojo (👁) verás:
- Información completa del producto
- Variaciones disponibles
- Stock por cada ubicación

### 4.2 Stock

El módulo de Stock te permite ver y controlar la cantidad de productos en cada ubicación, además de realizar ajustes con trazabilidad completa.

#### Pestañas del Módulo

El módulo de Stock tiene dos pestañas:

1. **Stock**: Vista del inventario actual por ubicación
2. **Historial**: Registro de todos los movimientos de inventario

#### Vista de Stock

La tabla muestra:
- **SKU**: Código del producto
- **Producto**: Nombre del item
- **Ubicación**: Sucursal/almacen
- **Variación**: Atributos (color, talla)
- **Cantidad**: Stock actual
- **Reservado**: Cantidad apartada
- **En Tránsito**: Cantidad en transferencia

#### Indicadores de Color

| Color | Significado |
|-------|-------------|
| 🔴 Rojo | Stock en 0 |
| 🟡 Amarillo | Bajo nivel (≤ reorder_level) |
| 🟢 Verde | Stock normal |

#### Ajustar Stock

Cuando necesitas hacer correcciones manuales, el sistema guarda un registro completo en 3 tablas para auditoría:

**Flujo de Ajuste:**

1. Haz clic en **"Ajustar Stock"** (botón naranja)
2. Selecciona:
   - **Producto**: El item a ajustar
   - **Ubicación**: Dónde está el producto
   - **Tipo de Movimiento**:
     - Entrada por ajuste (aumenta stock)
     - Salida por ajuste (disminuye stock)
     - Dañado
     - Perdido
     - Encontrado
   - **Cantidad**: Número de unidades
   - **Notas**: Razón del ajuste

3. Haz clic en **"Ajustar"**

**¿Qué hace el sistema?**

Al confirmar un ajuste, el sistema:

1. **Crea registro en `inventory_adjustments`**: Cabecera del ajuste con número, ubicación, tipo, notas
2. **Crea registro en `inventory_adjustment_items`**: Detalle del item con cantidad anterior, cantidad contada, diferencia, razón
3. **Actualiza `item_quantities`**: El stock actual del producto
4. **Crea registro en `inventory_movements`**: Historial para auditoría

#### Ejemplo de Ajuste

**Datos iniciales:**
- Producto X en ubicación Central: 5 unidades

**Usuario hace ajuste de -2 (dañado):**

1. Se crea ajuste `ADJ-2026-001` en `inventory_adjustments`
2. Se guarda en `inventory_adjustment_items`:
   - quantity_before: 5
   - quantity_counted: 3
   - quantity_difference: -2
   - reason: "Daños por inundación"
3. Se actualiza `item_quantities`: quantity = 3
4. Se registra en `inventory_movements`:
   - movement_type: "adjustment"
   - quantity_change: -2
   - quantity_before: 5
   - quantity_after: 3

#### Pestaña Historial

En la pestaña "Historial" puedes ver todos los movimientos de inventario:
- Fecha y hora
- Producto
- Ubicación
- Tipo de movimiento
- Cantidad anterior
- Cambio realizado
- Cantidad después
- Notas

Esto permite hacer auditorías completas del inventario.

#### Tipos de Movimiento

| Tipo | Descripción |
|------|-------------|
| Ajuste | Corrección manual de inventario |
| Entrada | Ingreso de mercancía |
| Salida | Egreso de mercancía |
| Dañado | Productos dañados |
| Perdido | Productos perdidos |
| Encontrado | Productos encontrados |
| Compra | Compra a proveedor |
| Venta | Venta al cliente |
| Transferencia | Movimiento entre ubicaciones |

---

### 4.3 Transferencias

Las transferencias permiten mover productos entre ubicaciones (sucursales/almacenes) de forma controlada, manteniendo un registro completo de movimientos.

#### Estados de una Transferencia

| Estado | Descripción |
|--------|-------------|
| **Pendiente** | Transferencia creada, esperando envío |
| **En Tránsito** | Stock reservado en origen, en camino |
| **Recibido** | Stock recibido en destino |
| **Cancelado** | Transferencia cancelada |

#### Cómo Crear una Transferencia

1. Accede a **Inventario → Transferencias**
2. Haz clic en **"Nueva Transferencia"**
3. Selecciona:
   - **Ubicación Origen**: De dónde sale el stock
   - **Ubicación Destino**: A dónde llega el stock
   - **Notas**: Comentarios opcionales
4. Guarda la transferencia

#### Agregar Items

1. En la transferencia creada, usa el formulario de "Agregar item"
2. Selecciona el **producto** y la **cantidad**
3. El sistema valida que haya stock disponible en origen

#### Enviar Transferencia

1. Una vez agregados los items, haz clic en **"Enviar"**
2. El stock se descuenta de origen y queda marcado como "en tránsito"
3. Se registra un movimiento de tipo `transfer_out`

#### Recibir Transferencia

1. Cuando arrives a destino, haz clic en **"Recibir"**
2. El stock se suma en la ubicación destino
3. Se registra un movimiento de tipo `transfer_in`

#### Cancelar Transferencia

- Solo se pueden cancelar transferencias en estado **Pendiente** o **En Tránsito**
- Si está en tránsito, primero debe recibir para deshacer o rechazar

#### Registro en Movimientos

Todas las transferencias quedan registradas en **Inventario → Stock → Movimientos** con:
- Tipo: `transfer_out` (origen) o `transfer_in` (destino)
- Referencia al número de transferencia

---

### 4.1 Costo Promedio

Es un método de valoración de inventario que pondera el valor del stock existente con el nuevo ingreso, manteniendo un costo unitario actualizado reflejando el promedio de todas las compras.

#### Fórmula de Costo Promedio

```
Costo Promedio = ((Stock Total Actual × Costo Actual) + (Cantidad Ingresada × Nuevo Costo)) / (Stock Total Actual + Cantidad Ingresada)
```

#### Ejemplo Práctico

Supongamos que tienes un producto con:
- **Stock actual**: 10 unidades
- **Costo actual**: $10.00
- **Valor total en inventario**: $100.00

Si ingresas **10 unidades adicionales** con un costo de **$20.00**:

```
Costo Promedio = ((10 × $10) + (10 × $20)) / (10 + 10)
Costo Promedio = ($100 + $200) / 20
Costo Promedio = $300 / 20
Costo Promedio = $15.00
```

**Resultado**:
- El nuevo costo del producto será **$15.00**
- El movimiento de inventario registrará: quantity=10, unit_cost=$15.00, total_cost=$150.00

#### Cómo Usar en Ajustes de Stock

1. Ve a **Inventario → Stock**
2. Haz clic en **"Ajustar Stock"**
3. Selecciona **"Entrada por ajuste"** como tipo de movimiento
4. Ingresa la **cantidad**
5. (Opcional) Ingresa el **Costo Unitario** - si lo dejas vacío, usa el costo actual del producto

**Importante**:
- El campo "Costo Unitario" solo aparece en entradas (ajuste positivo)
- Si no especificas un costo, se usa el costo actual del producto
- El costo promedio solo se recalcula si el costo enviado es diferente al actual

#### Cuándo Usar

- **Compras a diferente precio**: Cuando recibes mercadería de un proveedor a un precio distinto
- **Promociones**: Cuando ingresas productos en oferta
- **Ajustes de costo**: Para corregir el costo de un producto manualmente

#### Consideraciones

- El cálculo aplica solo a entradas de stock (cantidad positiva)
- Las salidas de stock usan el costo promedio actual
- El historial de movimientos guarda el costo de cada operación

---

### 4.4 Kits (Paquetes)

Los Kits son productos compuestos que contienen múltiples productos (componentes). Ejemplos:
- "Combo Gamming" = Teclado + Mouse + Monitor
- "Paquete Oficina" = Escritorio + Silla + Lámpara
- "Kit Mantención" = Aceite + Filtro + Bujías

#### Cómo Crear un Kit

1. Accede a **Inventario → Productos**
2. Haz clic en **"Nuevo Producto"**
3. Completa los datos básicos (nombre, categoría, etc.)
4. Activa la opción **"Kit/Paquete"**
5. En la sección "Componentes del Kit", agrega los productos:
   - Selecciona el producto componente
   - Define la cantidad necesaria
6. El sistema calculará automáticamente:
   - **Costo**: Suma de (costo componente × cantidad)
   - **Precio Venta**: Suma de (precio componente × cantidad)

#### Validación de Stock para Kits

**Importante**: Para crear o actualizar un kit, **todos los componentes deben tener stock disponible**.

El sistema valida que cada componente tenga al menos la cantidad necesaria:
- Si un componente tiene stock insuficiente, mostrará un error indicando cuál componente falta

**Cálculo de Stock Kit**

El stock disponible de un kit se calcula automáticamente como:

```
Stock Kit = min(stock_componente_1 / cantidad_1, stock_componente_2 / cantidad_2, ...)
```

**Ejemplo**:
- Monitor: 5 unidades disponibles
- Teclado: 2 unidades disponibles
- Mouse: 3 unidades disponibles

Stock Kit = min(5/1, 2/1, 3/1) = **2 kits máximo**

#### Visualización en la Tabla

- Los kits se identifican con un icono de caja (Box) y badge "Kit"
- La columna de Stock muestra "kits" como indicador
- El stock se muestra en rojo si está bajo el nivel de reorder

---

### 4.5 Porcentaje de Ganancia

El sistema permite calcular el precio de venta automáticamente basándose en un porcentaje de ganancia sobre el costo.

#### Cómo Usar

En el formulario de producto, verás tres campos relacionados con precios:

1. **Costo**: Precio de costo del producto
2. **% Ganancia**: Porcentaje de ganancia deseado
3. **Precio Venta**: Precio al público (calculado o manual)

#### Funcionamiento

- **Opción 1**: Ingresa el % de ganancia y el precio se calcula automáticamente
  - Fórmula: `Precio Venta = Costo × (1 + % Ganancia / 100)`
  - Ejemplo: Costo $100,000 + 30% = Precio $130,000

- **Opción 2**: Ingresa el precio de venta manualmente y el % se calcula automáticamente
  - El sistema detecta el cambio y calcula el porcentaje de ganancia
  - Útil para productos con precios redondeados o especiales

- **Opción 3**: Deja el % en 0 y define el precio manualmente

#### Para Kits

Para kits, el cálculo de precio sigue esta lógica:
1. Si hay un % de ganancia definido → usa: `costo_kit × (1 + % / 100)`
2. Si el % es 0 → usa la suma de precios de componentes

---

## Funcionalidades Avanzadas

### Productos Serializados

Los productos serializados requieren un número de serie único para cada unidad. Útil para:
- Electrónica (celulares, laptops)
- Electrodomésticos
- Artículos de valor

**Flujo**:
1. Crear producto marcado como "Serializado"
2. Al recibir mercadería, registrar números de serie
3. Al vender, asociar serie al cliente
4. Tracking completo del artículo

### Transferencias entre Ubicaciones

Las transferencias permiten mover productos entre ubicaciones (sucursales/almacenes) de forma controlada, manteniendo un registro completo de movimientos.

#### Estados de una Transferencia

| Estado | Descripción |
|--------|-------------|
| **Pendiente** | Transferencia creada, esperando envío |
| **En Tránsito** | Stock reservado en origen, en camino |
| **Recibido** | Stock recibido en destino |
| **Cancelado** | Transferencia cancelada |

#### Cómo Crear una Transferencia

1. Accede a **Inventario → Transferencias**
2. Haz clic en **"Nueva Transferencia"**
3. Selecciona:
   - **Ubicación Origen**: De dónde sale el stock
   - **Ubicación Destino**: A dónde llega el stock
   - **Notas**: Comentarios opcionales
4. Guarda la transferencia

#### Agregar Items

1. En la transferencia creada, usa el formulario de "Agregar item"
2. Selecciona el **producto** y la **cantidad**
3. El sistema valida que haya stock disponible en origen

#### Enviar Transferencia

1. Una vez agregados los items, haz clic en **"Enviar"**
2. El stock se descuenta de origen y queda marcado como "en tránsito"
3. Se registra un movimiento de tipo `transfer_out`

#### Recibir Transferencia

1. Cuando arrives a destino, haz clic en **"Recibir"**
2. El stock se suma en la ubicación destino
3. Se registra un movimiento de tipo `transfer_in`

#### Cancelar Transferencia

- Solo se pueden cancelar transferencias en estado **Pendiente** o **En Tránsito**
- Si está en tránsito, primero debe recibir para deshacer o rechazar

#### Registro en Movimientos

Todas las transferencias quedan registradas en **Inventario → Stock → Movimientos** con:
- Tipo: `transfer_out` (origen) o `transfer_in` (destino)
- Referencia al número de transferencia

### Alertas de Stock

El sistema genera alertas cuando:
- Stock ≤ Nivel de reorder
- Stock en 0
- Productos sin movimiento (futuro)

---

## Mejores Prácticas

### Configuración Inicial

El orden recomendado para la configuración inicial es:

1. **Primero**: Configurar Roles y Permisos
2. **Segundo**: Crear usuarios del sistema
3. **Tercero**: Configurar datos de empresa
4. **Cuarto**: Crear ubicaciones (sucursales/almacenes)
5. **Quinto**: Crear categorías
6. **Sexto**: Crear proveedores
7. **Séptimo**: Agregar productos
8. **Octavo**: Registrar stock inicial

### Gestión Diaria

1. Revisa las alertas de bajo stock
2. Realiza ajustes solo con justificación
3. Mantén actualizado el costo de productos
4. Registra todos los movimientos

### Auditoría

- El sistema registra TODOS los cambios de stock
- Incluye: usuario, fecha, motivo, cantidades anteriores y nuevas
- No es posible eliminar registros, solo soft delete

---

## Glosario

| Término | Definición |
|---------|------------|
| **SKU** | Código interno único del producto |
| **Stock** | Cantidad de unidades disponibles |
| **Reorder Level** | Nivel mínimo que activa alerta |
| **Variación** | Atributo del producto (talla, color) |
| **Serial** | Número de serie único por producto |
| **Soft Delete** | Eliminación lógica (no borra datos) |
| **Transferencia** | Movimiento de stock entre ubicaciones |
| **Ajuste** | Corrección manual de inventario |
| **inventory_adjustments** | Tabla de cabecera de ajustes de inventario |
| **inventory_adjustment_items** | Tabla de detalle de items de cada ajuste |
| **inventory_movements** | Tabla de historial de todos los movimientos de inventario |
| **item_quantities** | Tabla que guarda el stock actual por producto y ubicación |
| **quantity_before** | Cantidad antes del cambio |
| **quantity_after** | Cantidad después del cambio |
| **quantity_difference** | Diferencia entre cantidad contada y cantidad anterior |
| **Rol** | Perfil de usuario que define permisos de acceso |
| **Permiso** | Autorización para realizar una acción específica |
| **CRUD** | Crear, Leer, Actualizar, Eliminar |
| **Costo Promedio** | Método de valoración de inventario que calcula el promedio ponderado entre el stock existente y las nuevas entradas |
| **Kit/Paquete** | Producto compuesto por múltiples productos (componentes) |
| **Stock Kit** | Cantidad máxima de kits que se pueden armar según el stock de componentes |
| **% Ganancia** | Porcentaje de beneficio sobre el costo para calcular el precio de venta |

---

## Preguntas Frecuentes

### ¿Cómo inicio la configuración del sistema?

1. Configura los Roles y Permisos en **Configuración → Roles y Permisos**
2. Crea los usuarios en **Configuración → Usuarios**
3. Completa los datos de empresa en **Configuración → Datos de Empresa**
4. Crea tus ubicaciones en **Configuración → Ubicaciones**
5. Crea categorías en **Configuración → Categorías**
6. Agrega proveedores en **Inventario → Proveedores**
7. Crea productos en **Inventario → Productos**
8. Registra stock inicial usando "Ajustar Stock"

### ¿Puedo tener el mismo producto en varias tiendas?

Sí. El sistema soporta multi-ubicación. Cada producto puede tener stock diferente en cada ubicación.

### ¿Qué pasa si borro un producto?

Se hace un "soft delete" (borrado lógico). El producto se mantiene en la base de datos pero no aparece en listados. El historial de movimientos se preserva.

### ¿Cómo funciona el control de stock?

- Cada producto tiene stock por ubicación
- Las ventas descuatan stock automáticamente
- Las devoluciones incrementan stock
- Las transferencias mueven stock entre ubicaciones
- Todo queda registrado en movimientos

### ¿Necesito internet para usar el sistema?

Sí, el sistema es basado en web y requiere conexión. Los datos se almacenan en el servidor MySQL.
