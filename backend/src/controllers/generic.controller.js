export class GenericController {
  constructor (genericModel) {
    this.model = genericModel
  }

  async getAll (req, res, next) {
    try {
      const { search, is_active, limit, offset } = req.query
      const companyId = req.user?.company_id
      const filters = {
        search: search || '',
        is_active: is_active || '',
        company_id: companyId,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
      }
      const result = await this.model.getAll(filters)
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const data = await this.model.getById(req.params.id)
      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      const companyId = req.user?.company_id
      const data = await this.model.create(req.body, userId, companyId)
      res.status(201).json({ success: true, message: 'Creado', data })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      const data = await this.model.update(req.params.id, req.body, userId)
      res.status(200).json({ success: true, message: 'Actualizado', data })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      await this.model.delete(req.params.id, userId)
      res.status(200).json({ success: true, message: 'Eliminado' })
    } catch (error) {
      next(error)
    }
  }

  async restore (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      await this.model.restore(req.params.id, userId)
      res.status(200).json({ success: true, message: 'Restaurado' })
    } catch (error) {
      next(error)
    }
  }
}
