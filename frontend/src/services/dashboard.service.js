import api from './api.service.js'

export const dashboardService = {
  getFullDashboard(locationId = null) {
    const params = locationId ? { location_id: locationId } : {}
    return api.get('/dashboard', { params })
  },

  getDailyStats(locationId = null) {
    const params = locationId ? { location_id: locationId } : {}
    return api.get('/dashboard/daily', { params })
  },

  getStatsByDateRange(startDate, endDate, locationId = null) {
    const params = { start_date: startDate, end_date: endDate }
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/stats', { params })
  },

  getSalesByPeriod(startDate, endDate, locationId = null) {
    const params = { start_date: startDate, end_date: endDate }
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/sales-by-period', { params })
  },

  getTopItems(startDate, endDate, limit = 10, locationId = null) {
    const params = { start_date: startDate, end_date: endDate, limit }
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/top-items', { params })
  },

  getPaymentSummary(startDate, endDate, locationId = null) {
    const params = { start_date: startDate, end_date: endDate }
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/payments', { params })
  },

  getLowStock(limit = 20, locationId = null) {
    const params = { limit }
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/low-stock', { params })
  },

  getNewCustomers(startDate, endDate, locationId = null) {
    const params = { start_date: startDate, end_date: endDate }
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/new-customers', { params })
  },

  getRecentSales(limit = 10, locationId = null) {
    const params = { limit }
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/recent-sales', { params })
  },

  getRecentMovements(limit = 20, locationId = null) {
    const params = { limit }
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/recent-movements', { params })
  },

  getLocations() {
    return api.get('/dashboard/locations')
  },

  getAdminDashboard(startDate, endDate, locationId = null) {
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/admin-dashboard', { params })
  },

  getManagerDashboard(startDate, endDate, locationId = null) {
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    if (locationId) params.location_id = locationId
    return api.get('/dashboard/manager-dashboard', { params })
  },

  getCashierDashboard() {
    return api.get('/dashboard/cashier-dashboard')
  }
}
