import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { platformService } from '../services/platform.service.js'

export const usePlatformAuthStore = defineStore('platformAuth', () => {
  const token = ref(localStorage.getItem('platform_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('platform_user') || 'null'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isSuperAdmin = computed(() => {
    const value = user.value?.is_super_admin
    return value === true || value === 1 || value === '1'
  })

  async function login(email, password) {
    loading.value = true
    try {
      const response = await platformService.login(email, password)
      if (response.success) {
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('platform_token', response.data.token)
        localStorage.setItem('platform_user', JSON.stringify(response.data.user))
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
      }
    } finally {
      loading.value = false
    }
  }

  function clearAllAuthData() {
    localStorage.removeItem('platform_token')
    localStorage.removeItem('platform_user')
    localStorage.removeItem('selected_company_id')
    localStorage.removeItem('company_data')
  }

  function clearState() {
    token.value = null
    user.value = null
  }

  function logout() {
    clearAllAuthData()
    clearState()
  }

  function initialize() {
    const storedToken = localStorage.getItem('platform_token')
    const storedUser = localStorage.getItem('platform_user')
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isSuperAdmin,
    login,
    logout,
    clearAllAuthData,
    clearState,
    initialize
  }
})
