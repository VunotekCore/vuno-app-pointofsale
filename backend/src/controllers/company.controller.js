import { CompanyModel } from '../models/company.model.js'
import database from '../config/database.js'
import { ImageKitService } from '../services/imagekit.service.js'

export class CompanyController {
  constructor(companyModel = null) {
    this.companyModel = companyModel || new CompanyModel(database)
  }

  async create(req, res, next) {
    try {
      const company = await this.companyModel.createCompany(req.body)
      res.status(201).json({
        success: true,
        message: 'Empresa creada exitosamente. El administrador puede iniciar sesión.',
        data: company
      })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const company = await this.companyModel.getCompanyById(req.params.id)
      res.status(200).json({
        success: true,
        data: company
      })
    } catch (error) {
      next(error)
    }
  }

  async getBySlug(req, res, next) {
    try {
      const company = await this.companyModel.getCompanyBySlug(req.params.slug)
      res.status(200).json({
        success: true,
        data: company
      })
    } catch (error) {
      next(error)
    }
  }

  async getAll(req, res, next) {
    try {
      const filters = {}
      if (req.query.is_active !== undefined) {
        filters.is_active = parseInt(req.query.is_active)
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit)
      }
      if (req.query.offset) {
        filters.offset = parseInt(req.query.offset)
      }

      const companies = await this.companyModel.getAllCompanies(filters)
      res.status(200).json({
        success: true,
        data: companies,
        total: companies.length
      })
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const company = await this.companyModel.updateCompany(req.params.id, req.body)
      res.status(200).json({
        success: true,
        message: 'Empresa actualizada exitosamente',
        data: company
      })
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      await this.companyModel.deleteCompany(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Empresa desactivada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.companyModel.getCompanyStats(req.params.id)
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  async getWithStats(req, res, next) {
    try {
      const company = await this.companyModel.getCompanyWithStats(req.params.id)
      res.status(200).json({
        success: true,
        data: company
      })
    } catch (error) {
      next(error)
    }
  }

  async getAdmin(req, res, next) {
    try {
      const result = await this.companyModel.getCompanyAdmin(req.params.id)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async changeAdminPassword(req, res, next) {
    try {
      const { userId, newPassword } = req.body
      const result = await this.companyModel.changeAdminPassword(req.params.id, userId, newPassword)
      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async uploadLogo(req, res, next) {
    try {
      let imagekitPrivateKey, imagekitUrlEndpoint

      if (req.platformUser) {
        const companyId = req.params.id
        const companies = await this.db.query(
          'SELECT imagekit_private_key, imagekit_url_endpoint FROM companies WHERE id = UUID_TO_BIN(?)',
          [companyId]
        )
        if (companies.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Empresa no encontrada'
          })
        }
        imagekitPrivateKey = companies[0].imagekit_private_key
        imagekitUrlEndpoint = companies[0].imagekit_url_endpoint
      } else {
        imagekitPrivateKey = req.user?.imagekit_private_key
        imagekitUrlEndpoint = req.user?.imagekit_url_endpoint
      }

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
        finalFileName = fileName || `logo-${Date.now()}.jpg`
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
        folder: '/logos',
        tags: ['logo', 'company']
      })

      await this.companyModel.updateCompany(req.params.id, { logo_url: result.url })

      res.status(200).json({
        success: true,
        message: 'Logo subido exitosamente',
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
