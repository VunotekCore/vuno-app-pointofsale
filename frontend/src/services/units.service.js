import api from './api.service.js'

export const unitsService = {
  getAll: (params = {}) => api.get('/units', { params }),
  
  getById: (id) => api.get(`/units/${id}`),
  
  getItemUnits: (itemId) => api.get(`/units/item/${itemId}/units`),
  
  createItemUnit: (data) => api.post('/units/item-units', data),
  
  updateItemUnit: (id, data) => api.put(`/units/item-units/${id}`, data),
  
  deleteItemUnit: (id) => api.delete(`/units/item-units/${id}`),
  
  calculatePrice: (itemId, unitId, itemUnitPrice) => 
    api.get('/units/calculate-price', { params: { item_id: itemId, unit_id: unitId, item_unit_price: itemUnitPrice } })
}
