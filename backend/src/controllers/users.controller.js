import { ImageKitService } from '../services/imagekit.service.js'
import { NotFoundError } from '../errors/NotFoundError.js'

export class UsersController {
  constructor (usersModel) {
    this.usersModel = usersModel
  }

  async getAll (req, res, next) {
    try {
      const { limit, offset, search, ...filters } = req.query
      const companyId = req.user?.company_id
      const result = await this.usersModel.getAll({ limit, offset, search, company_id: companyId, ...filters })
      res.status(200).json({ success: true, data: result.data || result, total: result.total || result.length })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const { id } = req.params
      const user = await this.usersModel.getById(id)
      res.status(200).json({ success: true, data: user })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const { username, email, password, role_id, is_active, location_ids, employee, avatar } = req.body
      const userId = req.user?.user_id || null
      const companyId = req.user?.company_id
      const result = await this.usersModel.create({ username, email, password, role_id, is_active, location_ids, employee, avatar }, userId, companyId)
      res.status(201).json({
        success: true,
        message: 'Usuario creado',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const { id } = req.params
      const { username, email, password, role_id, is_active, location_ids, employee, avatar } = req.body
      const userId = req.user?.user_id || null
      const companyId = req.user?.company_id
      await this.usersModel.update(id, { username, email, password, role_id, is_active, location_ids, employee, avatar }, userId, companyId)
      res.status(200).json({ success: true, message: 'Usuario actualizado' })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user?.user_id || null
      const companyId = req.user?.company_id
      await this.usersModel.delete(id, userId, companyId)
      res.status(200).json({ success: true, message: 'Usuario eliminado' })
    } catch (error) {
      next(error)
    }
  }

  async restore (req, res, next) {
    try {
      const { id } = req.params
      await this.usersModel.restore(id)
      res.status(200).json({ success: true, message: 'Usuario restaurado' })
    } catch (error) {
      next(error)
    }
  }

  async uploadAvatar (req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID no encontrado'
        })
      }

      const user = await this.usersModel.getById(id)
      if (!user) {
        throw new NotFoundError('Usuario no encontrado')
      }

      const imagekitPrivateKey = req.user?.imagekit_private_key
      const imagekitUrlEndpoint = req.user?.imagekit_url_endpoint

      if (!imagekitPrivateKey || !imagekitUrlEndpoint) {
        return res.status(400).json({
          success: false,
          message: 'ImageKit no está configurado para esta empresa'
        })
      }

      const imagekit = new ImageKitService(imagekitPrivateKey, imagekitUrlEndpoint)

      const { image, fileName } = req.body
      let fileBuffer
      let finalFileName

      if (image) {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
        fileBuffer = Buffer.from(base64Data, 'base64')
        finalFileName = fileName || `avatar-${Date.now()}.jpg`
      } else {
        fileBuffer = req.file?.buffer
        finalFileName = req.file?.originalname
      }

      if (!fileBuffer) {
        return res.status(400).json({
          success: false,
          message: 'No se recibió ninguna imagen'
        })
      }

      const result = await imagekit.uploadImage(fileBuffer, finalFileName, {
        folder: '/avatars',
        tags: ['avatar', 'user']
      })

      await this.usersModel.update(id, { avatar: result.url }, req.user?.user_id)

      res.status(200).json({
        success: true,
        message: 'Avatar subido exitosamente',
        data: {
          url: result.url,
          fileId: result.fileId
        }
      })
    } catch (error) {
      next(error)
    }
  }
}
