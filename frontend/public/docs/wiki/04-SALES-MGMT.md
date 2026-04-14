# 04. Gestión de Ventas

## Índice

1. [Acceso al Módulo](#acceso-al-módulo)
2. [Lista de Ventas](#lista-de-ventas)
3. [Estados de Venta](#estados-de-venta)
4. [Filtros y Búsqueda](#filtros-y-búsqueda)
5. [Ver Detalle de Venta](#ver-detalle-de-venta)
6. [Acciones sobre Ventas](#acciones-sobre-ventas)
7. [Tickets y Comprobantes](#tickets-y-comprobantes)

---

## Acceso al Módulo

### Ruta

**Ventas → Lista de Ventas**

### Botón Rápido

Desde cualquier página, puedes crear una nueva venta haciendo clic en **"+ Nueva Venta"** en la esquina superior derecha.

---

## Lista de Ventas

### Vista Principal

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Ventas                                    [+ Nueva Venta]                   │
│ Historial de ventas realizadas                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ [Buscar por número, cliente o empleado...]                                  │
│                                                                              │
│ [Ubicación ▾] [Estado ▾] [Desde ▾] [Hasta ▾]                               │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ #Venta   Fecha          Cliente    Empleado  Ubicación  Total    Estado   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 000123   15/01 10:30    Juan P.    Maria G.  Tienda     C$250.00 Completada│
│ 000122   15/01 09:15    -          Carlos R.  Tienda     C$180.00 Suspendida│
│ 000121   14/01 18:45    Ana L.     Maria G.  Sucursal2  C$95.00  Completada│
│ ...                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Columnas Visibles

| Columna | Descripción |
|---------|-------------|
| #Venta | Número de identificación de la venta |
| Fecha | Fecha y hora de la transacción |
| Cliente | Nombre del cliente (o "-" si no tiene) |
| Empleado | Cajero/Vendedor que realizó la venta |
| Ubicación | Sucursal donde se hizo la venta |
| Total | Monto total de la venta |
| Estado | Estado actual de la transacción |
| Acciones | Opciones disponibles |

---

## Estados de Venta

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Completada** | Verde | Venta pagada y finalizada |
| **Pendiente** | Amarillo | Venta creada pero no pagada (layaway) |
| **Suspendida** | Naranja | Venta guardada para continuar después |
| **Cancelada** | Rojo | Venta anulada |

### Descripción de Estados

#### Completada

Venta procesada exitosamente con pago confirmado.

#### Pendiente (Layaway)

Venta creada donde el cliente no ha completado el pago. El sistema reserva los productos.

#### Suspendida

Venta guardada temporalmente para continuarla después. El carrito se vacía pero la venta permanece en el sistema.

#### Cancelada

Venta anulada. Ya no se puede modificar ni completar.

---

## Filtros y Búsqueda

### Búsqueda Rápida

Busca por:
- Número de venta
- Nombre del cliente
- Nombre del empleado

Ingresa cualquier texto en el campo de búsqueda para filtrar resultados.

### Filtro por Ubicación

**Solo visible para administradores.**

| Opción | Descripción |
|--------|-------------|
| Todas las ubicaciones | Ver ventas de todas las sucursales |
| [Sucursal específica] | Filtrar por una ubicación |

### Filtro por Estado

| Opción | Muestra |
|--------|---------|
| Todos los estados | Todas las ventas |
| Pendiente | Solo ventas no pagadas |
| Completada | Solo ventas finalizadas |
| Suspendida | Solo ventas pausadas |
| Cancelada | Solo ventas anuladas |

### Filtro por Fecha

Usa los campos **Desde** y **Hasta** para限定 un rango de fechas.

Por defecto se muestra el mes actual.

### Limpiar Filtros

Los filtros activos se muestran con un número en el botón "Mostrar filtros" en móvil.

---

## Ver Detalle de Venta

### Abrir Detalle

Haz clic en cualquier venta de la lista para ver su detalle completo.

### Contenido del Detalle

```
┌─────────────────────────────────────────┐
│ Venta #000123                        [X]│
├─────────────────────────────────────────┤
│                                         │
│ Estado: ● Completada                    │
│ Fecha: 15/01/2024 10:30                │
│ Ubicación: Tienda Centro                │
│ Empleado: Maria G.                      │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ CLIENTE                                 │
│ Juan Pérez                              │
│ +505 8888-8888                         │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ PRODUCTOS                               │
│ ┌─────────────────────────────────────┐│
│ │ Cafe Latte        x2    C$90.00   ││
│ │ Sandwich           x1    C$80.00   ││
│ │ Jugo Natural      x1    C$80.00   ││
│ └─────────────────────────────────────┘│
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Subtotal:              C$250.00        │
│ Descuento:             C$0.00          │
│ ─────────────────────────────────────  │
│ TOTAL:                C$250.00        │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ PAGOS                                   │
│ ┌─────────────────────────────────────┐│
│ │ Efectivo          C$300.00          ││
│ │ Cambio            C$50.00          ││
│ └─────────────────────────────────────┘│
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ [📥 Descargar Ticket]                   │
│                                         │
└─────────────────────────────────────────┘
```

### Información del Detalle

| Sección | Descripción |
|---------|-------------|
| **Cabecera** | Número, estado, fecha, ubicación, empleado |
| **Cliente** | Datos del cliente (si existe) |
| **Productos** | Lista de items con cantidades y precios |
| **Totales** | Subtotal, descuentos, total |
| **Pagos** | Métodos de pago utilizados |

---

## Acciones sobre Ventas

### Botones Disponibles

Las acciones varían según el estado de la venta:

#### Ventas Completadas

| Acción | Descripción |
|--------|-------------|
| Ver | Abrir detalle de la venta |
| Ticket | Descargar comprobante PDF |
| Imprimir | Imprimir ticket directamente |

#### Ventas Suspendidas

| Acción | Descripción |
|--------|-------------|
| Ver | Abrir detalle de la venta |
| Reanudar | Continuar con la venta en el POS |
| Cancelar | Anular la venta |

#### Ventas Pendientes

| Acción | Descripción |
|--------|-------------|
| Ver | Abrir detalle de la venta |
| Completar | Registrar el pago |
| Cancelar | Anular la venta |

### Reanudar Venta Suspendida

1. Abre la venta suspendida
2. Haz clic en **"Reanudar"**
3. Confirma la acción
4. La venta se carga en el POS
5. Completa el proceso de cobro

### Completar Venta Pendiente

Para ventas layaway (pendientes):

1. Abre la venta pendiente
2. Haz clic en **"Completar"**
3. Selecciona el método de pago
4. Ingresa el monto recibido
5. Confirma la venta

### Cancelar Venta

**Solo administradores pueden cancelar ventas.**

1. Abre la venta
2. Haz clic en **"Cancelar"**
3. Ingresa el **motivo de cancelación** (obligatorio)
4. Confirma la cancelación

> **Nota**: Las ventas canceladas no se pueden deshacer.

---

## Tickets y Comprobantes

### Descargar Ticket PDF

1. Abre la venta completada
2. Haz clic en **"Descargar Ticket"**
3. El PDF se genera y descarga automáticamente

### Vista Previa del Ticket

Antes de descargar puedes ver una vista previa del ticket.

### Información del Ticket

El ticket incluye:

- Datos de la empresa
- Número de venta
- Fecha y hora
- Productos vendidos
- Subtotal, descuentos, total
- Método de pago
- Cambio (si aplica)

---

## Acciones Masivas

### Nueva Venta Rápida

El botón **"+ Nueva Venta"** en la esquina superior te lleva directamente al POS.

---

## Tips para Búsqueda

### Buscar por Número de Venta

Ingresa el número completo o parcial:
- `000123` - Busca la venta exacta
- `123` - Busca ventas que contengan "123"

### Buscar por Cliente

Ingresa el nombre del cliente (parcial o completo).

### Filtrar por Período

1. Selecciona la fecha **Desde**
2. Selecciona la fecha **Hasta**
3. Los resultados se actualizan automáticamente

---

[Anterior: Manejo de Caja](./03-CASH.md) | [Siguiente: Devoluciones](./05-RETURNS.md)
