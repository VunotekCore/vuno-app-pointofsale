import { UserLocationsRepository } from '../repository/user-locations.repository.js'
import { BadRequestError } from '../errors/BadRequestError.js'

export class UserLocationsController {
  constructor(userLocationsRepo = null) {
    this.userLocationsRepo = userLocationsRepo || new UserLocationsRepository()
  }

  async getByUserId (req, res, next) {
    try {
      const userId = req.params.userId || req.user?.id
      const locations = await this.userLocationsRepo.getByUserId(userId)
      res.status(200).json({ success: true, data: locations })
    } catch (error) {
      next(error)
    }
  }

  async getLocationsForUser (req, res, next) {
    try {
      const userId = req.user?.id
      const locations = await this.userLocationsRepo.getByUserId(userId)
      res.status(200).json({ success: true, data: locations })
    } catch (error) {
      next(error)
    }
  }

  async add (req, res, next) {
    try {
      const { user_id, location_id, is_default } = req.body

      if (!user_id || !location_id) {
        throw new BadRequestError('user_id y location_id son requeridos')
      }

      await this.userLocationsRepo.add(user_id, location_id, is_default || false)

      res.status(201).json({ success: true, message: 'Ubicación asignada al usuario' })
    } catch (error) {
      next(error)
    }
  }

  async remove (req, res, next) {
    try {
      const { user_id, location_id } = req.params

      if (!user_id || !location_id) {
        throw new BadRequestError('user_id y location_id son requeridos')
      }

      await this.userLocationsRepo.remove(user_id, location_id)

      res.status(200).json({ success: true, message: 'Ubicación removida del usuario' })
    } catch (error) {
      next(error)
    }
  }

  async setDefault (req, res, next) {
    try {
      const { user_id, location_id } = req.body

      if (!user_id || !location_id) {
        throw new BadRequestError('user_id y location_id son requeridos')
      }

      await this.userLocationsRepo.setDefault(user_id, location_id)

      res.status(200).json({ success: true, message: 'Ubicación por defecto actualizada' })
    } catch (error) {
      next(error)
    }
  }
}
