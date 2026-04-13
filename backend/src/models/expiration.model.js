export class ExpirationModel {
  constructor (expirationRepository, companyRepository) {
    this.expirationRepo = expirationRepository
    this.companyRepo = companyRepository
  }

  async getExpiringItems (companyId, daysAhead = null, locationId = null) {
    const alertDays = daysAhead || await this.companyRepo.getExpirationAlertDays(companyId)
    return await this.expirationRepo.getExpiring(companyId, alertDays, locationId)
  }

  async getExpiredItems (companyId, locationId = null) {
    return await this.expirationRepo.getExpired(companyId, locationId)
  }

  async getByItem (itemId, companyId) {
    return await this.expirationRepo.getByItem(itemId, companyId)
  }

  async createExpiration (data) {
    return await this.expirationRepo.create(data)
  }

  async createExpirationsBatch (records) {
    return await this.expirationRepo.createBatch(records)
  }

  async markAsProcessed (id) {
    return await this.expirationRepo.markAsProcessed(id)
  }

  async updateExpiredStatus () {
    return await this.expirationRepo.updateExpiredStatus()
  }

  async getSummary (companyId) {
    return await this.expirationRepo.getCountSummary(companyId)
  }
}
