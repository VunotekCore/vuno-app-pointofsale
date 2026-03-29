import axios from 'axios'

const PLATFORM_API_URL = import.meta.env.VITE_APP_URL
const PLATFORM_PORT = import.meta.env.VITE_APP_PORT

const platformApi = axios.create({
<<<<<<< HEAD
  baseURL: `${PLATFORM_API_URL}:${PLATFORM_PORT}`,
=======
  baseURL: PORT ? `${PLATFORM_API_URL}:${PLATFORM_PORT}` : PLATFORM_API_URL,
>>>>>>> develop
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

platformApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('platform_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }
)

platformApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('platform_token')
      localStorage.removeItem('platform_user')
      window.location.href = '/platform/login'
    }
    return Promise.reject(error)
  }
)

export const platformService = {
  async login(email, password) {
    const response = await platformApi.post('/platform/login', { email, password })
    return response.data
  },

  async register(data) {
    const response = await platformApi.post('/platform/users/register', data)
    return response.data
  },

  async getCompanies(params = {}) {
    const response = await platformApi.get('/platform/companies', { params })
    return response.data
  },

  async getCompany(id) {
    const response = await platformApi.get(`/platform/companies/${id}`)
    return response.data
  },

  async getCompanyBySlug(slug) {
    const response = await platformApi.get(`/platform/companies/slug/${slug}`)
    return response.data
  },

  async createCompany(data) {
    const response = await platformApi.post('/platform/companies', data)
    return response.data
  },

  async updateCompany(id, data) {
    const response = await platformApi.put(`/platform/companies/${id}`, data)
    return response.data
  },

  async uploadCompanyLogo(companyId, imageData) {
    const response = await platformApi.post(`/platform/companies/${companyId}/logo`, imageData)
    return response.data
  },

  async deleteCompany(id) {
    const response = await platformApi.delete(`/platform/companies/${id}`)
    return response.data
  },

  async getCompanyStats(id) {
    const response = await platformApi.get(`/platform/companies/${id}/stats`)
    return response.data
  },

  async getCompanyAdmin(id) {
    const response = await platformApi.get(`/platform/companies/${id}/admin`)
    return response.data
  },

  async getPlatformUsers(params = {}) {
    const response = await platformApi.get('/platform/users', { params })
    return response.data
  },

  async getPlatformUser(id) {
    const response = await platformApi.get(`/platform/users/${id}`)
    return response.data
  },

  async updatePlatformUser(id, data) {
    const response = await platformApi.put(`/platform/users/${id}`, data)
    return response.data
  },

  async deletePlatformUser(id) {
    const response = await platformApi.delete(`/platform/users/${id}`)
    return response.data
  },

  async changePassword(id, currentPassword, newPassword) {
    const response = await platformApi.post(`/platform/users/${id}/change-password`, {
      currentPassword,
      newPassword
    })
    return response.data
  },

  async changeCompanyAdminPassword(companyId, userId, newPassword) {
    const response = await platformApi.post(`/platform/companies/${companyId}/change-admin-password`, {
      userId,
      newPassword
    })
    return response.data
  }
}
