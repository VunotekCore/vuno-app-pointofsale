import pool from '../config/database.js'
import crypto from 'crypto'
import { NotFoundError } from '../errors/NotFoundError.js'
import { generateUUID, uuidToBin, binToUuid } from '../utils/uuid.utils.js'
import { CompanyRepository } from './company.repository.js'
import { SequenceRepository } from './sequence.repository.js'

export class SalesRepository {
  constructor(db = pool, companyRepo = null, sequenceRepo = null) {
    this.db = db
    this.companyRepo = companyRepo || new CompanyRepository(db)
    this.sequenceRepo = sequenceRepo || new SequenceRepository(db, this.companyRepo)
  }

  async generateSaleNumber(companyId) {
    if (!companyId) {
      throw new Error('companyId es requerido para generar número de venta')
    }

    const result = await this.sequenceRepo.getNext(companyId, 'sale')
    return result.docNumber
  }

  async createSale(data) {
    const {
      sale_number,
      company_id,
      customer_id,
      created_by,
      location_id,
      drawer_id,
      subtotal,
      discount_amount,
      tax_amount,
      total,
      notes,
      status,
      sale_date
    } = data

    const saleUUID = crypto.randomUUID()
    
    const companyIdBin = company_id && company_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const customerIdBin = customer_id && customer_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const createdByBin = created_by && created_by !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const locationIdBin = location_id && location_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const drawerIdBin = drawer_id && drawer_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    
    const params = [saleUUID, sale_number]
    if (companyIdBin !== 'NULL') params.push(company_id)
    if (customerIdBin !== 'NULL') params.push(customer_id)
    if (createdByBin !== 'NULL') params.push(created_by)
    if (locationIdBin !== 'NULL') params.push(location_id)
    if (drawerIdBin !== 'NULL') params.push(drawer_id)
    params.push(subtotal, discount_amount, tax_amount, total, notes, status || 'pending', sale_date || new Date())
    
    try {
      await this.db.query(
        `INSERT INTO sales (id, sale_number, company_id, customer_id, created_by, location_id, drawer_id, subtotal, discount_amount, tax_amount, total, notes, status, sale_date)
         VALUES (UUID_TO_BIN(?), ?, ${companyIdBin}, ${customerIdBin}, ${createdByBin}, ${locationIdBin}, ${drawerIdBin}, ?, ?, ?, ?, ?, ?, ?)`,
        params
      )
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const mysqlError = error.sqlMessage || ''
        throw new Error(`Duplicate entry: ${mysqlError}`)
      }
      throw error
    }
    
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM sales WHERE id = UUID_TO_BIN(?)', [saleUUID])
    return rows[0]?.id
  }

  async createSaleWithConnection(conn, data) {
    const {
      sale_number,
      company_id,
      customer_id,
      created_by,
      location_id,
      drawer_id,
      subtotal,
      discount_amount,
      tax_amount,
      total,
      notes,
      status,
      sale_date
    } = data

    const saleUUID = crypto.randomUUID()
    
    const companyIdBin = company_id && company_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const customerIdBin = customer_id && customer_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const createdByBin = created_by && created_by !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const locationIdBin = location_id && location_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const drawerIdBin = drawer_id && drawer_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    
    const params = [saleUUID, sale_number]
    if (companyIdBin !== 'NULL') params.push(company_id)
    if (customerIdBin !== 'NULL') params.push(customer_id)
    if (createdByBin !== 'NULL') params.push(created_by)
    if (locationIdBin !== 'NULL') params.push(location_id)
    if (drawerIdBin !== 'NULL') params.push(drawer_id)
    params.push(subtotal, discount_amount, tax_amount, total, notes, status || 'pending', sale_date || new Date())
    
    try {
      await conn.query(
        `INSERT INTO sales (id, sale_number, company_id, customer_id, created_by, location_id, drawer_id, subtotal, discount_amount, tax_amount, total, notes, status, sale_date)
         VALUES (UUID_TO_BIN(?), ?, ${companyIdBin}, ${customerIdBin}, ${createdByBin}, ${locationIdBin}, ${drawerIdBin}, ?, ?, ?, ?, ?, ?, ?)`,
        params
      )
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`Duplicate entry: ${error.sqlMessage || ''}`)
      }
      throw error
    }
    
    return saleUUID
  }

  async addSaleItemWithConnection(conn, data) {
    const {
      sale_id,
      item_id,
      variation_id,
      serial_number,
      quantity,
      unit_price,
      discount_amount,
      tax_amount,
      cost_price,
      line_total,
      unit_abbreviation,
      unit_name
    } = data

    const itemUUID = crypto.randomUUID()
    await conn.query(
      `INSERT INTO sale_items (id, sale_id, item_id, variation_id, serial_number, quantity, unit_price, discount_amount, tax_amount, cost_price, line_total, unit_abbreviation, unit_name)
       VALUES (UUID_TO_BIN('${itemUUID}'), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sale_id,
        item_id,
        variation_id,
        serial_number || null,
        quantity,
        unit_price,
        discount_amount || 0,
        tax_amount || 0,
        cost_price || 0,
        line_total,
        unit_abbreviation || null,
        unit_name || null
      ]
    )

    return itemUUID
  }

  async addPaymentWithConnection(conn, data) {
    const {
      sale_id,
      payment_type,
      amount,
      transaction_id,
      reference_number,
      notes
    } = data

    const paymentUUID = crypto.randomUUID()
    await conn.query(
      `INSERT INTO sale_payments (id, sale_id, payment_type, amount, transaction_id, reference_number, notes)
       VALUES (UUID_TO_BIN('${paymentUUID}'), UUID_TO_BIN(?), ?, ?, ?, ?, ?)`,
      [
        sale_id,
        payment_type,
        amount,
        transaction_id || null,
        reference_number || null,
        notes || null
      ]
    )

    return paymentUUID
  }

  async updateSale(id, data, companyId) {
    return await this.updateSaleWithConnection(null, id, data, companyId)
  }

  async updateSaleWithConnection(conn, id, data, companyId) {
    const fields = []
    const values = []

    const allowedFields = ['customer_id', 'subtotal', 'discount_amount', 'tax_amount', 'total', 'notes', 'status', 'sale_date']
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) return false

    values.push(id, companyId)
    
    const queryFn = conn ? conn.query.bind(conn) : this.db.query.bind(this.db)
    await queryFn(
      `UPDATE sales SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      values
    )

    return true
  }

  async getById(id, companyId) {
    let query = `SELECT BIN_TO_UUID(s.id) as id, 
            s.sale_number,
            BIN_TO_UUID(s.company_id) as company_id,
            BIN_TO_UUID(s.customer_id) as customer_id,
            s.subtotal,
            s.discount_amount,
            s.tax_amount,
            s.total,
            s.notes,
            s.status,
            s.sale_date,
            s.created_at,
            s.updated_at,
            BIN_TO_UUID(s.created_by) as created_by,
            BIN_TO_UUID(s.location_id) as location_id,
            u.username as employee_name, 
            u.email as employee_email,
            l.name as location_name,
            l.code as location_code,
            CONCAT_WS(' ', c.first_name, c.last_name) as customer_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.id
      JOIN locations l ON s.location_id = l.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = UUID_TO_BIN(?)`
    
    const params = [id]
    
    if (companyId && companyId !== 'undefined') {
      query += ' AND s.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    const rows = await this.db.query(query, params)
    return rows[0] || null
  }

  async getAll(filters = {}) {
    const { location_id, status, start_date, end_date, company_id, search, limit = 100, offset = 0 } = filters

    let query = `
      SELECT 
        BIN_TO_UUID(s.id) as id,
        s.sale_number,
        BIN_TO_UUID(s.customer_id) as customer_id,
        s.subtotal,
        s.discount_amount,
        s.tax_amount,
        s.total,
        s.notes,
        s.status,
        s.sale_date,
        s.created_at,
        s.updated_at,
        BIN_TO_UUID(s.created_by) as created_by,
        BIN_TO_UUID(s.location_id) as location_id,
        u.username as employee_name, 
        l.name as location_name,
        l.code as location_code,
        CONCAT_WS(' ', c.first_name, c.last_name) as customer_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.id
      JOIN locations l ON s.location_id = l.id
      LEFT JOIN customers c ON s.customer_id = c.id AND (c.is_delete = 0 OR c.is_delete IS NULL)
      WHERE s.company_id = UUID_TO_BIN(?)
    `
    const params = [company_id]

    if (location_id) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
    }

    if (status) {
      query += ' AND s.status = ?'
      params.push(status)
    }

    if (search) {
      query += ' AND s.sale_number LIKE ?'
      params.push(`%${search}%`)
    }

    if (start_date) {
      query += ' AND DATE(s.sale_date) >= ?'
      params.push(start_date)
    }

    if (end_date) {
      query += ' AND DATE(s.sale_date) <= ?'
      params.push(end_date)
    }

    query += ' ORDER BY s.sale_date DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const rows = await this.db.query(query, params)
    return rows
  }

  async getCount(filters = {}) {
    const { location_id, status, start_date, end_date, company_id } = filters

    let query = `SELECT COUNT(*) as total FROM sales s WHERE s.company_id = UUID_TO_BIN(?)`
    const params = [company_id]

    if (location_id) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
    }

    if (status) {
      query += ' AND s.status = ?'
      params.push(status)
    }

    if (start_date) {
      query += ' AND DATE(s.sale_date) >= ?'
      params.push(start_date)
    }

    if (end_date) {
      query += ' AND DATE(s.sale_date) <= ?'
      params.push(end_date)
    }

    const rows = await this.db.query(query, params)
    return rows[0].total
  }

  async getItemsBySaleId(saleId, companyId) {
    let query = `
      SELECT BIN_TO_UUID(si.id) as id,
              BIN_TO_UUID(si.sale_id) as sale_id,
              BIN_TO_UUID(si.item_id) as item_id,
              BIN_TO_UUID(si.variation_id) as variation_id,
              si.quantity,
              si.unit_price,
              si.discount_amount,
              si.tax_amount,
              si.line_total,
              COALESCE(i.name, si.unit_name, 'Producto eliminado') as item_name, 
              i.item_number,
              i.is_serialized,
              iv.attributes as variation_attributes,
              iv.sku as variation_sku,
              si.unit_abbreviation,
              si.unit_name
       FROM sale_items si
       LEFT JOIN items i ON si.item_id = i.id
       LEFT JOIN item_variations iv ON si.variation_id = iv.id
       WHERE si.sale_id = UUID_TO_BIN(?)`
    const params = [saleId]
    
    if (companyId) {
      query += ' AND (i.company_id = UUID_TO_BIN(?) OR i.company_id IS NULL)'
      params.push(companyId)
    }
    
    query += ' ORDER BY si.id'
    
    const rows = await this.db.query(query, params)
    return rows
  }

  async addSaleItem(data) {
    const {
      sale_id,
      item_id,
      variation_id,
      serial_number,
      quantity,
      unit_price,
      discount_amount,
      tax_amount,
      cost_price,
      line_total,
      unit_abbreviation,
      unit_name
    } = data

    const itemUUID = crypto.randomUUID()
    await this.db.query(
      `INSERT INTO sale_items (id, sale_id, item_id, variation_id, serial_number, quantity, unit_price, discount_amount, tax_amount, cost_price, line_total, unit_abbreviation, unit_name)
       VALUES (UUID_TO_BIN('${itemUUID}'), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sale_id,
        item_id,
        variation_id,
        serial_number || null,
        quantity,
        unit_price,
        discount_amount || 0,
        tax_amount || 0,
        cost_price || 0,
        line_total,
        unit_abbreviation || null,
        unit_name || null
      ]
    )

    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id FROM sale_items WHERE sale_id = UUID_TO_BIN(?) AND item_id = UUID_TO_BIN(?) ORDER BY created_at DESC LIMIT 1',
      [sale_id, item_id]
    )
    return rows[0]?.id
  }

  async updateSaleItem(id, data) {
    const fields = []
    const values = []

    const allowedFields = ['quantity', 'unit_price', 'discount_amount', 'tax_amount', 'line_total', 'serial_number']
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) return false

    values.push(id)
    
    await this.db.query(
      `UPDATE sale_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    return true
  }

  async deleteSaleItem(id) {
    await this.db.query('DELETE FROM sale_items WHERE id = UUID_TO_BIN(?)', [id])
    return true
  }

  async getPaymentsBySaleId(saleId, companyId) {
    let query = `
      SELECT sp.* 
       FROM sale_payments sp
       JOIN sales s ON sp.sale_id = s.id
       WHERE sp.sale_id = UUID_TO_BIN(?)`
    const params = [saleId]
    
    if (companyId) {
      query += ' AND s.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' ORDER BY sp.payment_date'
    
    const rows = await this.db.query(query, params)
    return rows
  }

  async addPayment(data) {
    const {
      sale_id,
      payment_type,
      amount,
      transaction_id,
      reference_number,
      notes
    } = data

    await this.db.query(
      `INSERT INTO sale_payments (id, sale_id, payment_type, amount, transaction_id, reference_number, notes)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), ?, ?, ?, ?, ?)`,
      [
        sale_id,
        payment_type,
        amount,
        transaction_id || null,
        reference_number || null,
        notes || null
      ]
    )

    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id FROM sale_payments WHERE sale_id = UUID_TO_BIN(?) AND payment_type = ? ORDER BY created_at DESC LIMIT 1',
      [sale_id, payment_type]
    )
    return rows[0]?.id
  }

  async getSuspensionBySaleId(saleId) {
    const rows = await this.db.query(
      `SELECT ss.* 
       FROM sale_suspensions ss
       WHERE ss.sale_id = UUID_TO_BIN(?)`,
      [saleId]
    )

    return rows[0] || null
  }

  async suspendSale(data) {
    const { sale_id, payments_made, balance_due, due_date, notes } = data

    await this.db.query(
      `INSERT INTO sale_suspensions (id, sale_id, payments_made, balance_due, due_date, notes)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), ?, ?, ?, ?)`,
      [sale_id, payments_made, balance_due, due_date || null, notes || null]
    )

    await this.db.query(
      `UPDATE sales SET status = 'suspended' WHERE id = UUID_TO_BIN(?)`,
      [sale_id]
    )

    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id FROM sale_suspensions WHERE sale_id = UUID_TO_BIN(?)',
      [sale_id]
    )
    return rows[0]?.id
  }

  async resumeSale(saleId) {
    await this.db.query('DELETE FROM sale_suspensions WHERE sale_id = UUID_TO_BIN(?)', [saleId])
    await this.db.query(`UPDATE sales SET status = 'pending' WHERE id = UUID_TO_BIN(?)`, [saleId])
    return true
  }

  async cancelSale(saleId, notes) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const [items] = await conn.query(
        `SELECT si.* FROM sale_items si WHERE si.sale_id = UUID_TO_BIN(?)`,
        [saleId]
      )

      const [saleRows] = await conn.query('SELECT location_id FROM sales WHERE id = UUID_TO_BIN(?)', [saleId])
      const saleLocationId = saleRows[0]?.location_id

      for (const item of items) {
        await conn.query(
          `UPDATE item_quantities 
           SET quantity = quantity + ?, updated_at = NOW() 
           WHERE item_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL)) AND location_id = ?`,
          [item.quantity, item.item_id, item.variation_id, item.variation_id, saleLocationId]
        )
      }

      await conn.query(
        `UPDATE sales SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), '\nCancellation: ', ?) WHERE id = UUID_TO_BIN(?)`,
        [notes || 'Cancelled', saleId]
      )

      await conn.commit()
      return true
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async getByIdWithDetails(id, companyId) {
    const sale = await this.getById(id, companyId)
    if (!sale) return null

    if (!companyId && sale.company_id) {
      companyId = sale.company_id
    }

    const items = await this.getItemsBySaleId(id, companyId)
    const payments = await this.getPaymentsBySaleId(id, companyId)

    return {
      ...sale,
      items,
      payments
    }
  }

  async getDailySales(locationId, date) {
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    let query = `
      SELECT s.*, u.username as employee_name, l.name as location_name
      FROM sales s
      JOIN users u ON s.created_by = u.id
      JOIN locations l ON s.location_id = l.id
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = ?'
      params.push(locationId)
    }

    query += ' ORDER BY s.sale_date DESC'

    return await this.db.query(query, params)
  }

  async getSalesSummary(locationId, startDate, endDate) {
    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discounts
      FROM sales
      WHERE status = 'completed' AND sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND location_id = ?'
      params.push(locationId)
    }

    const rows = await this.db.query(query, params)
    return rows[0]
  }

  async getTopSellingItems(locationId, startDate, endDate, limit = 10) {
    let query = `
      SELECT 
        i.id,
        i.name,
        i.item_number,
        SUM(si.quantity) as total_quantity,
        SUM(si.line_total) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN items i ON si.item_id = i.id
      WHERE s.status = 'completed' AND s.sale_date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (locationId) {
      query += ' AND s.location_id = ?'
      params.push(locationId)
    }

    query += ` GROUP BY i.id, i.name, i.item_number ORDER BY total_quantity DESC LIMIT ?`
    params.push(parseInt(limit))

    return await this.db.query(query, params)
  }

  async getSuspendedSales(locationId = null, companyId = null) {
    let query = `
      SELECT s.*, ss.suspension_date, ss.payments_made, ss.balance_due, ss.due_date,
             u.username as employee_name, l.name as location_name
      FROM sales s
      JOIN sale_suspensions ss ON s.id = ss.sale_id
      JOIN users u ON s.created_by = u.id
      JOIN locations l ON s.location_id = l.id
      WHERE s.status IN ('suspended', 'layaway')
      AND s.company_id = UUID_TO_BIN(?)
    `
    const params = [companyId]

    if (locationId) {
      query += ' AND s.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    }

    query += ' ORDER BY ss.suspension_date DESC'

    return await this.db.query(query, params)
  }
}

