import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { ForbiddenError } from '../errors/ForbiddenError.js'

export class SalesModel {
  constructor (salesRepository, inventoryRepository, itemsRepository, paymentRepository = null) {
    this.salesRepo = salesRepository
    this.inventoryRepo = inventoryRepository
    this.itemsRepo = itemsRepository
    this.paymentRepo = paymentRepository
  }

  async createSale (data, userId, userLocations = [], isAdmin = false, companyId = null) {
    const { customer_id, location_id, items, notes, sale_date } = data

    if (!location_id) {
      throw new BadRequestError('Location is required')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(location_id)) {
      throw new ForbiddenError('No tienes permiso para crear ventas en esta ubicación')
    }

    // Obtener cajón abierto para vincular la venta
    let drawerId = null
    if (this.paymentRepo) {
      const openDrawer = await this.paymentRepo.getOpenDrawer(location_id, userId, companyId)
      if (openDrawer) {
        drawerId = openDrawer.id
      }
    }

    if (!items || items.length === 0) {
      throw new BadRequestError('La venta debe tener al menos un ítem')
    }

    const saleNumber = await this.salesRepo.generateSaleNumber(companyId)

    let subtotal = 0
    let totalDiscount = 0
    let totalTax = 0

    for (const item of items) {
      const itemData = await this.itemsRepo.getById(item.item_id, null, companyId)
      if (!itemData) {
        throw new NotFoundError(`Producto ${item.item_id} no encontrado`)
      }

      const quantity = parseFloat(item.quantity)
      const unitPrice = parseFloat(item.unit_price || itemData.unit_price)
      const discount = parseFloat(item.discount_amount || 0)
      const tax = parseFloat(item.tax_amount || 0)

      subtotal += (unitPrice * quantity)
      totalDiscount += discount
      totalTax += tax
    }

    const total = subtotal - totalDiscount + totalTax

    const saleId = await this.salesRepo.createSale({
      sale_number: saleNumber,
      company_id: companyId,
      customer_id,
      created_by: userId,
      location_id,
      drawer_id: drawerId,
      subtotal,
      discount_amount: totalDiscount,
      tax_amount: totalTax,
      total,
      notes,
      status: 'pending',
      sale_date
    })

    for (const item of items) {
      const itemData = await this.itemsRepo.getById(item.item_id, null, companyId)
      const quantity = parseFloat(item.quantity)
      const unitPrice = parseFloat(item.unit_price || itemData.unit_price)
      const discount = parseFloat(item.discount_amount || 0)
      const tax = parseFloat(item.tax_amount || 0)
      const lineTotal = (unitPrice * quantity) - discount + tax

      await this.salesRepo.addSaleItem({
        sale_id: saleId,
        item_id: item.item_id,
        variation_id: item.variation_id,
        serial_number: item.serial_number,
        quantity,
        unit_price: unitPrice,
        discount_amount: discount,
        tax_amount: tax,
        cost_price: itemData.cost_price,
        line_total: lineTotal,
        unit_abbreviation: item.unit_abbreviation,
        unit_name: item.unit_name
      })
    }

    return await this.salesRepo.getByIdWithDetails(saleId, companyId)
  }

