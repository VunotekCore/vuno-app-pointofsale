export class DashboardModel {
  constructor (dashboardRepository) {
    this.dashboardRepo = dashboardRepository
  }

  async getDailyStats (locationId, userLocations = [], isAdmin = false, companyId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sales = await this.dashboardRepo.getDailySales(locationId, userLocations, isAdmin, companyId)

    return {
      date: today.toISOString().split('T')[0],
      transactions: parseInt(sales.total_transactions) || 0,
      total_sales: parseFloat(sales.total_sales) || 0,
      total_tax: parseFloat(sales.total_tax) || 0,
      total_discounts: parseFloat(sales.total_discounts) || 0
    }
  }

  async getStatsByDateRange (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    const sales = await this.dashboardRepo.getSalesByDateRange(locationId, startDate, endDate, userLocations, isAdmin, companyId)

    return {
      start_date: startDate,
      end_date: endDate,
      transactions: parseInt(sales.total_transactions) || 0,
      total_sales: parseFloat(sales.total_sales) || 0,
      total_tax: parseFloat(sales.total_tax) || 0,
      total_discounts: parseFloat(sales.total_discounts) || 0
    }
  }

  async getSalesByPeriod (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getSalesByPeriod(locationId, startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getTopSellingItems (locationId, startDate, endDate, limit, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getTopSellingItems(locationId, startDate, endDate, limit, userLocations, isAdmin, companyId)
  }

  async getPaymentSummary (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getPaymentSummary(locationId, startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getLowStock (locationId = null, userLocations = [], isAdmin = false, limit = 20, companyId) {
    return await this.dashboardRepo.getLowStock(locationId, userLocations, isAdmin, limit, companyId)
  }

  async getNewCustomers (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    const result = await this.dashboardRepo.getNewCustomers(locationId, startDate, endDate, userLocations, isAdmin, companyId)
    return {
      start_date: startDate,
      end_date: endDate,
      total_new_customers: parseInt(result.total_new_customers) || 0
    }
  }

  async getCustomersByPeriod (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getCustomersByPeriod(locationId, startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getRecentSales (locationId, limit, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getRecentSales(locationId, limit, userLocations, isAdmin, companyId)
  }

  async getRecentMovements (locationId, limit, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getRecentMovements(locationId, limit, userLocations, isAdmin, companyId)
  }

  async getLocations (companyId) {
    return await this.dashboardRepo.getLocations(companyId)
  }

  async getFinancialOverview (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getFinancialOverview(locationId, startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getYearOverYearComparison (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getYearOverYearComparison(locationId, startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getPnLByLocation (startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getPnLByLocation(startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getCustomerLifetimeValue (startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getCustomerLifetimeValue(startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getTaxCompliance (startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getTaxCompliance(startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getCustomerAcquisitionCost (startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getCustomerAcquisitionCost(startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getInventoryTurnover (startDate, endDate, locationId, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getInventoryTurnover(startDate, endDate, locationId, userLocations, isAdmin, companyId)
  }

  async getSalesByEmployee (startDate, endDate, locationId, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getSalesByEmployee(startDate, endDate, locationId, userLocations, isAdmin, companyId)
  }

  async getSalesByHour (startDate, endDate, locationId, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getSalesByHour(startDate, endDate, locationId, userLocations, isAdmin, companyId)
  }

  async getReturnsAndCancellations (startDate, endDate, locationId, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getReturnsAndCancellations(startDate, endDate, locationId, userLocations, isAdmin, companyId)
  }

  async getCashDrawerDiscrepancies (startDate, endDate, locationId, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getCashDrawerDiscrepancies(startDate, endDate, locationId, userLocations, isAdmin, companyId)
  }

  async getEmployeeSalesGoals (userId, startDate, endDate, companyId) {
    return await this.dashboardRepo.getEmployeeSalesGoals(userId, startDate, endDate, companyId)
  }

  async getAverageTransactionTime (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    return await this.dashboardRepo.getAverageTransactionTime(locationId, startDate, endDate, userLocations, isAdmin, companyId)
  }

  async getFullDashboard (locationId, userLocations = [], isAdmin = false, companyId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - 7)

    const monthStart = new Date(today)
    monthStart.setMonth(monthStart.getMonth() - 1)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1)

    const [
      dailySales,
      yesterdaySales,
      weekSales,
      monthSales,
      topItems,
      paymentSummary,
      lowStock,
      newCustomers,
      recentSales,
      recentMovements,
      locations
    ] = await Promise.all([
      this.dashboardRepo.getDailySales(locationId, userLocations, isAdmin, companyId),
      this.dashboardRepo.getSalesByDateRange(locationId, yesterday.toISOString().split('T')[0], yesterdayEnd.toISOString().split('T')[0], userLocations, isAdmin, companyId),
      this.dashboardRepo.getSalesByDateRange(locationId, weekStart.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0], userLocations, isAdmin, companyId),
      this.dashboardRepo.getSalesByDateRange(locationId, monthStart.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0], userLocations, isAdmin, companyId),
      this.dashboardRepo.getTopSellingItems(locationId, monthStart.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0], 10, userLocations, isAdmin, companyId),
      this.dashboardRepo.getPaymentSummary(locationId, monthStart.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0], userLocations, isAdmin, companyId),
      this.dashboardRepo.getLowStock(locationId, userLocations, isAdmin, 20, companyId),
      this.dashboardRepo.getNewCustomers(locationId, monthStart.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0], userLocations, isAdmin, companyId),
      this.dashboardRepo.getRecentSales(locationId, 10, userLocations, isAdmin, companyId),
      this.dashboardRepo.getRecentMovements(locationId, 20, userLocations, isAdmin, companyId),
      this.dashboardRepo.getLocations(companyId)
    ])

    return {
      daily: {
        date: today.toISOString().split('T')[0],
        transactions: parseInt(dailySales.total_transactions) || 0,
        total_sales: parseFloat(dailySales.total_sales) || 0,
        total_tax: parseFloat(dailySales.total_tax) || 0,
        total_discounts: parseFloat(dailySales.total_discounts) || 0
      },
      yesterday: {
        date: yesterday.toISOString().split('T')[0],
        transactions: parseInt(yesterdaySales.total_transactions) || 0,
        total_sales: parseFloat(yesterdaySales.total_sales) || 0
      },
      week: {
        start_date: weekStart.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        transactions: parseInt(weekSales.total_transactions) || 0,
        total_sales: parseFloat(weekSales.total_sales) || 0
      },
      month: {
        start_date: monthStart.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        transactions: parseInt(monthSales.total_transactions) || 0,
        total_sales: parseFloat(monthSales.total_sales) || 0
      },
      top_items: topItems,
      payment_summary: paymentSummary,
      low_stock: lowStock,
      new_customers: {
        start_date: monthStart.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        total: parseInt(newCustomers.total_new_customers) || 0
      },
      recent_sales: recentSales,
      recent_movements: recentMovements,
      locations
    }
  }
}
