export class PurchaseOrderModel {
  constructor (purchaseOrderRepository) {
    this.poRepo = purchaseOrderRepository
  }

  async getAll (filters) {
    return await this.poRepo.getAll(filters)
  }

  async getById (id, companyId) {
    return await this.poRepo.getById(id, companyId)
  }

  async create (data, userId) {
    return await this.poRepo.create(data, userId)
  }

  async update (id, data, companyId) {
    return await this.poRepo.update(id, data, companyId)
  }

  async delete (id, companyId = null) {
    return await this.poRepo.delete(id, companyId)
  }

  async getPendingReorderItems (locationId, companyId) {
    return await this.poRepo.getPendingReorderItems(locationId, companyId)
  }
}
