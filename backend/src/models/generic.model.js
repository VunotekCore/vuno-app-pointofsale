import { BadRequestError } from '../errors/BadRequestError.js'

export class GenericModel {
  constructor (genericRepository, tableConfig) {
    this.repo = genericRepository
    this.tableConfig = tableConfig
  }

  validateRequired (data) {
    const required = this.tableConfig.required || []
    const missing = required.filter(field => !data[field])
    if (missing.length > 0) {
      throw new BadRequestError(`Campos requeridos: ${missing.join(', ')}`)
    }
  }

  filterAllowedFields (data) {
    const allowed = this.tableConfig.columns || []
    const filtered = {}
    for (const key of allowed) {
      if (data[key] !== undefined) {
        filtered[key] = data[key]
      }
    }
    return filtered
  }

  async getAll (filters = {}) {
    return await this.repo.getAll(filters)
  }

  async getById (id) {
    return await this.repo.getById(id)
  }

  async create (data, userId = null) {
    this.validateRequired(data)
    const filtered = this.filterAllowedFields(data)
    return await this.repo.create(filtered, userId)
  }

  async update (id, data, userId = null) {
    this.validateRequired({ ...data, id })
    const filtered = this.filterAllowedFields(data)
    return await this.repo.update(id, filtered, userId)
  }

  async delete (id, userId = null) {
    return await this.repo.delete(id, userId)
  }

  async restore (id, userId = null) {
    return await this.repo.restore(id, userId)
  }
}
