import pool from '../config/database.js'

function UUID_TO_BIN(uuid) {
  return uuid
}

function BIN_TO_UUID(binary) {
  return binary
}

export class DashboardRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getDailySales(locationId, userLocations = [], isAdmin = false) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discounts
      FROM sales s
      WHERE s.status = 'completed' AND s.sale_date >= ? AND s.sale_date < ?
    `
    const params = [today, tomorrow]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    const rows = await this.db.query(query, params)
    return rows[0]
  }

  async getSalesByDateRange(locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discounts
      FROM sales s
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    const rows = await this.db.query(query, params)
    return rows[0]
  }

  async getSalesByPeriod(locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        DATE(s.sale_date) as date,
        COUNT(*) as transactions,
        SUM(s.total) as total_sales
      FROM sales s
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' GROUP BY DATE(s.sale_date) ORDER BY date DESC'

    return await this.db.query(query, params)
  }

  async getTopSellingItems(locationId, startDate, endDate, limit = 10, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        BIN_TO_UUID(i.id) as id,
        i.name,
        i.item_number,
        i.image_url,
        SUM(si.quantity) as total_quantity,
        SUM(si.line_total) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN items i ON si.item_id = i.id
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ` GROUP BY i.id, i.name, i.item_number, i.image_url ORDER BY total_quantity DESC LIMIT ?`
    params.push(parseInt(limit))

    return await this.db.query(query, params)
  }

  async getPaymentSummary(locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        sp.payment_type,
        pm.name as payment_method_name,
        pm.type as payment_type_category,
        SUM(sp.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      LEFT JOIN payment_methods pm ON sp.payment_type = pm.code
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' GROUP BY sp.payment_type, pm.name, pm.type ORDER BY total_amount DESC'

    return await this.db.query(query, params)
  }

  async getLowStock(locationId = null, userLocations = [], isAdmin = false, limit = 20) {
    let query = `
      SELECT
        BIN_TO_UUID(i.id) as id,
        i.item_number,
        i.name,
        i.reorder_level,
        i.image_url,
        COALESCE(SUM(iq.quantity), 0) as total_quantity,
        c.name as category_name,
        l.name as location_name,
        BIN_TO_UUID(l.id) as location_id
      FROM items i
      LEFT JOIN item_quantities iq ON i.id = iq.item_id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON iq.location_id = l.id
      WHERE i.status = 'active' AND i.is_service = 0
    `
    const params = []

    if (locationId) {
      query += ' AND iq.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND (iq.location_id IN (${placeholders}) OR iq.location_id IS NULL)`
      params.push(...userLocations)
    }

    query += ` GROUP BY i.id, i.item_number, i.name, i.reorder_level, i.image_url, c.name, l.name, l.id
      HAVING COALESCE(SUM(iq.quantity), 0) <= i.reorder_level OR i.reorder_level = 0
      ORDER BY total_quantity ASC
      LIMIT ?`
    params.push(parseInt(limit))

    return await this.db.query(query, params)
  }

  async getNewCustomers(locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        COUNT(*) as total_new_customers
      FROM customers c
      WHERE c.created_at BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    const rows = await this.db.query(query, params)
    return rows[0]
  }

  async getCustomersByPeriod(locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        DATE(c.created_at) as date,
        COUNT(*) as new_customers
      FROM customers c
      WHERE c.created_at BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    query += ' GROUP BY DATE(c.created_at) ORDER BY date DESC'

    return await this.db.query(query, params)
  }

  async getRecentSales(locationId, limit = 10, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        BIN_TO_UUID(s.id) as id,
        s.sale_number,
        s.total,
        s.status,
        s.sale_date,
        s.created_at,
        u.username as employee_name,
        l.name as location_name,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name
      FROM sales s
      JOIN users u ON s.created_by = u.id
      JOIN locations l ON s.location_id = l.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.status = 'completed'
    `
    const params = []

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' ORDER BY s.sale_date DESC LIMIT ?'
    params.push(parseInt(limit))

    return await this.db.query(query, params)
  }

  async getRecentMovements(locationId, limit = 20, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        BIN_TO_UUID(im.id) as id,
        im.movement_type,
        im.quantity_change,
        im.quantity_before,
        im.quantity_after,
        im.created_at,
        i.name as item_name,
        i.item_number,
        l.name as location_name,
        u.username as created_by_name
      FROM inventory_movements im
      JOIN items i ON im.item_id = i.id
      JOIN locations l ON im.location_id = l.id
      LEFT JOIN users u ON im.user_id = u.id
      WHERE 1=1
    `
    const params = []

    if (locationId) {
      query += ' AND im.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND im.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' ORDER BY im.created_at DESC LIMIT ?'
    params.push(parseInt(limit))

    return await this.db.query(query, params)
  }

  async getLocations() {
    return await this.db.query('SELECT BIN_TO_UUID(id) as id, name, code FROM locations WHERE is_active = 1 ORDER BY name')
  }

  async getFinancialOverview(locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    let salesQuery = `
      SELECT 
        COALESCE(SUM(s.subtotal), 0) as total_revenue,
        COALESCE(SUM(s.tax_amount), 0) as total_tax,
        COALESCE(SUM(s.discount_amount), 0) as total_discounts,
        COUNT(*) as total_transactions
      FROM sales s
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    let costQuery = `
      SELECT 
        COALESCE(SUM(si.cost_price * si.quantity), 0) as total_cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]
    const paramsCost = [startDate, endDate]

    if (locationId) {
      salesQuery += ' AND s.location_id = UUID_TO_BIN(?)'
      costQuery += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
      paramsCost.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      salesQuery += ` AND s.location_id IN (${placeholders})`
      costQuery += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
      paramsCost.push(...userLocations)
    }

    const [salesResult, costResult] = await Promise.all([
      this.db.query(salesQuery, params),
      this.db.query(costQuery, paramsCost)
    ])

    const totalRevenue = parseFloat(salesResult[0].total_revenue) || 0
    const totalTax = parseFloat(salesResult[0].total_tax) || 0
    const totalDiscounts = parseFloat(salesResult[0].total_discounts) || 0
    const totalCOGS = parseFloat(costResult[0].total_cogs) || 0
    const grossProfit = totalRevenue - totalCOGS
    const ebitda = grossProfit
    const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0

    return {
      total_revenue: totalRevenue,
      total_tax: totalTax,
      total_discounts: totalDiscounts,
      total_cogs: totalCOGS,
      gross_profit: grossProfit,
      ebitda,
      ebitda_margin: parseFloat(ebitdaMargin.toFixed(2)),
      total_transactions: parseInt(salesResult[0].total_transactions) || 0,
      average_ticket: salesResult[0].total_transactions > 0 
        ? totalRevenue / salesResult[0].total_transactions 
        : 0
    }
  }

  async getYearOverYearComparison(locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const prevStart = new Date(start)
    prevStart.setFullYear(prevStart.getFullYear() - 1)
    const prevEnd = new Date(end)
    prevEnd.setFullYear(prevEnd.getFullYear() - 1)

    const currentPeriod = await this.getFinancialOverview(
      locationId, 
      startDate, 
      endDate, 
      userLocations, 
      isAdmin
    )
    const previousPeriod = await this.getFinancialOverview(
      locationId,
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0],
      userLocations,
      isAdmin
    )

    const revenueChange = previousPeriod.total_revenue > 0
      ? ((currentPeriod.total_revenue - previousPeriod.total_revenue) / previousPeriod.total_revenue) * 100
      : 0
    const transactionChange = previousPeriod.total_transactions > 0
      ? ((currentPeriod.total_transactions - previousPeriod.total_transactions) / previousPeriod.total_transactions) * 100
      : 0

    return {
      current: currentPeriod,
      previous: previousPeriod,
      changes: {
        revenue_change: parseFloat(revenueChange.toFixed(2)),
        transaction_change: parseFloat(transactionChange.toFixed(2))
      }
    }
  }

  async getPnLByLocation(startDate, endDate, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        BIN_TO_UUID(l.id) as location_id,
        l.name as location_name,
        COALESCE(SUM(s.subtotal), 0) as total_revenue,
        COALESCE(SUM(s.tax_amount), 0) as total_tax,
        COUNT(DISTINCT s.id) as transactions
      FROM locations l
      LEFT JOIN sales s ON l.id = s.location_id AND s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` WHERE l.id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' GROUP BY l.id, l.name ORDER BY total_revenue DESC'

    const locations = await this.db.query(query, params)

    const costQuery = `
      SELECT 
        s.location_id,
        COALESCE(SUM(si.cost_price * si.quantity), 0) as total_cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
      GROUP BY s.location_id
    `
    const costs = await this.db.query(costQuery, [startDate, endDate])
    const costMap = {}
    costs.forEach(c => {
      costMap[c.location_id] = parseFloat(c.total_cogs) || 0
    })

    return locations.map(loc => {
      const revenue = parseFloat(loc.total_revenue) || 0
      const cogs = costMap[loc.location_id] || 0
      const grossProfit = revenue - cogs
      return {
        location_id: loc.location_id,
        location_name: loc.location_name,
        revenue,
        tax: parseFloat(loc.total_tax) || 0,
        cogs,
        gross_profit: grossProfit,
        margin: revenue > 0 ? parseFloat(((grossProfit / revenue) * 100).toFixed(2)) : 0,
        transactions: parseInt(loc.transactions) || 0
      }
    })
  }

  async getCustomerLifetimeValue(startDate, endDate, userLocations = [], isAdmin = false) {
    let customerQuery = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        COUNT(s.id) as total_purchases,
        COALESCE(SUM(s.total), 0) as total_spent,
        MIN(s.sale_date) as first_purchase,
        MAX(s.sale_date) as last_purchase,
        TIMESTAMPDIFF(DAY, MIN(s.sale_date), MAX(s.sale_date)) as customer_days
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      customerQuery += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    customerQuery += ' GROUP BY c.id, c.first_name, c.last_name, c.email HAVING total_purchases > 0 ORDER BY total_spent DESC'

    const customers = await this.db.query(customerQuery, params)

    const totalCustomers = customers.length
    const totalRevenue = customers.reduce((sum, c) => sum + parseFloat(c.total_spent), 0)
    const avgPurchaseValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    const avgPurchaseFrequency = totalCustomers > 0 
      ? customers.reduce((sum, c) => sum + (parseInt(c.total_purchases) || 0), 0) / totalCustomers 
      : 0
    const avgCustomerLifespan = totalCustomers > 0
      ? customers.reduce((sum, c) => sum + (parseInt(c.customer_days) || 0), 0) / totalCustomers
      : 0

    const clv = avgPurchaseValue * avgPurchaseFrequency * (avgCustomerLifespan > 0 ? 365 / avgCustomerLifespan : 0)

    return {
      summary: {
        total_customers: totalCustomers,
        total_revenue: totalRevenue,
        average_purchase_value: parseFloat(avgPurchaseValue.toFixed(2)),
        average_purchase_frequency: parseFloat(avgPurchaseFrequency.toFixed(2)),
        average_customer_lifespan_days: parseFloat(avgCustomerLifespan.toFixed(2)),
        estimated_clv: parseFloat(clv.toFixed(2))
      },
      top_customers: customers.slice(0, 20).map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`.trim(),
        email: c.email,
        total_purchases: parseInt(c.total_purchases) || 0,
        total_spent: parseFloat(c.total_spent) || 0,
        first_purchase: c.first_purchase,
        last_purchase: c.last_purchase
      }))
    }
  }

  async getTaxCompliance(startDate, endDate, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        COALESCE(SUM(s.tax_amount), 0) as total_tax_collected,
        COALESCE(SUM(s.subtotal), 0) as total_taxable_sales,
        COUNT(DISTINCT s.id) as taxable_transactions
      FROM sales s
      WHERE s.status = 'completed' AND s.tax_amount > 0 AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    const rows = await this.db.query(query, params)

    return {
      total_tax_collected: parseFloat(rows[0].total_tax_collected) || 0,
      total_taxable_sales: parseFloat(rows[0].total_taxable_sales) || 0,
      taxable_transactions: parseInt(rows[0].taxable_transactions) || 0,
      effective_tax_rate: rows[0].total_taxable_sales > 0
        ? parseFloat(((rows[0].total_tax_collected / rows[0].total_taxable_sales) * 100).toFixed(2))
        : 0
    }
  }

  async getCustomerAcquisitionCost(startDate, endDate, userLocations = [], isAdmin = false) {
    let salesQuery = `
      SELECT 
        COUNT(DISTINCT s.customer_id) as new_customers,
        COALESCE(SUM(s.total), 0) as total_revenue
      FROM sales s
      WHERE s.status = 'completed' AND s.customer_id IS NOT NULL AND s.sale_date BETWEEN ? AND ?
    `
    let campaignCost = 0

    const params = [startDate, endDate]
    if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      salesQuery += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    const salesData = await this.db.query(salesQuery, params)

    let newCustomers = parseInt(salesData[0].new_customers) || 0
    let totalRevenue = parseFloat(salesData[0].total_revenue) || 0

    const cac = newCustomers > 0 ? campaignCost / newCustomers : 0
    const revenuePerCustomer = newCustomers > 0 ? totalRevenue / newCustomers : 0

    return {
      new_customers: newCustomers,
      total_revenue: totalRevenue,
      marketing_cost: campaignCost,
      cac: parseFloat(cac.toFixed(2)),
      revenue_per_customer: parseFloat(revenuePerCustomer.toFixed(2)),
      roi: campaignCost > 0 ? parseFloat(((totalRevenue - campaignCost) / campaignCost * 100).toFixed(2)) : 0
    }
  }

  async getInventoryTurnover(startDate, endDate, locationId, userLocations = [], isAdmin = false) {
    let salesQuery = `
      SELECT 
        COALESCE(SUM(si.quantity), 0) as units_sold,
        COALESCE(SUM(si.cost_price * si.quantity), 0) as cost_of_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    let avgInventoryQuery = `
      SELECT COALESCE(AVG(total_cost), 0) as avg_inventory_cost
      FROM (
        SELECT SUM(iq.quantity * i.cost_price) as total_cost
        FROM item_quantities iq
        JOIN items i ON iq.item_id = i.id
        WHERE i.status = 'active'
    `
    const params = [startDate, endDate]
    const paramsAvg = []

    if (locationId) {
      salesQuery += ' AND s.location_id = UUID_TO_BIN(?)'
      avgInventoryQuery += ' AND iq.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
      paramsAvg.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      salesQuery += ` AND s.location_id IN (${placeholders})`
      avgInventoryQuery += ` AND iq.location_id IN (${placeholders})`
      params.push(...userLocations)
      paramsAvg.push(...userLocations)
    }

    avgInventoryQuery += ' GROUP BY iq.location_id) as avg_inv'

    const [salesData, avgInvData] = await Promise.all([
      this.db.query(salesQuery, params),
      this.db.query(avgInventoryQuery, paramsAvg)
    ])

    const unitsSold = parseFloat(salesData[0].units_sold) || 0
    const costOfSold = parseFloat(salesData[0].cost_of_sold) || 0
    const avgInventory = parseFloat(avgInvData[0]?.avg_inventory_cost) || 0
    const turnover = avgInventory > 0 ? costOfSold / avgInventory : 0

    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    const daysOfInventory = turnover > 0 ? days / turnover : 0

    return {
      units_sold: unitsSold,
      cost_of_sold: costOfSold,
      avg_inventory_cost: avgInventory,
      turnover_rate: parseFloat(turnover.toFixed(2)),
      turnover_period_days: parseFloat(daysOfInventory.toFixed(1))
    }
  }

  async getSalesByEmployee(startDate, endDate, locationId, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        u.id,
        u.username,
        COUNT(s.id) as total_transactions,
        COALESCE(SUM(s.total), 0) as total_sales,
        COALESCE(SUM(s.subtotal), 0) as net_sales
      FROM users u
      JOIN sales s ON u.id = s.created_by
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' GROUP BY u.id, u.username ORDER BY total_sales DESC'

    const employees = await this.db.query(query, params)
    const totalSales = employees.reduce((sum, e) => sum + parseFloat(e.total_sales), 0)

    return employees.map(e => {
      const sales = parseFloat(e.total_sales) || 0
      return {
        id: e.id,
        name: e.username,
        transactions: parseInt(e.total_transactions) || 0,
        total_sales: sales,
        net_sales: parseFloat(e.net_sales) || 0,
        percentage_of_total: totalSales > 0 ? parseFloat(((sales / totalSales) * 100).toFixed(2)) : 0,
        avg_per_transaction: e.total_transactions > 0 ? sales / e.total_transactions : 0
      }
    })
  }

  async getSalesByHour(startDate, endDate, locationId, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        HOUR(s.sale_date) as hour,
        COUNT(*) as transactions,
        COALESCE(SUM(s.total), 0) as total_sales
      FROM sales s
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' GROUP BY HOUR(s.sale_date) ORDER BY hour'

    const hourlyData = await this.db.query(query, params)

    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      transactions: 0,
      total_sales: 0,
      label: `${i.toString().padStart(2, '0')}:00`
    }))

    hourlyData.forEach(row => {
      const h = parseInt(row.hour)
      if (hours[h]) {
        hours[h].transactions = parseInt(row.transactions) || 0
        hours[h].total_sales = parseFloat(row.total_sales) || 0
      }
    })

    const peakHour = hourlyData.reduce((max, row) => 
      (parseInt(row.transactions) || 0) > (parseInt(max?.transactions) || 0) ? row : max, null)

    return {
      hourly_breakdown: hours,
      peak_hour: peakHour ? {
        hour: parseInt(peakHour.hour),
        transactions: parseInt(peakHour.transactions) || 0,
        total_sales: parseFloat(peakHour.total_sales) || 0
      } : null
    }
  }

  async getReturnsAndCancellations(startDate, endDate, locationId, userLocations = [], isAdmin = false) {
    let returnsQuery = `
      SELECT 
        COUNT(DISTINCT r.id) as total_returns,
        COALESCE(SUM(ri.quantity), 0) as items_returned,
        COALESCE(SUM(ri.line_total), 0) as return_value
      FROM returns r
      JOIN return_items ri ON r.id = ri.return_id
      WHERE r.status = 'completed' AND r.return_date BETWEEN ? AND ?
    `
    let cancelledQuery = `
      SELECT 
        COUNT(*) as total_cancelled,
        COALESCE(SUM(s.total), 0) as cancelled_value
      FROM sales s
      WHERE s.status = 'cancelled' AND s.sale_date BETWEEN ? AND ?
    `
    let completedQuery = `
      SELECT COUNT(*) as total_completed, COALESCE(SUM(s.total), 0) as completed_value
      FROM sales s
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]
    const paramsCancelled = [startDate, endDate]
    const paramsCompleted = [startDate, endDate]

    if (locationId) {
      const locClause = ' AND s.location_id = UUID_TO_BIN(?)'
      returnsQuery += locClause
      cancelledQuery += locClause
      completedQuery += locClause
      params.push(locationId)
      paramsCancelled.push(locationId)
      paramsCompleted.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      const locClause = ` AND s.location_id IN (${placeholders})`
      returnsQuery += locClause
      cancelledQuery += locClause
      completedQuery += locClause
      params.push(...userLocations)
      paramsCancelled.push(...userLocations)
      paramsCompleted.push(...userLocations)
    }

    const [returns, cancelled, completed] = await Promise.all([
      this.db.query(returnsQuery, params),
      this.db.query(cancelledQuery, paramsCancelled),
      this.db.query(completedQuery, paramsCompleted)
    ])

    const totalReturns = parseInt(returns[0].total_returns) || 0
    const totalCancelled = parseInt(cancelled[0].total_cancelled) || 0
    const totalCompleted = parseInt(completed[0].total_completed) || 0
    const completedValue = parseFloat(completed[0].completed_value) || 0

    return {
      returns: {
        count: totalReturns,
        items: parseInt(returns[0].items_returned) || 0,
        value: parseFloat(returns[0].return_value) || 0
      },
      cancellations: {
        count: totalCancelled,
        value: parseFloat(cancelled[0].cancelled_value) || 0
      },
      rate: {
        return_rate: totalCompleted > 0 ? parseFloat(((totalReturns / totalCompleted) * 100).toFixed(2)) : 0,
        cancellation_rate: totalCompleted > 0 ? parseFloat(((totalCancelled / totalCompleted) * 100).toFixed(2)) : 0,
        return_value_rate: completedValue > 0 ? parseFloat(((parseFloat(returns[0].return_value) / completedValue) * 100).toFixed(2)) : 0
      }
    }
  }

  async getCashDrawerDiscrepancies(startDate, endDate, locationId, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        BIN_TO_UUID(da.id) as id,
        da.adjustment_type,
        da.amount as difference_amount,
        da.status,
        da.notes,
        da.created_at,
        l.name as location_name,
        u.username as created_by_name
      FROM drawer_adjustments da
      JOIN cash_drawers cd ON da.drawer_id = cd.id
      JOIN locations l ON cd.location_id = l.id
      LEFT JOIN users u ON da.user_id = u.id
      WHERE da.created_at BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND cd.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND cd.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' ORDER BY da.created_at DESC'

    const adjustments = await this.db.query(query, params)

    const pending = adjustments.filter(a => a.status === 'pending')
    const approved = adjustments.filter(a => a.status === 'approved')
    const rejected = adjustments.filter(a => a.status === 'rejected')

    const totalOverages = approved.filter(a => a.adjustment_type === 'overage')
      .reduce((sum, a) => sum + parseFloat(a.difference_amount), 0)
    const totalShortages = approved.filter(a => a.adjustment_type === 'shortage')
      .reduce((sum, a) => sum + Math.abs(parseFloat(a.difference_amount)), 0)

    return {
      summary: {
        total_adjustments: adjustments.length,
        pending_count: pending.length,
        approved_count: approved.length,
        rejected_count: rejected.length,
        total_overages: totalOverages,
        total_shortages: totalShortages,
        net_discrepancy: totalOverages - totalShortages
      },
      pending_adjustments: pending.map(a => ({
        id: a.id,
        type: a.adjustment_type,
        amount: parseFloat(a.difference_amount) || 0,
        location: a.location_name,
        created_by: a.created_by_name,
        notes: a.notes,
        created_at: a.created_at
      }))
    }
  }

  async getEmployeeSalesGoals(userId, startDate, endDate) {
    const query = `
      SELECT 
        COUNT(s.id) as transactions,
        COALESCE(SUM(s.total), 0) as total_sales
      FROM sales s
      WHERE s.created_by = ? AND s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const rows = await this.db.query(query, [userId, startDate, endDate])

    return {
      transactions: parseInt(rows[0]?.transactions) || 0,
      total_sales: parseFloat(rows[0]?.total_sales) || 0
    }
  }

  async getAverageTransactionTime(locationId, startDate, endDate, userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        COALESCE(AVG(TIMESTAMPDIFF(SECOND, s.created_at, s.sale_date)), 0) as avg_seconds
      FROM sales s
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    try {
      const rows = await this.db.query(query, params)
      const avgSeconds = parseFloat(rows[0]?.avg_seconds) || 0

      return {
        average_seconds: parseFloat(avgSeconds.toFixed(0)),
        average_formatted: avgSeconds > 0 ? `${Math.floor(avgSeconds / 60)}m ${Math.round(avgSeconds % 60)}s` : 'N/A',
        note: avgSeconds > 0 ? 'Tiempo estimado entre creación y cierre' : 'Datos de tiempo no disponibles'
      }
    } catch (error) {
      return {
        average_seconds: 0,
        average_formatted: 'N/A',
        note: 'Tracking de tiempo no configurado'
      }
    }
  }
}
