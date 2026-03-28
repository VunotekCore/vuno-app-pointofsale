export class ReportsModel {
  constructor (reportsRepository) {
    this.reportsRepo = reportsRepository
  }

  async getSalesReport (filters = {}) {
    const { location_id, start_date, end_date, user_id, status, limit, offset } = filters
    return await this.reportsRepo.getSalesReport({
      location_id,
      start_date,
      end_date,
      user_id,
      status,
      limit,
      offset,
      isAdmin: filters.isAdmin,
      userLocations: filters.userLocations
    })
  }

  async getSalesReportDetails (saleId) {
    return await this.reportsRepo.getSalesReportDetails(saleId)
  }

  async getInventoryReport (filters = {}) {
    const { location_id, start_date, end_date, user_id, movement_type, limit, offset } = filters
    return await this.reportsRepo.getInventoryReport({
      location_id,
      start_date,
      end_date,
      user_id,
      movement_type,
      limit,
      offset,
      isAdmin: filters.isAdmin,
      userLocations: filters.userLocations
    })
  }

  async getPurchasesReport (filters = {}) {
    const { location_id, start_date, end_date, supplier_id, status, limit, offset } = filters
    return await this.reportsRepo.getPurchasesReport({
      location_id,
      start_date,
      end_date,
      supplier_id,
      status,
      limit,
      offset,
      isAdmin: filters.isAdmin,
      userLocations: filters.userLocations
    })
  }

  async getCashReport (filters = {}) {
    const { location_id, start_date, end_date, user_id, limit, offset } = filters
    return await this.reportsRepo.getCashReport({
      location_id,
      start_date,
      end_date,
      user_id,
      limit,
      offset,
      isAdmin: filters.isAdmin,
      userLocations: filters.userLocations
    })
  }

  async exportSalesReport (filters = {}) {
    const { location_id, start_date, end_date, user_id, status } = filters
    return await this.reportsRepo.exportSalesReport({
      location_id,
      start_date,
      end_date,
      user_id,
      status,
      isAdmin: filters.isAdmin,
      userLocations: filters.userLocations
    })
  }

  async exportInventoryReport (filters = {}) {
    const { location_id, start_date, end_date, user_id, movement_type } = filters
    return await this.reportsRepo.exportInventoryReport({
      location_id,
      start_date,
      end_date,
      user_id,
      movement_type,
      isAdmin: filters.isAdmin,
      userLocations: filters.userLocations
    })
  }

  async exportPurchasesReport (filters = {}) {
    const { location_id, start_date, end_date, supplier_id, status } = filters
    return await this.reportsRepo.exportPurchasesReport({
      location_id,
      start_date,
      end_date,
      supplier_id,
      status,
      isAdmin: filters.isAdmin,
      userLocations: filters.userLocations
    })
  }

  async exportCashReport (filters = {}) {
    const { location_id, start_date, end_date, user_id } = filters
    return await this.reportsRepo.exportCashReport({
      location_id,
      start_date,
      end_date,
      user_id,
      isAdmin: filters.isAdmin,
      userLocations: filters.userLocations
    })
  }
}
