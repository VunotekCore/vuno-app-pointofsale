import pool from '../config/database.js'

function UUID_TO_BIN(uuid) {
  return uuid
}

function BIN_TO_UUID(binary) {
  return binary
}

export class ReportsRepository {
  constructor(db = pool) {
    this.db = db
  }

  buildLocationClauseCommon(tableAlias, locationId, userLocations, isAdmin, params) {
    let clause = ''
    if (locationId) {
      clause += ` AND ${tableAlias}.location_id = UUID_TO_BIN(?)`
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      clause += ` AND ${tableAlias}.location_id IN (${placeholders})`
      params.push(...userLocations)
    }
    return clause
  }

  buildLocationClause(locationId, userLocations, isAdmin, params) {
    let clause = ''
    if (locationId) {
      clause += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      clause += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }
    return clause
  }

  async getSalesReport(filters = {}) {
    const { location_id, start_date, end_date, user_id, status, limit, offset } = filters
    const isAdmin = filters.isAdmin || false
    const userLocations = filters.userLocations || []
    const companyId = filters.companyId || null
    const params = []
    const countParams = []

    let whereClause = ' WHERE s.is_delete = 0'

    if (companyId) {
      whereClause += ' AND s.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
      countParams.push(companyId)
    }

    if (start_date) {
      whereClause += ' AND DATE(s.sale_date) >= ?'
      params.push(start_date)
      countParams.push(start_date)
    }

    if (end_date) {
      whereClause += ' AND DATE(s.sale_date) <= ?'
      params.push(end_date)
      countParams.push(end_date)
    }

    if (location_id) {
      whereClause += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
      countParams.push(location_id)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      whereClause += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
      countParams.push(...userLocations)
    }

    if (user_id) {
      whereClause += ' AND s.created_by = UUID_TO_BIN(?)'
      params.push(user_id)
      countParams.push(user_id)
    }

    if (status) {
      whereClause += ' AND s.status = ?'
      params.push(status)
      countParams.push(status)
    }

    const countResult = await this.db.query(
      `SELECT COUNT(*) as total FROM sales s ${whereClause}`,
      countParams
    )
    const total = countResult[0]?.total || 0

    let query = `
      SELECT 
        BIN_TO_UUID(s.id) as id,
        s.sale_number,
        s.subtotal,
        s.discount_amount,
        s.tax_amount,
        s.total,
        s.status,
        s.notes,
        s.sale_date,
        s.created_at,
        BIN_TO_UUID(s.customer_id) as customer_id,
        BIN_TO_UUID(s.created_by) as created_by,
        BIN_TO_UUID(s.location_id) as location_id,
        BIN_TO_UUID(s.drawer_id) as drawer_id,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone,
        u.username as employee_name,
        l.name as location_name,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN users u ON s.created_by = u.id
      JOIN locations l ON s.location_id = l.id
      ${whereClause}
      ORDER BY s.sale_date DESC, s.created_at DESC
    `

    if (limit) {
      query += ' LIMIT ?'
      params.push(parseInt(limit))
      if (offset) {
        query += ' OFFSET ?'
        params.push(parseInt(offset))
      }
    }

    const rows = await this.db.query(query, params)

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(s.subtotal), 0) as total_subtotal,
        COALESCE(SUM(s.discount_amount), 0) as total_discount,
        COALESCE(SUM(s.tax_amount), 0) as total_tax,
        COALESCE(SUM(s.total), 0) as total_sales
      FROM sales s ${whereClause}
    `
    const summaryParams = [...countParams]
    const summary = await this.db.query(summaryQuery, summaryParams)

    return {
      data: rows,
      total: parseInt(total),
      summary: {
        total_transactions: parseInt(summary[0].total_transactions) || 0,
        total_subtotal: parseFloat(summary[0].total_subtotal) || 0,
        total_discount: parseFloat(summary[0].total_discount) || 0,
        total_tax: parseFloat(summary[0].total_tax) || 0,
        total_sales: parseFloat(summary[0].total_sales) || 0
      }
    }
  }

  async getSalesReportDetails(saleId, companyId = null) {
    let saleQuery = `
      SELECT 
        BIN_TO_UUID(s.id) as id,
        s.sale_number,
        s.subtotal,
        s.discount_amount,
        s.tax_amount,
        s.total,
        s.status,
        s.notes,
        s.sale_date,
        s.created_at,
        BIN_TO_UUID(s.customer_id) as customer_id,
        BIN_TO_UUID(s.created_by) as created_by,
        BIN_TO_UUID(s.location_id) as location_id,
        BIN_TO_UUID(s.drawer_id) as drawer_id,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone,
        c.email as customer_email,
        u.username as employee_name,
        l.name as location_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN users u ON s.created_by = u.id
      JOIN locations l ON s.location_id = l.id
      WHERE s.id = UUID_TO_BIN(?)`
    const saleParams = [saleId]
    
    if (companyId) {
      saleQuery += ' AND s.company_id = UUID_TO_BIN(?)'
      saleParams.push(companyId)
    }
    
    const saleRows = await this.db.query(saleQuery, saleParams)

    if (saleRows.length === 0) {
      return null
    }

    const itemsQuery = `
      SELECT 
        si.quantity,
        si.unit_price,
        si.discount_percent,
        si.discount_amount,
        si.cost_price,
        si.line_total,
        BIN_TO_UUID(si.item_id) as item_id,
        BIN_TO_UUID(si.variation_id) as variation_id,
        i.name as item_name,
        i.item_number,
        iv.attributes as variation_attributes,
        iv.sku as variation_sku
      FROM sale_items si
      JOIN items i ON si.item_id = i.id
      LEFT JOIN item_variations iv ON si.variation_id = iv.id
      WHERE si.sale_id = UUID_TO_BIN(?)
    `
    const items = await this.db.query(itemsQuery, [saleId])

    const paymentsQuery = `
      SELECT 
        sp.amount,
        sp.payment_type,
        sp.reference_number,
        pm.name as payment_method_name,
        pm.type as payment_type_category
      FROM sale_payments sp
      LEFT JOIN payment_methods pm ON sp.payment_type = pm.code
      WHERE sp.sale_id = UUID_TO_BIN(?)
    `
    const payments = await this.db.query(paymentsQuery, [saleId])

    return {
      sale: saleRows[0],
      items,
      payments
    }
  }

  async getInventoryReport(filters = {}) {
    const { location_id, start_date, end_date, user_id, movement_type, limit, offset } = filters
    const isAdmin = filters.isAdmin || false
    const userLocations = filters.userLocations || []
    const companyId = filters.companyId || null
    const params = []
    const countParams = []

    let whereClause = ' WHERE 1=1'

    if (companyId) {
      whereClause += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
      countParams.push(companyId)
    }

    if (start_date) {
      whereClause += ' AND DATE(im.created_at) >= ?'
      params.push(start_date)
      countParams.push(start_date)
    }

    if (end_date) {
      whereClause += ' AND DATE(im.created_at) <= ?'
      params.push(end_date)
      countParams.push(end_date)
    }

    if (location_id) {
      whereClause += ' AND im.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
      countParams.push(location_id)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      whereClause += ` AND im.location_id IN (${placeholders})`
      params.push(...userLocations)
      countParams.push(...userLocations)
    }

    if (user_id) {
      whereClause += ' AND im.user_id = UUID_TO_BIN(?)'
      params.push(user_id)
      countParams.push(user_id)
    }

    if (movement_type) {
      whereClause += ' AND im.movement_type = ?'
      params.push(movement_type)
      countParams.push(movement_type)
    }

    const countResult = await this.db.query(
      `SELECT COUNT(*) as total FROM inventory_movements im ${whereClause}`,
      countParams
    )
    const total = countResult[0]?.total || 0

    let query = `
      SELECT 
        BIN_TO_UUID(im.id) as id,
        im.movement_type,
        im.quantity_change,
        im.quantity_before,
        im.quantity_after,
        im.unit_cost,
        im.total_cost,
        im.reference_type,
        im.reference_id,
        im.notes,
        im.created_at,
        BIN_TO_UUID(im.item_id) as item_id,
        BIN_TO_UUID(im.variation_id) as variation_id,
        BIN_TO_UUID(im.location_id) as location_id,
        BIN_TO_UUID(im.user_id) as user_id,
        i.name as item_name,
        i.item_number,
        iv.attributes as variation_attributes,
        l.name as location_name,
        u.username as created_by_name
      FROM inventory_movements im
      JOIN items i ON im.item_id = i.id
      JOIN locations l ON im.location_id = l.id
      LEFT JOIN item_variations iv ON im.variation_id = iv.id
      LEFT JOIN users u ON im.user_id = u.id
      ${whereClause}
      ORDER BY im.created_at DESC
    `

    if (limit) {
      query += ' LIMIT ?'
      params.push(parseInt(limit))
      if (offset) {
        query += ' OFFSET ?'
        params.push(parseInt(offset))
      }
    }

    const rows = await this.db.query(query, params)

    const summaryQuery = `
      SELECT 
        im.movement_type,
        COUNT(*) as movements_count,
        COALESCE(SUM(im.quantity_change), 0) as total_quantity,
        COALESCE(SUM(im.total_cost), 0) as total_cost
      FROM inventory_movements im
      ${whereClause}
      GROUP BY im.movement_type
    `
    const summaryParams = [...countParams]
    const summary = await this.db.query(summaryQuery, summaryParams)

    const summaryByType = {}
    summary.forEach(s => {
      summaryByType[s.movement_type] = {
        movements_count: parseInt(s.movements_count) || 0,
        total_quantity: parseFloat(s.total_quantity) || 0,
        total_cost: parseFloat(s.total_cost) || 0
      }
    })

    return {
      data: rows,
      total: parseInt(total),
      summary: summaryByType
    }
  }

  async getPurchasesReport(filters = {}) {
    const { location_id, start_date, end_date, supplier_id, status, limit, offset } = filters
    const isAdmin = filters.isAdmin || false
    const userLocations = filters.userLocations || []
    const companyId = filters.companyId || null
    const params = []
    const countParams = []

    let receivingsWhere = ' WHERE (r.is_delete = 0 OR r.is_delete IS NULL)'
    let poWhere = ' WHERE (po.is_delete = 0 OR po.is_delete IS NULL)'

    const receivingsParams = []
    const poParams = []

    if (companyId) {
      receivingsWhere += ' AND r.company_id = UUID_TO_BIN(?)'
      poWhere += ' AND po.company_id = UUID_TO_BIN(?)'
      receivingsParams.push(companyId)
      poParams.push(companyId)
    }

    if (start_date) {
      receivingsWhere += ' AND DATE(r.received_at) >= ?'
      poWhere += ' AND DATE(po.created_at) >= ?'
      receivingsParams.push(start_date)
      poParams.push(start_date)
    }

    if (end_date) {
      receivingsWhere += ' AND DATE(r.received_at) <= ?'
      poWhere += ' AND DATE(po.created_at) <= ?'
      receivingsParams.push(end_date)
      poParams.push(end_date)
    }

    if (location_id) {
      receivingsWhere += ' AND r.location_id = UUID_TO_BIN(?)'
      poWhere += ' AND po.location_id = UUID_TO_BIN(?)'
      receivingsParams.push(location_id)
      poParams.push(location_id)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      receivingsWhere += ` AND r.location_id IN (${placeholders})`
      poWhere += ` AND po.location_id IN (${placeholders})`
      receivingsParams.push(...userLocations)
      poParams.push(...userLocations)
    }

    if (supplier_id) {
      receivingsWhere += ' AND r.supplier_id = UUID_TO_BIN(?)'
      poWhere += ' AND po.supplier_id = UUID_TO_BIN(?)'
      receivingsParams.push(supplier_id)
      poParams.push(supplier_id)
    }

    if (status) {
      receivingsWhere += ' AND r.status = ?'
      poWhere += ' AND po.status = ?'
      receivingsParams.push(status)
      poParams.push(status)
    }

    const receivingsQuery = `
      SELECT 
        BIN_TO_UUID(r.id) as id,
        r.receiving_number,
        'receiving' as document_type,
        r.status,
        r.total_amount,
        r.received_at as document_date,
        r.created_at,
        BIN_TO_UUID(r.supplier_id) as supplier_id,
        BIN_TO_UUID(r.location_id) as location_id,
        BIN_TO_UUID(r.purchase_order_id) as purchase_order_id,
        s.name as supplier_name,
        l.name as location_name,
        po.po_number as related_po_number,
        u.username as created_by_name
      FROM receivings r
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN purchase_orders po ON r.purchase_order_id = po.id
      LEFT JOIN users u ON r.created_by = u.id
      ${receivingsWhere}
    `

    const purchaseOrdersQuery = `
      SELECT 
        BIN_TO_UUID(po.id) as id,
        po.po_number,
        'purchase_order' as document_type,
        po.status,
        po.total_amount,
        po.expected_date as document_date,
        po.created_at,
        BIN_TO_UUID(po.supplier_id) as supplier_id,
        BIN_TO_UUID(po.location_id) as location_id,
        NULL as purchase_order_id,
        s.name as supplier_name,
        l.name as location_name,
        NULL as related_po_number,
        u.username as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN locations l ON po.location_id = l.id
      LEFT JOIN users u ON po.created_by = u.id
      ${poWhere}
    `

    const [receivings, purchaseOrders] = await Promise.all([
      this.db.query(receivingsQuery, receivingsParams),
      this.db.query(purchaseOrdersQuery, poParams)
    ])

    const combinedData = [...receivings, ...purchaseOrders].sort((a, b) => 
      new Date(b.document_date) - new Date(a.document_date)
    )

    const total = combinedData.length
    const paginatedData = limit 
      ? combinedData.slice(offset || 0, (offset || 0) + parseInt(limit))
      : combinedData

    const receivingsSummaryQuery = `
      SELECT 
        r.status,
        COUNT(*) as count,
        COALESCE(SUM(r.total_amount), 0) as total_amount
      FROM receivings r
      ${receivingsWhere}
      GROUP BY r.status
    `
    const poSummaryQuery = `
      SELECT 
        po.status,
        COUNT(*) as count,
        COALESCE(SUM(po.total_amount), 0) as total_amount
      FROM purchase_orders po
      ${poWhere}
      GROUP BY po.status
    `

    const [receivingsSummary, poSummary] = await Promise.all([
      this.db.query(receivingsSummaryQuery, receivingsParams),
      this.db.query(poSummaryQuery, poParams)
    ])

    const summaryByStatus = {}
    receivingsSummary.forEach(s => {
      summaryByStatus[`receiving_${s.status}`] = {
        count: parseInt(s.count) || 0,
        total_amount: parseFloat(s.total_amount) || 0
      }
    })
    poSummary.forEach(s => {
      summaryByStatus[`purchase_order_${s.status}`] = {
        count: parseInt(s.count) || 0,
        total_amount: parseFloat(s.total_amount) || 0
      }
    })

    const totalReceivings = receivings.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0)
    const totalPO = purchaseOrders.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0)

    return {
      data: paginatedData,
      total,
      summary: {
        total_receivings: receivings.length,
        total_purchase_orders: purchaseOrders.length,
        total_receivings_amount: totalReceivings,
        total_purchase_orders_amount: totalPO,
        by_status: summaryByStatus
      }
    }
  }

  async getCashReport(filters = {}) {
    const { location_id, start_date, end_date, user_id, limit, offset } = filters
    const isAdmin = filters.isAdmin || false
    const userLocations = filters.userLocations || []
    const companyId = filters.companyId || null
    const params = []
    const countParams = []

    let shiftsWhere = ' WHERE 1=1'
    let transactionsWhere = ' WHERE 1=1'
    let adjustmentsWhere = ' WHERE 1=1'

    if (companyId) {
      shiftsWhere += ' AND sc.company_id = UUID_TO_BIN(?)'
      transactionsWhere += ' AND cd.company_id = UUID_TO_BIN(?)'
      adjustmentsWhere += ' AND da.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
      countParams.push(companyId)
    }

    if (start_date) {
      shiftsWhere += ' AND DATE(ss.date) >= ?'
      transactionsWhere += ' AND DATE(dt.created_at) >= ?'
      adjustmentsWhere += ' AND DATE(da.created_at) >= ?'
      params.push(start_date)
      countParams.push(start_date)
    }

    if (end_date) {
      shiftsWhere += ' AND DATE(ss.date) <= ?'
      transactionsWhere += ' AND DATE(dt.created_at) <= ?'
      adjustmentsWhere += ' AND DATE(da.created_at) <= ?'
      params.push(end_date)
      countParams.push(end_date)
    }

    if (location_id) {
      shiftsWhere += ' AND ss.location_id = UUID_TO_BIN(?)'
      transactionsWhere += ' AND cd.location_id = UUID_TO_BIN(?)'
      adjustmentsWhere += ' AND cd.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
      countParams.push(location_id)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      shiftsWhere += ` AND ss.location_id IN (${placeholders})`
      transactionsWhere += ` AND cd.location_id IN (${placeholders})`
      adjustmentsWhere += ` AND cd.location_id IN (${placeholders})`
      params.push(...userLocations)
      countParams.push(...userLocations)
    }

    if (user_id) {
      shiftsWhere += ' AND ss.user_id = UUID_TO_BIN(?)'
      transactionsWhere += ' AND dt.created_by = UUID_TO_BIN(?)'
      adjustmentsWhere += ' AND da.user_id = UUID_TO_BIN(?)'
      params.push(user_id)
      countParams.push(user_id)
    }

    const shiftsQuery = `
      SELECT 
        BIN_TO_UUID(ss.id) as id,
        'shift' as transaction_type,
        ss.status,
        ss.initial_amount,
        ss.closing_amount,
        ss.difference,
        ss.actual_start as start_time,
        ss.actual_end as end_time,
        ss.date as shift_date,
        ss.created_at,
        BIN_TO_UUID(ss.location_id) as location_id,
        BIN_TO_UUID(ss.user_id) as user_id,
        sc.name as shift_name,
        l.name as location_name,
        u.username as user_name
      FROM shift_sessions ss
      JOIN shift_configs sc ON ss.shift_config_id = sc.id
      JOIN locations l ON ss.location_id = l.id
      JOIN users u ON ss.user_id = u.id
      ${shiftsWhere}
      ORDER BY ss.date DESC, ss.actual_start DESC
    `

    const transactionsQuery = `
      SELECT 
        BIN_TO_UUID(dt.id) as id,
        'transaction' as transaction_type,
        dt.transaction_type as type,
        dt.amount,
        dt.notes,
        dt.reference_number,
        dt.created_at,
        BIN_TO_UUID(dt.drawer_id) as drawer_id,
        BIN_TO_UUID(dt.created_by) as user_id,
        cd.location_id,
        pm.name as payment_method_name,
        u.username as user_name,
        l.name as location_name
      FROM drawer_transactions dt
      JOIN cash_drawers cd ON dt.drawer_id = cd.id
      JOIN locations l ON cd.location_id = l.id
      LEFT JOIN users u ON dt.created_by = u.id
      LEFT JOIN payment_methods pm ON dt.payment_method_id = pm.id
      ${transactionsWhere}
      ORDER BY dt.created_at DESC
    `

    const adjustmentsQuery = `
      SELECT 
        BIN_TO_UUID(da.id) as id,
        'adjustment' as transaction_type,
        da.adjustment_type as type,
        da.amount,
        da.status as adjustment_status,
        da.notes,
        da.created_at,
        BIN_TO_UUID(da.drawer_id) as drawer_id,
        BIN_TO_UUID(da.user_id) as user_id,
        cd.location_id,
        u.username as user_name,
        l.name as location_name
      FROM drawer_adjustments da
      JOIN cash_drawers cd ON da.drawer_id = cd.id
      JOIN locations l ON cd.location_id = l.id
      LEFT JOIN users u ON da.user_id = u.id
      ${adjustmentsWhere}
      ORDER BY da.created_at DESC
    `

    const [shifts, transactions, adjustments] = await Promise.all([
      this.db.query(shiftsQuery, params),
      this.db.query(transactionsQuery, params),
      this.db.query(adjustmentsQuery, params)
    ])

    const combinedData = [...shifts, ...transactions, ...adjustments].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )

    const total = combinedData.length
    const paginatedData = limit 
      ? combinedData.slice(offset || 0, (offset || 0) + parseInt(limit))
      : combinedData

    const shiftSummaryQuery = `
      SELECT 
        ss.status,
        COUNT(*) as count,
        COALESCE(SUM(ss.initial_amount), 0) as total_initial,
        COALESCE(SUM(ss.closing_amount), 0) as total_closing,
        COALESCE(SUM(ss.difference), 0) as total_difference
      FROM shift_sessions ss
      ${shiftsWhere}
      GROUP BY ss.status
    `
    const shiftSummary = await this.db.query(shiftSummaryQuery, countParams)

    const summaryByStatus = {}
    let totalInitial = 0
    let totalClosing = 0
    let totalDifference = 0
    shiftSummary.forEach(s => {
      summaryByStatus[s.status] = {
        count: parseInt(s.count) || 0,
        total_initial: parseFloat(s.total_initial) || 0,
        total_closing: parseFloat(s.total_closing) || 0,
        total_difference: parseFloat(s.total_difference) || 0
      }
      totalInitial += parseFloat(s.total_initial) || 0
      totalClosing += parseFloat(s.total_closing) || 0
      totalDifference += parseFloat(s.total_difference) || 0
    })

    const totalTransactionsAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    const totalAdjustmentsAmount = adjustments.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0)

    return {
      data: paginatedData,
      total,
      summary: {
        total_shifts: shifts.length,
        total_transactions: transactions.length,
        total_adjustments: adjustments.length,
        shifts_summary: summaryByStatus,
        total_transactions_amount: totalTransactionsAmount,
        total_adjustments_amount: totalAdjustmentsAmount,
        net_cash_flow: totalTransactionsAmount + totalAdjustmentsAmount
      }
    }
  }

  async exportSalesReport(filters = {}) {
    const { location_id, start_date, end_date, user_id, status } = filters
    const isAdmin = filters.isAdmin || false
    const userLocations = filters.userLocations || []
    const companyId = filters.companyId || null
    const params = []

    let whereClause = ' WHERE s.is_delete = 0'

    if (companyId) {
      whereClause += ' AND s.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    if (start_date) {
      whereClause += ' AND DATE(s.sale_date) >= ?'
      params.push(start_date)
    }
    if (end_date) {
      whereClause += ' AND DATE(s.sale_date) <= ?'
      params.push(end_date)
    }
    if (location_id) {
      whereClause += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      whereClause += ` AND s.location_id IN (${placeholders})`
      params.push(...userLocations)
    }
    if (user_id) {
      whereClause += ' AND s.created_by = UUID_TO_BIN(?)'
      params.push(user_id)
    }
    if (status) {
      whereClause += ' AND s.status = ?'
      params.push(status)
    }

    const query = `
      SELECT 
        s.sale_number,
        s.sale_date,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        u.username as employee_name,
        l.name as location_name,
        s.subtotal,
        s.discount_amount,
        s.tax_amount,
        s.total,
        s.status
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN users u ON s.created_by = u.id
      JOIN locations l ON s.location_id = l.id
      ${whereClause}
      ORDER BY s.sale_date DESC
    `

    return await this.db.query(query, params)
  }

  async exportInventoryReport(filters = {}) {
    const { location_id, start_date, end_date, user_id, movement_type } = filters
    const isAdmin = filters.isAdmin || false
    const userLocations = filters.userLocations || []
    const companyId = filters.companyId || null
    const params = []

    let whereClause = ' WHERE 1=1'

    if (companyId) {
      whereClause += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    if (start_date) {
      whereClause += ' AND DATE(im.created_at) >= ?'
      params.push(start_date)
    }
    if (end_date) {
      whereClause += ' AND DATE(im.created_at) <= ?'
      params.push(end_date)
    }
    if (location_id) {
      whereClause += ' AND im.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      whereClause += ` AND im.location_id IN (${placeholders})`
      params.push(...userLocations)
    }
    if (user_id) {
      whereClause += ' AND im.user_id = UUID_TO_BIN(?)'
      params.push(user_id)
    }
    if (movement_type) {
      whereClause += ' AND im.movement_type = ?'
      params.push(movement_type)
    }

    const query = `
      SELECT 
        im.created_at,
        i.name as item_name,
        i.item_number,
        im.movement_type,
        im.quantity_change,
        im.quantity_before,
        im.quantity_after,
        im.unit_cost,
        im.total_cost,
        l.name as location_name,
        u.username as created_by_name,
        im.notes
      FROM inventory_movements im
      JOIN items i ON im.item_id = i.id
      JOIN locations l ON im.location_id = l.id
      LEFT JOIN users u ON im.user_id = u.id
      ${whereClause}
      ORDER BY im.created_at DESC
    `

    return await this.db.query(query, params)
  }

  async exportPurchasesReport(filters = {}) {
    const { location_id, start_date, end_date, supplier_id, status } = filters
    const isAdmin = filters.isAdmin || false
    const userLocations = filters.userLocations || []
    const companyId = filters.companyId || null
    const receivingsParams = []
    const poParams = []

    let receivingsWhere = ' WHERE (r.is_delete = 0 OR r.is_delete IS NULL)'
    let poWhere = ' WHERE (po.is_delete = 0 OR po.is_delete IS NULL)'

    if (companyId) {
      receivingsWhere += ' AND r.company_id = UUID_TO_BIN(?)'
      poWhere += ' AND po.company_id = UUID_TO_BIN(?)'
      receivingsParams.push(companyId)
      poParams.push(companyId)
    }

    if (start_date) {
      receivingsWhere += ' AND DATE(r.received_at) >= ?'
      poWhere += ' AND DATE(po.created_at) >= ?'
      receivingsParams.push(start_date)
      poParams.push(start_date)
    }
    if (end_date) {
      receivingsWhere += ' AND DATE(r.received_at) <= ?'
      poWhere += ' AND DATE(po.created_at) <= ?'
      receivingsParams.push(end_date)
      poParams.push(end_date)
    }
    if (location_id) {
      receivingsWhere += ' AND r.location_id = UUID_TO_BIN(?)'
      poWhere += ' AND po.location_id = UUID_TO_BIN(?)'
      receivingsParams.push(location_id)
      poParams.push(location_id)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      receivingsWhere += ` AND r.location_id IN (${placeholders})`
      poWhere += ` AND po.location_id IN (${placeholders})`
      receivingsParams.push(...userLocations)
      poParams.push(...userLocations)
    }
    if (supplier_id) {
      receivingsWhere += ' AND r.supplier_id = UUID_TO_BIN(?)'
      poWhere += ' AND po.supplier_id = UUID_TO_BIN(?)'
      receivingsParams.push(supplier_id)
      poParams.push(supplier_id)
    }
    if (status) {
      receivingsWhere += ' AND r.status = ?'
      poWhere += ' AND po.status = ?'
      receivingsParams.push(status)
      poParams.push(status)
    }

    const receivingsQuery = `
      SELECT 
        r.received_at as document_date,
        'Recepción' as document_type,
        r.receiving_number as document_number,
        s.name as supplier_name,
        l.name as location_name,
        r.total_amount,
        r.status,
        u.username as created_by_name
      FROM receivings r
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN users u ON r.created_by = u.id
      ${receivingsWhere}
    `

    const purchaseOrdersQuery = `
      SELECT 
        po.created_at as document_date,
        'Orden de Compra' as document_type,
        po.po_number as document_number,
        s.name as supplier_name,
        l.name as location_name,
        po.total_amount,
        po.status,
        u.username as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN locations l ON po.location_id = l.id
      LEFT JOIN users u ON po.created_by = u.id
      ${poWhere}
    `

    const [receivings, purchaseOrders] = await Promise.all([
      this.db.query(receivingsQuery, receivingsParams),
      this.db.query(purchaseOrdersQuery, poParams)
    ])

    return [...receivings, ...purchaseOrders].sort((a, b) => new Date(b.document_date) - new Date(a.document_date))
  }

  async exportCashReport(filters = {}) {
    const { location_id, start_date, end_date, user_id } = filters
    const isAdmin = filters.isAdmin || false
    const userLocations = filters.userLocations || []
    const companyId = filters.companyId || null
    const params = []

    let shiftsWhere = ' WHERE 1=1'
    let transactionsWhere = ' WHERE 1=1'
    let adjustmentsWhere = ' WHERE 1=1'

    if (companyId) {
      shiftsWhere += ' AND sc.company_id = UUID_TO_BIN(?)'
      transactionsWhere += ' AND cd.company_id = UUID_TO_BIN(?)'
      adjustmentsWhere += ' AND da.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    if (start_date) {
      shiftsWhere += ' AND DATE(ss.date) >= ?'
      transactionsWhere += ' AND DATE(dt.created_at) >= ?'
      adjustmentsWhere += ' AND DATE(da.created_at) >= ?'
      params.push(start_date)
    }
    if (end_date) {
      shiftsWhere += ' AND DATE(ss.date) <= ?'
      transactionsWhere += ' AND DATE(dt.created_at) <= ?'
      adjustmentsWhere += ' AND DATE(da.created_at) <= ?'
      params.push(end_date)
    }
    if (location_id) {
      shiftsWhere += ' AND ss.location_id = UUID_TO_BIN(?)'
      transactionsWhere += ' AND cd.location_id = UUID_TO_BIN(?)'
      adjustmentsWhere += ' AND cd.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      shiftsWhere += ` AND ss.location_id IN (${placeholders})`
      transactionsWhere += ` AND cd.location_id IN (${placeholders})`
      adjustmentsWhere += ` AND cd.location_id IN (${placeholders})`
      params.push(...userLocations)
    }
    if (user_id) {
      shiftsWhere += ' AND ss.user_id = UUID_TO_BIN(?)'
      transactionsWhere += ' AND dt.created_by = UUID_TO_BIN(?)'
      adjustmentsWhere += ' AND da.user_id = UUID_TO_BIN(?)'
      params.push(user_id)
    }

    const shiftsQuery = `
      SELECT 
        ss.date as created_at,
        'Turno' as transaction_type,
        sc.name as type,
        ss.initial_amount as amount_in,
        ss.closing_amount as amount_out,
        ss.difference,
        ss.status,
        l.name as location_name,
        u.username as user_name
      FROM shift_sessions ss
      JOIN shift_configs sc ON ss.shift_config_id = sc.id
      JOIN locations l ON ss.location_id = l.id
      JOIN users u ON ss.user_id = u.id
      ${shiftsWhere}
    `

    const transactionsQuery = `
      SELECT 
        dt.created_at,
        'Transacción' as transaction_type,
        dt.transaction_type as type,
        dt.amount,
        NULL as amount_in,
        NULL as amount_out,
        NULL as difference,
        NULL as status,
        l.name as location_name,
        u.username as user_name
      FROM drawer_transactions dt
      JOIN cash_drawers cd ON dt.drawer_id = cd.id
      JOIN locations l ON cd.location_id = l.id
      LEFT JOIN users u ON dt.created_by = u.id
      ${transactionsWhere}
    `

    const adjustmentsQuery = `
      SELECT 
        da.created_at,
        'Ajuste' as transaction_type,
        da.adjustment_type as type,
        da.amount,
        NULL as amount_in,
        NULL as amount_out,
        NULL as difference,
        da.status as adjustment_status,
        l.name as location_name,
        u.username as user_name
      FROM drawer_adjustments da
      JOIN cash_drawers cd ON da.drawer_id = cd.id
      JOIN locations l ON cd.location_id = l.id
      LEFT JOIN users u ON da.user_id = u.id
      ${adjustmentsWhere}
    `

    const [shifts, transactions, adjustments] = await Promise.all([
      this.db.query(shiftsQuery, params),
      this.db.query(transactionsQuery, params),
      this.db.query(adjustmentsQuery, params)
    ])

    return [...shifts, ...transactions, ...adjustments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
}
