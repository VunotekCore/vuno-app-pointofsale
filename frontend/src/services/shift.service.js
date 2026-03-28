import api from './api.service.js'

export const shiftService = {
  getShiftConfigs: (locationId) => api.get('/shifts/configs', { params: { location_id: locationId } }),
  getShiftConfig: (id) => api.get(`/shifts/configs/${id}`),
  createShiftConfig: (data) => api.post('/shifts/configs', data),
  updateShiftConfig: (id, data) => api.put(`/shifts/configs/${id}`, data),
  deleteShiftConfig: (id) => api.delete(`/shifts/configs/${id}`),
  
  getActiveShift: (locationId) => api.get('/shifts/active', { params: { location_id: locationId } }),
  getOpenSession: (locationId) => api.get('/shifts/sessions/open', { params: { location_id: locationId } }),
  openSession: (data) => api.post('/shifts/sessions', data),
  closeSession: (id, data) => api.post(`/shifts/sessions/${id}/close`, data),
  getSessions: (locationId, params) => api.get('/shifts/sessions', { params: { location_id: locationId, ...params } }),
  getCloseReminders: (locationId) => api.get('/shifts/reminders', { params: { location_id: locationId } })
}
