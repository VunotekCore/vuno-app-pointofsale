import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'

export class UnitsModel {
  constructor (unitsRepository, itemsRepository = null) {
    this.unitsRepo = unitsRepository
    this.itemsRepo = itemsRepository
  }

  async getAll (activeOnly = true) {
    return await this.unitsRepo.getAll(activeOnly)
  }

  async getById (id) {
    return await this.unitsRepo.getById(id)
  }

  async getItemUnits (itemId) {
    return await this.unitsRepo.getItemUnits(itemId)
  }

  async getDefaultUnit (itemId) {
    return await this.unitsRepo.getDefaultUnit(itemId)
  }

  async createItemUnit (data, userId = null, companyId = null) {
    const { item_id, unit_id, is_default } = data

    if (!item_id) {
      throw new BadRequestError('El producto es requerido')
    }

    if (!unit_id) {
      throw new BadRequestError('La unidad es requerida')
    }

    const existingUnits = await this.unitsRepo.getItemUnits(item_id)

    const alreadyExists = existingUnits.some(u => u.unit_id === unit_id)
    if (alreadyExists) {
      throw new BadRequestError('Esta unidad ya existe para este producto')
    }

    if (existingUnits.length === 0) {
      data.is_default = true
    }

    await this.unitsRepo.createItemUnit({ ...data, company_id: companyId })

    return await this.unitsRepo.getItemUnits(item_id)
  }

  async updateItemUnit (id, data, userId = null) {
    const existing = await this.unitsRepo.getItemUnitById(id)

    await this.unitsRepo.updateItemUnit(id, data)

    return await this.unitsRepo.getItemUnits(existing.item_id)
  }

  async deleteItemUnit (id, userId = null) {
    const existing = await this.unitsRepo.getItemUnitById(id)

    await this.unitsRepo.deleteItemUnit(id)

    return await this.unitsRepo.getItemUnits(existing.item_id)
  }

  async calculatePriceByUnit (itemId, unitId, itemUnitPrice) {
    const unit = await this.unitsRepo.getById(unitId)
    const defaultUnit = await this.unitsRepo.getDefaultUnit(itemId)

    if (!defaultUnit || !unit) {
      return null
    }

    const priceRatio = unit.conversion_factor / defaultUnit.conversion_factor
    const calculatedPrice = itemUnitPrice * priceRatio

    return {
      unit_id: unitId,
      unit_name: unit.name,
      unit_abbreviation: unit.abbreviation,
      conversion_factor: unit.conversion_factor,
      calculated_price: Math.round(calculatedPrice * 100) / 100
    }
  }
}
