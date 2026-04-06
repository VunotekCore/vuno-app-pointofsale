import { NotFoundError } from '../errors/NotFoundError.js'

export class ItemsModel {
  constructor (itemsRepository) {
    this.itemsRepo = itemsRepository
  }

  async getAll (locationId = null, filters = {}) {
    const result = await this.itemsRepo.getAll(locationId, filters)
    return result
  }

  async getById (id, locationId = null, companyId) {
    const item = await this.itemsRepo.getById(id, locationId, companyId)
    if (!item) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }
    return item
  }

  async create (data, userId, companyId) {
    const itemData = { ...data, company_id: companyId }
    const kitComponents = itemData.kit_components
    delete itemData.kit_components

    if (!itemData.item_number) {
      itemData.item_number = await this.itemsRepo.generateItemNumber(companyId)
    }

    const itemId = await this.itemsRepo.create(itemData, userId)
    
    if (itemData.is_kit && kitComponents && kitComponents.length > 0) {
      await this.itemsRepo.saveKitComponents(itemId, kitComponents, companyId)
    }
    
    return await this.itemsRepo.getById(itemId, null, companyId)
  }

  async update (id, data, userId, companyId) {
    const existing = await this.itemsRepo.getById(id, null, companyId)
    if (!existing) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }

    const itemData = { ...data }
    const kitComponents = itemData.kit_components
    delete itemData.kit_components

    const priceBefore = {
      cost_price: existing.cost_price,
      unit_price: existing.unit_price,
      margin: existing.unit_price - existing.cost_price
    }

    itemData.updated_by = userId
    await this.itemsRepo.update(id, itemData, userId, companyId)
    
    const priceAfter = {
      cost_price: itemData.cost_price !== undefined ? itemData.cost_price : existing.cost_price,
      unit_price: itemData.unit_price !== undefined ? itemData.unit_price : existing.unit_price
    }
    priceAfter.margin = priceAfter.unit_price - priceAfter.cost_price

    if (priceBefore.cost_price !== priceAfter.cost_price || priceBefore.unit_price !== priceAfter.unit_price) {
      await this.itemsRepo.savePriceHistory(id, priceBefore, priceAfter, userId, companyId)
    }
    
    if (itemData.is_kit !== undefined) {
      if (itemData.is_kit && kitComponents && kitComponents.length > 0) {
        await this.itemsRepo.saveKitComponents(id, kitComponents, companyId)
      } else {
        await this.itemsRepo.deleteKitComponents(id, companyId)
      }
    } else if (existing.is_kit && kitComponents) {
      await this.itemsRepo.saveKitComponents(id, kitComponents, companyId)
    }
    
    return await this.itemsRepo.getById(id, null, companyId)
  }

  async delete (id, userId = null, companyId) {
    const existing = await this.itemsRepo.getById(id, null, companyId)
    if (!existing) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }

    await this.itemsRepo.delete(id, userId, companyId)
    return { success: true }
  }

  async restore (id, companyId) {
    const existing = await this.itemsRepo.restore(id, companyId)
    if (!existing) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }
    return { success: true }
  }

  async getPriceHistory (itemId, limit = 50, companyId) {
    const history = await this.itemsRepo.getPriceHistory(itemId, limit, companyId)
    return history
  }

  async updateImageUrl (id, imageUrl, companyId) {
    const existing = await this.itemsRepo.getById(id, null, companyId)
    if (!existing) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }
    await this.itemsRepo.update(id, { image_url: imageUrl }, null, companyId)
    return { image_url: imageUrl }
  }
}
