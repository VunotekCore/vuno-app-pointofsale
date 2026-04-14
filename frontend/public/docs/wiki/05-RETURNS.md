# 05. Devoluciones

## Índice

1. [Acceso al Módulo](#acceso-al-módulo)
2. [Lista de Devoluciones](#lista-de-devoluciones)
3. [Estados de Devolución](#estados-de-devolución)
4. [Crear Devolución](#crear-devolución)
5. [Procesar Devolución](#procesar-devolución)
6. [Ver Detalle](#ver-detalle)
7. [Tipos de Devolución](#tipos-de-devolución)
8. [Motivos de Devolución](#motivos-de-devolución)

---

## Acceso al Módulo

### Ruta

**Ventas → Devoluciones**

---

## Lista de Devoluciones

### Vista Principal

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Devoluciones                                                                   │
│ Gestión de devoluciones de ventas                                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [Buscar por número o venta original...]                                      │
│                                                                             │
│ [Desde ▾]  [Hasta ▾]                                                         │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│ #Dev    Fecha        Venta      Ubicación    Total    Estado        Acciones│
├────────────────────────────────────────────────────────────────────────────┤
│ RET001  15/01 10:30 000123     Tienda       C$90.00  Pendiente  [👁] [↻]  │
│ RET002  14/01 15:45 000118     Sucursal2    C$45.00  Procesada  [👁]      │
│ ...                                                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

### Columnas Visibles

| Columna | Descripción |
|---------|-------------|
| #Dev | Número de devolución |
| Fecha | Fecha y hora de la devolución |
| Venta | Número de venta original |
| Ubicación | Sucursal donde se hizo |
| Total | Monto de la devolución |
| Estado | Estado actual |
| Acciones | Opciones disponibles |

---

## Estados de Devolución

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Pendiente** | Amarillo | Devolución creada, esperando procesamiento |
| **Procesada** | Verde | Devolución completada, stock reintegrado |

---

## Crear Devolución

### Pasos

1. Haz clic en **"+"** o **"Nueva Devolución"** (si existe)
2. **Busca la venta original** por número
3. **Selecciona los productos** a devolver
4. **Configura** el tipo y motivo
5. **Confirma** la devolución

### Paso 1: Buscar Venta

```
┌─────────────────────────────────────────┐
│ Nueva Devolución                         │
├─────────────────────────────────────────┤
│                                         │
│ Buscar Venta                            │
│ [________________] [Buscar]            │
│                                         │
│ Ingresa el número de venta              │
│                                         │
└─────────────────────────────────────────┘
```

Ingresa el número de venta (ej: `000123`) y haz clic en "Buscar".

### Paso 2: Seleccionar Productos

Una vez encontrada la venta, se mostrarán los productos:

```
┌─────────────────────────────────────────┐
│ Venta #000123                     [X]  │
│ 15/01/2024 10:30 - Tienda Centro      │
├─────────────────────────────────────────┤
│                                         │
│ Seleccionar productos:                  │
│                                         │
│ [✓] Cafe Latte      Cant: 2   C$45.00 │
│         [___1___]                      │
│                                         │
│ [ ] Sandwich       Cant: 1   C$80.00  │
│         [___0___]                      │
│                                         │
│ [ ] Jugo Natural   Cant: 1   C$80.00  │
│         [___0___]                      │
│                                         │
└─────────────────────────────────────────┘
```

Para cada producto:

1. Marca el **checkbox** para seleccionar
2. Ingresa la **cantidad** a devolver (máximo = cantidad original)

---

## Tipos de Devolución

### Reembolso

El cliente recibe el dinero de vuelta.

| Característica | Descripción |
|----------------|-------------|
| Efectivo | Se devuelve en efectivo al cliente |
| Stock | El producto vuelve al inventario |

### Cambio

El producto se devuelve al inventario pero NO se reintegra dinero.

| Característica | Descripción |
|----------------|-------------|
| Efectivo | No hay reintegro de dinero |
| Stock | El producto vuelve al inventario |

### Cuándo Usar Cada Tipo

| Situación | Tipo Recomendado |
|-----------|-----------------|
| Cliente quiere su dinero | Reembolso |
| Cliente quiere otro producto | Cambio |
| Producto defectuoso (sin dinero) | Cambio |

---

## Motivos de Devolución

Al crear la devolución, debes seleccionar un motivo:

| Motivo | Uso |
|--------|-----|
| **Producto defectuoso** | El producto llegó dañado o no funciona |
| **No satisfecho** | El cliente no está conforme con el producto |
| **Error en pedido** | Se vendió incorrectamente (mal producto, cantidad wrong) |
| **Otro** | Cualquier otro motivo (especificar en notas) |

### Notas Adicionales

Puedes agregar notas complementarias que aparecerán en el registro de la devolución.

---

## Completar Formulario

```
┌─────────────────────────────────────────┐
│ Tipo de Devolución                     │
│                                         │
│ [Reembolso]  [Cambio]                  │
│ Se reintegrará dinero al cliente        │
│                                         │
│ Motivo:                                 │
│ [Producto defectuoso ▾]                │
│                                         │
│ Notas (opcional):                       │
│ [________________________]              │
│                                         │
│ ─────────────────────────────────────  │
│ Total a devolver:          C$45.00    │
│                                         │
│ [Cancelar]            [Crear Devolución]│
│                                         │
└─────────────────────────────────────────┘
```

### Validaciones

Antes de crear:

- ✅ Al menos un producto seleccionado
- ✅ Cantidad mayor a 0
- ✅ Tipo de devolución seleccionado
- ✅ Motivo seleccionado

---

## Procesar Devolución

### Qué Significa "Procesar"

Cuando una devolución está en estado **"Pendiente"**, significa que:

- La devolución fue creada
- El stock **NO ha sido reintegrado** aún

Al procesar la devolución:

1. El stock del producto aumenta
2. La devolución cambia a estado "Procesada"
3. Se registra como completada

### Cómo Procesar

1. En la lista de devoluciones, busca la devolución pendiente
2. Haz clic en el ícono **↻ (Procesar)**
3. Confirma la acción

```
┌─────────────────────────────────────────┐
│ ¿Confirmar esta devolución?            │
│ Se reintegrará el stock.                │
│                                         │
│        [Cancelar]    [Confirmar]       │
│                                         │
└─────────────────────────────────────────┘
```

> **Nota**: Solo los usuarios con permisos pueden procesar devoluciones.

---

## Ver Detalle

### Abrir Detalle

Haz clic en el ícono **👁 (Ver)** de cualquier devolución.

### Contenido del Detalle

```
┌─────────────────────────────────────────┐
│ Detalles de Devolución            [X]  │
├─────────────────────────────────────────┤
│                                         │
│ RET001                        Pendiente │
│ 15/01/2024 10:30                       │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Tipo:        Reembolso                  │
│ Venta orig:  #000123                   │
│ Ubicación:   Tienda Centro             │
│ Empleado:    Maria G.                   │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Productos:                             │
│ - Cafe Latte x1  C$45.00              │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Total:         C$45.00                 │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│              [Cerrar]                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Filtros

### Búsqueda

Busca por:
- Número de devolución
- Número de venta original

### Rango de Fechas

Usa los campos **Desde** y **Hasta** para限定 el período.

Por defecto se muestra el mes actual.

---

## Efectos de la Devolución

### En el Stock

Cuando se **procesa** una devolución:

- La cantidad devuelta se **suma** al stock del producto
- El stock se actualiza en la ubicación donde se hizo la venta

### En la Venta Original

- La venta original **no se modifica**
- Se crea un registro de devolución vinculado
- El historial mantiene trazabilidad completa

### En Reportes

Las devoluciones se reflejan en:
- Reportes de ventas netas
- Reportes de inventario
- Reportes de caja (devoluciones en efectivo)

---

## Permisos

### Quién Puede Crear Devoluciones

Depende de la configuración de roles y permisos.

### Quién Puede Procesar Devoluciones

Generalmente usuarios con rol de administrador o gerente.

---

## Ejemplos de Uso

### Ejemplo 1: Cliente Arrepentido

Un cliente compra un café pero cambia de opinión:

1. Buscar venta #000123
2. Seleccionar "Cafe Latte"
3. Tipo: **Reembolso**
4. Motivo: **No satisfecho**
5. Crear → Procesar
6. Cliente recibe C$45.00

### Ejemplo 2: Error en Pedido

Se vendió un sandwich en vez de una ensalada:

1. Buscar venta #000124
2. Seleccionar "Sandwich"
3. Tipo: **Cambio** (el sandwich defectuoso)
4. Motivo: **Error en pedido**
5. Crear → Procesar
6. Stock de sandwich aumenta

---

[Anterior: Gestión de Ventas](./04-SALES-MGMT.md) | [Siguiente: Clientes](./06-CUSTOMERS.md)
