# 07. Faltantes y Sobrantes

## Índice

1. [Descripción](#descripción)
2. [Acceso al Módulo](#acceso-al-módulo)
3. [Lista de Ajustes](#lista-de-ajustes)
4. [Estados de Ajuste](#estados-de-ajuste)
5. [Tipos de Ajuste](#tipos-de-ajuste)
6. [Aprobar o Rechazar](#aprobar-o-rechazar)
7. [Filtros](#filtros)
8. [Cómo se Crean los Ajustes](#cómo-se-crean-los-ajustes)
9. [Flujo de Trabajo](#flujo-de-trabajo)

---

## Descripción

El módulo de **Ajustes de Caja** gestiona las diferencias de dinero detectadas al cerrar una caja.

| Tipo | Significado | Color |
|------|------------|-------|
| **Faltante** | El dinero contado es menor al esperado | Rojo |
| **Sobrante** | El dinero contado es mayor al esperado | Verde |

---

## Acceso al Módulo

### Ruta

**Cajero → Faltantes/Sobrantes**

---

## Lista de Ajustes

### Vista Principal

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Ajustes de Caja                                                                │
│ Gestiona faltantes y sobrantes de dinero                                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [Buscar...]  [Todos ▾]  [Desde ▾]  [Hasta ▾]                              │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ [-] Faltante                          Pendiente                      │   │
│ │     15/01/2024 10:30                                                  │   │
│ │                                                                       │   │
│ │     Monto:    C$50.00        │ Aprobar │ Rechazar │                   │   │
│ │     Caja:     Caja Principal  │                                      │   │
│ │     Ubicación: Tienda Centro  │                                      │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ [+] Sobrante                         Aprobado                        │   │
│ │     14/01/2024 15:45                                                  │   │
│ │                                                                       │   │
│ │     Monto:    C$25.00                                                 │   │
│ │     Caja:     Caja Mañana                                             │   │
│ │     Ubicación: Sucursal Norte                                         │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Información de Cada Ajuste

| Campo | Descripción |
|-------|-------------|
| Tipo | Faltante (rojo) o Sobrante (verde) |
| Fecha | Fecha y hora del ajuste |
| Monto | Cantidad de la diferencia |
| Caja | Nombre de la caja |
| Ubicación | Sucursal donde ocurrió |
| Estado | Situación actual del ajuste |
| Notas | Observaciones (si hay) |

---

## Estados de Ajuste

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Pendiente** | Amarillo | Esperando revisión del administrador |
| **Aprobado** | Verde | Ajuste revisado y aprobado |
| **Rechazado** | Rojo | Ajuste no válido o anulado |

### Significado de los Estados

#### Pendiente

- El ajuste fue creado automáticamente al cerrar caja
- Un administrador debe revisarlo
- Las acciones de aprobar/rechazar están disponibles

#### Aprobado

- El administrador revisó y aprovou el ajuste
- Se ejecutan las acciones correspondientes

#### Rechazado

- El administrador consideró que no es válido
- No se ejecuta ninguna acción

---

## Tipos de Ajuste

### Faltante

```
[-] Faltante
```

| Característica | Descripción |
|----------------|-------------|
| Ícono | Signo menos (-) en rojo |
| Monto | Positivo (ej: C$50.00) |
| Significado | Falta dinero en la caja |

#### Al Aprobar un Faltante

1. Se crea automáticamente una **Cuenta por Cobrar**
2. El monto se asigna al cajero responsable
3. El cajero deberá pagar la diferencia

### Sobrante

```
[+] Sobrante
```

| Característica | Descripción |
|----------------|-------------|
| Ícono | Signo más (+) en verde |
| Monto | Positivo (ej: C$25.00) |
| Significado | Sobra dinero en la caja |

#### Al Aprobar un Sobrante

1. El ajuste queda **documentado** para auditoría
2. El dinero permanece en la caja
3. No hay movimiento de dinero adicional

---

## Aprobar o Rechazar

### Quién Puede Realizar Acciones

Solo usuarios con rol de **Administrador** pueden aprobar o rechazar ajustes.

### Acciones Disponibles

| Acción | Descripción |
|--------|-------------|
| **Aprobar** | Aceptar el ajuste y ejecutar acciones |
| **Rechazar** | Invalidar el ajuste |

### Cómo Aprobar

1. Busca el ajuste en estado **"Pendiente"**
2. Haz clic en **"Aprobar"**
3. El estado cambia a **"Aprobado"**
4. Se ejecutan las acciones correspondientes

```
┌─────────────────────────────────────────┐
│ [-] Faltante                   Pendiente│
│     15/01/2024 10:30                   │
│                                         │
│     Monto:    C$50.00                   │
│                                         │
│  [Aprobar]  [Rechazar]                 │
│                                         │
└─────────────────────────────────────────┘
```

### Cómo Rechazar

1. Busca el ajuste en estado **"Pendiente"**
2. Haz clic en **"Rechazar"**
3. El estado cambia a **"Rechazado"**
4. No se ejecuta ninguna acción

---

## Filtros

### Búsqueda

Busca por cualquier campo del ajuste.

### Filtro por Estado

| Opción | Muestra |
|--------|---------|
| Todos | Todos los ajustes |
| Pendientes | Solo sin revisar |
| Aprobados | Solo aprobados |
| Rechazados | Solo rechazados |

### Rango de Fechas

Usa los campos **Desde** y **Hasta** para限定 el período.

Por defecto se muestra el mes actual.

---

## Cómo se Crean los Ajustes

### Al Cerrar Caja

Los ajustes se crean **automáticamente** cuando:

1. Cierras una caja
2. Ingresas el dinero contado
3. Hay una diferencia con el efectivo esperado

### Proceso Automático

```
Cierre de Caja
     │
     ▼
¿Hay diferencia?
     │
     ├── No → Sin ajuste (cuadre perfecto)
     │
     └── Sí → Se crea ajuste automáticamente
                  │
                  ▼
            Estado: Pendiente
```

### Ejemplo de Creación

1. Cajero cierra caja
2. Monto esperado: C$1,000.00
3. Dinero contado: C$950.00
4. Diferencia: C$50.00 (Faltante)
5. Se crea automáticamente un ajuste de C$50.00 en estado "Pendiente"

---

## Flujo de Trabajo

### Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌───────────────┐                                               │
│  │ Cerrar Caja   │                                               │
│  └──────┬────────┘                                               │
│         │                                                         │
│         ▼                                                         │
│  ┌───────────────────┐                                           │
│  │ ¿Hay diferencia?  │                                           │
│  └──────┬───────────┘                                           │
│         │                                                         │
│    ┌────┴────┐                                                   │
│    │         │                                                   │
│    ▼         ▼                                                   │
│  Sí         No                                                   │
│    │         │                                                   │
│    ▼         ▼                                                   │
│  Crear      Cuadre Perfecto                                      │
│  Ajuste     (sin ajuste)                                        │
│    │                                                           │
│    ▼                                                           │
│  Pendiente                                                      │
│    │                                                           │
│    ▼                                                           │
│  ┌───────────────────────┐                                      │
│  │ Admin revisa ajuste   │                                      │
│  └──────┬────────────────┘                                      │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    │         │                                                  │
│    ▼         ▼                                                  │
│ Aprobar  Rechazar                                                │
│    │         │                                                  │
│    ▼         ▼                                                  │
│ Crear     Ajuste                                                 │
│ Cta x     Rechazado                                              │
│ Cobrar    (sin acción)                                          │
│ (si falt.)│                                                      │
└───────────┘                                                      │
```

### Para Faltantes

1. Cajero cierra con diferencia negativa
2. Se crea ajuste de faltante (Pendiente)
3. Admin aprueba
4. Se crea **Cuenta por Cobrar** al cajero
5. Cajero debe pagar

### Para Sobrantes

1. Cajero cierra con diferencia positiva
2. Se crea ajuste de sobrante (Pendiente)
3. Admin aprueba
4. Se documenta para auditoría
5. Dinero queda en caja

---

## Cuentas por Cobrar

### Relación con Ajustes

Cuando se aprueba un **faltante**, se crea automáticamente una Cuenta por Cobrar:

| Ajuste | Acción Automática |
|--------|------------------|
| Faltante aprobado | Crear Cuenta por Cobrar al cajero |
| Sobrante aprobado | Solo documentar |

### Ver Cuentas por Cobrar

Para gestionar las deudas:

1. Ve a **Cajero → Cuentas por Cobrar**
2. Verás todas las cuentas generadas por faltantes

Ver [Cuentas por Cobrar](./08-RECEIVABLES.md) para más detalles.

---

## Notas de los Ajustes

### Agregar Notas

Al cerrar caja, puedes agregar notas que aparecerán en el ajuste:

```
┌─────────────────────────────────────────┐
│ Notas (opcional):                        │
│ [Cliente pagó con billete roto__________]│
└─────────────────────────────────────────┘
```

### Ver Notas

Las notas se muestran en la tarjeta del ajuste:

```
[-] Faltante
    15/01/2024 10:30
    
    Monto: C$50.00
    
    Notas:
    Cliente pagó con billete deteriorado
```

---

## Permisos

### Quién Ve los Ajustes

- **Todos los usuarios**: Pueden ver los ajustes
- **Solo Admin**: Puede aprobar/rechazar

---

## Ejemplos

### Ejemplo 1: Faltante por Error de Cambio

1. Cajero da cambio de más
2. Al cerrar, falta C$20.00
3. Se crea ajuste de Faltante C$20.00
4. Admin aprueba
5. Se crea Cuenta por Cobrar al cajero

### Ejemplo 2: Sobrante por Error de Inventario

1. Se vende producto pero no se registra
2. Al cerrar, sobran C$35.00
3. Se crea ajuste de Sobrante C$35.00
4. Admin investiga y aprueba
5. Se documenta para auditoría

---

[Anterior: Clientes](./06-CUSTOMERS.md) | [Siguiente: Cuentas por Cobrar](./08-RECEIVABLES.md)
