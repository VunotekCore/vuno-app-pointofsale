export class SalesController {
  constructor(salesModel, returnsModel) {
    this.salesModel = salesModel
    this.returnsModel = returnsModel
  }

  async create(req, res, next) {
    try {
      const { items, payments, auto_complete, ...saleData } = req.body
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      let sale
      const shouldComplete = auto_complete === true || auto_complete === 'true'
      
      if (shouldComplete) {
        sale = await this.salesModel.createAndCompleteSale(
          { ...saleData, items, payments },
          req.userId,
          userLocations,
          isAdmin,
          companyId
        )
        res.status(201).json({ success: true, message: 'Venta completada', data: sale })
      } else {
        sale = await this.salesModel.createSale(
          { ...saleData, items },
          req.userId,
          userLocations,
          isAdmin,
          companyId
        )
        res.status(201).json({ success: true, message: 'Venta creada', data: sale })
      }
    } catch (error) {
      next(error)
    }
  }

  async complete(req, res, next) {
    try {
      const { id } = req.params
      const { payments } = req.body
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const sale = await this.salesModel.completeSale(
        id,
        payments,
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(200).json({ success: true, message: 'Venta completada', data: sale })
    } catch (error) {
      next(error)
    }
  }

  async suspend(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const sale = await this.salesModel.suspendSale(
        id,
        req.body,
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(200).json({ success: true, message: 'Venta suspendida', data: sale })
    } catch (error) {
      next(error)
    }
  }

  async resume(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const sale = await this.salesModel.resumeSale(
        id,
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(200).json({ success: true, message: 'Venta reanudada', data: sale })
    } catch (error) {
      next(error)
    }
  }

  async cancel(req, res, next) {
    try {
      const { id } = req.params
      const { notes } = req.body
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const sale = await this.salesModel.cancelSale(
        id,
        notes,
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(200).json({ success: true, message: 'Venta cancelada', data: sale })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const sale = await this.salesModel.getSale(
        id,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(200).json({ success: true, data: sale })
    } catch (error) {
      next(error)
    }
  }

  async getAll(req, res, next) {
    try {
      const { location_id, status, start_date, end_date, limit, offset } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const { sales, total } = await this.salesModel.getSales(
        { 
          location_id,
          status,
          start_date,
          end_date,
          company_id: companyId,
          limit: parseInt(limit) || 100,
          offset: parseInt(offset) || 0
        },
        userLocations,
        isAdmin
      )
      
      res.status(200).json({ success: true, data: sales, total })
    } catch (error) {
      next(error)
    }
  }

  async getDailySales(req, res, next) {
    try {
      const { location_id, date } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const sales = await this.salesModel.getDailySales(
        location_id,
        date || new Date(),
        userLocations,
        isAdmin
      )
      
      res.status(200).json({ success: true, data: sales, total: sales.length })
    } catch (error) {
      next(error)
    }
  }

  async getSummary(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const summary = await this.salesModel.getSalesSummary(
        location_id,
        start_date,
        end_date,
        userLocations,
        isAdmin
      )
      
      res.status(200).json({ success: true, data: summary })
    } catch (error) {
      next(error)
    }
  }

  async getTopSellingItems(req, res, next) {
    try {
      const { location_id, start_date, end_date, limit } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const items = await this.salesModel.getTopSellingItems(
        location_id,
        start_date,
        end_date,
        parseInt(limit) || 10,
        userLocations,
        isAdmin
      )
      
      res.status(200).json({ success: true, data: items, total: items.length })
    } catch (error) {
      next(error)
    }
  }

  async getSuspended(req, res, next) {
    try {
      const { location_id } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const sales = await this.salesModel.getSuspendedSales(
        location_id,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(200).json({ success: true, data: sales, total: sales.length })
    } catch (error) {
      next(error)
    }
  }

  async addPayment(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const sale = await this.salesModel.addPaymentToSale(
        id,
        req.body,
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(200).json({ success: true, message: 'Pago agregado', data: sale })
    } catch (error) {
      next(error)
    }
  }

  async updateItem(req, res, next) {
    try {
      const { id, itemId } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const sale = await this.salesModel.updateSaleItem(
        itemId,
        req.body,
        req.userId,
        userLocations,
        isAdmin
      )
      
      res.status(200).json({ success: true, message: 'Ítem actualizado', data: sale })
    } catch (error) {
      next(error)
    }
  }

  async removeItem(req, res, next) {
    try {
      const { id, itemId } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      
      const sale = await this.salesModel.removeSaleItem(
        itemId,
        req.userId,
        userLocations,
        isAdmin
      )
      
      res.status(200).json({ success: true, message: 'Ítem eliminado', data: sale })
    } catch (error) {
      next(error)
    }
  }
}

export class ReturnsController {
  constructor(returnsModel) {
    this.returnsModel = returnsModel
  }

  async create(req, res, next) {
    try {
      const { items, ...returnData } = req.body
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const returnObj = await this.returnsModel.createReturn(
        { ...returnData, items },
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(201).json({ success: true, message: 'Devolución creada', data: returnObj })
    } catch (error) {
      next(error)
    }
  }

  async process(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const returnObj = await this.returnsModel.processReturn(
        id,
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      
      res.status(200).json({ success: true, message: 'Devolución procesada', data: returnObj })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const returnObj = await this.returnsModel.getReturn(
        id,
        companyId,
        userLocations,
        isAdmin
      )
      
      res.status(200).json({ success: true, data: returnObj })
    } catch (error) {
      next(error)
    }
  }

  async getAll(req, res, next) {
    try {
      const { location_id, start_date, end_date, limit, offset, search } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const result = await this.returnsModel.getReturns(
        { 
          location_id,
          start_date,
          end_date,
          search,
          company_id: companyId,
          limit: parseInt(limit) || 20,
          offset: parseInt(offset) || 0
        },
        userLocations,
        isAdmin
      )
      
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }
}