export class ReturnsRepository {
  constructor(db = pool, companyRepo = null, sequenceRepo = null) {
    this.db = db
    this.companyRepo = companyRepo || new CompanyRepository(db)
    this.sequenceRepo = sequenceRepo || new SequenceRepository(db, this.companyRepo)
  }

  async generateReturnNumber(companyId) {
    if (!companyId) {
      throw new Error('companyId es requerido para generar número de devolución')
    }

    const result = await this.sequenceRepo.getNext(companyId, 'return')
    return { returnNumber: result.docNumber, retSeq: result.sequence }
  }

  async createReturn(data) {
    const conn = await this.db.getConnection()
    try {
      const result = await this.createReturnWithConnection(conn, data)
      await conn.commit()
      conn.release()
      return result
    } catch (error) {
      await conn.rollback()
      conn.release()
      throw error
    }
  }

  async createReturnWithConnection(conn, data) {
    const {
      return_number,
      company_id,
      sale_id,
      employee_id,
      location_id,
      subtotal,
      tax_amount,
      total,
      refund_method,
      notes,
      return_date
    } = data

    const newId = crypto.randomUUID()
    
    const companyIdBin = company_id && company_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const saleIdBin = sale_id && sale_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const employeeIdBin = employee_id && employee_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    const locationIdBin = location_id && location_id !== 'undefined' ? `UUID_TO_BIN(?)` : 'NULL'
    
    const params = [newId, return_number]
    if (companyIdBin !== 'NULL') params.push(company_id)
    if (saleIdBin !== 'NULL') params.push(sale_id)
    if (employeeIdBin !== 'NULL') params.push(employee_id)
    if (locationIdBin !== 'NULL') params.push(location_id)
    params.push(subtotal, tax_amount, total, refund_method || 'cash', notes, return_date || new Date())
    
    try {
      await conn.query(
        `INSERT INTO returns (id, return_number, company_id, sale_id, employee_id, location_id, subtotal, tax_amount, total, refund_method, notes, status, return_date)
         VALUES (UUID_TO_BIN(?), ?, ${companyIdBin}, ${saleIdBin}, ${employeeIdBin}, ${locationIdBin}, ?, ?, ?, ?, ?, 'pending', ?)`,
        params
      )
    } catch (error) {
      console.error('[DEBUG createReturn] Error:', error)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Número de devolución ya existe')
      }
      throw error
    }

