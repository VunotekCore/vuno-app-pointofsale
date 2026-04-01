# Módulo de Ventas - Documentación para Desarrolladores

## Índice
1. [Arquitectura del POS](#arquitectura-del-pos)
2. [Customer Display con WebSocket](#customer-display-con-websocket)
3. [Cierre de Caja](#cierre-de-caja)
4. [Estructura de Base de Datos](#estructura-de-base-de-datos-de-ventas)
5. [API Endpoints de Ventas](#api-endpoints-de-ventas)
6. [Faltantes y Sobrantes](#faltantes-y-sobrantes)
7. [Cuentas por Cobrar](#cuentas-por-cobrar)
8. [Modo Offline - Sistema de Ventas Sin Conexión](#modo-offline---sistema-de-ventas-sin-conexión)

---

## Arquitectura del POS

### Flujo de una Venta

```
1. Usuario selecciona ubicación
2. Busca/agrega productos al carrito
3. (Opcional) Selecciona cliente
4. (Opcional) Aplica descuentos
5. Abre modal de pago
6. Procesa pago
7. Sistema:
   - Crea registro en sales
   - Crea registros en sale_items
   - Crea registros en payments
   - Descuenta stock
   - Genera ticket (opcional)
```

### Archivos del Módulo

```
frontend/src/pages/sales/
├── PosPage.vue              # Punto de Venta (carrito, cobro)
├── SalesPage.vue            # Lista de ventas
├── CustomerDisplay.vue      # Pantalla del cliente (segundo monitor)
├── ReturnsPage.vue          # Devoluciones
└── CustomersPage.vue        # Gestión de clientes

frontend/src/services/
└── sales.service.js         # API de ventas

backend/src/controllers/
├── sales.controller.js      # Lógica de ventas
├── payment.controller.js    # Lógica de pagos
└── customers.controller.js  # Lógica de clientes

backend/src/models/
├── sales.model.js           # Modelo de ventas
├── payment.model.js         # Modelo de pagos
└── customers.model.js       # Modelo de clientes

backend/src/repository/
├── sales.repository.js      # Consultas de ventas
├── payment.repository.js    # Consultas de pagos
└── customers.repository.js  # Consultas de clientes
```

---

## Customer Display con WebSocket

El Customer Display es una pantalla que muestra al cliente los productos, precios y totales en tiempo real desde el POS.

### Tecnologías

- **Socket.io**: Comunicación WebSocket en tiempo real
- **Puerto**: 1405 (mismo que la API REST)

### Estructura de Archivos

```
backend/src/
├── socket/
│   └── index.js            # Servidor Socket.io

frontend/src/
├── stores/
│   └── socket.store.js      # Store Pinia para WebSocket
└── pages/sales/
    └── CustomerDisplay.vue   # Página standalone sin layout
```

### Servidor Socket.io (Backend)

```javascript
// backend/src/socket/index.js
import { Server } from 'socket.io'

let io = null

export function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    socket.on('join-pos', () => {
      socket.join('pos-room')
    })

    socket.on('sale-update', (data) => {
      io.to('pos-room').emit('sale-updated', data)
    })

    socket.on('disconnect', () => {})
  })

  return io
}
```

### Store WebSocket (Frontend)

```javascript
// frontend/src/stores/socket.store.js
import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:1405'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    isConnected: false,
    isEmitter: false,
    cartItems: [],
    customer: null,
    subtotal: 0,
    discount: 0,
    total: 0
  }),

  actions: {
    connect(asEmitter = false) {
      if (this.socket && this.isConnected) return

      this.isEmitter = asEmitter
      this.socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })

      this.socket.on('connect', () => {
        this.isConnected = true
        this.socket.emit('join-pos')
      })

      this.socket.on('sale-updated', (data) => {
        if (!this.isEmitter) {
          this.cartItems = data.items || []
          this.customer = data.customer
          this.subtotal = data.subtotal || 0
          this.discount = data.discount || 0
          this.total = data.total || 0
        }
      })
    },

    emitSaleUpdate(data) {
      if (this.socket && this.isConnected) {
        this.socket.emit('sale-update', data)
      }
    }
  }
})
```

### Integración en PosPage.vue

```javascript
// Activar pantalla del cliente
function openCustomerDisplay() {
  customerDisplayOpen.value = true
  socketStore.connect(true) // true = es emisor
  
  // Esperar conexión antes de emitir
  const checkAndEmit = () => {
    if (socketStore.isConnected) {
      socketStore.emitSaleUpdate({ /* datos del carrito */ })
    } else {
      setTimeout(checkAndEmit, 100)
    }
  }
  checkAndEmit()
  
  window.open('/display', '_blank', 'width=1024,height=768')
}

// Sincronización en tiempo real
watch([cartItems, selectedCustomer, subtotal, totalDiscount, total], () => {
  if (customerDisplayOpen.value && socketStore.isConnected) {
    socketStore.emitSaleUpdate({
      items: cartItems.value,
      customer: selectedCustomer.value,
      subtotal: subtotal.value,
      discount: totalDiscount.value,
      total: total.value
    })
  }
})
```

### Ruta sin Layout

La página `/display` es una ruta pública standalone sin MainLayout:

```javascript
// frontend/src/router/index.js
{
  path: '/display',
  name: 'CustomerDisplay',
  component: () => import('../pages/sales/CustomerDisplay.vue'),
  meta: { public: true }
}
```

### Eventos Socket

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `join-pos` | Client → Server | Cliente se une al room pos-room |
| `sale-update` | Client (POS) → Server | POS envía datos del carrito |
| `sale-updated` | Server → Client (Display) | Display recibe datos actualizados |

### Datos del Carrito

```javascript
{
  items: [
    {
      item_id: 1,
      item_name: "Producto X",
      item_number: "SKU-001",
      quantity: 2,
      unit_price: 1000,
      discount_amount: 0,
      line_total: 2000
    }
  ],
  customer: {
    id: 1,
    first_name: "Juan",
    last_name: "Pérez",
    email: "juan@email.com"
  },
  subtotal: 2000,
  discount: 0,
  total: 2000
}
```

---

## Estructura de Base de Datos de Ventas

```sql
-- Ventas
CREATE TABLE sales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status ENUM('pending','completed','suspended','returned','cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Items de venta
CREATE TABLE sale_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    variation_id BIGINT UNSIGNED,
    quantity DECIMAL(15,4) NOT NULL,
    unit_price DECIMAL(15,4) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    line_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Pagos
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT UNSIGNED NOT NULL,
    payment_type ENUM('cash','credit','debit','check','other') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Clientes
CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    is_default TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

---

## API Endpoints de Ventas

### Sales (Ventas)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sales` | Listar ventas |
| GET | `/sales/:id` | Ver venta con items y pagos |
| POST | `/sales` | Crear venta (borrador) |
| PUT | `/sales/:id` | Actualizar venta |
| POST | `/sales/:id/complete` | Completar venta |
| POST | `/sales/:id/suspend` | Suspender venta |
| POST | `/sales/:id/cancel` | Cancelar venta |

### Payments (Pagos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sales/:saleId/payments` | Listar pagos de una venta |
| POST | `/sales/:saleId/payments` | Agregar pago a venta |

### Customers (Clientes)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/customers` | Listar clientes |
| GET | `/customers/:id` | Ver cliente |
| POST | `/customers` | Crear cliente |
| PUT | `/customers/:id` | Actualizar cliente |
| DELETE | `/customers/:id` | Eliminar cliente (soft delete) |
| GET | `/customers/search?q=texto` | Buscar clientes |

---

## Cierre de Caja

El módulo de cierre de caja permite controlar el dinero en efectivo al inicio y fin de cada turno.

### Flujo

```
1. ABRIR CAJA (inicio del turno)
   - Usuario ingresa monto inicial
   - Se crea registro en cash_drawers (status: 'open')
   - Se registra transacción de tipo 'opening'

2. VENDER (durante el turno)
   - Cada pago en efectivo se registra en sale_payments
   - drawer_transactions registra sale_payment

3. CERRAR CAJA (fin del turno)
   - Sistema calcula: initial_amount + cash_sales - withdrawals
   - Usuario ingresa monto contado
   - Se calcula diferencia (sobrante/faltante)
   - Se cierra caja (status: 'closed')
```

### Archivos

```
frontend/src/
├── pages/sales/
│   └── CashDrawerPage.vue      # UI de caja
├── stores/
│   └── cash-drawer.store.js    # Store Pinia
└── services/
    └── payment.service.js      # API de pagos

backend/src/
├── repository/
│   └── payment.repository.js   # Métodos de caja
├── models/
│   └── payment.model.js        # Lógica de caja
├── controllers/
│   └── payment.controller.js   # Endpoints
└── router/
    └── payment.router.js       # Rutas /payments
```

### API Endpoints de Caja

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/payments/drawers/open` | Verificar si hay caja abierta |
| POST | `/payments/drawers` | Abrir caja |
| POST | `/payments/drawers/:id/close` | Cerrar caja |
| GET | `/payments/drawers/:id/cash-summary` | Resumen de efectivo |
| GET | `/payments/history` | Historial de cierres |

### Cálculo de Monto Esperado

```javascript
expected_cash = initial_amount + total_cash_sales - total_withdrawals
```

### Diferencia al Cerrar

```javascript
difference = actual_cash - expected_cash
```

- **Positivo**: Sobrante (verde)
- **Negativo**: Faltante (rojo)
- **Cero**: Cuadre perfecto

---

## Faltantes y Sobrantes

El sistema gestiona las diferencias de dinero al cerrar caja mediante la tabla `drawer_adjustments`.

### Tabla drawer_adjustments

```sql
CREATE TABLE drawer_adjustments (
  id BINARY(16) PRIMARY KEY,
  drawer_id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  adjustment_type ENUM('overage', 'shortage') NOT NULL,
  amount DECIMAL(15,4) NOT NULL,
  notes TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (drawer_id) REFERENCES cash_drawers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Flujo

```
1. CIERRE DE CAJA con diferencia
   → Se crea automáticamente drawer_adjustments (status: pending)

2. ADMIN revisa
   → Aprueba o rechaza

3. Si es FALTANTE aprobado
   → Se crea cuenta por cobrar al cajero

4. Si es SOBRANTE aprobado
   → Solo cambia estado (queda documentado)
```

### Tipos de Ajuste

| Tipo | Descripción |
|------|-------------|
| `overage` | Sobrante (dinero de más) |
| `shortage` | Faltante (dinero faltante) |

### Estados

| Estado | Descripción |
|--------|-------------|
| `pending` | Pendiente de revisión |
| `approved` | Aprobado |
| `rejected` | Rechazado |

---

## Cuentas por Cobrar

Gestiona las deudas de empleados por faltantes de caja.

### Tabla accounts_receivable

```sql
CREATE TABLE accounts_receivable (
  id BINARY(16) PRIMARY KEY,
  user_id BINARY(16) NOT NULL,
  adjustment_id BINARY(16) NOT NULL,
  amount DECIMAL(15,4) NOT NULL,
  paid_amount DECIMAL(15,4) DEFAULT 0,
  status ENUM('pending', 'partial', 'paid', 'forgiven') DEFAULT 'pending',
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (adjustment_id) REFERENCES drawer_adjustments(id)
);
```

### Estados

| Estado | Descripción |
|--------|-------------|
| `pending` | Deuda sin pagos |
| `partial` | Pago parcial realizado |
| `paid` | Deuda liquidada |
| `forgiven` | Deuda perdonada |

### API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/payments/accounts-receivable` | Listar cuentas (con filtros) |
| POST | `/payments/accounts-receivable/:id/payment` | Registrar pago |
| GET | `/payments/cashiers` | Listar cajeros |
| GET | `/payments/adjustments/:id/status` | Actualizar estado |

### Cálculo Automático

- **Al aprobar faltante**: Se crea automáticamente la cuenta por cobrar
- **Al registrar pago**: Se actualiza paid_amount y status
- **Status automático**: pending → partial → paid

---

## Módulo de Inventario - Documentación para Desarrolladores

## Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [API Endpoints](#api-endpoints)
4. [Patrones de Código](#patrones-de-código)
5. [Flujo de Datos](#flujo-de-datos)

---

## Arquitectura del Sistema

### Visión General

El módulo de inventario sigue una arquitectura de tres capas:

```
┌─────────────────────────────────────────────┐
│              FRONTEND (Vue 3)               │
│  - Pages: Items, Stock, Suppliers, etc.    │
│  - Services: inventory.service.js           │
└──────────────────────┬──────────────────────┘
                       │ HTTP API
┌──────────────────────▼──────────────────────┐
│            BACKEND (Express.js)              │
│  - Controllers: items, inventory             │
│  - Repositories: items, inventory            │
└──────────────────────┬──────────────────────┘
                       │ SQL Queries
┌──────────────────────▼──────────────────────┐
│              MYSQL DATABASE                  │
│  - Tables: items, locations, categories...  │
└─────────────────────────────────────────────┘
```

### Directorios

```
backend/src/
├── controllers/
│   ├── items.controller.js        # Lógica de productos
│   ├── inventory.controller.js   # Lógica de stock y movimientos
│   ├── adjustment.controller.js  # Lógica de ajustes de inventario
│   └── transfer.controller.js   # Lógica de transferencias
├── repository/
│   ├── items.repository.js       # Consultas de productos
│   ├── inventory.repository.js   # Consultas de inventario
│   ├── adjustment.repository.js  # Consultas de ajustes
│   └── transfer.repository.js    # Consultas de transferencias
├── models/
│   ├── items.model.js            # Modelo de productos
│   ├── inventory.model.js       # Modelo de inventario
│   ├── adjustment.model.js      # Modelo de ajustes
│   └── transfer.model.js        # Modelo de transferencias
├── router/
│   ├── items.router.js           # Rutas /items
│   ├── inventory.router.js       # Rutas /inventory
│   └── core.router.js           # Rutas /core (locations, categories, suppliers)
└── middleware/
    └── auth.middleware.js        # Autenticación

frontend/src/
├── pages/inventory/
│   ├── ItemsPage.vue            # Gestión de productos
│   ├── StockPage.vue            # Control de stock
│   ├── SuppliersPage.vue        # Gestión de proveedores
│   ├── LocationsPage.vue        # Gestión de ubicaciones
│   ├── CategoriesPage.vue       # Gestión de categorías
│   ├── AdjustmentsPage.vue      # Gestión de ajustes
│   └── TransfersPage.vue        # Gestión de transferencias
├── services/
│   └── inventory.service.js     # API de inventario
└── stores/
    └── ...
```
└── services/
    └── inventory.service.js     # Cliente API
```

---

## Estructura de Base de Datos

### Tablas del Módulo Core (Deben existir primero)

```sql
-- Ubicaciones (sucursales/almacenes)
CREATE TABLE locations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(255),
    is_warehouse TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    timezone VARCHAR(50) DEFAULT 'America/Santiago',
    default_tax_rate DECIMAL(5,2) DEFAULT 0.00,
    custom_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_at TIMESTAMP
);

-- Categorías (jerárquicas)
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT UNSIGNED NULL,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_at TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

### Tablas del Módulo Inventory

```sql
-- Proveedores
CREATE TABLE suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    is_active TINYINT(1) DEFAULT 1,
    custom_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_at TIMESTAMP
);

-- Productos (Item padre)
CREATE TABLE items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_number VARCHAR(255) UNIQUE NOT NULL,  -- SKU interno
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id BIGINT UNSIGNED,
    supplier_id BIGINT UNSIGNED,
    cost_price DECIMAL(15,4) DEFAULT 0.0000,
    unit_price DECIMAL(15,4) DEFAULT 0.0000,
    reorder_level INT UNSIGNED DEFAULT 0,
    reorder_quantity INT UNSIGNED DEFAULT 0,
    is_serialized TINYINT(1) DEFAULT 0,  -- Requiere serie
    is_service TINYINT(1) DEFAULT 0,
    is_kit TINYINT(1) DEFAULT 0,
    image_url VARCHAR(512),
    custom_fields JSON,
    status ENUM('active','inactive','discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_at TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Variaciones (tallas, colores, atributos)
CREATE TABLE item_variations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(255) UNIQUE NOT NULL,
    unit_price DECIMAL(15,4) NOT NULL,
    cost_price DECIMAL(15,4) NOT NULL,
    attributes JSON NOT NULL,  -- {"color": "Rojo", "talla": "M"}
    image_url VARCHAR(512),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_at TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Stock por ubicación
CREATE TABLE item_quantities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT UNSIGNED NOT NULL,
    variation_id BIGINT UNSIGNED NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(15,4) DEFAULT 0,
    quantity_reserved DECIMAL(15,4) DEFAULT 0,
    quantity_in_transit DECIMAL(15,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (variation_id) REFERENCES item_variations(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE KEY uq_stock (item_id, variation_id, location_id)
);

-- Números de serie
CREATE TABLE item_serials (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT UNSIGNED NOT NULL,
    variation_id BIGINT UNSIGNED NULL,
    serial_number VARCHAR(255) NOT NULL,
    cost_price DECIMAL(15,4) NOT NULL,
    sold_at TIMESTAMP NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    status ENUM('available','sold','reserved','in_transit','returned','damaged') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_at TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (variation_id) REFERENCES item_variations(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE KEY uq_serial (serial_number, item_id)
);

-- Componentes de Kits (productos compuestos)
CREATE TABLE kit_components (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kit_item_id BIGINT UNSIGNED NOT NULL,
    component_item_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kit_item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (component_item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE KEY uq_kit_component (kit_item_id, component_item_id)
);
```

### Tablas de Movimientos

```sql
-- Órdenes de compra
CREATE TABLE purchase_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    status ENUM('draft','sent','partial','received','cancelled') DEFAULT 'draft',
    expected_date DATE,
    notes TEXT,
    total_amount DECIMAL(15,2) DEFAULT 0,
    received_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_at TIMESTAMP
);

-- Recepciones
CREATE TABLE receivings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receiving_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_order_id BIGINT UNSIGNED,
    supplier_id BIGINT UNSIGNED,
    location_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending','completed','cancelled') DEFAULT 'pending',
    receiving_type ENUM('purchase_order','direct') DEFAULT 'purchase_order',
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Transferencias entre ubicaciones
CREATE TABLE IF NOT EXISTS `transfers` (
    `id` CHAR(36) PRIMARY KEY,
    `transfer_number` VARCHAR(50) UNIQUE NOT NULL,
    `from_location_id` CHAR(36) NOT NULL,
    `to_location_id` CHAR(36) NOT NULL,
    `status` ENUM('pending','in_transit','received','cancelled','rejected') DEFAULT 'pending',
    `requires_approval` TINYINT(1) DEFAULT 0,
    `approved_by` CHAR(36) NULL,
    `approved_at` TIMESTAMP NULL,
    `notes` TEXT NULL,
    `total_items` INT UNSIGNED DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`from_location_id`) REFERENCES `locations`(`id`),
    FOREIGN KEY (`to_location_id`) REFERENCES `locations`(`id`),
    INDEX `idx_transfer_status` (`status`),
    INDEX `idx_transfer_from` (`from_location_id`),
    INDEX `idx_transfer_to` (`to_location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Transferencias entre ubicaciones';

-- Items de transferencia
CREATE TABLE IF NOT EXISTS `transfer_items` (
    `id` CHAR(36) PRIMARY KEY,
    `transfer_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `variation_id` CHAR(36) NULL,
    `quantity` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `quantity_received` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('pending','in_transit','received','rejected') DEFAULT 'pending',
    `reject_reason` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`transfer_id`) REFERENCES `transfers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    INDEX `idx_ti_transfer` (`transfer_id`),
    INDEX `idx_ti_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Detalles de transferencia';

-- Ajustes de inventario
CREATE TABLE inventory_adjustments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    adjustment_type ENUM('count','damage','theft','correction','loss','found') NOT NULL,
    status ENUM('draft','pending','completed','cancelled') DEFAULT 'draft',
    notes TEXT,
    total_items INT UNSIGNED DEFAULT 0,
    total_quantity_change DECIMAL(15,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Historial de movimientos (AUDITORÍA)
CREATE TABLE inventory_movements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT UNSIGNED NOT NULL,
    variation_id BIGINT UNSIGNED NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    quantity_change DECIMAL(15,4) NOT NULL,
    quantity_before DECIMAL(15,4) DEFAULT 0,
    quantity_after DECIMAL(15,4) DEFAULT 0,
    movement_type ENUM('purchase','receiving','sale','return','transfer_in','transfer_out',
                      'adjustment','count','reservation','reservation_release',
                      'damaged','lost','found') NOT NULL,
    reference_type VARCHAR(100),
    reference_id BIGINT UNSIGNED,
    unit_cost DECIMAL(15,4) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    serial_numbers JSON,
    user_id BIGINT UNSIGNED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
```

---

## API Endpoints

### Items (Productos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/items` | Listar todos los productos |
| GET | `/items/:id` | Obtener producto con variaciones y stock |
| POST | `/items` | Crear nuevo producto |
| PUT | `/items/:id` | Actualizar producto |
| DELETE | `/items/:id` | Eliminar producto (soft delete) |

**Ejemplo de respuesta GET /items/:id:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "item_number": "ITE-000001",
    "name": "Camiseta Basic",
    "category_id": 1,
    "category_name": "Ropa",
    "cost_price": 5000,
    "unit_price": 9990,
    "is_serialized": 0,
    "variations": [
      { "id": 1, "sku": "CAM-BLK-M", "attributes": {"color": "Negro", "talla": "M"} }
    ],
    "stock": [
      { "location_id": 1, "location_name": "Tienda Central", "quantity": 50 }
    ]
  }
}
```

### Inventory (Inventario)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/inventory/stock` | Listar stock (con filtros) |
| GET | `/inventory/movements` | Historial de movimientos |
| GET | `/inventory/serials` | Listar números de serie |
| GET | `/inventory/low-stock` | Productos bajo nivel de reorder |

#### Ajustes de Inventario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/inventory/adjustments` | Listar ajustes |
| GET | `/inventory/adjustments/:id` | Ver ajuste con items |
| POST | `/inventory/adjustments` | Crear ajuste |
| POST | `/inventory/adjustments/:id/items` | Agregar item al ajuste |
| DELETE | `/inventory/adjustments/:id/items/:itemId` | Eliminar item |
| POST | `/inventory/adjustments/:id/confirm` | Confirmar ajuste |
| POST | `/inventory/adjustments/:id/cancel` | Cancelar ajuste |

#### Transferencias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/inventory/transfers` | Listar transferencias |
| GET | `/inventory/transfers/:id` | Ver transferencia con items |
| POST | `/inventory/transfers` | Crear transferencia |
| POST | `/inventory/transfers/:id/items` | Agregar item |
| DELETE | `/inventory/transfers/:id/items/:itemId` | Eliminar item |
| POST | `/inventory/transfers/:id/ship` | Enviar transferencia |
| POST | `/inventory/transfers/:id/receive` | Recibir transferencia |
| POST | `/inventory/transfers/:id/cancel` | Cancelar transferencia |

**Body POST /inventory/transfers:**
```json
{
  "from_location_id": "uuid-origen",
  "to_location_id": "uuid-destino",
  "notes": "Notas opcionales"
}
```

### Core (Ubicaciones, Categorías, Proveedores)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/core/locations` | Listar ubicaciones |
| POST | `/core/locations` | Crear ubicación |
| PUT | `/core/locations/:id` | Actualizar ubicación |
| DELETE | `/core/locations/:id` | Eliminar ubicación |
| GET | `/core/categories` | Listar categorías |
| POST | `/core/categories` | Crear categoría |
| GET | `/core/suppliers` | Listar proveedores |
| POST | `/core/suppliers` | Crear proveedor |
| GET | `/core/item_variations` | Listar variaciones |

---

## Patrones de Código

### Repository Pattern

Los repositorios contienen todas las consultas SQL:

```javascript
// backend/src/repository/items.repository.js
export class ItemsRepository {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        i.*,
        c.name as category_name,
        s.name as supplier_name,
        (SELECT SUM(quantity) FROM item_quantities WHERE item_id = i.id) as total_quantity
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.deleted_at IS NULL
      ORDER BY i.id DESC
    `)
    return rows
  }

  static async create(data) {
    const { item_number, name, cost_price, ... } = data
    const [result] = await pool.query(`
      INSERT INTO items (item_number, name, cost_price, ...)
      VALUES (?, ?, ?, ...)
    `, [item_number, name, cost_price, ...])
    return result.insertId
  }
}
```

### Controller Pattern

Los controladores llaman a los repositorios y formatean respuestas:

```javascript
// backend/src/controllers/items.controller.js
export class ItemsController {
  static async getAll(req, res) {
    try {
      const items = await ItemsRepository.getAll()
      res.status(200).json({ success: true, data: items, total: items.length })
    } catch (error) {
      console.error('Get items error:', error)
      res.status(400).json({ success: false, message: error.message })
    }
  }
}
```

### Transacciones para Stock que modifican stock

Para operaciones, usar transacciones:

```javascript
static async updateStock(itemId, variationId, locationId, quantity, createdBy) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Obtener stock actual
    const [current] = await connection.query(
      `SELECT quantity FROM item_quantities WHERE item_id = ? AND variation_id IS ? AND location_id = ?`,
      [itemId, variationId || null, locationId]
    )

    const quantityBefore = current.length > 0 ? current[0].quantity : 0
    const quantityAfter = quantityBefore + parseFloat(quantity)

    // 2. Actualizar o insertar
    if (current.length > 0) {
      await connection.query(
        `UPDATE item_quantities SET quantity = ? WHERE item_id = ? AND variation_id IS ? AND location_id = ?`,
        [quantityAfter, itemId, variationId || null, locationId]
      )
    } else {
      await connection.query(
        `INSERT INTO item_quantities (item_id, variation_id, location_id, quantity) VALUES (?, ?, ?, ?)`,
        [itemId, variationId || null, locationId, quantityAfter]
      )
    }

    // 3. Registrar movimiento
    await connection.query(
      `INSERT INTO inventory_movements (item_id, quantity_change, ...) VALUES (?, ?, ...)`,
      [itemId, quantity, ...]
    )

    await connection.commit()
    return { quantityBefore, quantityAfter }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
```

---

## Flujo de Datos

### Crear Producto

```
1. Usuario completa formulario en ItemsPage.vue
2. itemsService.createItem(data) → POST /items
3. ItemsController.create() valida datos
4. ItemsRepository.create() inserta en DB
5. Respuesta exitosa → Actualizar lista
```

### Ajustar Stock

```
1. Usuario selecciona producto, ubicación y cantidad
2. inventoryService.adjustStock(data) → POST /inventory/adjust
3. InventoryController.adjustStock():
   a. Valida que exista el producto
   b. Llama InventoryRepository.updateStock() con transacción
   c. Actualiza item_quantities
   d. Crea registro en inventory_movements (auditoría)
4. Respuesta → Refrescar tabla de stock
```

### Transferencia entre Ubicaciones

```
1. Usuario crea transferencia (from → to)
2. Se crea registro en inventory_transfers
3. Se reservan items en location origen (quantity_in_transit)
4. Al recibir:
   a. Se descuenta de origen
   b. Se agrega a destino
   c. Se crea movimiento transfer_in/transfer_out
   d. Se actualiza status
```

---

## Reglas de Negocio Importantes

1. **Soft Deletes**: Todos los registros se eliminan lógicamente (`deleted_at`)
2. **Multi-ubicación**: El stock se maneja por `location_id`
3. **Auditoría**: Todo cambio de stock genera registro en `inventory_movements`
4. **Seriales**: Productos serializados requieren registro en `item_serials`
5. **Reorder**: Sistema alerta cuando `quantity <= reorder_level`

---

## Testing

```bash
# Backend
cd backend
pnpm dev

# Frontend  
cd frontend
pnpm dev
```

### Datos de prueba

```sql
-- Insertar ubicación
INSERT INTO locations (name, code, is_warehouse) VALUES 
('Tienda Central', 'CEN', 0),
('Almacén Principal', 'ALM01', 1);

-- Insertar categoría
INSERT INTO categories (name) VALUES 
('Electrónica'),
('Ropa'),
('Accesorios');

-- Insertar proveedor
INSERT INTO suppliers (name, contact_name, email) VALUES 
('Proveedor Test', 'Juan Pérez', 'juan@test.com');

-- Insertar producto
INSERT INTO items (item_number, name, category_id, cost_price, unit_price, reorder_level) 
VALUES ('ITE-000001', 'Producto Test', 1, 1000, 1990, 10);

-- Insertar stock
INSERT INTO item_quantities (item_id, location_id, quantity) VALUES (1, 1, 100);
```

---

## Sistema de Permisos Dinámico

El sistema de permisos utiliza una arquitectura dinámica donde la fuente de verdad es el archivo de configuración `menu.config.js`.

### Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    FUENTE DE VERDAD                      │
│         frontend/src/config/menu.config.js              │
│         backend/src/config/menu.config.js               │
│                                                          │
│  Define: secciones, páginas, permisos, iconos            │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Permissions    │ │   RolesPage     │ │  MainLayout     │
│  Page.vue       │ │   (editar rol)  │ │  (menú)         │
│                 │ │                 │ │                 │
│ Muestra la      │ │ Lista permisos   │ │ Genera el menú  │
│ estructura del  │ │ por sección     │ │ según permisos   │
│ menú            │ │                 │ │ del usuario      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Estructura del Archivo de Configuración

```javascript
// frontend/src/config/menu.config.js

export const MENU_SECTIONS = [
  { key: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', color: '...' },
  { key: 'inventory', name: 'Inventario', icon: 'Package', color: '...' },
  { key: 'purchases', name: 'Compras', icon: 'Truck', color: '...' },
  { key: 'sales', name: 'Ventas', icon: 'ShoppingCart', color: '...' },
  { key: 'cashier', name: 'Cajero', icon: 'Wallet', color: '...' },
  { key: 'settings', name: 'Configuración', icon: 'Settings', color: '...' }
]

export const MENU_ITEMS = [
  { key: 'dashboard', name: 'Dashboard', path: '/', icon: 'LayoutDashboard', section: 'dashboard', permission: 'menu.dashboard' },
  { key: 'stock', name: 'Stock', path: '/stock', icon: 'Warehouse', section: 'inventory', permission: 'menu.stock' },
  { key: 'products', name: 'Productos', path: '/productos', icon: 'Package', section: 'inventory', permission: 'menu.products' },
  // ... más items
]
```

### Agregar Nueva Página al Menú

Para agregar una nueva página al menú, seguir estos pasos:

#### 1. Crear el archivo de la página

```bash
# Ubicación según el módulo
frontend/src/pages/{modulo}/MiPaginaPage.vue
```

#### 2. Agregar al Router

```javascript
// frontend/src/router/index.js
{
  path: 'mi-pagina',
  name: 'Mi Página',
  component: () => import('../pages/{modulo}/MiPaginaPage.vue'),
  meta: { permission: 'menu.mi_pagina' }
}
```

#### 3. Agregar al Menú (MainLayout.vue)

```javascript
// frontend/src/layouts/MainLayout.vue
const miSeccionItems = [
  // ... otros items existentes
  { name: 'Mi Página', path: '/mi-pagina', icon: MiIcono, permission: 'menu.mi_pagina' }
]
```

#### 4. Agregar al Archivo de Configuración (AMBOS)

```javascript
// frontend/src/config/menu.config.js
export const MENU_ITEMS = [
  // ... items existentes
  { 
    key: 'mi_pagina', 
    name: 'Mi Página', 
    path: '/mi-pagina', 
    icon: 'MiIcono',  // nombre del icono en lucide-vue-next
    section: 'mi_seccion',  // sección existente o nueva
    permission: 'menu.mi_pagina' 
  }
]

// Si es nueva sección, agregar en MENU_SECTIONS:
export const MENU_SECTIONS = [
  // ... secciones existentes
  { key: 'mi_seccion', name: 'Mi Sección', icon: 'MiIcono', color: '...' }
]
```

```javascript
// backend/src/config/menu.config.js
// Misma estructura que frontend, sin iconos
export const MENU_ITEMS = [
  // ... items existentes
  { 
    key: 'mi_pagina', 
    name: 'Mi Página', 
    path: '/mi-pagina', 
    icon: 'MiIcono', 
    section: 'mi_seccion', 
    permission: 'menu.mi_pagina' 
  }
]
```

### Permisos de Tabla vs Permisos de Menú

| Tipo | Descripción | Uso |
|------|-------------|-----|
| **Permisos de Menú** | Controlan qué páginas puede ver un usuario | `menu.stock`, `menu.products`, etc. |
| **Permisos de Tabla (CRUD)** | Controlan operaciones en la base de datos | `items.read`, `items.create`, etc. |

### API Endpoints de Permisos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/permissions/menu` | Lista todos los permisos de menú |
| GET | `/permissions/grouped` | Lista permisos de tabla agrupados por tabla |
| POST | `/permissions/sync-menu` | Sincroniza permisos de menú desde config → BD |
| POST | `/permissions/sync` | Sincroniza permisos de tabla (escanea tablas) |
| POST | `/permissions/clean-orphan` | Elimina permisos huérfanos |

### Sincronizar Permisos a Base de Datos

El botón "Sincronizar" en la página de Permisos crea los permisos en la BD. Solo es necesario la primera vez o si se agregan nuevas páginas.

```bash
# Endpoint para sincronizar permisos de menú
POST /permissions/sync-menu
```

### Asignar Permisos a Roles

1. Ir a **Configuración → Roles**
2. Editar el rol deseado
3. Marcar los permisos de menú deseados
4. (Opcional) Marcar permisos de tabla (CRUD)
5. Guardar

### Verificar Funcionamiento

1. Crear/editar rol y asignar nuevos permisos
2. Asignar rol a usuario
3. Recargar aplicación
4. Verificar que el menú muestre/oculte según permisos

### Permisos Actuales del Sistema

| Sección | Permiso | Página |
|---------|---------|--------|
| Dashboard | `menu.dashboard` | Dashboard |
| Inventario | `menu.stock` | Stock |
| | `menu.products` | Productos |
| | `menu.transfers` | Transferencias |
| | `menu.locations` | Ubicaciones |
| | `menu.categories` | Categorías |
| Compras | `menu.suppliers` | Proveedores |
| | `menu.purchase_orders` | Órdenes de Compra |
| | `menu.receivings` | Recepciones |
| Ventas | `menu.pos` | Punto de Venta |
| | `menu.cash_drawer` | Caja |
| | `menu.drawer_closures` | Cierres |
| | `menu.sales` | Lista de Ventas |
| | `menu.returns` | Devoluciones |
| | `menu.customers` | Clientes |
| Cajero | `menu.adjustments` | Faltantes/Sobrantes |
| | `menu.accounts_receivable` | Cuentas por Cobrar |
| Config | `menu.company` | Datos de Empresa |
| | `menu.shifts` | Turnos |
| | `menu.users` | Usuarios |
| | `menu.currency` | Moneda |
| | `menu.roles` | Roles |
| | `menu.permissions` | Permisos |

---

## Agregar Nuevo Ítem de Menú (Anterior)

**NOTA:** Este método ya no es recomendado. Usar el nuevo sistema de permisos dinámicos descrito arriba.

Para agregar un nuevo elemento al menú de la aplicación, se necesitan hacer modificaciones en 4 lugares:

### 1. Frontend - Agregar al Archivo de Configuración

Editar `frontend/src/config/menu.config.js`:

```javascript
export const MENU_ITEMS = [
  // ... items existentes
  { 
    key: 'nuevo', 
    name: 'Nuevo Menú', 
    path: '/nuevo', 
    icon: 'IconName', 
    section: 'seccion', 
    permission: 'menu.nuevo' 
  }
]
```

### 2. Backend - Agregar al Archivo de Configuración

Editar `backend/src/config/menu.config.js`:

```javascript
export const MENU_ITEMS = [
  // ... items existentes
  { 
    key: 'nuevo', 
    name: 'Nuevo Menú', 
    path: '/nuevo', 
    icon: 'IconName', 
    section: 'seccion', 
    permission: 'menu.nuevo' 
  }
]
```

### 3. Frontend - Agregar al Menú

Editar `frontend/src/layouts/MainLayout.vue`:

```javascript
const miSeccionItems = [
  { name: 'Nuevo Menú', path: '/nuevo', icon: IconName, permission: 'menu.nuevo' }
]
```

### 4. Frontend - Agregar Ruta

Editar `frontend/src/router/index.js`:

```javascript
{
  path: 'nuevo',
  name: 'Nuevo Menú',
  component: () => import('../pages/{modulo}/NuevoPage.vue'),
  meta: { permission: 'menu.nuevo' }
}
```

### 5. Sincronizar Permisos (Primera vez)

1. Ir a **Configuración → Permisos**
2. Hacer clic en **Sincronizar** (en Permisos de Menú)
3. Ir a **Roles** y asignar el nuevo permiso al rol deseado

### Resumen de Archivos a Modificar

| Archivo | Propósito |
|---------|-----------|
| `frontend/src/config/menu.config.js` | Definición de páginas y permisos |
| `backend/src/config/menu.config.js` | Definición de páginas (sin iconos) |
| `frontend/src/layouts/MainLayout.vue` | Renderizado del menú |
| `frontend/src/router/index.js` | Rutas y protección de páginas |

---

## Componentes Reutilizables

### AuditInfo

Componente para mostrar información de auditoría (creado por, actualizado por, fechas).

**Ubicación:** `frontend/src/components/AuditInfo.vue`

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `createdBy` | String | `''` | Nombre del creador |
| `createdAt` | String/Date | `''` | Fecha de creación |
| `updatedBy` | String | `''` | Nombre de quien actualizó |
| `updatedAt` | String/Date | `''` | Fecha de actualización |
| `createdLabel` | String | `'Creado por'` | Label personalizado |
| `updatedLabel` | String | `'Última acción'` | Label personalizado |

**Uso:**

```vue
<template>
  <AuditInfo
    :created-by="data.created_by_name"
    :created-at="data.created_at"
    :updated-by="data.updated_by_name"
    :updated-at="data.updated_at"
    created-label="Creado por"
    updated-label="Última acción"
  />
</template>

<script setup>
import AuditInfo from '@/components/AuditInfo.vue'
</script>
```

---

## Permisos por Ubicación (Multi-tenancy)

El sistema soporta permisos por ubicación para controlar qué ven los usuarios según su sucursal.

### Tabla user_locations

```sql
CREATE TABLE user_locations (
    id CHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_location (user_id, location_id)
);
```

### Endpoints de Gestión

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users-locations/me/locations` | Mis ubicaciones |
| GET | `/users-locations/users/:userId/locations` | Ubicaciones de usuario |
| POST | `/users-locations/users/locations` | Asignar ubicación |
| DELETE | `/users-locations/users/:user_id/locations/:location_id` | Remover ubicación |
| PUT | `/users-locations/users/locations/default` | Ubicación por defecto |

### Filtros Automáticos

Los siguientes endpoints filtran automáticamente por ubicaciones del usuario:

- `GET /inventory/stock`
- `GET /inventory/movements`
- `GET /inventory/serials`
- `GET /inventory/low-stock`
- `GET /inventory/stock/in-transit`
- `GET /inventory/transfers`
- `GET /inventory/transfers/pending-receipt`

**Nota:** Los usuarios con rol `admin` ven todas las ubicaciones.

---

## Currency Store

El sistema tiene un store centralizado para manejar moneda y formatos.

**Ubicación:** `frontend/src/stores/currency.store.js`

**Funciones:**

```javascript
// Cargar configuración desde el backend
await currencyStore.loadConfig()

// Formatear dinero con símbolo
currencyStore.formatMoney(1000) // "$1.000"

// Formatear número con decimales configurados
currencyStore.formatNumber(1000.50) // "1.000.50" o "1,000.50" según config

// Obtener símbolo de moneda
currencyStore.getCurrencySymbol() // "$"

// Redondear según decimales configurados
currencyStore.roundMoney(1000.556) // 1001 (si decimal_places = 0)
```

**Propiedades:**

| Propiedad | Descripción |
|-----------|-------------|
| `currency_code` | Código de moneda (CLP, MXN, USD, etc.) |
| `currency_symbol` | Símbolo de moneda |
| `decimal_places` | Decimales configurados |

---

## Modo Offline - Sistema de Ventas Sin Conexión

El sistema soporta ventas offline usando arquitectura **Offline-First + Sync Queue** con IndexedDB.

### Índice
1. [Arquitectura](#arquitectura-1)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Base de Datos Offline](#base-de-datos-offline)
4. [Flujo de Sincronización](#flujo-de-sincronización)
5. [API Endpoints de Sync](#api-endpoints-de-sync)
6. [Tablas de Sync](#tablas-de-sync)
7. [Debug y Testing](#debug-y-testing)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Offline Mode)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │  PosPage    │───▶│ offlineStore │───▶│  IndexedDB    │ │
│  │  .vue       │    │              │    │  (Dexie.js)   │ │
│  └─────────────┘    └──────────────┘    └───────────────┘ │
│         │                  │                    │          │
│         ▼                  ▼                    ▼          │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │ offlineApi  │    │ SyncManager  │    │ ServiceWorker │ │
│  │ (intercept) │    │  (cola)      │    │  (cache)      │ │
│  └─────────────┘    └──────────────┘    └───────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /sync/sales → SyncController → SyncModel            │
│                                  ↓                          │
│                            SyncRepository                   │
│                                  ↓                          │
│                          Tablas MySQL                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Clave

| Componente | Descripción |
|------------|-------------|
| `offline-db.js` | Schema Dexie (IndexedDB) |
| `cache.service.js` | Sync de productos, cola de ventas |
| `sync-manager.js` | Procesa cola, sync batch |
| `offline.store.js` | Estado global de sync |
| `useNetworkStatus.js` | Detecta online/offline |

---

## Estructura de Archivos

```
frontend/src/
├── lib/
│   ├── offline-db.js          # Schema IndexedDB (Dexie)
│   └── sync-manager.js       # Gestor de sincronización
├── services/
│   ├── api.service.js        # offlineApi con interceptores
│   └── cache.service.js      # Sync productos, cola offline
├── stores/
│   └── offline.store.js      # Estado Pinia global
├── composables/
│   ├── useNetworkStatus.js   # Estado online/offline
│   └── useSyncUI.js         # UI del modal de sync
└── components/
    └── SyncProgressModal.vue # Modal de progreso

backend/src/
├── controllers/
│   └── sync.controller.js    # Endpoint batch sync
├── models/
│   └── sync.model.js         # Lógica de sync
├── repository/
│   └── sync.repository.js    # Acceso a tablas sync
└── router/
    └── sync.router.js        # Rutas /sync/*
```

---

## Base de Datos Offline

### Schema IndexedDB (Dexie)

```javascript
// frontend/src/lib/offline-db.js
db.version(1).stores({
  items: 'id, code, name, category_id, price, cost, is_active',
  categories: 'id, name, parent_id, is_active',
  customers: 'id, name, phone, email, is_active',
  stock: '[item_id+location_id], item_id, location_id, quantity',
  syncQueue: '++id, type, status, created_at, synced_at',
  metadata: 'key'
})
```

### Tablas IndexedDB

| Tabla | Descripción |
|-------|-------------|
| `items` | Productos cacheados |
| `categories` | Categorías cacheadas |
| `customers` | Clientes cacheados |
| `stock` | Inventario por ubicación |
| `syncQueue` | Cola de ventas pendientes |
| `metadata` | Timestamps de última sync |

---

## Flujo de Sincronización

### Venta Online (Normal)

```
1. Cajero completa venta en POS
2. offlineApi.post('/sales', data)
3. API normal: /sales → /sales/:id/complete
4. Venta en DB como 'completed'
```

### Venta Offline

```
1. Cajero completa venta sin internet
2. offlineApi detecta: !navigator.onLine
3. Guarda en IndexedDB syncQueue (status: pending)
4. Muestra toast: "Venta guardada offline (OFFLINE-XXX)"
5. Indicador muestra badge con pendientes
```

### Sincronización Automática

```
1. Cajero reconecta internet
2. Evento 'online' activa SyncManager
3. SyncManager.processQueue()
4. Envía TODAS las ventas en 1 request a /sync/sales
5. Backend procesa batch, guarda en sync_logs
6. Frontend actualiza syncQueue (status: synced)
7. Modal muestra: "Sincronización Completa: 5/5"
```

### Fallback (Si batch falla)

```
1. Si /sync/sales falla (backend caído)
2. SyncManager usa método individual (Fase 3)
3. Envía cada venta por separado a /sales
4. Garantiza sync aunque sea más lento
```

---

## API Endpoints de Sync

### POST /sync/sales

Sincroniza múltiples ventas offline en batch.

**Request:**
```json
{
  "sales": [
    {
      "offline_id": "OFFLINE_746901fe-a99b-...",
      "sale": {
        "location_id": "uuid",
        "customer_id": "uuid",
        "subtotal": 1000,
        "total": 1000
      },
      "items": [
        {
          "item_id": "uuid",
          "quantity": 2,
          "unit_price": 500
        }
      ],
      "payments": [
        {
          "payment_type": "cash",
          "amount": 1000
        }
      ]
    }
  ],
  "device_id": "device_1234567890_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sync_log_id": "uuid",
    "total": 2,
    "synced": 2,
    "failed": 0,
    "status": "completed",
    "results": {
      "synced": [
        { "offline_id": "OFFLINE_7469...", "server_id": "uuid", "sale_number": "SALE-2026-0030", "status": "synced" }
      ],
      "failed": []
    }
  }
}
```

### GET /sync/history

Historial de sincronizaciones del usuario.

### GET /sync/history/:sync_log_id

Detalle de una sincronización específica.

---

## Tablas de Sync

### sync_logs

Registro de cada sync batch.

```sql
CREATE TABLE sync_logs (
    id CHAR(36) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    user_id BINARY(16) NOT NULL,
    location_id BINARY(16),
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_sales INT DEFAULT 0,
    successful_sales INT DEFAULT 0,
    failed_sales INT DEFAULT 0,
    status ENUM('completed', 'partial', 'failed') DEFAULT 'completed'
);
```

### offline_id_mapping

Mapeo de IDs offline a IDs del servidor (anti-duplicados).

```sql
CREATE TABLE offline_id_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    offline_id VARCHAR(100) NOT NULL UNIQUE,  -- Clave anti-duplicado
    server_id BINARY(16) NOT NULL,
    sale_number VARCHAR(50),
    device_id VARCHAR(255) NOT NULL,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### sync_conflicts

Conflictos durante sincronización.

```sql
CREATE TABLE sync_conflicts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_log_id CHAR(36) NOT NULL,
    offline_id VARCHAR(100) NOT NULL,
    conflict_type ENUM('insufficient_stock', 'duplicate', 'invalid_data', 'permission_denied'),
    details JSON,
    resolution ENUM('pending', 'resolved', 'skipped') DEFAULT 'pending'
);
```

---

## Debug y Testing

### Comandos de Consola

```javascript
// En DevTools > Console

// Ver estadísticas de la BD offline
debugOffline.getStats()

// Ver cola de ventas pendientes
debugOffline.getQueue()

// Estadísticas de sincronización
debugOffline.getSyncStats()

// Forzar sync manual
debugOffline.syncPendingSales()

// Simular offline (para testing)
debugOffline.simulateOffline()

// Simular online
debugOffline.simulateOnline()

// Ver ayuda
debugOffline.help()
```

### Testing Manual

1. **Probar sync offline:**
   - DevTools > Network > ☑️ Offline
   - Hacer venta en POS
   - Verificar que se guarda en IndexedDB

2. **Probar sincronización:**
   - Desmarcar Offline en DevTools
   - Verificar modal de progreso
   - Verificar ventas en backend

3. **Probar indicador:**
   - Verificar colores del indicador en POS:
     - Verde: Online
     - Ámbar: Offline o con pendientes
     - Azul: Sincronizando

### Verificar Base de Datos

```sql
-- Ver sync logs
SELECT * FROM sync_logs ORDER BY synced_at DESC LIMIT 10;

-- Ver mapeo de IDs
SELECT * FROM offline_id_mapping;

-- Ver conflictos
SELECT * FROM sync_conflicts WHERE resolution = 'pending';
```

---

## Configuración PWA

### vite.config.js

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
})
```

### manifest.json

```json
{
  "name": "Vuno POS",
  "short_name": "VunoPOS",
  "display": "standalone",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Puntos Importantes

### Anti-Duplicados

El sistema tiene protección en 3 niveles:

1. **Frontend**: `syncQueue` marca como `synced`
2. **Backend**: `checkOfflineIdExists()` verifica antes de crear
3. **MySQL**: `offline_id UNIQUE` restricción

### Indicador de Estado en POS

El indicador en el toolbar del POS muestra:

| Estado | Color | Tooltip |
|--------|-------|---------|
| Online + sin pendientes | Verde | "En línea - Todo sincronizado" |
| Online + pendientes | Ámbar | "X venta(s) pendiente(s)" (clickeable) |
| Sincronizando | Azul | "Sincronizando ventas..." |
| Offline | Ámbar | "Modo offline" |

### Modal de Progreso

Se muestra automáticamente:
- Al iniciar sincronización
- Al completar (3s auto-cerrado si exitoso)
- Al fallar (botón reintentar disponible)

---

## Migrations

```bash
# Ejecutar migración de sync
mysql -u user -p database < backend/migrations/029_offline_sync_tables.sql
```

---

## Troubleshooting

### Problema: Ventas no se sincronizan

1. Verificar que el backend esté corriendo
2. Ver consola del navegador por errores
3. Ejecutar `debugOffline.getQueue()` para ver estado
4. Ejecutar `debugOffline.syncPendingSales()` manualmente

### Problema: Duplicados en DB

1. Verificar tabla `offline_id_mapping`
2. El sistema debe rechazar duplicados por `offline_id UNIQUE`

### Problema: Modal no aparece

1. Verificar que `SyncProgressModal.vue` esté importado en `App.vue`
2. Verificar que `useSyncUI()` esté siendo usado

---

## Comandos Rápidos

```bash
# Desarrollo frontend
cd frontend && pnpm dev

# Desarrollo backend
cd backend && pnpm dev

# Build producción
cd frontend && pnpm build
```

---

## Transferencias - Workflow Completo

Las transferencias entre ubicaciones siguen este flujo:

```
1. CREAR (pending)
   - Usuario crea la transferencia especificando origen y destino
   - No afecta el stock aún

2. AGREGAR ITEMS (pending)
   - Se agregan productos con cantidades
   - Valida stock disponible en origen

3. ENVIAR (in_transit)
   - Se descuenta stock del origen
   - Se suma a quantity_in_transit
   - Se registra movimiento transfer_out
   - updated_by = usuario que envía

4. RECIBIR (completed)
   - Se suma stock al destino
   - Se descuenta de quantity_in_transit en origen
   - Se registra movimiento transfer_in
   - updated_by = usuario que recibe

5. CANCELAR (cancelled)
   - Si está en tránsito: restaura stock al origen
   - Registra movimiento de ajuste
```

### Métodos de Cancelación

**Importante:** La cancelación restaura el stock solo si está en estado `in_transit`.

```javascript
// En transfer.repository.js
async cancel(transferId, userId) {
  // Si está in_transit: restaura quantity en origen
  // Si está pending: solo cambia estado
  // Si está completed: NO se puede cancelar
}
```
