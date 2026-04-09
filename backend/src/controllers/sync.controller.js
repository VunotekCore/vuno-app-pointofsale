export class SyncController {
  constructor(syncModel) {
    this.syncModel = syncModel
  }

  async syncSales(req, res, next) {
    try {
      const { sales, device_id } = req.body

      if (!sales || !Array.isArray(sales) || sales.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de ventas'
        })
      }

      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id

      const result = await this.syncModel.syncSalesBatch(
        sales,
        device_id || 'unknown',
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async getHistory(req, res, next) {
    try {
      const history = await this.syncModel.getSyncHistory(req.userId)
      res.status(200).json({
        success: true,
        data: history
      })
    } catch (error) {
      next(error)
    }
  }

  async getDetails(req, res, next) {
    try {
      const { sync_log_id } = req.params
      const details = await this.syncModel.getSyncDetails(sync_log_id)
      res.status(200).json({
        success: true,
        data: details
      })
    } catch (error) {
      next(error)
    }
  }

  async resolveConflict(req, res, next) {
    try {
      const { conflict_id } = req.params
      const result = await this.syncModel.resolveConflict(conflict_id, req.userId)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
}
