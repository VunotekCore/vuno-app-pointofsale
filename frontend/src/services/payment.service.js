import api from './api.service.js'

export const paymentService = {
  // Payment methods
  getPaymentMethods: () => api.get('/payments/methods'),
  
  // Cash drawers
  getDrawers: (locationId) => api.get('/payments/drawers', { params: { location_id: locationId } }),
  getDrawer: (id) => api.get(`/payments/drawers/${id}`),
  getOpenDrawer: (locationId) => api.get('/payments/drawers/open', { params: { location_id: locationId } }),
  openDrawer: (data) => api.post('/payments/drawers', data),
  closeDrawer: (id, data) => api.post(`/payments/drawers/${id}/close`, data),
  getDrawerTransactions: (id) => api.get(`/payments/drawers/${id}/transactions`),
  getCashSummary: (id, params = {}) => api.get(`/payments/drawers/${id}/cash-summary`, { params }),
  downloadClosePDF: (id) => api.get(`/payments/drawers/${id}/close-pdf`, { responseType: 'blob' }),
  getCloseHTML: (id) => api.get(`/payments/drawers/${id}/close/html`),
  
  // History
  getDrawerHistory: (locationId, params = {}) => api.get('/payments/history', { params: { location_id: locationId, ...params } }),
  
  // Transactions
  addDrawerTransaction: (drawerId, data) => api.post(`/payments/drawers/${drawerId}/transactions`, data),

  // Adjustments (faltantes/sobrantes)
  createAdjustment: (data) => api.post('/payments/adjustments', data),
  getDrawerAdjustments: (drawerId) => api.get(`/payments/drawers/${drawerId}/adjustments`),
  getMyAdjustments: (params = {}) => api.get('/payments/my-adjustments', { params }),
  updateAdjustmentStatus: (id, status) => api.put(`/payments/adjustments/${id}/status`, { status }),

  // Accounts receivable (cuentas por cobrar a empleados)
  getAccountsReceivable: (params) => api.get('/payments/accounts-receivable', { params }),
  payAccountReceivable: (id, amount) => api.post(`/payments/accounts-receivable/${id}/payment`, { amount }),
  getCashiers: () => api.get('/payments/cashiers')
}
