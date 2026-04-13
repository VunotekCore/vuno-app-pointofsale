import api from './api.service.js'

export const expirationService = {
  getExpiring (params = {}) {
    return api.get('/api/expirations/expiring', { params })
  },

  getExpired (params = {}) {
    return api.get('/api/expirations/expired', { params })
  },

  getByItem (itemId) {
    return api.get(`/api/items/${itemId}/expirations`)
  },

  markProcessed (id) {
    return api.post(`/api/expirations/${id}/process`)
  },

  getSummary () {
    return api.get('/api/expirations/summary')
  }
}
