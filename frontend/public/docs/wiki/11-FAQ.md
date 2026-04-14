# 11. Preguntas Frecuentes (FAQ)

## Índice

1. [General](#general)
2. [Ventas y POS](#ventas-y-pos)
3. [Caja](#caja)
4. [Clientes](#clientes)
5. [Inventario](#inventario)
6. [Reportes](#reportes)
7. [Errores Comunes](#errores-comunes)

---

## General

### ¿Cómo inicio sesión?

1. Abre el navegador e ingresa la URL del sistema
2. Ingresa tu **usuario** y **contraseña**
3. Si tienes acceso a varias ubicaciones, selecciona una
4. Haz clic en **"Continuar"**

### ¿Olvidé mi contraseña?

Contacta al administrador del sistema para que la restablesca.

### ¿Puedo cambiar mi contraseña?

Sí. Ve a tu perfil o configuración de usuario y busca la opción de cambiar contraseña.

### ¿El sistema funciona sin internet?

Sí, el POS tiene modo offline que permite realizar ventas cuando no hay conexión. Las ventas se sincronizan cuando se recupera la conexión.

---

## Ventas y POS

### ¿Cómo hago una venta?

1. Ve a **Ventas → Punto de Venta**
2. Selecciona una **categoría** o usa la **búsqueda**
3. Clic en el **producto** para agregarlo al carrito
4. (Opcional) Agrega un **cliente**
5. Haz clic en **"Cobrar"**
6. Selecciona el **método de pago**
7. Confirma la venta

### ¿Puedo vender sin cliente?

Sí. Si no seleccionas un cliente, se usará el **cliente por defecto** configurado en el sistema.

### ¿Cómo agrego un cliente?

1. En el POS, haz clic en **"+ Cliente"**
2. Escribe el nombre o teléfono
3. Selecciona el cliente de la lista

### ¿Qué hago si no encuentro un producto?

1. Verifica que estés en la **categoría correcta**
2. Usa la **búsqueda** por nombre o código
3. Verifica que el producto esté **activo**
4. Verifica que haya **stock** en la ubicación

### ¿Cómo doy descuento a un producto?

1. En el carrito, busca el campo de **descuento** del producto
2. Ingresa el monto de descuento
3. El descuento se aplica automáticamente

### ¿Qué es "Suspender" una venta?

Permite guardar una venta temporalmente para continuarla después. El carrito se vacía pero la venta queda registrada como "Suspendida".

### ¿Cómo recupero una venta suspendida?

1. Ve a **Ventas → Lista de Ventas**
2. Filtra por estado **"Suspendida"**
3. Abre la venta
4. Clic en **"Reanudar"**

### ¿Puedo reimprimir un ticket?

Sí. Ve a **Ventas → Lista de Ventas**, abre la venta y busca la opción de descargar/imprimir ticket.

### ¿Cómo hago una devolución?

1. Ve a **Ventas → Devoluciones**
2. Clic en **"+"** o **"Nueva Devolución"**
3. Busca la venta original por número
4. Selecciona los productos a devolver
5. Elige el **tipo** (Reembolso o Cambio)
6. Selecciona el **motivo**
7. Confirma

---

## Caja

### ¿Por qué no puedo vender?

Verifica que la **caja esté abierta**. El indicador en el POS debe mostrar "Abierta" (verde).

### ¿Cómo abro la caja?

1. Ve a **Cajero → Gestión de Caja**
2. Clic en **"Abrir Caja"**
3. Ingresa el **monto inicial**
4. Confirma

### ¿Qué es el monto inicial?

Es el dinero en efectivo que depositas en la caja al abrir. Sirve como base para calcular el efectivo esperado al cerrar.

### ¿Cómo cierro la caja?

1. Ve a **Cajero → Gestión de Caja**
2. Clic en **"Vista Previa"** para ver el resumen
3. Clic en **"Cerrar Caja"**
4. Ingresa el **dinero contado**
5. El sistema calcula si hay faltante o sobrante
6. Confirma

### ¿Qué hago si hay faltante?

1. El faltante se registra automáticamente
2. Un administrador debe **aprobarlo**
3. Si se aprueba, se crea una **Cuenta por Cobrar** al cajero
4. El cajero debe pagar la diferencia

### ¿Qué hago si hay sobrante?

1. El sobrante se registra automáticamente
2. Un administrador debe **revisarlo**
3. Si se aprueba, queda documentado para auditoría

### ¿Qué es un retiro?

Es una extracción de dinero de la caja durante el turno (depósitos bancarios, gastos, etc.).

### ¿Cómo registro un retiro?

1. En **Gestión de Caja**, clic en **"Registrar Retiro"**
2. Ingresa el monto
3. (Opcional) Agrega una descripción
4. Confirma

### ¿Puedo tener varios cierres en un día?

Sí. Cada vez que cierras y abres la caja, se crea un nuevo registro de cierre.

---

## Clientes

### ¿Cómo creo un cliente?

1. Ve a **Ventas → Clientes**
2. Clic en **"+ Nuevo Cliente"**
3. Completa los datos (nombre obligatorio)
4. Clic en **"Crear"**

### ¿Qué es el cliente por defecto?

Es el cliente que se usa automáticamente cuando no seleccionas uno en una venta. Configúralo al crear/editar un cliente marcando **"Cliente por defecto"**.

### ¿Puedo editar un cliente?

Sí. En la lista de clientes, clic en **"Editar"** en la tarjeta del cliente.

### ¿Puedo eliminar un cliente?

Sí, pero la eliminación es lógica (soft delete). El cliente desaparece de búsquedas pero permanece en el historial de ventas.

### ¿Cómo activo/desactivo un cliente?

Usa el **toggle** (switch) en la esquina de la tarjeta del cliente:
- Verde: Activo
- Gris: Inactivo

### ¿Qué son los grupos de clientes?

Permiten organizar clientes por categorías (ej: Retail, Corporativo, VIP). Se asignan al crear/editar el cliente.

---

## Inventario

### ¿Cómo agrego productos?

Ve a **Inventario → Productos** y crea nuevos productos con nombre, precio y categoría.

### ¿Qué es el stock?

Es la cantidad de unidades disponibles de un producto en una ubicación específica.

### ¿Cómo actualizo el stock?

El stock cambia automáticamente con:
- Ventas (disminuye)
- Devoluciones (aumenta)
- Recepciones de compra (aumenta)
- Transferencias entre ubicaciones

### ¿Qué son las categorías?

Permiten organizar productos jerárquicamente. Ej: Electrónica > Teléfonos > Smartphones.

### ¿Puedo tener el mismo producto en varias sucursales?

Sí. El sistema es multi-ubicación. Cada producto puede tener stock diferente en cada ubicación.

---

## Reportes

### ¿Qué reportes hay disponibles?

Hay 5 tipos de reportes:
- **Ventas**: Transacciones de venta
- **Inventario**: Movimientos de stock
- **Compras**: Órdenes y recepciones
- **Caja**: Transacciones de caja
- **Vencimientos**: Productos próximos a vencer

### ¿Cómo filtro un reporte?

Usa los filtros en la parte superior:
- **Ubicación**: Por sucursal
- **Usuario**: Por empleado
- **Estado**: Por tipo/estado
- **Fechas**: Rango de fechas

### ¿Cómo exporto un reporte?

Después de generar el reporte, busca el botón de exportar y selecciona el formato (PDF, Excel, CSV).

### ¿Cómo veo las ventas de un día específico?

1. Ve a **Reportes → Ventas**
2. Establece "Desde" y "Hasta" en la misma fecha
3. Verás todas las ventas de ese día

---

## Errores Comunes

### "La caja está cerrada"

Ve a **Cajero → Gestión de Caja** y abre la caja.

### "No hay productos"

Verifica:
- Que la categoría tenga productos
- Que los productos estén activos
- Que haya stock en la ubicación

### "Error al procesar venta"

Verifica:
- Tu conexión a internet
- Que la caja esté abierta
- Que haya suficiente stock

### "No se encontró la venta"

El número de venta puede estar errado o la venta fue cancelada.

### "Monto inválido"

Verifica que el monto ingresado sea correcto y mayor o igual al total.

---

## Glossary

| Término | Descripción |
|---------|-------------|
| **POS** | Point of Sale - Punto de Venta |
| **Stock** | Cantidad disponible de un producto |
| **SKU** | Código de producto |
| **Caja** | Gestión de dinero en efectivo |
| **Layaway** | Venta pendiente de pago |
| **Soft delete** | Eliminación lógica (no permanente) |

---

[Anterior: Reportes](./10-REPORTS.md)
