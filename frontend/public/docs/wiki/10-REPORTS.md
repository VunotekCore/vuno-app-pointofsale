# 10. Reportes

## Índice

1. [Acceso al Módulo](#acceso-al-módulo)
2. [Tipos de Reportes](#tipos-de-reportes)
3. [Reporte de Ventas](#reporte-de-ventas)
4. [Reporte de Inventario](#reporte-de-inventario)
5. [Reporte de Compras](#reporte-de-compras)
6. [Reporte de Caja](#reporte-de-caja)
7. [Reporte de Vencimientos](#reporte-de-vencimientos)
8. [Filtros Comunes](#filtros-comunes)
9. [Exportar Datos](#exportar-datos)

---

## Acceso al Módulo

### Ruta

**Dashboard → Reportes**

### Pestañas Disponibles

El módulo tiene 5 pestañas de reportes:

| Pestaña | Descripción |
|---------|-------------|
| Ventas | Transacciones de venta |
| Inventario | Movimientos de stock |
| Compras | Órdenes y recepciones |
| Caja | Transacciones de caja |
| Vencimientos | Productos próximos a vencer |

---

## Tipos de Reportes

### Vista General

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Reportes                                                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [Ventas] [Inventario] [Compras] [Caja] [Vencimientos]                    │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Filtros:                                                              │ │
│ │ [Ubicación ▾]  [Usuario ▾]  [Estado ▾]  [Desde ▾]  [Hasta ▾]       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ #      Fecha        Cliente    Empleado  Ubicación   Total   Estado│ │
│ │ ─────────────────────────────────────────────────────────────────── │ │
│ │ ...                                                                 │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Reporte de Ventas

### Descripción

Muestra todas las transacciones de venta en el período seleccionado.

### Columnas

| Columna | Descripción |
|---------|-------------|
| Número | Número de venta |
| Fecha | Fecha y hora de la venta |
| Cliente | Nombre del cliente |
| Empleado | Cajero/Vendedor |
| Ubicación | Sucursal |
| Total | Monto total |
| Estado | Estado de la venta |

### Estados Disponibles

| Estado | Descripción |
|--------|-------------|
| Pendiente | Venta no completada |
| Completada | Venta finalizada |
| Suspendida | Venta pausada |
| Cancelada | Venta anulada |

### Ejemplo de Datos

```
 Número    Fecha              Cliente      Empleado    Ubicación     Total
─────────────────────────────────────────────────────────────────────────
 000123   15/01 10:30       Juan Pérez   Maria G.    Tienda     C$250.00  Completada
 000122   15/01 09:15       -            Carlos R.   Tienda     C$180.00  Completada
 000121   14/01 18:45       Ana López    Maria G.    Sucursal2  C$95.00   Cancelada
```

---

## Reporte de Inventario

### Descripción

Muestra los movimientos de stock: entradas, salidas y ajustes.

### Columnas

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha del movimiento |
| Producto | Nombre del producto |
| Tipo | Tipo de movimiento |
| Cantidad | Cantidad afectada |
| Ubicación | Sucursal |
| Usuario | Quién realizó el movimiento |

### Tipos de Movimiento

| Tipo | Descripción |
|------|-------------|
| Entrada | Producto agregado al stock |
| Salida | Producto removido del stock |
| Ajuste | Corrección de inventario |

### Filtro por Tipo

| Opción | Descripción |
|--------|-------------|
| Todos los tipos | Ver todos los movimientos |
| Entrada | Solo entradas |
| Salida | Solo salidas |
| Ajuste | Solo ajustes |

### Ejemplo de Datos

```
 Fecha       Producto         Tipo     Cantidad   Ubicación     Usuario
─────────────────────────────────────────────────────────────────────────
 15/01 10:30 Cafe Latte       Entrada     +50     Tienda       Maria G.
 15/01 09:00 Sandwich         Salida      -10     Tienda       Carlos R.
 14/01 18:00 Cafe Latte       Ajuste      +5      Tienda       Admin
```

---

## Reporte de Compras

### Descripción

Muestra las órdenes de compra y recepciones de inventario.

### Columnas

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha del documento |
| Tipo | Tipo de documento |
| Número | Número del documento |
| Proveedor | Nombre del proveedor |
| Ubicación | Sucursal destino |
| Total | Monto total |
| Estado | Estado del documento |

### Estados Disponibles

| Estado | Descripción |
|--------|-------------|
| Pendiente | Documento no completado |
| Completada | Documento finalizado |
| Cancelada | Documento anulado |

### Ejemplo de Datos

```
 Fecha       Tipo         Número    Proveedor    Ubicación     Total
─────────────────────────────────────────────────────────────────────
 15/01 10:30 Recepción   REC-001   Proveedor A  Tienda     C$500.00  Completada
 14/01 09:00 Orden        OC-001    Proveedor B  Tienda     C$300.00  Pendiente
```

---

## Reporte de Caja

### Descripción

Muestra las transacciones de caja: ventas en efectivo, retiros, depósitos.

### Columnas

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha y hora |
| Tipo | Tipo de transacción |
| Detalle | Descripción |
| Monto | Cantidad |
| Ubicación | Sucursal |
| Usuario | Responsable |

### Tipos de Transacción

| Tipo | Descripción |
|------|-------------|
| Venta | Pago en efectivo de venta |
| Retiro | Extracción de dinero |
| Depósito | Depósito de dinero |
| Apertura | Monto inicial |
| Cierre | Cierre de caja |

### Ejemplo de Datos

```
 Fecha       Tipo       Detalle        Monto      Ubicación     Usuario
──────────────────────────────────────────────────────────────────────────
 15/01 10:30 Venta      Venta #001    +C$250.00  Tienda       Maria G.
 15/01 09:00 Retiro     Banco          -C$100.00  Tienda       Carlos R.
 14/01 18:00 Cierre     Cierre caja    -C$500.00  Tienda       Maria G.
```

---

## Reporte de Vencimientos

### Descripción

Muestra los productos próximos a vencer o já vencidos.

### Columnas

| Columna | Descripción |
|---------|-------------|
| Producto | Nombre del producto |
| Ubicación | Sucursal donde está |
| Cantidad | Stock afectado |
| Fecha Vence | Fecha de vencimiento |
| Días | Días restantes |
| Estado | Estado del producto |

### Estados

| Estado | Descripción |
|--------|-------------|
| Por Vencer | Próximo a vencer |
| Vencidos | Já pasó la fecha |

### Filtro

| Opción | Descripción |
|--------|-------------|
| Todos | Ver todos |
| Por Vencer | Solo próximos a vencer |
| Vencidos | Solo já vencidos |

### Ejemplo de Datos

```
 Producto         Ubicación    Cantidad   Fecha Vence   Días    Estado
─────────────────────────────────────────────────────────────────────────
 Leche Entera     Tienda          10      20/01/2024      5     Por Vencer
 Yogurt Fresa     Tienda           5      15/01/2024     -2     Vencido
```

### Importancia

Revisa este reporte regularmente para:

- **Reducir pérdidas** por productos vencidos
- **Rotar inventario** (FIFO: primero en entrar, primero en salir)
- **Planificar promociones** para productos próximos a vencer

---

## Filtros Comunes

### Ubicación

| Opción | Descripción |
|--------|-------------|
| Todas las ubicaciones | Ver de todas las sucursales |
| [Sucursal específica] | Filtrar por una ubicación |

> **Nota**: Solo admins pueden ver todas las ubicaciones.

### Usuario

Filtra por el empleado que realizó la transacción.

### Rango de Fechas

| Campo | Descripción |
|-------|-------------|
| Desde | Fecha inicial |
| Hasta | Fecha final |

Por defecto se muestra el mes actual.

### Cambiar Período

1. Haz clic en el campo de fecha
2. Selecciona la nueva fecha
3. Los datos se actualizan automáticamente

---

## Exportar Datos

### Funcionalidad

El reporte permite exportar los datos a otros formatos.

### Opciones de Exportación

| Formato | Descripción |
|---------|-------------|
| PDF | Documento para imprimir |
| Excel | Hoja de cálculo |
| CSV | Datos separados por comas |

### Cómo Exportar

1. Genera el reporte con los filtros deseados
2. Haz clic en el botón de exportar
3. Selecciona el formato
4. El archivo se descarga automáticamente

---

## Tips para el Uso

### Ventas del Día

1. Selecciona "Desde" = hoy
2. Selecciona "Hasta" = hoy
3. Verás todas las ventas del día

### Ventas por Cajero

1. Selecciona el usuario específico
2. Aplica los filtros de fecha
3. Verás las ventas de ese cajero

### Inventario del Mes

1. Mantén el filtro de mes actual
2. Verás todos los movimientos
3. Usa tipo "Entrada" o "Salida" según necesites

### Productos por Vencer

1. Ve a la pestaña "Vencimientos"
2. Selecciona "Por Vencer"
3. Revisa qué productos necesitan atención

---

[Anterior: Cuentas por Cobrar](./08-RECEIVABLES.md) | [Siguiente: FAQ](./11-FAQ.md)
