import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { ForbiddenError } from '../errors/ForbiddenError.js'

export class InventoryModel {
  constructor (inventoryRepository, itemsRepository) {
    this.inventoryRepo = inventoryRepository
    this.itemsRepo = itemsRepository
  }

  async getStockByLocation (filters = {}) {
    return await this.inventoryRepo.getStockByLocation(filters)
  }

  async adjustStock (data, userId, userLocations = [], isAdmin = false) {
    const { item_id, variation_id, location_id, quantity, movement_type, notes, unit_cost } = data

    if (!item_id || !location_id || !quantity) {
      throw new BadRequestError('Faltan datos requeridos')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(location_id)) {
      throw new ForbiddenError('No tienes permiso para modificar stock en esta ubicación')
    }

    const item = await this.itemsRepo.getById(item_id)
    if (!item) {
      throw new NotFoundError('Producto no encontrado')
    }

    const isEntry = ['adjustment_in', 'found'].includes(movement_type)

    const { quantityBefore, quantityAfter, signedQuantity } = await this.inventoryRepo.updateStock(
      item_id, variation_id, location_id, parseFloat(quantity), userId, isEntry
    )

    const movementTypes = {
      adjustment_in: 'adjustment',
      adjustment_out: 'adjustment',
      damaged: 'damaged',
      lost: 'lost',
      found: 'found'
    }

    let finalUnitCost = (unit_cost !== undefined && unit_cost !== '' && unit_cost !== null)
      ? parseFloat(unit_cost)
      : parseFloat(item.cost_price || 0)

    if (isNaN(finalUnitCost)) {
      finalUnitCost = parseFloat(item.cost_price || 0)
    }

    if (isEntry && finalUnitCost !== parseFloat(item.cost_price || 0)) {
      const currentStock = await this.inventoryRepo.getTotalStock(item_id)
      const currentCost = parseFloat(item.cost_price || 0)
      const newQuantity = parseFloat(quantity)
      const newCost = finalUnitCost

      const totalCurrentValue = currentStock * currentCost
      const totalNewValue = newQuantity * newCost
      const totalQuantity = currentStock + newQuantity

      let averageCost = currentCost
      if (totalQuantity > 0) {
        averageCost = (totalCurrentValue + totalNewValue) / totalQuantity
      }

      averageCost = Math.round(averageCost * 100) / 100

      await this.itemsRepo.update(item_id, { cost_price: averageCost }, userId)

      finalUnitCost = averageCost
    }

    await this.inventoryRepo.createMovement({
      item_id,
      variation_id,
      location_id,
      movement_type: movementTypes[movement_type] || movement_type,
      quantity: signedQuantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      unit_cost: finalUnitCost,
      total_cost: finalUnitCost * Math.abs(signedQuantity),
      reference_type: 'manual_adjustment',
      user_id: userId,
      notes
    })

    return { quantity_before: quantityBefore, quantity_after: quantityAfter, new_cost_price: finalUnitCost }
  }

  async getMovements (itemId = null, locationId = null, limit = 100, userLocations = [], isAdmin = false, companyId = null) {
    return await this.inventoryRepo.getMovements(itemId, locationId, limit, userLocations, isAdmin, companyId)
  }

  async getSerials (itemId = null, locationId = null, status = null, userLocations = [], isAdmin = false) {
    return await this.inventoryRepo.getSerials(itemId, locationId, status, userLocations, isAdmin)
  }

  async getLowStock (userLocations = [], isAdmin = false, companyId = null) {
    return await this.inventoryRepo.getLowStock(userLocations, isAdmin, companyId)
  }

  async getStockInTransit (locationIds = [], isAdmin = false, companyId = null) {
    return await this.inventoryRepo.getStockInTransit(locationIds, isAdmin, companyId)
  }
}
