import { PlatformUserRepository } from '../repository/platform-user.repository.js'
import { NotFoundError, BadRequestError, UnauthorizedError } from '../errors/index.js'
import jwt from 'jsonwebtoken'

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
}
