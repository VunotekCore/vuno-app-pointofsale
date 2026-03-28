import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'

export class AdjustmentModel {
  constructor (adjustmentRepository, inventoryRepository, itemsRepository) {
    this.adjustmentRepo = adjustmentRepository
    this.inventoryRepo = inventoryRepository
    this.itemsRepo = itemsRepository
  }

  async getAll (filters = {}) {
    return await this.adjustmentRepo.getAll(filters)
  }

  async getById (id) {
    const adjustment = await this.adjustmentRepo.getById(id)
    if (!adjustment) {
      throw new NotFoundError('Ajuste no encontrado')
    }
    const items = await this.adjustmentRepo.getItems(id)
    return { ...adjustment, items }
  }

  async create (data, userId) {
    const adjustmentNumber = await this.adjustmentRepo.getNextNumber()

    const id = await this.adjustmentRepo.create({
      adjustment_number: adjustmentNumber,
      location_id: data.location_id,
      adjustment_type: data.adjustment_type,
      notes: data.notes,
      status: 'draft',
      created_by: userId
    })

    return id
  }

  async addItem (data, userId) {
    const item = await this.itemsRepo.getById(data.item_id)
    if (!item) {
      throw new NotFoundError('Producto no encontrado')
    }

    const adjustment = await this.adjustmentRepo.getById(data.adjustment_id)
    if (!adjustment) {
      throw new NotFoundError('Ajuste no encontrado')
    }

    const currentStock = await this.inventoryRepo.getTotalStock(
      data.item_id,
      data.variation_id,
      adjustment.location_id
    )

    const unitCostValue = data.unit_cost !== undefined && data.unit_cost !== null && data.unit_cost !== ''
      ? parseFloat(data.unit_cost)
      : parseFloat(item.cost_price || 0)

    await this.adjustmentRepo.addItem({
      adjustment_id: data.adjustment_id,
      item_id: data.item_id,
      variation_id: data.variation_id,
      quantity_before: currentStock,
      quantity_counted: data.quantity_counted,
      quantity_difference: parseFloat(data.quantity_counted) - currentStock,
      unit_cost: unitCostValue,
      reason: data.reason,
      created_by: userId
    })

    await this.adjustmentRepo.updateTotals(data.adjustment_id)
  }

  async removeItem (adjustmentId, itemId) {
    await this.adjustmentRepo.deleteItem(adjustmentId, itemId)
    await this.adjustmentRepo.updateTotals(adjustmentId)
  }

  async confirm (id, userId) {
    const adjustment = await this.adjustmentRepo.getById(id)
    if (!adjustment) {
      throw new NotFoundError('Ajuste no encontrado')
    }

    if (adjustment.status !== 'draft') {
      throw new BadRequestError('Solo se pueden confirmar ajustes en estado borrador')
    }

    const items = await this.adjustmentRepo.getItems(id)
    if (items.length === 0) {
      throw new BadRequestError('El ajuste no tiene items')
    }

    for (const item of items) {
      if (parseFloat(item.quantity_difference) > 0) {
        const currentStock = await this.inventoryRepo.getTotalStock(item.item_id, item.variation_id)
        const currentCost = parseFloat((await this.itemsRepo.getById(item.item_id)).cost_price || 0)
        const newQuantity = parseFloat(item.quantity_difference)
        const newCost = parseFloat(item.unit_cost || 0)

        const totalCurrentValue = currentStock * currentCost
        const totalNewValue = newQuantity * newCost
        const totalQuantity = currentStock + newQuantity

        let averageCost = currentCost
        if (totalQuantity > 0) {
          averageCost = (totalCurrentValue + totalNewValue) / totalQuantity
        }
        averageCost = Math.round(averageCost * 100) / 100

        if (averageCost !== currentCost) {
          await this.itemsRepo.update(item.item_id, { cost_price: averageCost }, userId)
        }
      }
    }

    await this.adjustmentRepo.confirm(id, userId)
    return true
  }

  async cancel (id, userId) {
    const adjustment = await this.adjustmentRepo.getById(id)
    if (!adjustment) {
      throw new NotFoundError('Ajuste no encontrado')
    }

    if (adjustment.status === 'completed') {
      throw new BadRequestError('No se puede cancelar un ajuste completado')
    }

    await this.adjustmentRepo.cancel(id, userId)
    return true
  }

  async getItemStock (itemId, variationId = null, adjustmentId = null) {
    let locationId = null

    if (adjustmentId) {
      const adjustment = await this.adjustmentRepo.getById(adjustmentId)
      if (adjustment) {
        locationId = adjustment.location_id
      }
    }

    return await this.inventoryRepo.getTotalStock(itemId, variationId, locationId)
  }

  async createWithTransaction (data) {
    const { location_id, adjustment_type, notes, item_id, variation_id, quantity, movement_type, userId } = data

    const adjustmentNumber = await this.adjustmentRepo.generateUniqueNumber()
    const adjustmentUUID = await this.adjustmentRepo.createWithTransaction({
      adjustment_number: adjustmentNumber,
      location_id,
      adjustment_type,
      notes,
      created_by: userId,
      item_id,
      variation_id,
      quantity,
      movement_type
    })

    return { id: adjustmentUUID, adjustment_number: adjustmentNumber }
  }
}
