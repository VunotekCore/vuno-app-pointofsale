import { PlatformUserRepository } from '../repository/platform-user.repository.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { UserRepository } from '../repository/user.repository.js'
import { RolesRepository } from '../repository/roles.repository.js'
import { NotFoundError, BadRequestError, UnauthorizedError } from '../errors/index.js'
import { generateToken } from '../utils/jwt.utils.js'
import jwt from 'jsonwebtoken'

function bufferToUuid (buffer) {
  if (!buffer) return null
  if (Buffer.isBuffer(buffer)) {
    const hex = buffer.toString('hex')
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
  }
  return buffer
}

export class PlatformUserModel {
  constructor (db) {
    this.platformUserRepo = new PlatformUserRepository(db)
  }

  async register (data) {
    if (!data.email || !data.email.includes('@')) {
      throw new BadRequestError('Email inválido')
    }
    if (!data.password || data.password.length < 6) {
      throw new BadRequestError('La contraseña debe tener al menos 6 caracteres')
    }

    const existing = await this.platformUserRepo.findByEmail(data.email)
    if (existing) {
      throw new BadRequestError('Ya existe un usuario con ese email')
    }

    const platformUser = await this.platformUserRepo.create(data)
    return platformUser
  }

  async login (email, password) {
    if (!email || !password) {
      throw new BadRequestError('Email y contraseña son requeridos')
    }

    const platformUser = await this.platformUserRepo.findByEmail(email)
    if (!platformUser) {
      throw new UnauthorizedError('Credenciales inválidas')
    }

    if (!platformUser.is_active) {
      throw new UnauthorizedError('Usuario desactivado')
    }

    const isValid = await this.platformUserRepo.verifyPassword(platformUser, password)
    if (!isValid) {
      throw new UnauthorizedError('Credenciales inválidas')
    }

    const token = jwt.sign(
      {
        id: platformUser.id,
        email: platformUser.email,
        type: 'platform',
        is_super_admin: platformUser.is_super_admin
      },
      process.env.JWT_SECRET || 'VunoTek',
      { expiresIn: '24h' }
    )

    return {
      token,
      user: {
        id: platformUser.id,
        email: platformUser.email,
        name: platformUser.name,
        is_super_admin: platformUser.is_super_admin
      }
    }
  }

  async getProfile (id) {
    const platformUser = await this.platformUserRepo.findById(id)
    if (!platformUser) {
      throw new NotFoundError('Usuario no encontrado')
    }

    const { password_hash, ...userWithoutPassword } = platformUser
    return userWithoutPassword
  }

  async getAllPlatformUsers (filters = {}) {
    return await this.platformUserRepo.findAll(filters)
  }

  async updatePlatformUser (id, data) {
    const existing = await this.platformUserRepo.findById(id)
    if (!existing) {
      throw new NotFoundError('Usuario no encontrado')
    }

    if (data.email && data.email !== existing.email) {
      const emailConflict = await this.platformUserRepo.findByEmail(data.email)
      if (emailConflict) {
        throw new BadRequestError('Ya existe un usuario con ese email')
      }
    }

    return await this.platformUserRepo.update(id, data)
  }

  async deletePlatformUser (id) {
    const existing = await this.platformUserRepo.findById(id)
    if (!existing) {
      throw new NotFoundError('Usuario no encontrado')
    }

    await this.platformUserRepo.delete(id)
    return { success: true }
  }

  async changePassword (id, currentPassword, newPassword) {
    const platformUser = await this.platformUserRepo.findById(id)
    if (!platformUser) {
      throw new NotFoundError('Usuario no encontrado')
    }

    const isValid = await this.platformUserRepo.verifyPassword(platformUser, currentPassword)
    if (!isValid) {
      throw new BadRequestError('Contraseña actual incorrecta')
    }

    if (newPassword.length < 6) {
      throw new BadRequestError('La nueva contraseña debe tener al menos 6 caracteres')
    }

    await this.platformUserRepo.update(id, { password: newPassword })
    return { success: true }
  }

  async switchToCompany (companyId) {
    const companyRepo = new CompanyRepository(this.platformUserRepo.db)
    const company = await companyRepo.findById(companyId)
    if (!company) {
      throw new NotFoundError('Empresa no encontrada')
    }

    if (!company.is_active) {
      throw new BadRequestError('La empresa está desactivada')
    }

    const adminUser = await companyRepo.getAdminUser(companyId)
    if (!adminUser) {
      throw new NotFoundError('No se encontró administrador para esta empresa')
    }

    const userRepo = new UserRepository(this.platformUserRepo.db)
    const fullUser = await userRepo.findById(adminUser.id)
    if (!fullUser) {
      throw new NotFoundError('Usuario administrador no encontrado')
    }

    const roleIdUuid = bufferToUuid(fullUser.role_id)
    const roleRepo = new RolesRepository(this.platformUserRepo.db)
    const role = await roleRepo.getById(roleIdUuid)

    const userId = bufferToUuid(fullUser.id)
    const roleId = bufferToUuid(fullUser.role_id)
    const companyIdFormatted = bufferToUuid(company.id)

    const imagekitConfig = {
      imagekit_private_key: company.imagekit_private_key || null,
      imagekit_url_endpoint: company.imagekit_url_endpoint || null
    }

    const token = generateToken({
      user_id: userId,
      username: fullUser.username,
      email: fullUser.email,
      role_id: roleId,
      role_name: role ? role.name : null,
      company_id: companyIdFormatted,
      is_admin: role ? role.is_admin === 1 : false,
      is_super_admin_impersonating: true,
      ...imagekitConfig
    })

    return {
      token,
      user: {
        id: userId,
        username: fullUser.username,
        email: fullUser.email,
        role_name: role ? role.name : null,
        is_admin: role ? role.is_admin === 1 : false,
        is_super_admin_impersonating: true
      },
      company: {
        id: companyIdFormatted,
        name: company.name,
        logo_url: company.logo_url
      }
    }
  }
}
