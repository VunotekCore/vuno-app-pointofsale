import api from './api.service.js'

export const salesService = {
  // Sales
  getSales: (params) => api.get('/sales', { params }),
  getSale: (id) => api.get(`/sales/${id}`),
  createSale: (data) => api.post('/sales', data),
  completeSale: (id, payments) => api.post(`/sales/${id}/complete`, { payments }),
  suspendSale: (id, data) => api.post(`/sales/${id}/suspend`, data),
  resumeSale: (id) => api.post(`/sales/${id}/resume`),
  cancelSale: (id, notes) => api.post(`/sales/${id}/cancel`, { notes }),
  addPayment: (id, payment) => api.post(`/sales/${id}/payments`, payment),
  
  // Ticket
  getTicketHtml: (id) => api.get(`/sales/${id}/ticket/html`),
  downloadTicket: (id) => api.get(`/sales/${id}/ticket`, { responseType: 'blob' }),
  
  // Sales items
  updateSaleItem: (saleId, itemId, data) => api.put(`/sales/${saleId}/items/${itemId}`, data),
  removeSaleItem: (saleId, itemId) => api.delete(`/sales/${saleId}/items/${itemId}`),

  // Reports
  getDailySales: (params) => api.get('/sales/daily', { params }),
  getSalesSummary: (params) => api.get('/sales/summary', { params }),
  getTopSellingItems: (params) => api.get('/sales/top-items', { params }),
  getSuspendedSales: (params) => api.get('/sales/suspended', { params }),

  // Returns
  getReturns: (params) => api.get('/sales/returns', { params }),
  getReturn: (id) => api.get(`/sales/returns/${id}`),
  createReturn: (data) => api.post('/sales/returns', data),
  processReturn: (id) => api.post(`/sales/returns/${id}/process`)
}

export const customersService = {
  // Customers
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  toggleCustomerStatus: (id) => api.put(`/customers/${id}/toggle-status`),
  searchCustomers: (query) => api.get('/customers/search', { params: { q: query } }),

  // Customer points
  addPoints: (customerId, data) => api.post(`/customers/${customerId}/points`, data),
  redeemPoints: (customerId, data) => api.post(`/customers/${customerId}/points/redeem`, data),
  getPointsLog: (customerId) => api.get(`/customers/${customerId}/points`),
  getCustomerSales: (customerId, limit) => api.get(`/customers/${customerId}/sales`, { params: { limit } }),

  // Customer groups
  getGroups: () => api.get('/customers/groups'),
  getGroup: (id) => api.get(`/customers/groups/${id}`),
  createGroup: (data) => api.post('/customers/groups', data),
  updateGroup: (id, data) => api.put(`/customers/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/customers/groups/${id}`),

  // Rewards
  getRewards: (activeOnly = true) => api.get('/customers/rewards', { params: { active: activeOnly } }),
  getReward: (id) => api.get(`/customers/rewards/${id}`),
  createReward: (data) => api.post('/customers/rewards', data),
  updateReward: (id, data) => api.put(`/customers/rewards/${id}`, data),
  deleteReward: (id) => api.delete(`/customers/rewards/${id}`),
  redeemReward: (rewardId, data) => api.post(`/customers/rewards/${rewardId}/redeem`, data)
}
