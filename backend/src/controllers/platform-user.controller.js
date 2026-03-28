import { PlatformUserModel } from '../models/platform-user.model.js'
import database from '../config/database.js'

export class PlatformUserController {
  constructor(platformUserModel = null) {
    this.platformUserModel = platformUserModel || new PlatformUserModel(database)
  }

  async register(req, res, next) {
    try {
      const platformUser = await this.platformUserModel.register(req.body)
      res.status(201).json({
        success: true,
        message: 'Usuario plataforma creado exitosamente',
        data: platformUser
      })
    } catch (error) {
      next(error)
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body
      const result = await this.platformUserModel.login(email, password)
      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await this.platformUserModel.getProfile(req.params.id)
      res.status(200).json({
        success: true,
        data: profile
      })
    } catch (error) {
      next(error)
    }
  }

  async getAll(req, res, next) {
    try {
      const filters = {}
      if (req.query.is_super_admin !== undefined) {
        filters.is_super_admin = parseInt(req.query.is_super_admin)
      }
      if (req.query.is_active !== undefined) {
        filters.is_active = parseInt(req.query.is_active)
      }

      const platformUsers = await this.platformUserModel.getAllPlatformUsers(filters)
      res.status(200).json({
        success: true,
        data: platformUsers,
        total: platformUsers.length
      })
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const platformUser = await this.platformUserModel.updatePlatformUser(req.params.id, req.body)
      res.status(200).json({
        success: true,
        message: 'Usuario plataforma actualizado exitosamente',
        data: platformUser
      })
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      await this.platformUserModel.deletePlatformUser(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Usuario plataforma desactivado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body
      await this.platformUserModel.changePassword(req.params.id, currentPassword, newPassword)
      res.status(200).json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}
