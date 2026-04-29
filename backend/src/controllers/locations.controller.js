export class LocationsController {
  constructor (locationsModel) {
    this.locationsModel = locationsModel
  }

  async getAll (req, res, next) {
    try {
      const { limit, offset, search, is_active } = req.query
      const companyId = req.user?.company_id

      const filters = {
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0,
        search: search || '',
        is_active: is_active || '',
        company_id: companyId
      }

      const result = await this.locationsModel.getAll(filters)
      res.status(200).json({ success: true, data: result.items, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const companyId = req.user?.company_id
      const location = await this.locationsModel.getById(req.params.id, companyId)
      res.status(200).json({ success: true, data: location })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      const companyId = req.user?.company_id
      const location = await this.locationsModel.create(req.body, userId, companyId)
      res.status(201).json({ success: true, message: 'Ubicación creada', data: location })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      const companyId = req.user?.company_id
      const location = await this.locationsModel.update(req.params.id, req.body, userId, companyId)
      res.status(200).json({ success: true, message: 'Ubicación actualizada', data: location })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      const companyId = req.user?.company_id
      await this.locationsModel.delete(req.params.id, userId, companyId)
      res.status(200).json({ success: true, message: 'Ubicación eliminada' })
    } catch (error) {
      next(error)
    }
  }

  async restore (req, res, next) {
    try {
      const companyId = req.user?.company_id
      await this.locationsModel.restore(req.params.id, companyId)
      res.status(200).json({ success: true, message: 'Ubicación restaurada' })
    } catch (error) {
      next(error)
    }
  }
}
