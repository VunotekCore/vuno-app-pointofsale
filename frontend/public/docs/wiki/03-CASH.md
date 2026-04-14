# 03. Manejo de Caja

## Índice

1. [Acceso al Módulo](#acceso-al-módulo)
2. [Estados de Caja](#estados-de-caja)
3. [Abrir Caja](#abrir-caja)
4. [Ver Resumen de Caja](#ver-resumen-de-caja)
5. [Registrar Retiro](#registrar-retiro)
6. [Cerrar Caja](#cerrar-caja)
7. [Recordatorios de Cierre](#recordatorios-de-cierre)
8. [Notificaciones de Resultado](#notificaciones-de-resultado)

---

## Acceso al Módulo

### Ruta

**Cajero → Gestión de Caja**

### Selector de Ubicación

Al igual que en el POS, puedes seleccionar la sucursal para gestionar su caja.

### Indicador en el POS

En la barra superior del POS verás:

| Estado | Color | Significado |
|--------|-------|-------------|
| Verde | "Abierta" | Caja lista para vender |
| Rojo | "Cerrada" | Caja no disponible |

Haz clic en el indicador para ir directamente al módulo de caja.

---

## Estados de Caja

| Estado | Descripción |
|--------|-------------|
| **Cerrada** | No se pueden realizar ventas en efectivo |
| **Abierta** | Lista para transacciones en efectivo |

---

## Abrir Caja

### Cuándo Abrir

Al inicio del turno de trabajo, antes de comenzar a vender.

### Pasos

1. Ve a **Cajero → Gestión de Caja**
2. Verás el botón **"Abrir Caja"**
3. Se abrirá un modal con opciones

### Modal de Apertura

```
┌─────────────────────────────────────────┐
│              Abrir Caja                 │
├─────────────────────────────────────────┤
│                                         │
│  [Turno: Mañana]                       │
│  Horario: 08:00 - 16:00                │
│                                         │
│  Monto Inicial: [    0.00    ] [💰]   │
│  Monto sugerido: C$500.00              │
│                                         │
│  ┌──────────────┐  ┌────────────────┐  │
│  │  Cancelar   │  │     Abrir      │  │
│  └──────────────┘  └────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Monto Inicial

- Es el dinero en efectivo depositado al abrir
- Si hay un turno activo, puede mostrar un monto sugerido
- Haz clic en el ícono de **$** para usar el monto del turno

### Con Turno Activo

Si existe un turno configurado:

- Se muestra el nombre del turno (ej: "Mañana", "Tarde")
- Se sugiere un monto inicial predefinido
- Al hacer clic en "Abrir", usa automáticamente el monto sugerido

### Sin Turno Activo

- Debes ingresar manualmente el monto inicial
- No hay sugerencia de monto

---

## Ver Resumen de Caja

### Información Visible

Cuando la caja está abierta, verás:

```
┌─────────────────────────────────────────────────────┐
│  Caja Abierta                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  Apertura: 15/01/2024  08:00                      │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ MONTO INICIAL   │  │ VENTAS EN EFECTIVO      │  │
│  │ C$500.00        │  │ C$2,500.00              │  │
│  └─────────────────┘  └─────────────────────────┘  │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ DEVOLUCIONES    │  │ RETIROS                 │  │
│  │ C$100.00        │  │ C$200.00                │  │
│  └─────────────────┘  └─────────────────────────┘  │
│                                                     │
│  ════════════════════════════════════════════════  │
│  EFECTIVO ESPERADO:          C$2,700.00           │
│  ════════════════════════════════════════════════  │
│                                                     │
│  [Vista Previa]  [Registrar Retiro]                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Componentes del Resumen

| Concepto | Descripción |
|----------|-------------|
| **Monto Inicial** | Dinero con el que abriste la caja |
| **Ventas en Efectivo** | Total de ventas pagadas en efectivo |
| **Devoluciones** | Total de devoluciones en efectivo |
| **Retiros** | Dinero retirado durante el turno |
| **Efectivo Esperado** | Inicial + Ventas - Devoluciones - Retiros |

### Fórmula

```
Efectivo Esperado = Monto Inicial + Ventas Efectivo - Devoluciones - Retiros
```

### Filtrar por Fecha

Puedes filtrar los movimientos por rango de fechas usando los campos de fecha en la parte superior.

---

## Registrar Retiro

### Cuándo Usar

Para extraer dinero de la caja durante el turno:
- Depósitos bancarios
- Gastos menores
- Transferencias a otra caja

### Pasos

1. Haz clic en **"Registrar Retiro"**
2. Ingresa el monto a retirar
3. (Opcional) Agrega una descripción
4. Confirma

### Modal de Retiro

```
┌─────────────────────────────────────────┐
│           Registrar Retiro               │
├─────────────────────────────────────────┤
│                                         │
│  Monto: [    0.00    ]                 │
│                                         │
│  Descripción (opcional):                │
│  [________________________]             │
│                                         │
│  ┌──────────────┐  ┌────────────────┐  │
│  │  Cancelar   │  │    Confirmar    │  │
│  └──────────────┘  └────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Lista de Retiros

Los retiros realizados aparecen en el historial de movimientos.

---

## Cerrar Caja

### Cuándo Cerrar

Al final del turno de trabajo.

### Pasos

1. Haz clic en **"Vista Previa"** para ver el resumen
2. Verifica los totales
3. Haz clic en **"Cerrar Caja"** en la vista previa

### Modal de Cierre

```
┌─────────────────────────────────────────┐
│              Cerrar Caja                 │
├─────────────────────────────────────────┤
│                                         │
│  Resumen del Turno                      │
│  ─────────────────────────────────────  │
│  Monto Inicial:        C$500.00        │
│  Ventas en Efectivo:   C$2,500.00       │
│  Devoluciones:        C$100.00         │
│  Retiros:             C$200.00         │
│  ─────────────────────────────────────  │
│  Efectivo Esperado:    C$2,700.00       │
│                                         │
│  Dinero Contado: [    0.00    ]        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⚠️ Faltante: C$50.00            │   │
│  │   (o "Sobrante: C$50.00")      │   │
│  │   (o "✓ Cuadre Perfecto!")     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Notas (opcional):                       │
│  [________________________]              │
│                                         │
│  ┌──────────────┐  ┌────────────────┐  │
│  │  Cancelar   │  │  Cerrar Caja   │  │
│  └──────────────┘  └────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Ingresar Dinero Contado

1. Cuenta físicamente el dinero en la caja
2. Ingresa el monto total en el campo
3. El sistema calculará automáticamente:
   - **Sobrante** (verde): Tienes más del esperado
   - **Faltante** (rojo): Tienes menos del esperado
   - **Cuadre Perfecto** (azul): Las cantidades coinciden

### Diferencia

```
Diferencia = Dinero Contado - Efectivo Esperado
```

### Notas

Puedes agregar observaciones del cierre (opcional).

### Confirmar Cierre

1. Verifica toda la información
2. Haz clic en **"Cerrar Caja"**
3. Se procesará el cierre y la caja quedará cerrada

---

## Recordatorios de Cierre

### Funcionamiento

El sistema puede mostrar recordatorios cuando se acerca el fin de un turno configurado.

### Notificación

Si existe un turno activo y se acerca su hora de cierre:

1. Aparecerá un modal recordándote cerrar la caja
2. Podrás:
   - **Ignorar**: Seguir trabajando
   - **Cerrar caja ahora**: Procesar el cierre

### Configuración

Los recordatorios se configuran desde **Configuración → Turnos**, donde defines:
- Hora de inicio del turno
- Hora de fin del turno
- Monto inicial sugerido

---

## Notificaciones de Resultado

Al cerrar la caja, el sistema mostrará:

| Situación | Notificación |
|-----------|-------------|
| Cuadre perfecto | "Cuadre perfecto!" |
| Sobrante | "Sobrante: C$XXX" |
| Faltante | "Faltante: C$XXX" |

### Después del Faltante

Si hay faltante:

1. Se crea automáticamente un registro en [Faltantes/Sobrantes](./07-CASH-ADJ.md)
2. Un administrador revisará y aprobará o rechazará
3. Si se aprueba, se crea una [Cuenta por Cobrar](./08-RECEIVABLES.md) al cajero

### Después del Sobrante

Si hay sobrante:

1. Se documenta en el registro de cierre
2. Queda para revisión del administrador

---

## Flujo Completo de Caja

```
┌─────────────┐
│ Inicio del  │
│   Turno     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Abrir Caja │ ◄── Monto Inicial
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         CAJA ABIERTA                │
│                                     │
│  ┌─────────┐     ┌─────────────┐  │
│  │  Vender │     │  Retiros    │  │
│  └────┬────┘     └──────┬──────┘  │
│       │                 │          │
│       └────────┬────────┘          │
│                ▼                   │
│         ┌─────────────┐           │
│         │   Ventas    │           │
│         └─────────────┘           │
│                                     │
│  Recordatorio de cierre (al final)  │
│                                     │
└─────────────────┬───────────────────┘
                  │
                  ▼
           ┌─────────────┐
           │ Cerrar Caja │
           │ (Contado)   │
           └──────┬──────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Cálculo de     │
         │  Diferencia     │
         └────────┬────────┘
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
   Sobrante   Faltante   Cuadre
   Documenta  Cta x Cobrar  Perfecto
```

---

## Tips para el Cajero

1. **Al abrir**: Cuenta tu dinero inicial antes de abrir la caja
2. **Durante el turno**: Registra todos los retiros con descripción
3. **Al cerrar**: Cuenta el dinero varias veces para evitar errores
4. **Si hay diferencia**: Revisa que no falten o sobren billetes

---

[Anterior: Punto de Venta](./02-SALES.md) | [Siguiente: Gestión de Ventas](./04-SALES-MGMT.md)
