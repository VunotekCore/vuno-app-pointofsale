export class SupplierModel {
  constructor (supplierRepository) {
    this.supplierRepo = supplierRepository
  }

  async getAll (filters) {
    return await this.supplierRepo.getAll(filters)
  }

  async getById (id) {
    return await this.supplierRepo.getById(id)
  }

  async create (data) {
    return await this.supplierRepo.create(data)
  }

  async update (id, data) {
    return await this.supplierRepo.update(id, data)
  }

  async delete (id) {
    return await this.supplierRepo.delete(id)
  }

  async getActive () {
    return await this.supplierRepo.getActive()
  }

  async getHistory (id) {
    return await this.supplierRepo.getHistory(id)
  }
}
