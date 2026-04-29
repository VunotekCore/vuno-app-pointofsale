import { NotFoundError } from '../errors/NotFoundError.js'

export class LocationsModel {
  constructor (locationsRepository) {
    this.locationsRepo = locationsRepository
  }

  async getAll (filters = {}) {
    const result = await this.locationsRepo.getAll(filters)
    return result
  }

  async getById (id, companyId) {
    const location = await this.locationsRepo.getById(id, companyId)
    if (!location) {
      throw new NotFoundError(`Ubicación con id ${id} no encontrada`)
    }
    return location
  }

  async create (data, userId, companyId) {
    const locationData = { ...data, company_id: companyId }
    const locationId = await this.locationsRepo.create(locationData, userId, companyId)
    return await this.locationsRepo.getById(locationId, companyId)
  }

  async update (id, data, userId, companyId) {
    const existing = await this.locationsRepo.getById(id, companyId)
    if (!existing) {
      throw new NotFoundError(`Ubicación con id ${id} no encontrada`)
    }

    await this.locationsRepo.update(id, data, userId, companyId)
    return await this.locationsRepo.getById(id, companyId)
  }

  async delete (id, userId, companyId) {
    const existing = await this.locationsRepo.getById(id, companyId)
    if (!existing) {
      throw new NotFoundError(`Ubicación con id ${id} no encontrada`)
    }

    await this.locationsRepo.delete(id, userId, companyId)
    return { success: true }
  }

  async restore (id, companyId) {
    const result = await this.locationsRepo.restore(id, companyId)
    return { success: true, affectedRows: result }
  }
}