  async createAndCompleteSale (data, userId, userLocations = [], isAdmin = false, companyId = null) {
    const { customer_id, location_id, items, payments, notes, sale_date } = data

    if (!location_id) {
      throw new BadRequestError('Location is required')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(location_id)) {
      throw new ForbiddenError('No tienes permiso para crear ventas en esta ubicación')
    }

    if (!items || items.length === 0) {
      throw new BadRequestError('La venta debe tener al menos un ítem')
    }

    if (!payments || payments.length === 0) {
      throw new BadRequestError('La venta debe tener al menos un pago')
    }

    let drawerId = null
    if (this.paymentRepo) {
      try {
        const openDrawer = await this.paymentRepo.getOpenDrawer(location_id, userId, companyId)
        if (openDrawer) {
          drawerId = openDrawer.id
        }
      } catch (e) {
        // No open drawer - continue without drawerId
      }
    }

    const saleNumber = await this.salesRepo.generateSaleNumber(companyId)

    let subtotal = 0
    let totalDiscount = 0
    let totalTax = 0

    for (const item of items) {
      const itemData = await this.itemsRepo.getById(item.item_id, null, companyId)
      if (!itemData) {
        throw new NotFoundError(`Producto ${item.item_id} no encontrado`)
      }

      const quantity = parseFloat(item.quantity)
      const unitPrice = parseFloat(item.unit_price || itemData.unit_price)
      const discount = parseFloat(item.discount_amount || 0)
      const tax = parseFloat(item.tax_amount || 0)

      subtotal += (unitPrice * quantity)
      totalDiscount += discount
      totalTax += tax
    }

    const total = subtotal - totalDiscount + totalTax
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    if (totalPaid < total) {
      throw new BadRequestError('El pago total es menor al total de la venta')
    }

    const conn = this.salesRepo.db
    try {
      const dbConn = await conn.getConnection()
      await dbConn.beginTransaction()

      const saleId = await this.salesRepo.createSaleWithConnection(dbConn, {
        sale_number: saleNumber,
        company_id: companyId,
        customer_id,
        created_by: userId,
        location_id,
        drawer_id: drawerId,
        subtotal,
        discount_amount: totalDiscount,
        tax_amount: totalTax,
        total,
        notes,
        status: 'completed',
        sale_date
      })

      for (const item of items) {
        const itemData = await this.itemsRepo.getById(item.item_id, null, companyId)
        const quantity = parseFloat(item.quantity)
        const unitPrice = parseFloat(item.unit_price || itemData.unit_price)
        const discount = parseFloat(item.discount_amount || 0)
        const tax = parseFloat(item.tax_amount || 0)
        const lineTotal = (unitPrice * quantity) - discount + tax

        await this.salesRepo.addSaleItemWithConnection(dbConn, {
          sale_id: saleId,
          item_id: item.item_id,
          variation_id: item.variation_id,
          serial_number: item.serial_number,
          quantity,
          unit_price: unitPrice,
          discount_amount: discount,
          tax_amount: tax,
          cost_price: itemData.cost_price,
          line_total: lineTotal,
          unit_abbreviation: item.unit_abbreviation,
          unit_name: item.unit_name
        })
      }

      for (const payment of payments) {
        await this.salesRepo.addPaymentWithConnection(dbConn, {
          sale_id: saleId,
          payment_type: payment.payment_type,
          amount: payment.amount,
          transaction_id: payment.transaction_id,
          reference_number: payment.reference_number,
          notes: payment.notes
        })
      }

      for (const item of items) {
        const quantityNeeded = parseFloat(item.quantity)
        const itemData = await this.itemsRepo.getById(item.item_id, null, companyId)

        if (itemData.is_kit && itemData.kit_components?.length > 0) {
          for (const comp of itemData.kit_components) {
            const compQtyNeeded = parseFloat(comp.quantity) * quantityNeeded
            const currentStock = await this.inventoryRepo.getTotalStock(
              comp.item_id,
              item.variation_id,
              location_id
            )

            if (currentStock < compQtyNeeded) {
              throw new BadRequestError(
                `Stock insuficiente para el componente ${comp.item_name} del kit ${itemData.name}`
              )
            }

            await this.inventoryRepo.updateStock(
              comp.item_id,
              item.variation_id,
              location_id,
              compQtyNeeded,
              userId,
              false
            )

            await this.inventoryRepo.createMovement({
              item_id: comp.item_id,
              variation_id: item.variation_id,
              location_id,
              movement_type: 'sale',
              quantity: -compQtyNeeded,
              quantity_before: currentStock,
              quantity_after: currentStock - compQtyNeeded,
              unit_cost: item.cost_price,
              total_cost: item.cost_price * compQtyNeeded,
              reference_type: 'sale',
              reference_id: saleId,
              serial_numbers: null,
              user_id: userId,
              notes: `Kit sale: ${itemData.name} (Sale #${saleNumber})`
            })
          }
        } else {
          const currentStock = await this.inventoryRepo.getTotalStock(
            item.item_id,
            item.variation_id,
            location_id
          )

          if (currentStock < quantityNeeded) {
            throw new BadRequestError(`Stock insuficiente para el producto ${item.item_id}`)
          }

          await this.inventoryRepo.updateStock(
            item.item_id,
            item.variation_id,
            location_id,
            quantityNeeded,
            userId,
            false
          )

          await this.inventoryRepo.createMovement({
            item_id: item.item_id,
            variation_id: item.variation_id,
            location_id,
            movement_type: 'sale',
            quantity: -quantityNeeded,
            quantity_before: currentStock,
            quantity_after: currentStock - quantityNeeded,
            unit_cost: item.cost_price,
            total_cost: item.cost_price * quantityNeeded,
            reference_type: 'sale',
            reference_id: saleId,
            serial_numbers: item.serial_number,
            user_id: userId,
            notes: `Sale #${saleNumber}`
          })
        }
      }

      await dbConn.commit()
      dbConn.release()

      return await this.salesRepo.getByIdWithDetails(saleId, companyId)
    } catch (error) {
      try {
        const dbConn = await conn.getConnection()
        await dbConn.rollback()
        dbConn.release()
      } catch (e) {}
      throw error
    }
  }

