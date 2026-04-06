export class ReceivingModel {
  constructor (receivingRepository) {
    this.recRepo = receivingRepository
  }

  async getAll (filters) {
    return await this.recRepo.getAll(filters)
  }

  async getById (id, companyId) {
    return await this.recRepo.getById(id, companyId)
  }

  async create (data, userId) {
    return await this.recRepo.create(data, userId)
  }

  async complete (id, userId, companyId = null) {
    return await this.recRepo.complete(id, userId, companyId)
  }

  async delete (id, companyId = null) {
    return await this.recRepo.delete(id, companyId)
  }
}
