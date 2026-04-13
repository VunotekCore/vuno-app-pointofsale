export class ExpirationController {
  constructor (expirationModel) {
    this.expirationModel = expirationModel
  }

  async getExpiring (req, res, next) {
    try {
      const { days, location_id } = req.query
      const companyId = req.user.company_id
      
      const items = await this.expirationModel.getExpiringItems(
        companyId,
        days ? parseInt(days) : null,
        location_id || null
      )
      
      res.json({
        success: true,
        data: items,
        total: items.length
      })
    } catch (error) {
      next(error)
    }
  }

  async getExpired (req, res, next) {
    try {
      const { location_id } = req.query
      const companyId = req.user.company_id
      
      const items = await this.expirationModel.getExpiredItems(companyId, location_id || null)
      
      res.json({
        success: true,
        data: items,
        total: items.length
      })
    } catch (error) {
      next(error)
    }
  }

  async getByItem (req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user.company_id
      
      const expirations = await this.expirationModel.getByItem(id, companyId)
      
      res.json({
        success: true,
        data: expirations
      })
    } catch (error) {
      next(error)
    }
  }

  async markProcessed (req, res, next) {
    try {
      const { id } = req.params
      
      await this.expirationModel.markAsProcessed(id)
      
      res.json({
        success: true,
        message: 'Marcado como procesado'
      })
    } catch (error) {
      next(error)
    }
  }

  async getSummary (req, res, next) {
    try {
      const companyId = req.user.company_id
      
      const summary = await this.expirationModel.getSummary(companyId)
      
      res.json({
        success: true,
        data: summary
      })
    } catch (error) {
      next(error)
    }
  }
}
