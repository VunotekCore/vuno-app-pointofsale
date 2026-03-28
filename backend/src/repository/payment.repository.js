import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'

export class PaymentRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getAllPaymentMethods() {
    return await this.db.query(
      'SELECT id, name, code, type, is_active, is_default, requires_reference, allow_partial, sort_order FROM payment_methods WHERE is_active = 1 ORDER BY sort_order, name'
    )
  }

  async getPaymentMethodById(id) {
    const rows = await this.db.query(
      'SELECT id, name, code, type, is_active, is_default, requires_reference, allow_partial, sort_order FROM payment_methods WHERE id = ?',
      [id]
    )
    return rows[0] || null
  }

  async getPaymentMethodByCode(code) {
    const rows = await this.db.query(
      'SELECT id, name, code, type, is_active, is_default, requires_reference, allow_partial, sort_order FROM payment_methods WHERE code = ?',
      [code]
    )
    return rows[0] || null
  }

  async createPaymentMethod(data) {
    const { name, code, type, is_default, requires_reference, allow_partial, sort_order } = data
    
    const result = await this.db.query(
      `INSERT INTO payment_methods (name, code, type, is_default, requires_reference, allow_partial, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, code, type, is_default || 0, requires_reference || 0, allow_partial || 1, sort_order || 0]
    )
    
    return result.insertId
  }

  async updatePaymentMethod(id, data) {
    const fields = []
    const values = []
    
    const allowedFields = ['name', 'code', 'type', 'is_active', 'is_default', 'requires_reference', 'allow_partial', 'sort_order']
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    
    if (fields.length === 0) return false
    
    values.push(id)
    await this.db.query(
      `UPDATE payment_methods SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    
    return true
  }

  async deletePaymentMethod(id) {
    await this.db.query(
      'UPDATE payment_methods SET is_active = 0 WHERE id = ?',
      [id]
    )
    return true
  }

  async getCashDrawers(locationId = null) {
    let query = `
      SELECT 
        BIN_TO_UUID(cd.id) as id,
        cd.name,
        BIN_TO_UUID(cd.location_id) as location_id,
        cd.initial_amount,
        cd.current_amount,
        cd.status,
        cd.opened_at,
        cd.closed_at,
        BIN_TO_UUID(cd.opened_by) as opened_by,
        BIN_TO_UUID(cd.closed_by) as closed_by,
        cd.notes,
        BIN_TO_UUID(cd.shift_session_id) as shift_session_id,
        cd.created_at,
        cd.updated_at,
        l.name as location_name, 
        u_opened.username as opened_by_name,
        u_closed.username as closed_by_name
      FROM cash_drawers cd
      JOIN locations l ON cd.location_id = l.id
      LEFT JOIN users u_opened ON cd.opened_by = u_opened.id
      LEFT JOIN users u_closed ON cd.closed_by = u_closed.id
      WHERE 1=1
    `
    const params = []
    
    if (locationId) {
      query += ' AND cd.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    }
    
    query += ' ORDER BY cd.created_at DESC'
    
    return await this.db.query(query, params)
  }

  async getCashDrawerById(id) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(cd.id) as id,
        cd.name,
        BIN_TO_UUID(cd.location_id) as location_id,
        cd.initial_amount,
        cd.current_amount,
        cd.status,
        cd.opened_at,
        cd.closed_at,
        BIN_TO_UUID(cd.opened_by) as opened_by,
        BIN_TO_UUID(cd.closed_by) as closed_by,
        cd.notes,
        BIN_TO_UUID(cd.shift_session_id) as shift_session_id,
        cd.created_at,
        cd.updated_at,
        l.name as location_name, u.username as opened_by_name
       FROM cash_drawers cd
       JOIN locations l ON cd.location_id = l.id
       LEFT JOIN users u ON cd.opened_by = u.id
       WHERE cd.id = UUID_TO_BIN(?)`,
      [id]
    )
    return rows[0] || null
  }

  async getOpenDrawer(locationId, userId) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(cd.id) as id,
        cd.name,
        BIN_TO_UUID(cd.location_id) as location_id,
        cd.initial_amount,
        cd.current_amount,
        cd.status,
        cd.opened_at,
        cd.closed_at,
        BIN_TO_UUID(cd.opened_by) as opened_by,
        BIN_TO_UUID(cd.closed_by) as closed_by,
        cd.notes,
        BIN_TO_UUID(cd.shift_session_id) as shift_session_id,
        cd.created_at,
        cd.updated_at,
        l.name as location_name
       FROM cash_drawers cd
       JOIN locations l ON cd.location_id = l.id
       WHERE cd.location_id = UUID_TO_BIN(?) AND cd.status = 'open'
       ORDER BY cd.opened_at DESC
       LIMIT 1`,
      [locationId]
    )
    return rows[0] || null
  }

  async openDrawer(data) {
    const { name, location_id, initial_amount, opened_by, notes } = data
    
    await this.db.query(
      `INSERT INTO cash_drawers (id, name, location_id, initial_amount, current_amount, status, opened_at, opened_by, notes)
       VALUES (UUID_TO_BIN(UUID()), ?, UUID_TO_BIN(?), ?, ?, 'open', NOW(), UUID_TO_BIN(?), ?)`,
      [name, location_id, initial_amount, initial_amount, opened_by ? opened_by : null, notes]
    )
    
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM cash_drawers WHERE location_id = UUID_TO_BIN(?) AND status = "open" ORDER BY opened_at DESC LIMIT 1', [location_id])
    const drawerId = rows[0]?.id
    
    await this.db.query(
      `INSERT INTO drawer_transactions (id, drawer_id, transaction_type, amount, notes, created_by)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), 'opening', ?, ?, UUID_TO_BIN(?))`,
      [drawerId, initial_amount, 'Apertura de caja', opened_by ? opened_by : null]
    )
    
    return drawerId
  }

  async closeDrawer(id, closed_by, closing_amount, notes) {
    const drawer = await this.getCashDrawerById(id)
    if (!drawer) throw new NotFoundError('Caja no encontrada')
    
    if (drawer.status !== 'open') {
      throw new Error('La caja no está abierta')
    }
    
    const difference = closing_amount - drawer.current_amount
    
    await this.db.query(
      `UPDATE cash_drawers 
       SET status = 'closed', closed_at = NOW(), closed_by = UUID_TO_BIN(?), current_amount = ?, notes = ?
       WHERE id = UUID_TO_BIN(?)`,
      [closed_by ? closed_by : null, closing_amount, notes, id]
    )
    
    await this.db.query(
      `INSERT INTO drawer_transactions (id, drawer_id, transaction_type, amount, notes, created_by)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), 'closing', ?, ?, UUID_TO_BIN(?))`,
      [id, closing_amount, `Cierre de caja. Diferencia: ${difference}`, closed_by ? closed_by : null]
    )
    
    return { drawer_id: id, difference }
  }

  async addTransaction(data) {
    const { drawer_id, transaction_type, amount, payment_method_id, reference_id, reference_number, notes, created_by } = data
    
    await this.db.query(
      `INSERT INTO drawer_transactions (id, drawer_id, transaction_type, amount, payment_method_id, reference_id, reference_number, notes, created_by)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?))`,
      [drawer_id, transaction_type, amount, payment_method_id, reference_id, reference_number, notes, created_by ? created_by : null]
    )
    
    const drawer = await this.getCashDrawerById(drawer_id)
    let newAmount = parseFloat(drawer.current_amount)
    
    if (transaction_type === 'sale_payment') {
      newAmount += parseFloat(amount)
    } else if (transaction_type === 'withdrawal' || transaction_type === 'expense') {
      newAmount -= parseFloat(amount)
    } else if (transaction_type === 'income' || transaction_type === 'adjustment') {
      newAmount += parseFloat(amount)
    }
    
    await this.db.query(
      'UPDATE cash_drawers SET current_amount = ? WHERE id = UUID_TO_BIN(?)',
      [newAmount, drawer_id]
    )
    
    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id FROM drawer_transactions WHERE drawer_id = UUID_TO_BIN(?) AND transaction_type = ? ORDER BY created_at DESC LIMIT 1',
      [drawer_id, transaction_type]
    )
    return rows[0]?.id
  }

  async getDrawerTransactions(drawerId, startDate = null, endDate = null) {
    let query = `
      SELECT dt.*, pm.name as payment_method_name, pm.code as payment_method_code,
             u.username as created_by_name
      FROM drawer_transactions dt
      LEFT JOIN payment_methods pm ON dt.payment_method_id = pm.id
      JOIN users u ON dt.created_by = u.id
      WHERE dt.drawer_id = ?
    `
    const params = [drawerId]
    
    if (startDate) {
      query += ' AND dt.created_at >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND dt.created_at <= ?'
      params.push(endDate)
    }
    
    query += ' ORDER BY dt.created_at DESC'
    
    return await this.db.query(query, params)
  }

  async getDrawerSummary(drawerId) {
    const rows = await this.db.query(
      `SELECT 
        transaction_type,
        SUM(CASE WHEN transaction_type IN ('sale_payment', 'income', 'opening') THEN amount ELSE 0 END) as total_in,
        SUM(CASE WHEN transaction_type IN ('withdrawal', 'expense', 'closing') THEN amount ELSE 0 END) as total_out,
        COUNT(*) as transaction_count
      FROM drawer_transactions
      WHERE drawer_id = ?
      GROUP BY transaction_type`,
      [drawerId]
    )
    return rows
  }

  async getPaymentSummaryByDate(locationId, startDate, endDate) {
    let query = `
      SELECT 
        sp.payment_type,
        pm.name as payment_method_name,
        SUM(sp.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      LEFT JOIN payment_methods pm ON sp.payment_type = pm.code
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]
    
    if (locationId) {
      query += ' AND s.location_id = ?'
      params.push(locationId)
    }
    
    query += ' GROUP BY sp.payment_type, pm.name ORDER BY total_amount DESC'
    
    return await this.db.query(query, params)
  }

  async getCashSalesSummary(drawerId, startDate = null, endDate = null) {
    const drawer = await this.getCashDrawerById(drawerId)
    if (!drawer) return null
    
    const rows = await this.db.query(
      `SELECT 
        COALESCE(SUM(s.total), 0) as total_cash_sales
      FROM sales s
      WHERE s.drawer_id = UUID_TO_BIN(?) 
        AND s.status = 'completed'`,
      [drawerId]
    )
    
    const totalCashSales = parseFloat(rows[0]?.total_cash_sales || 0)
    
    const sales = await this.db.query(
      `SELECT 
        BIN_TO_UUID(s.id) as id,
        s.sale_number,
        s.total,
        s.sale_date,
        c.first_name,
        c.last_name,
        u.username as created_by_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.drawer_id = UUID_TO_BIN(?) AND s.status = 'completed'
      ORDER BY s.sale_date DESC`,
      [drawerId]
    )
    
    const withdrawalRows = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_withdrawals
       FROM drawer_transactions 
       WHERE drawer_id = UUID_TO_BIN(?) AND transaction_type = 'withdrawal'`,
      [drawerId]
    )
    
    const totalWithdrawals = parseFloat(withdrawalRows[0]?.total_withdrawals || 0)
    
    const expectedCash = parseFloat(drawer.initial_amount) + totalCashSales - totalWithdrawals
    
    const transactions = await this.db.query(
      `SELECT 
        BIN_TO_UUID(dt.id) as id,
        dt.transaction_type,
        dt.amount,
        dt.notes,
        dt.created_at,
        u.username as created_by_name
      FROM drawer_transactions dt
      LEFT JOIN users u ON dt.created_by = u.id
      WHERE dt.drawer_id = UUID_TO_BIN(?)
      ORDER BY dt.created_at DESC`,
      [drawerId]
    )
    
    return {
      drawer,
      initial_amount: parseFloat(drawer.initial_amount),
      total_cash_sales: totalCashSales,
      total_withdrawals: totalWithdrawals,
      expected_cash: expectedCash,
      current_amount: parseFloat(drawer.current_amount),
      transactions: transactions,
      sales: sales
    }
  }

  async getDrawerHistory(locationId, filters = {}) {
    const { search, limit = 20, offset = 0, start_date, end_date } = filters
    const params = [locationId]

    let whereClause = 'WHERE cd.location_id = UUID_TO_BIN(?) AND cd.status = ?'
    params.push('closed')

    if (search) {
      whereClause += ' AND (cd.name LIKE ? OR u_opened.username LIKE ? OR u_closed.username LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (start_date) {
      whereClause += ' AND DATE(cd.closed_at) >= ?'
      params.push(start_date)
    }

    if (end_date) {
      whereClause += ' AND DATE(cd.closed_at) <= ?'
      params.push(end_date)
    }

    const countResult = await this.db.query(`SELECT COUNT(*) as total FROM cash_drawers cd LEFT JOIN users u_opened ON cd.opened_by = u_opened.id LEFT JOIN users u_closed ON cd.closed_by = u_closed.id ${whereClause}`, params)
    const total = countResult[0]?.total || 0

    params.push(parseInt(limit), parseInt(offset))

    const query = `
      SELECT 
        BIN_TO_UUID(cd.id) as id,
        cd.name,
        BIN_TO_UUID(cd.location_id) as location_id,
        cd.initial_amount,
        cd.current_amount,
        cd.status,
        cd.opened_at,
        cd.closed_at,
        BIN_TO_UUID(cd.opened_by) as opened_by,
        BIN_TO_UUID(cd.closed_by) as closed_by,
        cd.notes,
        BIN_TO_UUID(cd.shift_session_id) as shift_session_id,
        cd.created_at,
        cd.updated_at,
        l.name as location_name,
        u_opened.username as opened_by_name,
        u_closed.username as closed_by_name
       FROM cash_drawers cd
       JOIN locations l ON cd.location_id = l.id
       LEFT JOIN users u_opened ON cd.opened_by = u_opened.id
       LEFT JOIN users u_closed ON cd.closed_by = u_closed.id
       ${whereClause}
       ORDER BY cd.closed_at DESC
       LIMIT ? OFFSET ?`

    const rows = await this.db.query(query, params)
    return { data: rows, total }
  }

  async createAdjustment(drawerId, userId, adjustmentType, amount, notes) {
    await this.db.query(
      `INSERT INTO drawer_adjustments (id, drawer_id, user_id, adjustment_type, amount, notes, status)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, 'pending')`,
      [drawerId, userId, adjustmentType, amount, notes]
    )
  }

  async getAdjustmentsByDrawer(drawerId) {
    return await this.db.query(
      `SELECT 
        BIN_TO_UUID(da.id) as id,
        BIN_TO_UUID(da.drawer_id) as drawer_id,
        BIN_TO_UUID(da.user_id) as user_id,
        da.adjustment_type,
        da.amount,
        da.notes,
        da.status,
        da.created_at,
        u.username as user_name
       FROM drawer_adjustments da
       LEFT JOIN users u ON da.user_id = u.id
       WHERE da.drawer_id = UUID_TO_BIN(?)
       ORDER BY da.created_at DESC`,
      [drawerId]
    )
  }

  async getAdjustmentsByUser(userId, filters = {}) {
    const { status, search, limit = 20, offset = 0, start_date, end_date } = filters
    const params = [userId]
    const countParams = [userId]

    let whereClause = 'WHERE da.user_id = UUID_TO_BIN(?)'

    if (status) {
      whereClause += ' AND da.status = ?'
      params.push(status)
      countParams.push(status)
    }

    if (start_date) {
      whereClause += ' AND DATE(da.created_at) >= ?'
      params.push(start_date)
      countParams.push(start_date)
    }

    if (end_date) {
      whereClause += ' AND DATE(da.created_at) <= ?'
      params.push(end_date)
      countParams.push(end_date)
    }

    if (search) {
      whereClause += ' AND (cd.name LIKE ? OR da.notes LIKE ? OR da.adjustment_type LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
      countParams.push(searchTerm, searchTerm, searchTerm)
    }

    const countResult = await this.db.query(`SELECT COUNT(*) as total FROM drawer_adjustments da JOIN cash_drawers cd ON da.drawer_id = cd.id ${whereClause}`, countParams)
    const total = countResult[0]?.total || 0

    let query = `SELECT 
        BIN_TO_UUID(da.id) as id,
        BIN_TO_UUID(da.drawer_id) as drawer_id,
        BIN_TO_UUID(da.user_id) as user_id,
        da.adjustment_type,
        da.amount,
        da.notes,
        da.status,
        da.created_at,
        cd.name as drawer_name,
        l.name as location_name
       FROM drawer_adjustments da
       JOIN cash_drawers cd ON da.drawer_id = cd.id
       JOIN locations l ON cd.location_id = l.id
       ${whereClause}
       ORDER BY da.created_at DESC
       LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const rows = await this.db.query(query, params)
    return { data: rows, total }
  }

  async updateAdjustmentStatus(adjustmentId, status) {
    await this.db.query(
      `UPDATE drawer_adjustments SET status = ? WHERE id = UUID_TO_BIN(?)`,
      [status, adjustmentId]
    )
  }

  async getAdjustmentById(adjustmentId) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(id) as id,
        BIN_TO_UUID(drawer_id) as drawer_id,
        BIN_TO_UUID(user_id) as user_id,
        adjustment_type,
        amount,
        notes,
        status,
        created_at
       FROM drawer_adjustments WHERE id = UUID_TO_BIN(?)`,
      [adjustmentId]
    )
    return rows[0] || null
  }

  async createAccountReceivable(userId, adjustmentId, amount, notes = null, dueDate = null) {
    await this.db.query(
      `INSERT INTO accounts_receivable (id, user_id, adjustment_id, amount, notes, due_date)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?)`,
      [userId, adjustmentId, amount, notes, dueDate]
    )
  }

  async getAccountsReceivable(filters = {}) {
    const { userId, status, search, limit = 20, offset = 0, start_date, end_date } = filters
    const params = []
    const countParams = []

    let whereClause = 'WHERE 1=1'

    if (userId) {
      whereClause += ' AND ar.user_id = UUID_TO_BIN(?)'
      params.push(userId)
      countParams.push(userId)
    }

    if (status) {
      whereClause += ' AND ar.status = ?'
      params.push(status)
      countParams.push(status)
    }

    if (start_date) {
      whereClause += ' AND DATE(ar.created_at) >= ?'
      params.push(start_date)
      countParams.push(start_date)
    }

    if (end_date) {
      whereClause += ' AND DATE(ar.created_at) <= ?'
      params.push(end_date)
      countParams.push(end_date)
    }

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR ar.notes LIKE ? OR cd.name LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
      countParams.push(searchTerm, searchTerm, searchTerm)
    }

    const countResult = await this.db.query(`SELECT COUNT(*) as total FROM accounts_receivable ar LEFT JOIN users u ON ar.user_id = u.id LEFT JOIN drawer_adjustments da ON ar.adjustment_id = da.id LEFT JOIN cash_drawers cd ON da.drawer_id = cd.id ${whereClause}`, countParams)
    const total = countResult[0]?.total || 0

    let query = `SELECT 
        BIN_TO_UUID(ar.id) as id,
        BIN_TO_UUID(ar.user_id) as user_id,
        BIN_TO_UUID(ar.adjustment_id) as adjustment_id,
        ar.amount,
        ar.paid_amount,
        ar.status,
        ar.notes,
        ar.due_date,
        ar.created_at,
        ar.updated_at,
        u.username as user_name,
        da.adjustment_type,
        da.amount as adjustment_amount,
        cd.name as drawer_name
       FROM accounts_receivable ar
       LEFT JOIN users u ON ar.user_id = u.id
       LEFT JOIN drawer_adjustments da ON ar.adjustment_id = da.id
       LEFT JOIN cash_drawers cd ON da.drawer_id = cd.id
       ${whereClause}
       ORDER BY ar.created_at DESC
       LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const rows = await this.db.query(query, params)
    return { data: rows, total }
  }

  async updateAccountReceivable(id, paidAmount, status) {
    await this.db.query(
      `UPDATE accounts_receivable SET paid_amount = ?, status = ?, updated_at = NOW() WHERE id = UUID_TO_BIN(?)`,
      [paidAmount, status, id]
    )
  }

  async getAccountReceivableById(id) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(ar.id) as id,
        BIN_TO_UUID(ar.user_id) as user_id,
        BIN_TO_UUID(ar.adjustment_id) as adjustment_id,
        ar.amount,
        ar.paid_amount,
        ar.status,
        ar.notes,
        ar.due_date,
        ar.created_at,
        u.username as user_name,
        da.adjustment_type,
        da.amount as adjustment_amount
       FROM accounts_receivable ar
       LEFT JOIN users u ON ar.user_id = u.id
       LEFT JOIN drawer_adjustments da ON ar.adjustment_id = da.id
       WHERE ar.id = UUID_TO_BIN(?)`,
      [id]
    )
    return rows[0] || null
  }

  async getCashiers() {
    return await this.db.query(
      `SELECT BIN_TO_UUID(u.id) as id, u.username, u.email
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'cashier' AND u.is_active = 1
       ORDER BY u.username`
    )
  }
}
