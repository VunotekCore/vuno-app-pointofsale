import { NotFoundError } from '../errors/NotFoundError.js'

export class ItemsModel {
  constructor (itemsRepository) {
    this.itemsRepo = itemsRepository
  }

  async getAll (locationId = null, filters = {}) {
    const result = await this.itemsRepo.getAll(locationId, filters)
    return result
  }

  async getById (id) {
    const item = await this.itemsRepo.getById(id)
    if (!item) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }
    const [variations, stock] = await Promise.all([
      this.itemsRepo.getVariations(id),
      this.itemsRepo.getStock(id)
    ])
    return { ...item, variations, stock }
  }

  async create (data, userId) {
    const itemData = { ...data }
    const kitComponents = itemData.kit_components
    delete itemData.kit_components

    if (!itemData.item_number) {
      itemData.item_number = await this.itemsRepo.generateItemNumber()
    }

    const itemId = await this.itemsRepo.create(itemData, userId)
    
    if (itemData.is_kit && kitComponents && kitComponents.length > 0) {
      await this.itemsRepo.saveKitComponents(itemId, kitComponents)
    }
    
    return await this.itemsRepo.getById(itemId)
  }

  async update (id, data, userId) {
    const existing = await this.itemsRepo.getById(id)
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
    await this.itemsRepo.update(id, itemData)
    
    const priceAfter = {
      cost_price: itemData.cost_price !== undefined ? itemData.cost_price : existing.cost_price,
      unit_price: itemData.unit_price !== undefined ? itemData.unit_price : existing.unit_price
    }
    priceAfter.margin = priceAfter.unit_price - priceAfter.cost_price

    if (priceBefore.cost_price !== priceAfter.cost_price || priceBefore.unit_price !== priceAfter.unit_price) {
      await this.itemsRepo.savePriceHistory(id, priceBefore, priceAfter, userId)
    }
    
    if (itemData.is_kit !== undefined) {
      if (itemData.is_kit && kitComponents && kitComponents.length > 0) {
        await this.itemsRepo.saveKitComponents(id, kitComponents)
      } else {
        await this.itemsRepo.deleteKitComponents(id)
      }
    } else if (existing.is_kit && kitComponents) {
      await this.itemsRepo.saveKitComponents(id, kitComponents)
    }
    
    return await this.itemsRepo.getById(id)
  }

  async delete (id, userId = null) {
    const existing = await this.itemsRepo.getById(id)
    if (!existing) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }

    await this.itemsRepo.delete(id, userId)
    return { success: true }
  }

  async restore (id) {
    const existing = await this.itemsRepo.restore(id)
    if (!existing) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }
    return { success: true }
  }

  async getPriceHistory (itemId, limit = 50) {
    const history = await this.itemsRepo.getPriceHistory(itemId, limit)
    return history
  }

  async updateImageUrl (id, imageUrl) {
    const existing = await this.itemsRepo.getById(id)
    if (!existing) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }
    await this.itemsRepo.update(id, { image_url: imageUrl })
    return { image_url: imageUrl }
  }
}
