export class PurchaseOrderModel {
  constructor (purchaseOrderRepository) {
    this.poRepo = purchaseOrderRepository
  }

  async getAll (filters) {
    return await this.poRepo.getAll(filters)
  }

  async getById (id) {
    return await this.poRepo.getById(id)
  }

  async create (data, userId) {
    return await this.poRepo.create(data, userId)
  }

  async update (id, data) {
    return await this.poRepo.update(id, data)
  }

  async delete (id) {
    return await this.poRepo.delete(id)
  }

  async getPendingReorderItems (locationId) {
    return await this.poRepo.getPendingReorderItems(locationId)
  }
}
