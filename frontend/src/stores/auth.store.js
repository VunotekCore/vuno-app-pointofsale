import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api.service.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  const permissions = ref([])
  const isSuperAdminImpersonating = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  const companyId = computed(() => user.value?.company_id || null)

  const isSuperAdmin = computed(() => user.value?.is_super_admin_impersonating === true)

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
    localStorage.removeItem('selected_company_id')
    localStorage.removeItem('company_data')
  }

  function clearState() {
    token.value = null
    user.value = null
    permissions.value = []
  }

  function logout(keepPlatformAuth = false) {
    clearAllAuthData()
    clearState()
    isSuperAdminImpersonating.value = false
  }

  function setImpersonating(data) {
    token.value = data.token
    user.value = data.user
    permissions.value = data.permissions || []
    isSuperAdminImpersonating.value = data.user?.is_super_admin_impersonating || false
    
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('permissions', JSON.stringify(permissions.value))
  }

  function clearImpersonating() {
    isSuperAdminImpersonating.value = false
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
    isSuperAdminImpersonating,
    isSuperAdmin,
    companyId,
    hasPermission,
    hasTablePermission,
    hasAnyPermission,
    hasRole,
    login,
    logout,
    setImpersonating,
    clearImpersonating,
    clearAllAuthData,
    clearState,
    initialize
  }
})
