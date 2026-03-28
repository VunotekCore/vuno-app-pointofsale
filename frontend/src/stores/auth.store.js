import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api.service.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  const permissions = ref([])

  const isAuthenticated = computed(() => !!token.value)

  const companyId = computed(() => user.value?.company_id || null)

  const hasPermission = (permissionCode) => {
    if (user.value?.role_name === 'admin') {
      return true
    }
    if (!permissions.value.length) {
      return false
    }
    return permissions.value.includes(permissionCode)
  }

  const hasTablePermission = (table, operation) => {
    const permCode = `${table}.${operation}`
    return hasPermission(permCode)
  }

  const hasAnyPermission = (permissionCodes) => {
    return permissionCodes.some(code => hasPermission(code))
  }

  const hasRole = (roleName) => {
    return user.value?.role_name === roleName
  }

  async function login(username, password) {
    const response = await api.post('/login', { username, password })
    token.value = response.data.data.token
    user.value = response.data.data.user
    permissions.value = response.data.data.permissions || []
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('permissions', JSON.stringify(permissions.value))
    return response.data
  }

  function clearAllAuthData() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('permissions')
    localStorage.removeItem('platform_token')
    localStorage.removeItem('platform_user')
    localStorage.removeItem('selected_company_id')
    localStorage.removeItem('company_data')
  }

  function clearState() {
    token.value = null
    user.value = null
    permissions.value = []
  }

  function logout() {
    clearAllAuthData()
    clearState()
  }

  function initialize() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedPermissions = localStorage.getItem('permissions')
    
    if (storedToken) {
      token.value = storedToken
    }
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        user.value = null
      }
    }
    if (storedPermissions) {
      try {
        permissions.value = JSON.parse(storedPermissions)
      } catch (e) {
        permissions.value = []
      }
    }
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    companyId,
    hasPermission,
    hasTablePermission,
    hasAnyPermission,
    hasRole,
    login,
    logout,
    clearAllAuthData,
    clearState,
    initialize
  }
})
