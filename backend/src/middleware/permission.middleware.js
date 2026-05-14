import { PermissionRepository } from '../repository/permission.repository.js'
import database from '../config/database.js'

const permissionRepo = new PermissionRepository(database)

const getPermissionType = (code) => {
  if (code.startsWith('view.') || code.startsWith('menu.')) return 'view'
  return 'table'
}

export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.user_id || req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const effectivePermissions = await permissionRepo.getEffectivePermissions(userId)
      const permissionCodes = effectivePermissions.map((p) => p.code)

      if (!permissionCodes.includes(permissionCode)) {
        const type = getPermissionType(permissionCode)
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${permissionCode}`,
          error: `Missing ${type} permission`
        })
      }

      next()
    } catch (error) {
      console.error('[Permission] Error:', error.message)
      next(error)
    }
  }
}

export const requireAnyPermission = (...permissionCodes) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.user_id || req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const effectivePermissions = await permissionRepo.getEffectivePermissions(userId)
      const userPermissionCodes = effectivePermissions.map((p) => p.code)

      const hasPermission = permissionCodes.some((code) => userPermissionCodes.includes(code))

      if (!hasPermission) {
        const types = [...new Set(permissionCodes.map((c) => getPermissionType(c)))]
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
          error: `Missing ${types.join(' or ')} permission`
        })
      }

      next()
    } catch (error) {
      console.error('[Permission] Error:', error.message)
      next(error)
    }
  }
}
