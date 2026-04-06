export class PaymentController {
  constructor(paymentModel) {
    this.paymentModel = paymentModel
  }

  async getPaymentMethods(req, res, next) {
    try {
      const methods = await this.paymentModel.getPaymentMethods()
      res.status(200).json({ success: true, data: methods, total: methods.length })
    } catch (error) {
      next(error)
    }
  }

  async getPaymentMethod(req, res, next) {
    try {
      const { id } = req.params
      const method = await this.paymentModel.getPaymentMethod(id)
      res.status(200).json({ success: true, data: method })
    } catch (error) {
      next(error)
    }
  }

  async createPaymentMethod(req, res, next) {
    try {
      const isAdmin = req.user?.is_admin == 1
      const method = await this.paymentModel.createPaymentMethod(req.body, req.userId, isAdmin)
      res.status(201).json({ success: true, message: 'Método de pago creado', data: method })
    } catch (error) {
      next(error)
    }
  }

  async updatePaymentMethod(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const method = await this.paymentModel.updatePaymentMethod(id, req.body, req.userId, isAdmin)
      res.status(200).json({ success: true, message: 'Método de pago actualizado', data: method })
    } catch (error) {
      next(error)
    }
  }

  async deletePaymentMethod(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      await this.paymentModel.deletePaymentMethod(id, req.userId, isAdmin)
      res.status(200).json({ success: true, message: 'Método de pago eliminado' })
    } catch (error) {
      next(error)
    }
  }

  async getCashDrawers(req, res, next) {
    try {
      const { location_id } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const drawers = await this.paymentModel.getCashDrawers(
        location_id || null,
        userLocations,
        isAdmin,
        companyId
      )
      res.status(200).json({ success: true, data: drawers, total: drawers.length })
    } catch (error) {
      next(error)
    }
  }

  async getCashDrawer(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const drawer = await this.paymentModel.getCashDrawer(id, userLocations, isAdmin, companyId)
      res.status(200).json({ success: true, data: drawer })
    } catch (error) {
      next(error)
    }
  }

  async getOpenDrawer(req, res, next) {
    try {
      const { location_id } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const drawer = await this.paymentModel.getOpenDrawer(
        location_id || userLocations[0],
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      
      if (!drawer) {
        return res.status(200).json({ success: true, data: null, message: 'No hay caja abierta' })
      }
      
      res.status(200).json({ success: true, data: drawer })
    } catch (error) {
      next(error)
    }
  }

  async openDrawer(req, res, next) {
    try {
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const drawer = await this.paymentModel.openDrawer(req.body, req.userId, userLocations, isAdmin, companyId)
      res.status(201).json({ success: true, message: 'Caja abierta', data: drawer })
    } catch (error) {
      next(error)
    }
  }

  async closeDrawer(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const result = await this.paymentModel.closeDrawer(id, req.body, req.userId, userLocations, isAdmin, companyId)
      res.status(200).json({ success: true, message: 'Caja cerrada', data: result })
    } catch (error) {
      next(error)
    }
  }

  async getDrawerTransactions(req, res, next) {
    try {
      const { id } = req.params
      const { start_date, end_date } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const transactions = await this.paymentModel.getDrawerTransactions(
        id,
        { start_date, end_date },
        userLocations,
        isAdmin,
        companyId
      )
      res.status(200).json({ success: true, data: transactions, total: transactions.length })
    } catch (error) {
      next(error)
    }
  }

  async getDrawerSummary(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const summary = await this.paymentModel.getDrawerSummary(id, userLocations, isAdmin, companyId)
      res.status(200).json({ success: true, data: summary })
    } catch (error) {
      next(error)
    }
  }

  async getPaymentSummary(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const summary = await this.paymentModel.getPaymentSummary(
        location_id,
        start_date,
        end_date,
        userLocations,
        isAdmin,
        companyId
      )
      res.status(200).json({ success: true, data: summary })
    } catch (error) {
      next(error)
    }
  }

  async getCashDrawerSummary(req, res, next) {
    try {
      const { id } = req.params
      const { start_date, end_date } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const summary = await this.paymentModel.getCashDrawerSummary(
        id,
        userLocations,
        isAdmin,
        start_date || null,
        end_date || null,
        companyId
      )
      res.status(200).json({ success: true, data: summary })
    } catch (error) {
      next(error)
    }
  }

  async getDrawerHistory(req, res, next) {
    try {
      const { location_id, search, limit = 20, offset = 0, start_date, end_date } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const result = await this.paymentModel.getDrawerHistory(
        location_id || null,
        userLocations,
        isAdmin,
        { search, limit: parseInt(limit), offset: parseInt(offset), start_date, end_date },
        companyId
      )
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async addTransaction(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const companyId = req.user?.company_id
      
      const transaction = await this.paymentModel.addTransaction(
        id,
        req.body,
        req.userId,
        userLocations,
        isAdmin,
        companyId
      )
      res.status(201).json({ success: true, message: 'Transacción registrada', data: transaction })
    } catch (error) {
      next(error)
    }
  }
}
