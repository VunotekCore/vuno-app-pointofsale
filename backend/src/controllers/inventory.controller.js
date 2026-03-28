export class InventoryController {
  constructor (inventoryModel) {
    this.inventoryModel = inventoryModel
  }

  async getStock (req, res, next) {
    try {
      const { location_id, search, limit, offset } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const result = await this.inventoryModel.getStockByLocation({
        locationId: location_id,
        userLocations,
        isAdmin,
        search,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      })
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getMovements (req, res, next) {
    try {
      const { item_id, location_id, limit } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const movements = await this.inventoryModel.getMovements(
        item_id, 
        location_id, 
        parseInt(limit) || 100,
        userLocations,
        isAdmin
      )
      res.status(200).json({ success: true, data: movements, total: movements.length })
    } catch (error) {
      next(error)
    }
  }

  async getSerials (req, res, next) {
    try {
      const { item_id, location_id, status } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const serials = await this.inventoryModel.getSerials(
        item_id, 
        location_id, 
        status,
        userLocations,
        isAdmin
      )
      res.status(200).json({ success: true, data: serials, total: serials.length })
    } catch (error) {
      next(error)
    }
  }

  async getLowStock (req, res, next) {
    try {
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const lowStock = await this.inventoryModel.getLowStock(userLocations, isAdmin)
      res.status(200).json({ success: true, data: lowStock, total: lowStock.length })
    } catch (error) {
      next(error)
    }
  }

  async getStockInTransit (req, res, next) {
    try {
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const stockInTransit = await this.inventoryModel.getStockInTransit(userLocations, isAdmin)
      res.status(200).json({ success: true, data: stockInTransit, total: stockInTransit.length })
    } catch (error) {
      next(error)
    }
  }
}
