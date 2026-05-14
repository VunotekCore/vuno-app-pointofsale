import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api.service.js'

export const usePermissionStore = defineStore('permissions', () => {
  const allPermissions = ref([])
  const userPermissions = ref([])
  const rolePermissions = ref([])
  const loading = ref(false)

  const allPermissionCodes = computed(() =>
    allPermissions.value.map(p => p.code)
  )

  const userPermissionCodes = computed(() =>
    userPermissions.value.map(p => p.code)
  )

  const effectivePermissionCodes = computed(() => {
    const codes = new Set([
      ...rolePermissions.value.map(p => p.code),
      ...userPermissions.value.map(p => p.code)
    ])
    return Array.from(codes)
  })

  async function fetchAllPermissions() {
    try {
      loading.value = true
      const response = await api.get('/permissions', { params: { limit: 0 } })
      allPermissions.value = response.data.data || []
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchUserPermissions(userId) {
    try {
      const response = await api.get(`/permissions/user/${userId}`)
      userPermissions.value = response.data.data || []
    } catch (error) {
      console.error('Error fetching user permissions:', error)
    }
  }

  async function fetchRolePermissions(roleId) {
    try {
      const response = await api.get(`/permissions/role/${roleId}`)
      rolePermissions.value = response.data.data || []
    } catch (error) {
      console.error('Error fetching role permissions:', error)
    }
  }

  async function fetchEffectivePermissions(userId) {
    try {
      const response = await api.get(`/permissions/effective/${userId}`)
      userPermissions.value = response.data.data || []
    } catch (error) {
      console.error('Error fetching effective permissions:', error)
    }
  }

  async function updateRolePermissions(roleId, permissionIds) {
    try {
      await api.put(`/permissions/role/${roleId}`, { permissionIds })
    } catch (error) {
      console.error('Error updating role permissions:', error)
      throw error
    }
  }

  async function updateUserPermissions(userId, permissionIds) {
    try {
      await api.put(`/permissions/user/${userId}`, { permissionIds })
    } catch (error) {
      console.error('Error updating user permissions:', error)
      throw error
    }
  }

  function hasPermission(code) {
    return effectivePermissionCodes.value.includes(code)
  }

  function canRead(resource) {
    return hasPermission(`${resource}.read`) || hasPermission(`${resource}.manage`)
  }

  function canWrite(resource) {
    return hasPermission(`${resource}.write`) || hasPermission(`${resource}.manage`)
  }

  function canDelete(resource) {
    return hasPermission(`${resource}.delete`) || hasPermission(`${resource}.manage`)
  }

  return {
    allPermissions,
    userPermissions,
    rolePermissions,
    loading,
    allPermissionCodes,
    userPermissionCodes,
    effectivePermissionCodes,
    fetchAllPermissions,
    fetchUserPermissions,
    fetchRolePermissions,
    fetchEffectivePermissions,
    updateRolePermissions,
    updateUserPermissions,
    hasPermission,
    canRead,
    canWrite,
    canDelete
  }
})
