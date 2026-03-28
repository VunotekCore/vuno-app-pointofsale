import { ImageKitService } from '../services/imagekit.service.js'

export class ItemsController {
  constructor (itemsModel) {
    this.itemsModel = itemsModel
  }

  async getAll (req, res, next) {
    try {
      const { location_id, limit, offset, search, status } = req.query
      const filters = {
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        search: search || '',
        status: status || ''
      }
      const result = await this.itemsModel.getAll(location_id, filters)
      res.status(200).json({ success: true, data: result.items, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const item = await this.itemsModel.getById(req.params.id)
      res.status(200).json({ success: true, data: item })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      const item = await this.itemsModel.create(req.body, userId)
      res.status(201).json({ success: true, message: 'Producto creado', data: item })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      const item = await this.itemsModel.update(req.params.id, req.body, userId)
      res.status(200).json({ success: true, message: 'Producto actualizado', data: item })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      await this.itemsModel.delete(req.params.id, userId)
      res.status(200).json({ success: true, message: 'Producto eliminado' })
    } catch (error) {
      next(error)
    }
  }

  async restore (req, res, next) {
    try {
      await this.itemsModel.restore(req.params.id)
      res.status(200).json({ success: true, message: 'Producto restaurado' })
    } catch (error) {
      next(error)
    }
  }

  async getPriceHistory (req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50
      const history = await this.itemsModel.getPriceHistory(req.params.id, limit)
      res.status(200).json({ success: true, data: history })
    } catch (error) {
      next(error)
    }
  }

  async uploadImage (req, res, next) {
    try {
      const { imagekit_private_key: imagekitPrivateKey, imagekit_url_endpoint: imagekitUrlEndpoint } = req.user || {}

      if (!imagekitPrivateKey || !imagekitUrlEndpoint) {
        return res.status(400).json({
          success: false,
          message: 'ImageKit no está configurado para esta empresa'
        })
      }

      const imagekit = new ImageKitService(imagekitPrivateKey, imagekitUrlEndpoint)

      // Handle base64 or binary upload
      const { image, fileName } = req.body
      let fileBuffer
      let finalFileName

      if (image) {
        // Base64 encoded image
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
        fileBuffer = Buffer.from(base64Data, 'base64')
        finalFileName = fileName || `product-${Date.now()}.jpg`
      } else {
        // Binary upload (handled by multer in middleware)
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
        folder: '/products',
        tags: ['product']
      })

      // Update item's image_url
      await this.itemsModel.updateImageUrl(req.params.id, result.url)

      res.status(200).json({
        success: true,
        message: 'Imagen subida exitosamente',
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
