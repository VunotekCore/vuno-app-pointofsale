# 08. Cuentas por Cobrar

## Índice

1. [Descripción](#descripción)
2. [Acceso al Módulo](#acceso-al-módulo)
3. [Resumen](#resumen)
4. [Lista de Cuentas](#lista-de-cuentas)
5. [Estados de Cuenta](#estados-de-cuenta)
6. [Registrar Pago](#registrar-pago)
7. [Filtros](#filtros)

---

## Descripción

El módulo de **Cuentas por Cobrar** gestiona las deudas de los empleados originadas por **faltantes de caja**.

### Origen de las Deudas

Las cuentas se crean automáticamente cuando:

1. Se cierra una caja con faltante
2. Un administrador **aprueba** el faltante en [Faltantes/Sobrantes](./07-CASH-ADJ.md)
3. El monto se asigna al cajero responsable

---

## Acceso al Módulo

### Ruta

**Cajero → Cuentas por Cobrar**

---

## Resumen

En la parte superior verás un resumen de todas las cuentas:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Total Deuda:     Total Pagado:    Total Pendiente:    │
│    C$500.00         C$200.00          C$300.00         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| Concepto | Descripción |
|----------|-------------|
| Total Deuda | Suma de todas las cuentas |
| Total Pagado | Suma de pagos realizados |
| Total Pendiente | Deuda pendiente por cobrar |

---

## Lista de Cuentas

### Vista Principal

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Cuentas por Cobrar                                                             │
│ Gestiona las deudas de empleados por faltantes de caja                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [Buscar...]  [Todos los cajeros ▾]  [Todos los estados ▾]  [Desde] [Hasta]│
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ [$] Juan Pérez                                                        │   │
│ │     15/01/2024                                                        │   │
│ │                                                                       │   │
│ │  Total:      Pagado:     Pendiente:  Caja:           Estado:         │   │
│ │  C$100.00    C$50.00     C$50.00      Caja Mañana    [Parcial] [Pay] │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ [$] María López                                                       │   │
│ │     14/01/2024                                                        │   │
│ │                                                                       │   │
│ │  Total:      Pagado:     Pendiente:  Caja:           Estado:         │   │
│ │  C$75.00     C$0.00      C$75.00      Caja Tarde      [Pendiente] [Pay]│   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Información de Cada Cuenta

| Campo | Descripción |
|-------|-------------|
| Empleado | Nombre del cajero con la deuda |
| Fecha | Fecha de creación de la cuenta |
| Total | Monto total de la deuda |
| Pagado | Monto já pagado |
| Pendiente | Monto restante por cobrar |
| Caja | Nombre de la caja origen |
| Estado | Situación actual |

### Notas

Si la cuenta tiene notas, se muestran expandidas:

```
Notas:
Cliente pagó con billete deteriorado
```

---

## Estados de Cuenta

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Pendiente** | Rojo | Sin pagos realizados |
| **Parcial** | Amarillo | Pago parcial realizado |
| **Pagado** | Verde | Deuda completamente liquidada |

### Ejemplo: Pendiente

```
Total: C$75.00
Pagado: C$0.00
Pendiente: C$75.00
Estado: Pendiente
```

### Ejemplo: Parcial

```
Total: C$100.00
Pagado: C$50.00
Pendiente: C$50.00
Estado: Parcial
```

### Ejemplo: Pagado

```
Total: C$100.00
Pagado: C$100.00
Pendiente: C$0.00
Estado: Pagado
```

---

## Registrar Pago

### Quién Puede Registrar Pagos

Solo usuarios con rol de **Administrador** pueden registrar pagos.

### Cómo Registrar

1. Busca la cuenta del empleado
2. Haz clic en **"Registrar Pago"**

### Modal de Pago

```
┌─────────────────────────────────────────┐
│ Registrar Pago                        [X]│
├─────────────────────────────────────────┤
│                                         │
│ Empleado:    Juan Pérez                │
│ Monto Pendiente:  C$50.00              │
│                                         │
│ Monto a pagar:                          │
│ [____________]                         │
│ Pago máximo: C$50.00                   │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ [Cancelar]          [Confirmar Pago]   │
│                                         │
└─────────────────────────────────────────┘
```

### Proceso

1. El sistema muestra el **monto pendiente**
2. Ingresa el **monto a pagar**
3. El monto no puede exceder el pendiente
4. Haz clic en **"Confirmar Pago"**

### Pagos Parciales

Puedes registrar pagos parciales:

- Si la deuda es C$100.00
- Puedes pagar C$50.00 primero
- Queda pendiente C$50.00
- Después pagar los C$50.00 restantes

### Confirmación

```
┌─────────────────────────────────────────┐
│ ¿Confirmar pago de C$50.00?            │
│                                         │
│        [Cancelar]    [Confirmar]       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Filtros

### Búsqueda

Busca por nombre del empleado o cualquier dato.

### Filtro por Cajero

| Opción | Descripción |
|--------|-------------|
| Todos los cajeros | Ver todas las cuentas |
| [Cajero específico] | Ver cuentas de un empleado |

### Filtro por Estado

| Opción | Descripción |
|--------|-------------|
| Todos los estados | Todas las cuentas |
| Pendiente | Solo sin pagos |
| Parcial | Solo con pagos parciales |
| Pagado | Solo liquidadas |

### Rango de Fechas

Usa los campos **Desde** y **Hasta** para限定 el período.

Por defecto se muestra el mes actual.

---

## Relación con Faltantes

### Flujo

```
Cierre de Caja (Faltante)
        │
        ▼
    Admin Aprueba
        │
        ▼
Se crea Cuenta por Cobrar
al cajero responsable
        │
        ▼
   Cajero paga
```

### Ver Faltante Origen

Para ver de qué faltante proviene una cuenta:

1. Nota la fecha y hora
2. Ve a **Cajero → Faltantes/Sobrantes**
3. Busca por fecha o cajero

---

## Permisos

### Quién Ve las Cuentas

- **Todos los usuarios**: Pueden ver las cuentas
- **Solo Admin**: Puede registrar pagos

---

## Ejemplos

### Ejemplo 1: Deuda Completa

1. Cajero cierra con faltante de C$100.00
2. Admin aprueba en Faltantes/Sobrantes
3. Se crea Cuenta por Cobrar de C$100.00
4. Cajero paga C$100.00
5. Cuenta queda Pagada

### Ejemplo 2: Pago Parcial

1. Cajero cierra con faltante de C$150.00
2. Admin aprueba
3. Se crea Cuenta por Cobrar de C$150.00
4. Cajero paga C$50.00 → Queda C$100.00 (Parcial)
5. Cajero paga C$100.00 → Queda C$0.00 (Pagado)

---

[Anterior: Faltantes y Sobrantes](./07-CASH-ADJ.md) | [Siguiente: Reportes](./10-REPORTS.md)
