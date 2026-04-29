import api from './api.service.js'

export const coreService = {
  // Locations
  getLocations: (params) => api.get('/locations', { params }),
  getLocation: (id) => api.get(`/locations/${id}`),
  createLocation: (data) => api.post('/locations', data),
  updateLocation: (id, data) => api.put(`/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/locations/${id}`),
  getUserLocations: () => api.get('/users-locations/me/locations'),

  // Categories
  getCategories: (params) => api.get('/core/categories', { params }),
  getCategory: (id) => api.get(`/core/categories/${id}`),
  createCategory: (data) => api.post('/core/categories', data),
  updateCategory: (id, data) => api.put(`/core/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/core/categories/${id}`),

  // Suppliers
  getSuppliers: () => api.get('/core/suppliers'),
  getSupplier: (id) => api.get(`/core/suppliers/${id}`),
  createSupplier: (data) => api.post('/core/suppliers', data),
  updateSupplier: (id, data) => api.put(`/core/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/core/suppliers/${id}`),

  // Item Variations
  getVariations: () => api.get('/core/item_variations'),
  getVariation: (id) => api.get(`/core/item_variations/${id}`),
  createVariation: (data) => api.post('/core/item_variations', data),
  updateVariation: (id, data) => api.put(`/core/item_variations/${id}`, data),
  deleteVariation: (id) => api.delete(`/core/item_variations/${id}`)
}

export const itemsService = {
  getItems: (params) => api.get('/items', { params }),
  getItem: (id) => api.get(`/items/${id}`),
  getPriceHistory: (id) => api.get(`/items/${id}/price-history`),
  createItem: (data) => api.post('/items', data),
  updateItem: (id, data) => api.put(`/items/${id}`, data),
  deleteItem: (id) => api.delete(`/items/${id}`),
  uploadItemImage: (id, imageData) => api.post(`/items/${id}/image`, imageData)
}

export const inventoryService = {
  getStock: (params) => api.get('/inventory/stock', { params }),
  getMovements: (params) => api.get('/inventory/movements', { params }),
  getSerials: (params) => api.get('/inventory/serials', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  
  // Ajustes de inventario
  getAdjustments: (params) => api.get('/inventory/adjustments', { params }),
  getAdjustment: (id) => api.get(`/inventory/adjustments/${id}`),
  createAdjustment: (data) => api.post('/inventory/adjustments', data),
  createAdjustmentQuick: (data) => api.post('/inventory/adjustments/quick', data),
  addAdjustmentItem: (adjustmentId, data) => api.post(`/inventory/adjustments/${adjustmentId}/items`, data),
  removeAdjustmentItem: (adjustmentId, itemId) => api.delete(`/inventory/adjustments/${adjustmentId}/items/${itemId}`),
  confirmAdjustment: (id) => api.post(`/inventory/adjustments/${id}/confirm`),
  cancelAdjustment: (id) => api.post(`/inventory/adjustments/${id}/cancel`),
  getItemStock: (itemId, adjustmentId, variationId) => api.get(`/inventory/adjustments/item-stock/${itemId}`, { params: { adjustment_id: adjustmentId, variation_id: variationId } }),

  // Transferencias
  getTransfers: (params) => api.get('/inventory/transfers', { params }),
  getTransfer: (id) => api.get(`/inventory/transfers/${id}`),
  createTransfer: (data) => api.post('/inventory/transfers', data),
  addTransferItem: (transferId, data) => api.post(`/inventory/transfers/${transferId}/items`, data),
  removeTransferItem: (transferId, itemId) => api.delete(`/inventory/transfers/${transferId}/items/${itemId}`),
  shipTransfer: (id) => api.post(`/inventory/transfers/${id}/ship`),
  receiveTransfer: (id, items) => api.post(`/inventory/transfers/${id}/receive`, { items }),
  cancelTransfer: (id) => api.post(`/inventory/transfers/${id}/cancel`)
}
