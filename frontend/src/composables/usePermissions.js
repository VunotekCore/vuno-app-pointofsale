import { usePermissionStore } from '../stores/permission.store.js'
import { useAuthStore } from '../stores/auth.store.js'

export function usePermissions() {
  const permissionStore = usePermissionStore()
  const authStore = useAuthStore()

  const hasPermission = (code) => {
    if (authStore.user?.is_admin == 1 || authStore.user?.role_name?.toLowerCase() === 'admin') {
      return true
    }
    return permissionStore.hasPermission(code)
  }

  const canAccess = (resource) => {
    return hasPermission(`view.${resource}`)
  }

  const canCreate = (resource) => {
    return hasPermission(`${resource}.write`) || hasPermission(`${resource}.manage`)
  }

  const canEdit = (resource) => {
    return hasPermission(`${resource}.write`) || hasPermission(`${resource}.manage`)
  }

  const canRemove = (resource) => {
    return hasPermission(`${resource}.delete`) || hasPermission(`${resource}.manage`)
  }

  const initPermissions = async () => {
    await permissionStore.fetchAllPermissions()
    if (authStore.user?.id) {
      await permissionStore.fetchEffectivePermissions(authStore.user.id)
    }
  }

  return {
    hasPermission,
    canAccess,
    canCreate,
    canEdit,
    canRemove,
    initPermissions,
    permissionStore
  }
}
