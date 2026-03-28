import api from './api.service.js'

export const purchaseService = {
  // Suppliers
  getSuppliers: (params) => api.get('/suppliers', { params }),
  getSupplier: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (data) => api.post('/suppliers', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`),
  getSupplierHistory: (id) => api.get(`/suppliers/${id}/history`),

  // Purchase Orders
  getPurchaseOrders: (params) => api.get('/purchase-orders', { params }),
  getPurchaseOrder: (id) => api.get(`/purchase-orders/${id}`),
  createPurchaseOrder: (data) => api.post('/purchase-orders', data),
  updatePurchaseOrder: (id, data) => api.put(`/purchase-orders/${id}`, data),
  deletePurchaseOrder: (id) => api.delete(`/purchase-orders/${id}`),
  generateAutoOrders: (data) => api.post('/purchase-orders/generate-auto', data),

  // Receivings
  getReceivings: (params) => api.get('/receivings', { params }),
  getReceiving: (id) => api.get(`/receivings/${id}`),
  createReceiving: (data) => api.post('/receivings', data),
  completeReceiving: (id) => api.put(`/receivings/${id}/complete`),
  deleteReceiving: (id) => api.delete(`/receivings/${id}`)
}
