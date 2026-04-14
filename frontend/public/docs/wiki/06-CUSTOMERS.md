# 06. Clientes

## Índice

1. [Acceso al Módulo](#acceso-al-módulo)
2. [Lista de Clientes](#lista-de-clientes)
3. [Crear Cliente](#crear-cliente)
4. [Editar Cliente](#editar-cliente)
5. [Eliminar Cliente](#eliminar-cliente)
6. [Activar/Desactivar](#activardesactivar)
7. [Cliente por Defecto](#cliente-por-defecto)
8. [Campos del Formulario](#campos-del-formulario)
9. [Grupos de Clientes](#grupos-de-clientes)

---

## Acceso al Módulo

### Ruta

**Ventas → Clientes**

---

## Lista de Clientes

### Vista Principal

Los clientes se muestran en tarjetas (cards) con su información principal:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Clientes                                                                 │
│ Gestión de clientes y membresías                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [Buscar...]  [Todos ▾]                                                    │
│                                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│ │ 👤 Juan Pérez       │  │ 👤 María López      │  │ 👤 Carlos García   │ │
│ │                      │  │                      │  │                      │ │
│ │ ✉ juan@email.com  │  │ ✉ maria@email.com  │  │ ✉ carlos@email.com │ │
│ │ ☎ +505 8888-8888  │  │ ☎ +505 7777-7777  │  │ ☎ +505 6666-6666  │ │
│ │                      │  │                      │  │                      │ │
│ │ ⭐ 150 puntos       │  │                      │  │                      │ │
│ │                      │  │                      │  │                      │ │
│ │ [Editar] [Eliminar] │  │ [Editar] [Eliminar] │  │ [Editar] [Eliminar] │ │
│ └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                             │
│ ...                                                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

### Tarjeta de Cliente

Cada tarjeta muestra:

| Elemento | Descripción |
|----------|-------------|
| Avatar | Ícono de usuario |
| Nombre | Nombre completo |
| Grupo | Grupo al que pertenece (si tiene) |
| Email | Correo electrónico |
| Teléfono | Número de contacto |
| Puntos | Saldo de puntos (si tiene) |
| Toggle | Activar/Desactivar |
| Acciones | Editar / Eliminar |

### Búsqueda

Busca clientes por nombre, email o cualquier otro campo.

### Filtro de Estado

| Opción | Descripción |
|--------|-------------|
| Todos | Ver todos los clientes |
| Activos | Solo clientes activos |
| Inactivos | Solo clientes desactivados |

---

## Crear Cliente

### Pasos

1. Haz clic en **"+ Nuevo Cliente"**
2. Completa el formulario
3. Haz clic en **"Crear"**

### Formulario de Cliente

```
┌─────────────────────────────────────────┐
│ Nuevo Cliente                        [X] │
├─────────────────────────────────────────┤
│                                         │
│  Nombre *    │  Apellido              │
│  [__________] │  [__________]          │
│                                         │
│  Email       │  Teléfono               │
│  [__________] │  [__________]          │
│                                         │
│  Empresa     │  RFC/Tax ID             │
│  [__________] │  [__________]          │
│                                         │
│  Dirección                            │
│  [_____________________________]       │
│                                         │
│  Ciudad    │  Estado     │ CP         │
│  [_______] │  [_______]  │ [_______] │
│                                         │
│  Grupo                                │
│  [Sin grupo ▾]                        │
│                                         │
│  Límite de Crédito                    │
│  [____________]                        │
│                                         │
│  Notas                                 │
│  [_____________________________]       │
│                                         │
│  [ ] Exento de impuestos               │
│  [ ] Cliente por defecto               │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│         [Cancelar]  [Crear]            │
│                                         │
└─────────────────────────────────────────┘
```

### Validaciones

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Nombre del cliente |
| Apellido | No | Apellido del cliente |
| Email | No | Correo electrónico válido |
| Teléfono | No | Número de contacto |

---

## Campos del Formulario

### Información Personal

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Texto | Nombre del cliente (obligatorio) |
| Apellido | Texto | Apellido del cliente |
| Email | Email | Correo electrónico |
| Teléfono | Teléfono | Número de contacto |

### Información Fiscal

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Empresa | Texto | Nombre de la empresa (si es B2B) |
| RFC/Tax ID | Texto | Identificación fiscal |

### Dirección

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Dirección | Texto | Dirección completa |
| Ciudad | Texto | Ciudad |
| Estado | Texto | Estado/Provincia |
| Código Postal | Texto | CP |

### Configuración

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Grupo | Select | Grupo de clientes |
| Límite de Crédito | Número | Crédito máximo permitido |
| Notas | Texto | Observaciones adicionales |

### Opciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Exento de impuestos | Checkbox | El cliente no paga impuestos |
| Cliente por defecto | Checkbox | Se usa automáticamente en ventas sin cliente |

---

## Editar Cliente

### Pasos

1. En la tarjeta del cliente, haz clic en **"Editar"**
2. Modifica los campos necesarios
3. Haz clic en **"Actualizar"**

### Campos Editables

Todos los campos son editables excepto que se indica lo contrario.

---

## Eliminar Cliente

### Pasos

1. En la tarjeta del cliente, haz clic en **"Eliminar"**
2. Confirma la eliminación

### Confirmación

```
┌─────────────────────────────────────────┐
│ ¿Estás seguro de eliminar al cliente    │
│ "Juan Pérez"?                          │
│                                         │
│        [Cancelar]    [Eliminar]         │
│                                         │
└─────────────────────────────────────────┘
```

> **Nota**: La eliminación es lógica (soft delete). El cliente no desaparece de las ventas históricas.

---

## Activar/Desactivar

### Toggle de Estado

Cada tarjeta tiene un toggle en la esquina superior derecha:

| Estado | Ícono | Color |
|--------|-------|-------|
| Activo | ToggleRight | Verde |
| Inactivo | ToggleLeft | Gris |

### Cambiar Estado

1. Haz clic en el toggle
2. El estado cambia inmediatamente

### Clientes Inactivos

- No aparecen en la búsqueda del POS
- No se pueden seleccionar en nuevas ventas
- Su historial permanece intacto

---

## Cliente por Defecto

### Qué Es

El cliente por defecto se usa automáticamente cuando:
- No seleccionas ningún cliente en una venta
- Necesitas una venta rápida sin registro

### Configurar

1. Crea o edita un cliente
2. Marca la opción **"Cliente por defecto"**
3. Guarda

### Comportamiento

- Solo puede haber **un** cliente por defecto
- Al marcar uno nuevo, el anterior pierde esa marca
- En el POS, se muestra el cliente por defecto automáticamente

### Usos Comunes

- "Cliente Mostrador"
- "Consumidor Final"
- "Público en General"

---

## Grupos de Clientes

### Qué Son

Los grupos permiten organizar clientes por categorías:

| Grupo | Descripción |
|-------|-------------|
| Retail | Clientes individuales |
| Corporativo | Empresas |
| VIP | Clientes preferenciales |
| Mayorista | Compradores al por mayor |

### Asignar Grupo

Al crear/editar un cliente:

1. Selecciona el **Grupo** del dropdown
2. Guarda

---

## Puntos y Recompensas

### Puntos del Cliente

Algunos clientes pueden tener un saldo de puntos:

```
⭐ 150 puntos
```

### Dónde Ver los Puntos

- En la tarjeta del cliente
- En el detalle del cliente

### Sistema de Puntos

> **Nota**: La funcionalidad de puntos depende de la configuración del sistema. Consulta con el administrador.

---

## Uso en el POS

### Agregar Cliente a Venta

1. En el POS, haz clic en **"+ Cliente"**
2. Escribe el nombre o email
3. Selecciona el cliente de la lista

### Cliente por Defecto

Si no agregas un cliente manualmente:
- Se usa el cliente marcado como "por defecto"
- Si no hay ninguno, la venta se registra sin cliente

### Cambiar Cliente

Para cambiar el cliente de una venta:
1. Haz clic en el nombre del cliente actual
2. Selecciona otro cliente
3. El cambio se refleja inmediatamente

### Quitar Cliente

Para vender sin cliente:
1. Clic en el ícono "X" junto al nombre del cliente
2. Se quita el cliente (queda sin cliente o con el por defecto)

---

## Búsqueda Rápida en POS

### En el Campo de Cliente

El POS busca clientes mientras escribes:

1. Escribe al menos 2 caracteres
2. Los resultados aparecen automáticamente
3. Selecciona el cliente deseado

### Criterios de Búsqueda

Busca en:
- Nombre
- Apellido
- Email
- Teléfono

---

## Reportes de Clientes

### Información Disponible

En reportes puedes ver:

| Dato | Descripción |
|------|-------------|
| Total de clientes | Cantidad registrada |
| Clientes activos/inactivos | Estado |
| Compras por cliente | Historial de ventas |
| Total gastado | Monto acumulado |

---

[Anterior: Devoluciones](./05-RETURNS.md) | [Siguiente: Faltantes y Sobrantes](./07-CASH-ADJ.md)
