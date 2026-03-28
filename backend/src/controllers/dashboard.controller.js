export class DashboardController {
  constructor(dashboardModel) {
    this.dashboardModel = dashboardModel
  }

  async getDailyStats(req, res, next) {
    try {
      const { location_id } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const stats = await this.dashboardModel.getDailyStats(
        location_id,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }

  async getStatsByDateRange(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date y end_date son requeridos' 
        })
      }

      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const stats = await this.dashboardModel.getStatsByDateRange(
        location_id,
        start_date,
        end_date,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }

  async getSalesByPeriod(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date y end_date son requeridos' 
        })
      }

      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const data = await this.dashboardModel.getSalesByPeriod(
        location_id,
        start_date,
        end_date,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data, total: data.length })
    } catch (error) {
      next(error)
    }
  }

  async getTopSellingItems(req, res, next) {
    try {
      const { location_id, start_date, end_date, limit } = req.query
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date y end_date son requeridos' 
        })
      }

      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const items = await this.dashboardModel.getTopSellingItems(
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

  async getPaymentSummary(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date y end_date son requeridos' 
        })
      }

      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const summary = await this.dashboardModel.getPaymentSummary(
        location_id,
        start_date,
        end_date,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data: summary, total: summary.length })
    } catch (error) {
      next(error)
    }
  }

  async getLowStock(req, res, next) {
    try {
      const { limit } = req.query
      const locationId = req.query.location_id || null
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const items = await this.dashboardModel.getLowStock(
        locationId,
        userLocations,
        isAdmin,
        parseInt(limit) || 20
      )

      res.status(200).json({ success: true, data: items, total: items.length })
    } catch (error) {
      next(error)
    }
  }

  async getNewCustomers(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date y end_date son requeridos' 
        })
      }

      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const stats = await this.dashboardModel.getNewCustomers(
        location_id,
        start_date,
        end_date,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }

  async getCustomersByPeriod(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date y end_date son requeridos' 
        })
      }

      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const data = await this.dashboardModel.getCustomersByPeriod(
        location_id,
        start_date,
        end_date,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data, total: data.length })
    } catch (error) {
      next(error)
    }
  }

  async getRecentSales(req, res, next) {
    try {
      const { location_id, limit } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const sales = await this.dashboardModel.getRecentSales(
        location_id,
        parseInt(limit) || 10,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data: sales, total: sales.length })
    } catch (error) {
      next(error)
    }
  }

  async getRecentMovements(req, res, next) {
    try {
      const { location_id, limit } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const movements = await this.dashboardModel.getRecentMovements(
        location_id,
        parseInt(limit) || 20,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data: movements, total: movements.length })
    } catch (error) {
      next(error)
    }
  }

  async getLocations(req, res, next) {
    try {
      const locations = await this.dashboardModel.getLocations()
      res.status(200).json({ success: true, data: locations, total: locations.length })
    } catch (error) {
      next(error)
    }
  }

  async getFullDashboard(req, res, next) {
    try {
      const { location_id } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const dashboard = await this.dashboardModel.getFullDashboard(
        location_id,
        userLocations,
        isAdmin
      )

      res.status(200).json({ success: true, data: dashboard })
    } catch (error) {
      next(error)
    }
  }

  async getAdminFinancialDashboard(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - 7)
      const monthStart = new Date(today)
      monthStart.setMonth(monthStart.getMonth() - 1)

      const start = start_date || monthStart.toISOString().split('T')[0]
      const end = end_date || today.toISOString().split('T')[0]

      const [
        dailyStats,
        yesterdayStats,
        weekStats,
        monthStats,
        financialOverview,
        yoyComparison,
        pnlByLocation,
        clv,
        taxCompliance,
        cac,
        topItems,
        paymentSummary,
        newCustomers,
        recentSales,
        lowStock
      ] = await Promise.all([
        this.dashboardModel.getDailyStats(location_id, userLocations, isAdmin),
        this.dashboardModel.getStatsByDateRange(location_id, yesterday.toISOString().split('T')[0], today.toISOString().split('T')[0], userLocations, isAdmin),
        this.dashboardModel.getStatsByDateRange(location_id, weekStart.toISOString().split('T')[0], today.toISOString().split('T')[0], userLocations, isAdmin),
        this.dashboardModel.getStatsByDateRange(location_id, monthStart.toISOString().split('T')[0], today.toISOString().split('T')[0], userLocations, isAdmin),
        this.dashboardModel.getFinancialOverview(location_id, start, end, userLocations, isAdmin),
        this.dashboardModel.getYearOverYearComparison(location_id, start, end, userLocations, isAdmin),
        this.dashboardModel.getPnLByLocation(start, end, userLocations, isAdmin),
        this.dashboardModel.getCustomerLifetimeValue(start, end, userLocations, isAdmin),
        this.dashboardModel.getTaxCompliance(start, end, userLocations, isAdmin),
        this.dashboardModel.getCustomerAcquisitionCost(start, end, userLocations, isAdmin),
        this.dashboardModel.getTopSellingItems(location_id, start, end, 10, userLocations, isAdmin),
        this.dashboardModel.getPaymentSummary(location_id, start, end, userLocations, isAdmin),
        this.dashboardModel.getNewCustomers(location_id, monthStart.toISOString().split('T')[0], today.toISOString().split('T')[0], userLocations, isAdmin),
        this.dashboardModel.getRecentSales(location_id, 10, userLocations, isAdmin),
        this.dashboardModel.getLowStock(location_id, userLocations, isAdmin, 20)
      ])

      res.status(200).json({
        success: true,
        data: {
          period: { start_date: start, end_date: end },
          daily: dailyStats,
          yesterday: yesterdayStats,
          week: weekStats,
          month: monthStats,
          financial_overview: financialOverview,
          yoy_comparison: yoyComparison,
          pnl_by_location: pnlByLocation,
          customer_lifetime_value: clv,
          tax_compliance: taxCompliance,
          customer_acquisition_cost: cac,
          top_items: topItems,
          payment_summary: paymentSummary,
          new_customers: newCustomers,
          recent_sales: recentSales,
          low_stock: lowStock
        }
      })
    } catch (error) {
      next(error)
    }
  }

  async getManagerOperationalDashboard(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - 7)

      const start = start_date || weekStart.toISOString().split('T')[0]
      const end = end_date || today.toISOString().split('T')[0]

      const [
        inventoryTurnover,
        salesByEmployee,
        salesByHour,
        returnsAndCancellations,
        drawerDiscrepancies,
        lowStock,
        topItems
      ] = await Promise.all([
        this.dashboardModel.getInventoryTurnover(start, end, location_id, userLocations, isAdmin),
        this.dashboardModel.getSalesByEmployee(start, end, location_id, userLocations, isAdmin),
        this.dashboardModel.getSalesByHour(start, end, location_id, userLocations, isAdmin),
        this.dashboardModel.getReturnsAndCancellations(start, end, location_id, userLocations, isAdmin),
        this.dashboardModel.getCashDrawerDiscrepancies(start, end, location_id, userLocations, isAdmin),
        this.dashboardModel.getLowStock(location_id, userLocations, isAdmin, 20),
        this.dashboardModel.getTopSellingItems(location_id, start, end, 10, userLocations, isAdmin)
      ])

      res.status(200).json({
        success: true,
        data: {
          period: { start_date: start, end_date: end },
          inventory_turnover: inventoryTurnover,
          sales_by_employee: salesByEmployee,
          sales_by_hour: salesByHour,
          returns_and_cancellations: returnsAndCancellations,
          drawer_discrepancies: drawerDiscrepancies,
          low_stock_alerts: lowStock,
          top_items: topItems
        }
      })
    } catch (error) {
      next(error)
    }
  }

  async getCashierDashboard(req, res, next) {
    try {
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []
      const userId = req.user?.id

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const monthStart = new Date(today)
      monthStart.setMonth(monthStart.getMonth() - 1)

      const [dailyStats, monthStats, avgTransactionTime] = await Promise.all([
        this.dashboardModel.getEmployeeSalesGoals(userId, today.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]),
        this.dashboardModel.getEmployeeSalesGoals(userId, monthStart.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]),
        this.dashboardModel.getAverageTransactionTime(null, monthStart.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0], userLocations, isAdmin)
      ])

      res.status(200).json({
        success: true,
        data: {
          daily: dailyStats,
          month: monthStats,
          average_transaction_time: avgTransactionTime
        }
      })
    } catch (error) {
      next(error)
    }
  }
}
