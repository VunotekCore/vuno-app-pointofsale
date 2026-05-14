import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api.service.js'
import { usePermissionStore } from './permission.store.js'
import { setPermissionsReady } from '../router/index.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  const permissions = ref([])
  const isSuperAdminImpersonating = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  const companyId = computed(() => user.value?.company_id || null)

  const isSuperAdmin = computed(() => user.value?.is_super_admin_impersonating === true)

  const hasPermission = (permissionCode) => {
    if (user.value?.is_admin === true) {
      return true
    }
    const ps = usePermissionStore()
    if (ps.effectivePermissionCodes.length > 0) {
      return ps.hasPermission(permissionCode)
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
    sessionStorage.setItem('token', token.value)
    sessionStorage.setItem('user', JSON.stringify(user.value))
    sessionStorage.setItem('permissions', JSON.stringify(permissions.value))

    await initAuth()

    return response.data
  }

  async function initAuth() {
    if (token.value) {
      try {
        const permissionStore = usePermissionStore()
        await permissionStore.fetchAllPermissions()
        if (user.value?.id) {
          await permissionStore.fetchEffectivePermissions(user.value.id)
        }
        if (typeof window !== 'undefined') {
          window.__permissionStore = permissionStore
          setPermissionsReady()
        }
      } catch (error) {
        console.error('[Auth] initAuth failed:', error)
      }
    }
  }

  function clearAllAuthData() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('permissions')
    sessionStorage.removeItem('selected_company_id')
    sessionStorage.removeItem('company_data')
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

    sessionStorage.setItem('token', token.value)
    sessionStorage.setItem('user', JSON.stringify(user.value))
    sessionStorage.setItem('permissions', JSON.stringify(permissions.value))
  }

  function clearImpersonating() {
    isSuperAdminImpersonating.value = false
  }

  function initialize() {
    const storedToken = sessionStorage.getItem('token')
    const storedUser = sessionStorage.getItem('user')
    const storedPermissions = sessionStorage.getItem('permissions')

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

    if (token.value && typeof window !== 'undefined') {
      const permissionStore = usePermissionStore()
      window.__permissionStore = permissionStore
      initAuth()
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
    initialize,
    initAuth
  }
})
