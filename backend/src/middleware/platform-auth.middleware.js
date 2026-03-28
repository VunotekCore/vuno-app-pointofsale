import jwt from 'jsonwebtoken'
import { Database } from '../config/database.js'
import { UnauthorizedError } from '../errors/index.js'

export const platformAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token requerido')
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'VunoTek')
    } catch (err) {
      throw new UnauthorizedError('Token inválido o expirado')
    }

    if (decoded.type !== 'platform') {
      throw new UnauthorizedError('Acceso denegado. Se requiere cuenta de plataforma.')
    }

    req.platformUser = {
      id: decoded.id,
      email: decoded.email,
      is_super_admin: decoded.is_super_admin
    }

    next()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        success: false,
        message: error.message
      })
    }
    return res.status(401).json({
      success: false,
      message: 'Error de autenticación'
    })
  }
}

export const superAdminOnly = (req, res, next) => {
  if (!req.platformUser?.is_super_admin) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo super administradores.'
    })
  }
  next()
}
