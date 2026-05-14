import { verifyToken } from '../utils/jwt.utils.js'
import { usersModel } from '../models/users.model.js'
import { CompanyRepository } from '../repository/company.repository.js'
import database from '../config/database.js'

const companyRepository = new CompanyRepository(database)

const attachUserData = async (req, user, decoded) => {
  const userLocations = await usersModel.getUserLocations(user.id)

  req.user = {
    ...decoded,
    ...user,
    user_id: user.id,
    locations: userLocations
  }

  req.userId = user.id
  req.companyId = user.company_id
  req.userLocations = userLocations.map(ul => ul.location_id)

  // Load ImageKit credentials from company (not from JWT)
  if (user.company_id) {
    try {
      const company = await companyRepository.findById(user.company_id)
      if (company) {
        req.user.imagekit_private_key = company.imagekit_private_key
        req.user.imagekit_url_endpoint = company.imagekit_url_endpoint
      }
    } catch {
      // ImageKit credentials are non-critical
    }
  }
}

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

    await attachUserData(req, user, decoded)

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ success: false, message: 'Error en autenticación' })
  }
}

export const authenticateActive = async (req, res, next) => {
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

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tu usuario está inactivo. Contacta al administrador.' })
    }

    await attachUserData(req, user, decoded)

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ success: false, message: 'Error en autenticación' })
  }
}