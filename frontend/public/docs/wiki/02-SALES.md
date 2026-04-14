# 02. Punto de Venta

## Índice

1. [Acceso al POS](#acceso-al-pos)
2. [Interfaz del POS](#interfaz-del-pos)
3. [Gestión de Productos](#gestión-de-productos)
4. [Carrito de Compras](#carrito-de-compras)
5. [Cliente](#cliente)
6. [Finalizar Venta](#finalizar-venta)
7. [Suspender Venta](#suspender-venta)
8. [Pantalla del Cliente](#pantalla-del-cliente)
9. [Modo Offline](#modo-offline)
10. [Indicadores de Estado](#indicadores-de-estado)

---

## Acceso al POS

### Ruta

**Ventas → Punto de Venta**

### Requisitos Previos

Antes de vender, verifica:

1. **Caja abierta**: El indicador debe mostrar "Abierta" (verde)
2. **Ubicación seleccionada**: Confirmar la sucursal correcta
3. **Conexión**: Indicador debe mostrar "Online"

### Selector de Ubicación

Si tienes acceso a múltiples sucursales:

1. Usa el desplegable en la barra superior
2. Selecciona la ubicación donde realizarás la venta
3. Los productos y stock cambiarán según la ubicación

---

## Interfaz del POS

### Layout Principal

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Ubicación ▾] │ [Caja: Abierta ●] │ [Online ●] │    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │ CATEGORÍAS                  │  │ CARRITO                             │  │
│  │                             │  │                                     │  │
│  │ [Bebidas      ]             │  │ Cafe Latte         x2    C$90.00   │  │
│  │ [Comidas      ]             │  │ Sandwich           x1    C$80.00   │  │
│  │ [Snacks       ]             │  │                                     │  │
│  │ [Postres      ]             │  │ ────────────────────────────────   │  │
│  │                             │  │ Subtotal:              C$170.00    │  │
│  │ ─────────────────────────── │  │ Descuento:             C$0.00      │  │
│  │                             │  │ ────────────────────────────────   │  │
│  │ PRODUCTOS                   │  │ TOTAL:                C$170.00     │  │
│  │                             │  │                                     │  │
│  │ [Cafe] [Latte] [Capuchino] │  │ ┌─────────────────────────────────┐ │  │
│  │ [Te]   [Jugos] [Refrescos] │  │ │  [Suspender]  [Cobrar C$170.00] │ │  │
│  │                             │  │ └─────────────────────────────────┘ │  │
│  └─────────────────────────────┘  └────────────────────────────────────┘  │
│                                                                            │
│  [Búsqueda: _______________ 🔍]                   │ [+ Cliente] [👁 TV]   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Elementos de la Barra Superior

| Elemento | Descripción |
|----------|-------------|
| Ubicación | Selector de sucursal |
| Caja | Estado de la caja (Abierta/Cerrada) - clic para ir a caja |
| Online/Offline | Estado de conexión |

---

## Gestión de Productos

### Vista por Categorías

1. Haz clic en una **categoría** del panel izquierdo
2. Se mostrarán los productos de esa categoría
3. Haz clic en un **producto** para agregarlo

### Navegación de Categorías

- **Raíz**: Muestra todas las categorías principales
- **Subcategorías**: Navega haciendo clic en las categorías
- **Volver**: Usa el botón "←" para retroceder

### Agregar Producto al Carrito

1. **Clic simple**: Agrega 1 unidad
2. **Productos con múltiples unidades**: Se abre modal para seleccionar unidad
3. **Productos variables**: Se abre modal para ingresar cantidad y precio

### Búsqueda de Productos

1. Escribe en el campo de búsqueda (mínimo 2 caracteres)
2. Busca por:
   - Nombre del producto
   - Código/SKU
3. Los resultados aparecen automáticamente
4. Clic en el producto para agregar

---

## Carrito de Compras

### Ver Carrito

El carrito muestra todos los productos agregados con:
- Nombre del producto
- Cantidad
- Precio unitario
- Total por línea

### Modificar Cantidad

| Acción | Método |
|--------|--------|
| Aumentar | Clic en botón `+` |
| Disminuir | Clic en botón `-` |
| Eliminar | Cantidad llega a 0 |

### Descuento por Producto

1. Clic en el campo de descuento del producto
2. Ingresa el monto de descuento
3. El descuento no puede exceder el total del producto

### Totales del Carrito

```
Subtotal:    C$170.00
Descuento:   -C$10.00
──────────────────────
TOTAL:       C$160.00
```

### Vaciar Carrito

Botón **"Limpiar"** para cancelar toda la venta.

---

## Cliente

### Agregar Cliente

1. Haz clic en **"+ Cliente"**
2. Escribe el nombre o teléfono
3. Selecciona el cliente de la lista
4. El cliente aparece en el carrito

### Cliente por Defecto

Si no agregas un cliente, se usa el cliente marcado como "por defecto" en el sistema.

### Quitar Cliente

1. Haz clic en el nombre del cliente seleccionado
2. Se abre el buscador
3. Cierra el buscador sin seleccionar

---

## Finalizar Venta

### Proceso de Cobro

1. Verifica los productos en el carrito
2. (Opcional) Agrega notas en el campo de notas
3. Haz clic en **"Cobrar"**

### Modal de Pago

```
┌─────────────────────────────────────────┐
│         Procesar Venta                  │
├─────────────────────────────────────────┤
│                                         │
│  Total:           C$160.00              │
│                                         │
│  Método de Pago: [Efectivo ▾]           │
│                                         │
│  Recibido:       C$200.00               │
│  ─────────────────────────────────────  │
│  Cambio:         C$40.00                │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Cancelar   │  │  Finalizar Venta │   │
│  └─────────────┘  └─────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Métodos de Pago

| Método | Descripción |
|--------|-------------|
| Efectivo | Pago en efectivo |
| Tarjeta | Pago con tarjeta |
| Mixto | Múltiples métodos (próximamente) |

### Confirmar Venta

1. Selecciona el método de pago
2. Ingresa el monto recibido
3. El sistema calcula el cambio automáticamente
4. Haz clic en **"Finalizar Venta"**

### Resultado

- **Éxito**: Notificación "Venta #XXXX procesada correctamente"
- **Offline**: Notificación "Venta guardada offline (#XXXX)"

---

## Suspender Venta

### Cuándo Usar

- Dejar una venta pendiente para continuarla después
- Cliente no tiene el dinero completo
- Necesitas atender a otro cliente primero

### Suspender

1. Agrega los productos al carrito
2. Haz clic en **"Suspender"**
3. La venta se guarda con estado "Suspendida"
4. El carrito se vacía

### Recuperar Venta

Para continuar una venta suspendida:

1. Ve a **Ventas → Lista de Ventas**
2. Filtra por estado "Suspendida"
3. Abre la venta suspendida
4. Completa el proceso de cobro

---

## Pantalla del Cliente

### Descripción

Muestra en tiempo real lo que se está vendiendo en un segundo monitor o TV.

### Abrir Pantalla

1. En el POS, haz clic en el ícono **👁 (TV)**
2. Se abre una nueva ventana del navegador
3. Mueve esa ventana al segundo monitor

### Contenido Mostrado

- Productos en el carrito
- Cliente seleccionado
- Subtotal, descuento y total
- Cambio (cuando se muestra)

### Sincronización

- Se actualiza automáticamente al:
  - Agregar producto
  - Modificar cantidad
  - Agregar/quitar cliente
  - Modificar descuentos

### Cerrar Pantalla

1. Clic en el ícono **👁 (TV)** nuevamente
2. O cierra la ventana del navegador

---

## Modo Offline

### Funcionamiento

El sistema puede funcionar sin conexión a internet:

1. **Detección automática**: Cuando se pierde la conexión
2. **Ventas guardadas**: Se almacenan localmente
3. **Sincronización**: Al reconectar, se suben automáticamente

### Indicador Offline

| Estado | Color | Significado |
|--------|-------|-------------|
| Verde | Online | Conexión normal |
| Azul | Sincronizando | Subiendo ventas pendientes |
| Amarillo | Offline | Sin conexión |

### Ventas Offline

Cuando estás offline:

- Las ventas se procesan localmente
- Se genera un número temporal
- Al reconectar, se sincronizan con el servidor

### Sincronización Manual

Si hay ventas pendientes al reconectar:

1. Clic en el indicador de estado
2. El sistema sincroniza automáticamente

---

## Indicadores de Estado

### Estado de Caja

| Estado | Color | Acción |
|--------|-------|--------|
| Abierta | Verde | Puedes vender |
| Cerrada | Rojo | Ve a caja para abrir |

### Estado de Conexión

| Estado | Color | Significado |
|--------|-------|-------------|
| Online | Verde | Todo funciona normalmente |
| Offline | Amarillo | Sin internet, ventas guardadas localmente |
| Sincronizando | Azul | Subiendo ventas pendientes |

### Notificaciones

El sistema muestra notificaciones para:

| Situación | Tipo |
|-----------|------|
| Venta procesada | Éxito (verde) |
| Error de conexión | Error (rojo) |
| Venta guardada offline | Éxito (azul) |
| Caja requerida | Advertencia (amarillo) |

---

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `F1` | Enfocar búsqueda de productos |
| `Esc` | Cerrar modal / Cancelar |

---

## Resolución de Problemas

### No puedo cobrar

1. **Verificar caja**: Clic en el indicador de caja
2. **Abrir caja**: Si está cerrada, ve a Gestión de Caja

### No aparecen productos

1. **Verificar ubicación**: Asegúrate de estar en la sucursal correcta
2. **Verificar categorías**: Revisa que las categorías tengan productos
3. **Verificar stock**: El producto debe tener stock disponible

### Error al procesar

1. Revisa tu conexión a internet
2. Verifica que la caja esté abierta
3. Contacta al administrador si persiste

---

[Anterior: Introducción](./01-INTRO.md) | [Siguiente: Manejo de Caja](./03-CASH.md)
