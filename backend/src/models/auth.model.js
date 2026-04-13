import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/jwt.utils.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { UnauthorizedError } from '../errors/UnauthorizedError.js'
import { CompanyRepository } from '../repository/company.repository.js'

function bufferToUuid (buffer) {
  if (!buffer) return null
  if (Buffer.isBuffer(buffer)) {
    const hex = buffer.toString('hex')
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
  }
  return buffer
}

/**
 * Model for authentication business logic
 */
export class AuthModel {
  constructor (authRepository, companyRepository = new CompanyRepository()) {
    this.authRepo = authRepository
    this.companyRepo = companyRepository
  }

  async login ({ username, password }) {
    if (!username || !password) {
      throw new BadRequestError('Usuario y contraseña requeridos')
    }

    const user = await this.authRepo.findUserByUsernameOrEmail(username)

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas')
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Usuario inactivo')
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      throw new UnauthorizedError('Credenciales inválidas')
    }

    const role = await this.authRepo.findRoleById(user.role_id)
    const permissions = await this.authRepo.findPermissionsByRoleId(user.role_id)

    const userId = bufferToUuid(user.id)
    const roleId = bufferToUuid(user.role_id)
    const companyId = bufferToUuid(user.company_id)

    // Fetch company data for ImageKit config
    const company = await this.companyRepo.findById(companyId)

    if (!company || !company.is_active) {
      throw new UnauthorizedError('Empresa desactivada. Contacte al administrador.')
    }

    const imagekitConfig = company ? {
      imagekit_private_key: company.imagekit_private_key || null,
      imagekit_url_endpoint: company.imagekit_url_endpoint || null
    } : { imagekit_private_key: null, imagekit_url_endpoint: null }

    const token = generateToken({
      user_id: userId,
      username: user.username,
      email: user.email,
      role_id: roleId,
      role_name: role ? role.name : null,
      company_id: companyId,
      ...imagekitConfig
    })

    const { password_hash: _, ...userWithoutPassword } = user

    return {
      token,
      user: { 
        ...userWithoutPassword, 
        id: userId,
        role_id: roleId,
        company_id: companyId,
        role_name: role ? role.name : null,
        is_admin: role ? role.is_admin === 1 : false
      },
      permissions
    }
  }

  async passwordRequest ({ email }) {
    if (!email) {
      throw new BadRequestError('Email requerido')
    }

    const user = await this.authRepo.findUserByEmail(email)

    if (!user) {
      throw new NotFoundError('Usuario no encontrado')
    }

    const userId = bufferToUuid(user.id)
    const resetToken = generateToken({ user_id: userId, type: 'password_reset' }, 3600)

    return { resetToken }
  }

  async passwordReset ({ token, newPassword }) {
    if (!token || !newPassword) {
      throw new BadRequestError('Token y nueva contraseña requeridos')
    }

    const jwt = await import('jsonwebtoken')
    let decoded

    try {
      decoded = jwt.default.verify(token, process.env.JWT_SECRET)
    } catch (e) {
      throw new UnauthorizedError('Token inválido o expirado')
    }

    if (decoded.type !== 'password_reset') {
      throw new UnauthorizedError('Token inválido')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await this.authRepo.updatePassword(decoded.user_id, passwordHash)

    return { success: true }
  }
}
