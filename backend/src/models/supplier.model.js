export class SupplierModel {
  constructor (supplierRepository) {
    this.supplierRepo = supplierRepository
  }

  async getAll (filters) {
    return await this.supplierRepo.getAll(filters)
  }

  async getById (id, companyId) {
    return await this.supplierRepo.getById(id, companyId)
  }

  async create (data) {
    return await this.supplierRepo.create(data)
  }

  async update (id, data, companyId) {
    return await this.supplierRepo.update(id, data, companyId)
  }

  async delete (id, companyId) {
    return await this.supplierRepo.delete(id, companyId)
  }

  async getActive (companyId = null) {
    return await this.supplierRepo.getActive(companyId)
  }

  async getHistory (id, companyId) {
    return await this.supplierRepo.getHistory(id, companyId)
  }
}