    return newId
  }

  async getById(id, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(r.id) as id,
              r.return_number,
              BIN_TO_UUID(r.sale_id) as sale_id,
              BIN_TO_UUID(r.employee_id) as employee_id,
              BIN_TO_UUID(r.location_id) as location_id,
              r.subtotal, r.tax_amount, r.total, r.refund_method, r.notes, r.status, r.return_date,
              BIN_TO_UUID(r.company_id) as company_id,
              u.username as employee_name, 
              l.name as location_name,
              s.sale_number as original_sale_number
       FROM returns r
       LEFT JOIN users u ON r.employee_id = u.id
       LEFT JOIN locations l ON r.location_id = l.id
       LEFT JOIN sales s ON r.sale_id = s.id
       WHERE r.id = UUID_TO_BIN(?) AND r.company_id = UUID_TO_BIN(?)`,
      [id, companyId]
    )

    return rows[0] || null
  }

  async updateStatus(id, status, companyId) {
    await this.db.query(
      `UPDATE returns SET status = ? WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      [status, id, companyId]
    )
  }

  async getAll(filters = {}) {
    const { location_id, start_date, end_date, status, search, company_id, limit = 20, offset = 0 } = filters

    let query = `
      SELECT 
             BIN_TO_UUID(r.id) as id,
             r.return_number,
             BIN_TO_UUID(r.sale_id) as sale_id,
             BIN_TO_UUID(r.employee_id) as employee_id,
             BIN_TO_UUID(r.location_id) as location_id,
             r.subtotal,
             r.tax_amount,
             r.total,
             r.refund_method,
             r.notes,
             r.status,
             r.return_date,
             BIN_TO_UUID(r.company_id) as company_id,
             u.username as employee_name, 
             l.name as location_name,
             s.sale_number as original_sale_number
      FROM returns r
      LEFT JOIN users u ON r.employee_id = u.id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN sales s ON r.sale_id = s.id
      WHERE r.company_id = UUID_TO_BIN(?)
    `
    const params = [company_id]

    if (location_id) {
      query += ' AND r.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
    }

    if (status) {
      query += ' AND r.status = ?'
      params.push(status)
    }

    if (start_date) {
      query += ' AND r.return_date >= ?'
      params.push(start_date)
    }

    if (end_date) {
      query += ' AND r.return_date <= ?'
      params.push(end_date)
    }

    if (search) {
      query += ' AND (r.return_number LIKE ? OR r.return_number LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }

    let countQuery = `SELECT COUNT(*) as total FROM returns r WHERE r.company_id = UUID_TO_BIN(?)`
    const countParams = [company_id]
    
    if (location_id) {
      const locQuery = ' AND r.location_id = UUID_TO_BIN(?)'
      query += locQuery
      params.push(location_id)
      countQuery += locQuery
      countParams.push(location_id)
    }
    if (status) {
      const statQuery = ' AND r.status = ?'
      query += statQuery
      params.push(status)
      countQuery += statQuery
      countParams.push(status)
    }
    if (start_date) {
      const sdQuery = ' AND r.return_date >= ?'
      query += sdQuery
      params.push(start_date)
      countQuery += sdQuery
      countParams.push(start_date)
    }
    if (end_date) {
      const edQuery = ' AND r.return_date <= ?'
      query += edQuery
      params.push(end_date)
      countQuery += edQuery
      countParams.push(end_date)
    }
    if (search) {
      const srchQuery = ' AND (r.return_number LIKE ? OR r.return_number LIKE ?)'
      const searchTerm = `%${search}%`
      query += srchQuery
      params.push(searchTerm, searchTerm)
      countQuery += srchQuery
      countParams.push(searchTerm, searchTerm)
    }

    query += ` ORDER BY r.return_date DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const rows = await this.db.query(query, params)
    
    const countResult = await this.db.query(countQuery, countParams)
    const total = countResult[0]?.total || 0
    
    return { data: rows, total }
  }

  async addReturnItem(data, conn = null) {
    const {
      return_id,
      sale_item_id,
      item_id,
      variation_id,
      serial_number,
      quantity,
      unit_price,
      tax_amount,
      line_total,
      reason,
      item_condition
    } = data

    const newId = crypto.randomUUID()
    const dbConn = conn || this.db
    
    // Ensure dbConn has query method
    if (typeof dbConn.query !== 'function') {
      console.error('[DEBUG addReturnItem] dbConn type:', typeof dbConn, 'keys:', Object.keys(dbConn || {}))
      throw new Error('dbConn.query is not a function')
    }

    await dbConn.query(
      `INSERT INTO return_items (id, return_id, sale_item_id, item_id, variation_id, serial_number, quantity, unit_price, tax_amount, line_total, reason, item_condition)
       VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        return_id,
        sale_item_id || null,
        item_id,
        variation_id || null,
        serial_number || null,
        quantity,
        unit_price,
        tax_amount || 0,
        line_total,
        reason || null,
        item_condition || 'new'
      ]
    )

    return newId
  }

  async getItemsByReturnId(returnId, companyId) {
    let query = `
      SELECT BIN_TO_UUID(ri.id) as id,
             BIN_TO_UUID(ri.return_id) as return_id,
             BIN_TO_UUID(ri.sale_item_id) as sale_item_id,
             BIN_TO_UUID(ri.item_id) as item_id,
             BIN_TO_UUID(ri.variation_id) as variation_id,
             ri.serial_number,
             ri.quantity,
             ri.unit_price,
             ri.tax_amount,
             ri.line_total,
             ri.reason,
             ri.item_condition,
             i.name as item_name, 
             i.item_number,
             si.serial_number as original_serial
       FROM return_items ri
       JOIN items i ON ri.item_id = i.id
       LEFT JOIN sale_items si ON ri.sale_item_id = si.id
       WHERE ri.return_id = UUID_TO_BIN(?)`
    const params = [returnId]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' ORDER BY ri.id'
    
    const rows = await this.db.query(query, params)
    return rows
  }

  async getAlreadyReturnedQuantity(saleItemId, companyId) {
    let query = `
      SELECT COALESCE(SUM(ri.quantity), 0) as returned_qty
      FROM return_items ri
      JOIN returns r ON ri.return_id = r.id
      WHERE ri.sale_item_id = UUID_TO_BIN(?)
        AND r.status = 'completed'
    `
    const params = [saleItemId]

    if (companyId) {
      query += ' AND r.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    const rows = await this.db.query(query, params)
    return Number(rows[0]?.returned_qty || 0)
  }

  async processReturn(returnId, inventoryRepo, companyId) {
    const returnData = await this.getById(returnId, companyId)
    if (!returnData) throw new NotFoundError('Return not found')

    const items = await this.getItemsByReturnId(returnId, companyId)
    const conn = await this.db.getConnection()

    try {
      await conn.beginTransaction()

      for (const item of items) {
        const currentStockRows = await conn.query(
          `SELECT quantity FROM item_quantities WHERE item_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL)) AND location_id = ?`,
          [item.item_id, item.variation_id || null, item.variation_id || null, returnData.location_id]
        )

        const quantityBefore = currentStockRows.length > 0 ? Number(currentStockRows[0].quantity) : 0
        const quantityAfter = quantityBefore + parseFloat(item.quantity)

        if (currentStockRows.length > 0) {
          await conn.query(
            `UPDATE item_quantities 
             SET quantity = ?, updated_at = NOW() 
             WHERE item_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL)) AND location_id = ?`,
            [quantityAfter, item.item_id, item.variation_id || null, item.variation_id || null, returnData.location_id]
          )
        } else {
          const qtyUUID = crypto.randomUUID()
          await conn.query(
            `INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity, created_by)
             VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?)`,
            [qtyUUID, item.item_id, item.variation_id || null, returnData.location_id, quantityAfter, returnData.created_by]
          )
        }

        const movementUUID = crypto.randomUUID()
        await conn.query(
          `INSERT INTO inventory_movements (id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, user_id, notes)
           VALUES (UUID_TO_BIN('${movementUUID}'), ?, ?, ?, 'return', ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.item_id,
            item.variation_id || null,
            returnData.location_id,
            item.quantity,
            quantityBefore,
            quantityAfter,
            'return',
            returnId,
            returnData.created_by,
            `Return: ${item.reason || 'N/A'}`
          ]
        )
      }

      await conn.commit()

      await this.updateStatus(returnId, 'completed', companyId)

      return true
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }
}
