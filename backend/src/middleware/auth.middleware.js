import { verifyToken } from '../utils/jwt.utils.js'
import { userHasPermission } from '../utils/rbac.utils.js'
import { permissionsService } from '../utils/permissions.utils.js'
import { usersModel } from '../models/users.model.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' })
    }

    const userId = decoded.user_id || decoded.id

    const user = await usersModel.getUserWithRole(userId)

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' })
    }

    const userLocations = await usersModel.getUserLocations(userId)

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Usuario inactivo' })
    }

    req.user = {
      ...decoded,
      ...user,
      user_id: user.id,
      locations: userLocations
    }

    req.userId = user.id
    req.companyId = user.company_id
    req.userLocations = userLocations.map(ul => ul.location_id)

    if (req.requiredPermission) {
      const isAdmin = user.is_admin === 1
      if (isAdmin) {
        return next()
      }
      const hasPermission = await userHasPermission(user.id, req.requiredPermission)
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: 'Sin permisos suficientes' })
      }
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ success: false, message: 'Error en autenticación' })
  }
}

export const requireRoutePermission = (routePath) => {
  return async (req, res, next) => {
    const permissionCode = permissionsService.getPermissionCodeFromRoute(routePath, req.method)

    if (!permissionCode) {
      console.warn(`[Auth] No permission in DB for route: ${routePath} method: ${req.method}, allowing auth request`)
      req.requiredPermission = null
      return authenticate(req, res, next)
    }

    req.requiredPermission = permissionCode
    return authenticate(req, res, next)
  }
}