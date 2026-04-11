// API Service - Production Ready
import axios from 'axios'
import { cacheService } from './cache.service.js'
import { isNetworkOnline } from '../composables/useNetworkStatus.js'
import { useAuthStore } from '../stores/auth.store.js'

const API_URL = import.meta.env.VITE_APP_URL || 'https://vuno-app-pointofsale.onrender.com'
const PORT = import.meta.env.VITE_APP_PORT

const api = axios.create({
  baseURL: PORT ? `${API_URL}:${PORT}` : API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Verifica si la ruta actual (pathname o hash) contiene 'login'
    const isLoginPage = window.location.pathname.includes('/login') || window.location.hash.includes('/login');
    
    if (error.response?.status === 401 && !isLoginPage) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
      
      // Si estamos en Electron (hash router), no podemos hacer un redirect fuerte a '/login'
      const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
      if (isElectron) {
        window.location.hash = '#/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error)
  }
)

export const offlineApi = {
  async post(url, data, options = {}) {
    const { queueIfOffline = true } = options

    if (url === '/sales') {
      const isOnline = isNetworkOnline()

      if (!isOnline && queueIfOffline) {
        return await this.queueSaleOffline(data)
      }

      try {
        const response = await api.post(url, data)
        return response
      } catch (error) {
        if (!isNetworkOnline() && queueIfOffline) {
          return await this.queueSaleOffline(data)
        }
        throw error
      }
    }

    return await api.post(url, data)
  },

  async queueSaleOffline(data) {
    const authStore = useAuthStore()
    const offlineId = await cacheService.queueSaleOffline(
      {
        location_id: data.location_id,
        company_id: authStore.companyId,  // Company del usuario autenticado
        customer_id: data.customer_id,
        subtotal: data.subtotal,
        tax_amount: data.tax_amount || 0,
        discount_amount: data.discount_amount || 0,
        total: data.total,
        notes: data.notes || ''
      },
      data.items,
      data.payments
    )

    return {
      data: {
        success: true,
        data: {
          id: offlineId,
          sale_number: `OFFLINE-${offlineId.substring(0, 8).toUpperCase()}`,
          offline: true
        }
      }
    }
  },

  get: (url, config) => api.get(url, config),
  put: (url, data) => api.put(url, data),
  delete: (url) => api.delete(url),

  async uploadCompanyLogo(imageData) {
    const response = await api.post('/companies/logo', imageData)
    return response.data
  }
}

export default api
