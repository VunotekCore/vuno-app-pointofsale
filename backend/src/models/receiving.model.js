export class ReceivingModel {
  constructor (receivingRepository) {
    this.recRepo = receivingRepository
  }

  async getAll (filters) {
    return await this.recRepo.getAll(filters)
  }

  async getById (id) {
    return await this.recRepo.getById(id)
  }

  async create (data, userId) {
    return await this.recRepo.create(data, userId)
  }

  async complete (id, userId) {
    return await this.recRepo.complete(id, userId)
  }

  async delete (id) {
    return await this.recRepo.delete(id)
  }
}