  async completeSale (saleId, payments, userId, userLocations = [], isAdmin = false, companyId = null) {
    const sale = await this.salesRepo.getById(saleId, companyId)
    if (!sale) {
      throw new NotFoundError('Venta no encontrada')
    }

    if (sale.status !== 'pending') {
      throw new BadRequestError('La venta no puede ser completada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(sale.location_id)) {
      throw new ForbiddenError('No tienes permiso para completar ventas en esta ubicación')
    }

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    if (totalPaid < sale.total) {
      throw new BadRequestError('El pago total es menor al total de la venta')
    }

    const conn = this.salesRepo.db
    try {
      const dbConn = await conn.getConnection()
      await dbConn.beginTransaction()

      for (const payment of payments) {
        await this.salesRepo.addPaymentWithConnection(dbConn, {
          sale_id: saleId,
          payment_type: payment.payment_type,
          amount: payment.amount,
          transaction_id: payment.transaction_id,
          reference_number: payment.reference_number,
          notes: payment.notes
        })
      }

      const items = await this.salesRepo.getItemsBySaleId(saleId, companyId)
      const affectedKits = new Set()

      for (const item of items) {
        const quantityNeeded = parseFloat(item.quantity)
        const itemData = await this.itemsRepo.getById(item.item_id, null, companyId)

        if (itemData.is_kit && itemData.kit_components?.length > 0) {
          for (const comp of itemData.kit_components) {
            const compQtyNeeded = parseFloat(comp.quantity) * quantityNeeded
            const currentStock = await this.inventoryRepo.getTotalStock(
              comp.item_id,
              item.variation_id,
              sale.location_id
            )

            if (currentStock < compQtyNeeded) {
              throw new BadRequestError(
                `Stock insuficiente para el componente ${comp.item_name} del kit ${itemData.name}`
              )
            }

            await this.inventoryRepo.updateStock(
              comp.item_id,
              item.variation_id,
              sale.location_id,
              compQtyNeeded,
              userId,
              false
            )

            await this.inventoryRepo.createMovement({
              item_id: comp.item_id,
              variation_id: item.variation_id,
              location_id: sale.location_id,
              movement_type: 'sale',
              quantity: -compQtyNeeded,
              quantity_before: currentStock,
              quantity_after: currentStock - compQtyNeeded,
              unit_cost: item.cost_price,
              total_cost: item.cost_price * compQtyNeeded,
              reference_type: 'sale',
              reference_id: saleId,
              serial_numbers: null,
              user_id: userId,
              notes: `Kit sale: ${itemData.name} (Sale #${sale.sale_number})`
            })

            const kitsUsingThis = await this.itemsRepo.getKitsByComponent(comp.item_id)
            for (const kit of kitsUsingThis) {
              affectedKits.add(kit.kit_item_id)
            }
          }
        } else {
          const currentStock = await this.inventoryRepo.getTotalStock(
            item.item_id,
            item.variation_id,
            sale.location_id
          )

          if (currentStock < quantityNeeded) {
            throw new BadRequestError(`Stock insuficiente para el producto ${item.item_id}`)
          }

          await this.inventoryRepo.updateStock(
            item.item_id,
            item.variation_id,
            sale.location_id,
            quantityNeeded,
            userId,
            false
          )

          await this.inventoryRepo.createMovement({
            item_id: item.item_id,
            variation_id: item.variation_id,
            location_id: sale.location_id,
            movement_type: 'sale',
            quantity: -quantityNeeded,
            quantity_before: currentStock,
            quantity_after: currentStock - quantityNeeded,
            unit_cost: item.cost_price,
            total_cost: item.cost_price * quantityNeeded,
            reference_type: 'sale',
            reference_id: saleId,
            serial_numbers: item.serial_number,
            user_id: userId,
            notes: `Sale #${sale.sale_number}`
          })

          if (itemData.is_part_of_kit) {
            const kitsUsingThis = await this.itemsRepo.getKitsByComponent(item.item_id)
            for (const kit of kitsUsingThis) {
              affectedKits.add(kit.kit_item_id)
            }
          }
        }
      }

      await this.salesRepo.updateSaleWithConnection(dbConn, saleId, { status: 'completed' }, companyId)

      await dbConn.commit()
      dbConn.release()

    return await this.salesRepo.getByIdWithDetails(saleId, companyId)
    } catch (error) {
      const dbConn = await conn.getConnection()
      await dbConn.rollback()
      dbConn.release()
      throw error
    }
  }

  async suspendSale (saleId, data, userId, userLocations = [], isAdmin = false, companyId = null) {
    const sale = await this.salesRepo.getById(saleId, companyId)
    if (!sale) {
      throw new NotFoundError('Venta no encontrada')
    }

    if (sale.status !== 'pending') {
      throw new BadRequestError('Solo se pueden suspender ventas pendientes')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(sale.location_id)) {
      throw new ForbiddenError('No tienes permiso para suspender ventas en esta ubicación')
    }

    const { payments_made = 0, due_date, notes } = data
    const balance_due = sale.total - payments_made

    await this.salesRepo.suspendSale({
      sale_id: saleId,
      payments_made,
      balance_due,
      due_date,
      notes
    })

    return await this.salesRepo.getByIdWithDetails(saleId)
  }

  async resumeSale (saleId, userId, userLocations = [], isAdmin = false, companyId = null) {
    const sale = await this.salesRepo.getById(saleId, companyId)
    if (!sale) {
      throw new NotFoundError('Venta no encontrada')
    }

    if (sale.status !== 'suspended') {
      throw new BadRequestError('Solo se pueden reanudar ventas suspendidas')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(sale.location_id)) {
      throw new ForbiddenError('No tienes permiso para reanudar ventas en esta ubicación')
    }

    await this.salesRepo.resumeSale(saleId)
    return await this.salesRepo.getByIdWithDetails(saleId)
  }

  async cancelSale (saleId, notes, userId, userLocations = [], isAdmin = false, companyId = null) {
    const sale = await this.salesRepo.getById(saleId, companyId)
    if (!sale) {
      throw new NotFoundError('Venta no encontrada')
    }

    if (sale.status === 'cancelled') {
      throw new BadRequestError('La venta ya está cancelada')
    }

    if (sale.status === 'completed') {
      throw new BadRequestError('No se puede cancelar una venta completada. Use returns.')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(sale.location_id)) {
      throw new ForbiddenError('No tienes permiso para cancelar ventas en esta ubicación')
    }

    await this.salesRepo.cancelSale(saleId, notes)
    return await this.salesRepo.getById(saleId)
  }

  async getSale (saleId, userLocations = [], isAdmin = false, companyId = null) {
    const sale = await this.salesRepo.getById(saleId, companyId)
    if (!sale) {
      throw new NotFoundError('Venta no encontrada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(sale.location_id)) {
      throw new ForbiddenError('No tienes permiso para ver esta venta')
    }

    return await this.salesRepo.getByIdWithDetails(saleId, companyId)
  }

  async getSales (filters = {}, userLocations = [], isAdmin = false) {
    const { location_id } = filters

    if (!isAdmin && userLocations.length > 0 && location_id && !userLocations.includes(location_id)) {
      throw new ForbiddenError('No tienes permiso para ver ventas de esta ubicación')
    }

    const processedFilters = { ...filters }
    if (!isAdmin && userLocations.length > 0 && !location_id) {
      processedFilters.location_id = userLocations[0]
    }

    const sales = await this.salesRepo.getAll(processedFilters)
    const total = await this.salesRepo.getCount(processedFilters)

    return { sales, total }
  }

  async getDailySales (locationId, date, userLocations = [], isAdmin = false) {
    if (!isAdmin && userLocations.length > 0 && locationId && !userLocations.includes(locationId)) {
      throw new ForbiddenError('No tienes permiso para ver ventas de esta ubicación')
    }

    const location = locationId || (userLocations.length > 0 ? userLocations[0] : null)
    return await this.salesRepo.getDailySales(location, date)
  }

  async getSalesSummary (locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    if (!isAdmin && userLocations.length > 0 && locationId && !userLocations.includes(locationId)) {
      throw new ForbiddenError('No tienes permiso para ver reportes de esta ubicación')
    }

    const location = locationId || (userLocations.length > 0 ? userLocations[0] : null)
    return await this.salesRepo.getSalesSummary(location, startDate, endDate)
  }

  async getTopSellingItems (locationId, startDate, endDate, limit = 10, userLocations = [], isAdmin = false) {
    if (!isAdmin && userLocations.length > 0 && locationId && !userLocations.includes(locationId)) {
      throw new ForbiddenError('No tienes permiso para ver reportes de esta ubicación')
    }

    const location = locationId || (userLocations.length > 0 ? userLocations[0] : null)
    return await this.salesRepo.getTopSellingItems(location, startDate, endDate, limit)
  }

  async getSuspendedSales (locationId = null, userLocations = [], isAdmin = false, companyId = null) {
    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(locationId)) {
      throw new ForbiddenError('No tienes permiso para ver ventas suspendidas')
    }

    const location = locationId || (userLocations.length > 0 ? userLocations[0] : null)
    return await this.salesRepo.getSuspendedSales(location, companyId)
  }

  async updateSaleItem (saleItemId, data, userId, userLocations = [], isAdmin = false) {
    const items = await this.salesRepo.db.query(
      'SELECT si.*, s.location_id, s.status FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.id = ?',
      [saleItemId]
    )

    if (items.length === 0) {
      throw new NotFoundError('Ítem de venta no encontrado')
    }

    const saleItem = items[0]

    if (saleItem.status !== 'pending') {
      throw new BadRequestError('Solo se pueden modificar ítems de ventas pendientes')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(saleItem.location_id)) {
      throw new ForbiddenError('No tienes permiso para modificar esta venta')
    }

    await this.salesRepo.updateSaleItem(saleItemId, data)
    return await this.salesRepo.getById(saleItem.sale_id)
  }

  async removeSaleItem (saleItemId, userId, userLocations = [], isAdmin = false) {
    const items = await this.salesRepo.db.query(
      'SELECT si.*, s.location_id, s.status FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.id = ?',
      [saleItemId]
    )

    if (items.length === 0) {
      throw new NotFoundError('Ítem de venta no encontrado')
    }

    const saleItem = items[0]

    if (saleItem.status !== 'pending') {
      throw new BadRequestError('Solo se pueden eliminar ítems de ventas pendientes')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(saleItem.location_id)) {
      throw new ForbiddenError('No tienes permiso para modificar esta venta')
    }

    await this.salesRepo.deleteSaleItem(saleItemId)
    return await this.salesRepo.getById(saleItem.sale_id)
  }

  async addPaymentToSale (saleId, payment, userId, userLocations = [], isAdmin = false, companyId = null) {
    const sale = await this.salesRepo.getById(saleId, companyId)
    if (!sale) {
      throw new NotFoundError('Venta no encontrada')
    }

    if (sale.status === 'cancelled') {
      throw new BadRequestError('No se puede agregar pagos a una venta cancelada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(sale.location_id)) {
      throw new ForbiddenError('No tienes permiso para modificar esta venta')
    }

    await this.salesRepo.addPayment({
      sale_id: saleId,
      payment_type: payment.payment_type,
      amount: payment.amount,
      transaction_id: payment.transaction_id,
      reference_number: payment.reference_number,
      notes: payment.notes
    })

    return await this.salesRepo.getByIdWithDetails(saleId)
  }
}

export class ReturnsModel {
  constructor (returnsRepository, salesRepository, inventoryRepository, itemsRepository, paymentRepository = null) {
    this.returnsRepo = returnsRepository
    this.salesRepo = salesRepository
    this.inventoryRepo = inventoryRepository
    this.itemsRepo = itemsRepository
    this.paymentRepo = paymentRepository
  }

  async createReturn (data, userId, userLocations = [], isAdmin = false, companyId = null) {
    const { sale_id, items, refund_method, notes, return_date, return_type } = data

    if (!return_type || !['refund', 'exchange'].includes(return_type)) {
      throw new BadRequestError('El tipo de devolución es obligatorio y debe ser "refund" o "exchange"')
    }

    const finalReturnType = return_type

    const sale = await this.salesRepo.getById(sale_id, companyId)
    if (!sale) {
      throw new NotFoundError('Venta no encontrada')
    }

    if (sale.status !== 'completed') {
      throw new BadRequestError('Solo se pueden devolver ventas completadas')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(sale.location_id)) {
      throw new ForbiddenError('No tienes permiso para procesar devoluciones en esta ubicación')
    }

    if (!items || items.length === 0) {
      throw new BadRequestError('La devolución debe tener al menos un ítem')
    }

    const saleItems = await this.salesRepo.getItemsBySaleId(sale_id, companyId)

    for (const returnItem of items) {
      const originalSaleItem = saleItems.find(si => {
        if (returnItem.sale_item_id && si.id === returnItem.sale_item_id) return true
        if (returnItem.item_id && si.item_id === returnItem.item_id) return true
        return false
      })

      if (!originalSaleItem) {
        throw new BadRequestError(`Ítem de venta no encontrado para la devolución`)
      }

      const alreadyReturned = await this.returnsRepo.getAlreadyReturnedQuantity(originalSaleItem.id, companyId)
      const returnQty = parseFloat(returnItem.quantity)
      const availableToReturn = parseFloat(originalSaleItem.quantity) - alreadyReturned

      if (returnQty > availableToReturn) {
        throw new BadRequestError(
          `No se puede devolver más de lo vendido para "${originalSaleItem.item_name}". ` +
          `Vendidos: ${originalSaleItem.quantity}, Ya devueltos: ${alreadyReturned}, ` +
          `Disponible: ${availableToReturn}, Solicitado: ${returnQty}`
        )
      }
    }

    let subtotal = 0
    let totalTax = 0

    for (const item of items) {
      const quantity = parseFloat(item.quantity)
      const unitPrice = parseFloat(item.unit_price)
      const tax = parseFloat(item.tax_amount || 0)

      subtotal += (unitPrice * quantity)
      totalTax += tax
    }

    const total = subtotal + totalTax

    const conn = await this.returnsRepo.db.getConnection()
    try {
      await conn.beginTransaction()

      // Generate number WITHIN the transaction
      const seqResult = await this.returnsRepo.sequenceRepo.getNextWithConnection(conn, companyId, 'return')
      const returnNumber = seqResult.docNumber

      const returnId = await this.returnsRepo.createReturnWithConnection(conn, {
        return_number: returnNumber,
        company_id: companyId,
        sale_id,
        employee_id: userId,
        location_id: sale.location_id,
        subtotal,
        tax_amount: totalTax,
        total,
        refund_method,
        notes,
        return_date,
        return_type: finalReturnType
      })

      for (const item of items) {
        await this.returnsRepo.addReturnItem({
          return_id: returnId,
          sale_item_id: item.sale_item_id,
          item_id: item.item_id,
          variation_id: item.variation_id,
          serial_number: item.serial_number,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_amount: item.tax_amount || 0,
          line_total: (item.unit_price * item.quantity) + (item.tax_amount || 0),
          reason: item.reason,
          condition: item.condition || 'new'
        }, conn)
      }

      await conn.commit()
      conn.release()

      return await this.returnsRepo.getById(returnId, companyId)
    } catch (error) {
      await conn.rollback()
      conn.release()
      throw error
    }
  }

  async processReturn (returnId, userId, userLocations = [], isAdmin = false, companyId = null) {
    const returnData = await this.returnsRepo.getById(returnId, companyId)
    if (!returnData) {
      throw new NotFoundError('Devolución no encontrada')
    }

    if (returnData.status === 'completed') {
      throw new BadRequestError('Esta devolución ya fue procesada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(returnData.location_id)) {
      throw new ForbiddenError('No tienes permiso para procesar devoluciones en esta ubicación')
    }

    const items = await this.returnsRepo.getItemsByReturnId(returnId, companyId)
    const conn = this.returnsRepo.db

    try {
      const dbConn = await conn.getConnection()
      await dbConn.beginTransaction()

      if (returnData.return_type === 'exchange') {
        await dbConn.query(
          `UPDATE returns SET status = ? WHERE id = UUID_TO_BIN(?)`,
          ['completed', returnId]
        )
        await dbConn.commit()
        dbConn.release()
        return await this.returnsRepo.getById(returnId, companyId)
      }

      for (const item of items) {
        const itemData = await this.itemsRepo.getById(item.item_id, null, companyId)

        if (itemData.is_kit && itemData.kit_components?.length > 0) {
          for (const comp of itemData.kit_components) {
            const compQtyReturned = parseFloat(comp.quantity) * parseFloat(item.quantity)

            const currentStockRows = await dbConn.query(
              `SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND (variation_id = UUID_TO_BIN(?) OR (variation_id IS NULL AND ? IS NULL)) AND location_id = UUID_TO_BIN(?)`,
              [comp.item_id, item.variation_id || null, item.variation_id || null, returnData.location_id]
            )

            const quantityBefore = currentStockRows.length > 0 ? Number(currentStockRows[0].quantity) : 0
            const quantityAfter = quantityBefore + compQtyReturned

            if (currentStockRows.length > 0) {
              await dbConn.query(
                `UPDATE item_quantities SET quantity = ?, updated_at = NOW() WHERE item_id = UUID_TO_BIN(?) AND (variation_id = UUID_TO_BIN(?) OR (variation_id IS NULL AND ? IS NULL)) AND location_id = UUID_TO_BIN(?)`,
                [quantityAfter, comp.item_id, item.variation_id || null, item.variation_id || null, returnData.location_id]
              )
            } else {
              await dbConn.query(
                `INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity, created_by) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), ?, UUID_TO_BIN(?), ?, UUID_TO_BIN(?))`,
                [comp.item_id, item.variation_id || null, returnData.location_id, quantityAfter, userId]
              )
            }

            const movementUUID = crypto.randomUUID()
            await dbConn.query(
              `INSERT INTO inventory_movements (id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, user_id, notes)
               VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, UUID_TO_BIN(?), 'return', ?, ?, ?, 'return', UUID_TO_BIN(?), UUID_TO_BIN(?), ?)`,
              [movementUUID, comp.item_id, item.variation_id || null, returnData.location_id, compQtyReturned, quantityBefore, quantityAfter, returnId, userId, `Devolución kit: ${itemData.name}`]
            )
          }
        } else {
          const currentStockRows = await dbConn.query(
            `SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND (variation_id = UUID_TO_BIN(?) OR (variation_id IS NULL AND ? IS NULL)) AND location_id = UUID_TO_BIN(?)`,
            [item.item_id, item.variation_id || null, item.variation_id || null, returnData.location_id]
          )

          const quantityBefore = currentStockRows.length > 0 ? Number(currentStockRows[0].quantity) : 0
          const quantityAfter = quantityBefore + parseFloat(item.quantity)

          if (currentStockRows.length > 0) {
            await dbConn.query(
              `UPDATE item_quantities SET quantity = ?, updated_at = NOW() WHERE item_id = UUID_TO_BIN(?) AND (variation_id = UUID_TO_BIN(?) OR (variation_id IS NULL AND ? IS NULL)) AND location_id = UUID_TO_BIN(?)`,
              [quantityAfter, item.item_id, item.variation_id || null, item.variation_id || null, returnData.location_id]
            )
          } else {
            await dbConn.query(
              `INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity, created_by) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), ?, UUID_TO_BIN(?), ?, UUID_TO_BIN(?))`,
              [item.item_id, item.variation_id || null, returnData.location_id, quantityAfter, userId]
            )
          }

          const movementUUID = crypto.randomUUID()
          await dbConn.query(
            `INSERT INTO inventory_movements (id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, user_id, notes)
             VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, UUID_TO_BIN(?), 'return', ?, ?, ?, 'return', UUID_TO_BIN(?), UUID_TO_BIN(?), ?)`,
            [movementUUID, item.item_id, item.variation_id || null, returnData.location_id, item.quantity, quantityBefore, quantityAfter, returnId, userId, `Devolución: ${item.reason || 'N/A'}`]
          )
        }
      }

      let drawerId = null

      if (this.paymentRepo && returnData.refund_method === 'cash') {
        const openDrawer = await this.paymentRepo.getOpenDrawer(returnData.location_id, userId, companyId)
        if (openDrawer) {
          drawerId = openDrawer.id

          const refundAmount = -Math.abs(returnData.total)

          const refundPaymentUUID = crypto.randomUUID()
          await dbConn.query(
            `INSERT INTO sale_payments (id, sale_id, payment_type, amount, transaction_id, reference_number, notes)
             VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?)`,
            [refundPaymentUUID, returnData.sale_id, 'cash', refundAmount, `REF-${returnData.return_number}`, returnData.return_number, `Reembolso de devolución ${returnData.return_number}`]
          )

          const drawerTransactionUUID = crypto.randomUUID()
          await dbConn.query(
            `INSERT INTO drawer_transactions (id, drawer_id, company_id, transaction_type, amount, notes, created_by)
             VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), 'refund', ?, ?, UUID_TO_BIN(?))`,
            [drawerTransactionUUID, drawerId, companyId, Math.abs(refundAmount), `Reembolso de ${returnData.return_number}`, userId]
          )

          const [drawerRows] = await dbConn.query(
            `SELECT current_amount FROM cash_drawers WHERE id = UUID_TO_BIN(?)`,
            [drawerId]
          )

          if (drawerRows.length > 0) {
            const newAmount = parseFloat(drawerRows[0].current_amount) + Math.abs(refundAmount)
            await dbConn.query(
              `UPDATE cash_drawers SET current_amount = ? WHERE id = UUID_TO_BIN(?)`,
              [newAmount, drawerId]
            )
          }
        }
      }

      await dbConn.query(
        `UPDATE returns SET status = ?, drawer_id = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)`,
        ['completed', drawerId, returnId]
      )

      await dbConn.commit()
      dbConn.release()

      return await this.returnsRepo.getById(returnId, companyId)
    } catch (error) {
      const dbConn = await conn.getConnection()
      await dbConn.rollback()
      dbConn.release()
      throw error
    }
  }

  async getReturn (returnId, companyId, userLocations = [], isAdmin = false) {
    const returnData = await this.returnsRepo.getById(returnId, companyId)
    if (!returnData) {
      throw new NotFoundError('Devolución no encontrada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(returnData.location_id)) {
      throw new ForbiddenError('No tienes permiso para ver esta devolución')
    }

    const items = await this.returnsRepo.getItemsByReturnId(returnId, companyId)
    return { ...returnData, items }
  }

  async getReturns (filters = {}, userLocations = [], isAdmin = false) {
    const { location_id } = filters

    if (!isAdmin && userLocations.length > 0 && location_id && !userLocations.includes(location_id)) {
      throw new ForbiddenError('No tienes permiso para ver devoluciones de esta ubicación')
    }

    const processedFilters = { ...filters }
    if (!isAdmin && userLocations.length > 0 && !location_id) {
      processedFilters.location_id = userLocations[0]
    }

    return await this.returnsRepo.getAll(processedFilters)
  }
}
