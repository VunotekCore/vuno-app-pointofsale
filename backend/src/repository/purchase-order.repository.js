import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { SequenceRepository } from './sequence.repository.js'
import { CompanyRepository } from './company.repository.js'

export class PurchaseOrderRepository {
  constructor (db = pool, companyRepo = null, sequenceRepo = null) {
    this.db = db
    this.companyRepo = companyRepo || new CompanyRepository(db)
    this.sequenceRepo = sequenceRepo || new SequenceRepository(db, this.companyRepo)
  }

  async getAll (filters = {}) {
    const { status, supplier_id, location_id, search, company_id, limit, offset } = filters
    
    let whereClause = 'WHERE (po.is_delete = 0 OR po.is_delete IS NULL)'
    const params = []
    const countParams = []

    if (company_id) {
      whereClause += ' AND po.company_id = UUID_TO_BIN(?)'
      params.push(company_id)
      countParams.push(company_id)
    }

    if (status) {
      whereClause += ' AND po.status = ?'
      params.push(status)
      countParams.push(status)
    }

    if (supplier_id) {
      whereClause += ' AND po.supplier_id = UUID_TO_BIN(?)'
      params.push(supplier_id)
      countParams.push(supplier_id)
    }

    if (location_id) {
      whereClause += ' AND po.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
      countParams.push(location_id)
    }

    if (search) {
      whereClause += ' AND (po.po_number LIKE ? OR s.name LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
      countParams.push(searchTerm, searchTerm)
    }

    const countResult = await this.db.query(`SELECT COUNT(*) as total FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id ${whereClause}`, countParams)
    const total = countResult[0]?.total || 0

    let query = `
      SELECT 
        BIN_TO_UUID(po.id) as id,
        po.po_number,
        BIN_TO_UUID(po.supplier_id) as supplier_id,
        BIN_TO_UUID(po.location_id) as location_id,
        po.status,
        po.expected_date,
        po.notes,
        po.total_amount,
        po.received_amount,
        po.created_at,
        po.updated_at,
        s.name as supplier_name,
        s.email as supplier_email,
        l.name as location_name,
        u.username as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN locations l ON po.location_id = l.id
      LEFT JOIN users u ON po.created_by = u.id
      ${whereClause}
      ORDER BY po.created_at DESC
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
    return { data: rows || [], total }
  }

  async getById (id, companyId) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(po.id) as id,
        po.po_number,
        BIN_TO_UUID(po.supplier_id) as supplier_id,
        BIN_TO_UUID(po.location_id) as location_id,
        po.status,
        po.expected_date,
        po.notes,
        po.total_amount,
        po.received_amount,
        po.created_at,
        po.updated_at,
        s.name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        l.name as location_name,
        u.username as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN locations l ON po.location_id = l.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = UUID_TO_BIN(?) AND po.company_id = UUID_TO_BIN(?) AND (po.is_delete = 0 OR po.is_delete IS NULL)
    `, [id, companyId])

    if (!rows || rows.length === 0) {
      throw new NotFoundError(`Orden de compra con id ${id} no encontrada`)
    }

    const order = rows[0]
    order.items = await this.getItems(id, companyId)
    
    return order
  }

  async getItems (orderId, companyId) {
    let query = `
      SELECT 
        BIN_TO_UUID(poi.id) as id,
        BIN_TO_UUID(poi.purchase_order_id) as purchase_order_id,
        BIN_TO_UUID(poi.item_id) as item_id,
        BIN_TO_UUID(poi.variation_id) as variation_id,
        poi.quantity_ordered,
        poi.quantity_received,
        poi.cost_price,
        poi.total_cost,
        i.name as item_name,
        i.item_number,
        iv.sku as variation_sku,
        iv.attributes as variation_attributes
      FROM purchase_order_items poi
      LEFT JOIN items i ON poi.item_id = i.id
      LEFT JOIN item_variations iv ON poi.variation_id = iv.id
      WHERE poi.purchase_order_id = UUID_TO_BIN(?)
    `
    const params = [orderId]
    
    const rows = await this.db.query(query, params)
    return rows || []
  }

  async create (data, userId = null) {
    const { supplier_id, location_id, expected_date, notes, items, company_id } = data

    if (!supplier_id) {
      throw new BadRequestError('El proveedor es requerido')
    }

    if (!location_id) {
      throw new BadRequestError('La ubicación es requerida')
    }

    if (!items || items.length === 0) {
      throw new BadRequestError('Los items son requeridos')
    }

    const poNumber = await this.generatePONumber(company_id)

    await this.db.query(`
      INSERT INTO purchase_orders (id, po_number, supplier_id, location_id, expected_date, notes, created_by, company_id)
      VALUES (UUID_TO_BIN(UUID()), ?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?))
    `, [poNumber, supplier_id, location_id, expected_date || null, notes || null, userId, company_id])

    const newOrder = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM purchase_orders WHERE po_number = ? AND company_id = UUID_TO_BIN(?)', [poNumber, company_id])
    const orderId = newOrder[0]?.id

    let totalAmount = 0

    for (const item of items) {
      const { item_id, variation_id, quantity_ordered, cost_price } = item
      
      if (!item_id || !quantity_ordered || !cost_price) {
        throw new BadRequestError('Cada item debe tener item_id, cantidad y costo')
      }

      const totalCost = parseFloat(quantity_ordered) * parseFloat(cost_price)
      totalAmount += totalCost

      await this.db.query(`
        INSERT INTO purchase_order_items (id, purchase_order_id, item_id, variation_id, quantity_ordered, quantity_received, cost_price, total_cost)
        VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, 0, ?, ?)
      `, [orderId, item_id, variation_id || null, quantity_ordered, cost_price, totalCost])
    }

    await this.db.query('UPDATE purchase_orders SET total_amount = ? WHERE id = UUID_TO_BIN(?)', [totalAmount, orderId])

    return orderId
  }

  async update (id, data, companyId) {
    await this.getById(id, companyId)

    const { expected_date, notes, status } = data

    const fields = []
    const values = []

    if (expected_date !== undefined) {
      fields.push('expected_date = ?')
      values.push(expected_date)
    }

    if (notes !== undefined) {
      fields.push('notes = ?')
      values.push(notes)
    }

    if (status !== undefined) {
      const validStatuses = ['draft', 'sent', 'partial', 'received', 'cancelled']
      if (!validStatuses.includes(status)) {
        throw new BadRequestError('Estado inválido')
      }
      fields.push('status = ?')
      values.push(status)
    }

    if (fields.length === 0) {
      throw new BadRequestError('No hay campos para actualizar')
    }

    values.push(id, companyId)
    const result = await this.db.query(`UPDATE purchase_orders SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`, values)

    if (result.affectedRows === 0) {
      throw new NotFoundError(`Orden de compra con id ${id} no encontrada`)
    }
    return result.affectedRows
  }

  async delete (id, companyId = null) {
    await this.getById(id, companyId)
    const result = await this.db.query('UPDATE purchase_orders SET is_delete = 1 WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)', [id, companyId])
    if (result.affectedRows === 0) {
      throw new NotFoundError(`Orden de compra con id ${id} no encontrada`)
    }
    return result.affectedRows
  }

  async generatePONumber (companyId) {
    if (!companyId) {
      throw new Error('companyId es requerido para generar número de orden de compra')
    }
    const result = await this.sequenceRepo.getNext(companyId, 'purchase_order')
    return result.docNumber
  }

  async getPendingReorderItems (locationId, companyId) {
    let whereClause = `i.is_delete = 0 
        AND i.status = 'active'
        AND (i.reorder_level > 0 OR i.reorder_quantity > 0)
        AND (i.supplier_id IS NOT NULL OR i.preferred_supplier_id IS NOT NULL)`
    const params = []
    
    if (companyId) {
      whereClause += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    if (locationId) {
      whereClause += ' AND iq.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
      whereClause += ' AND COALESCE(iq.quantity, 0) < i.reorder_level'
    }

    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(i.id) as item_id,
        i.item_number,
        i.name,
        i.reorder_level,
        i.reorder_quantity,
        i.cost_price,
        BIN_TO_UUID(i.supplier_id) as supplier_id,
        BIN_TO_UUID(i.preferred_supplier_id) as preferred_supplier_id,
        COALESCE(iq.quantity, 0) as current_quantity,
        s.name as supplier_name
      FROM items i
      LEFT JOIN item_quantities iq ON i.id = iq.item_id ${locationId ? 'AND iq.location_id = UUID_TO_BIN(?)' : ''}
      LEFT JOIN suppliers s ON COALESCE(i.preferred_supplier_id, i.supplier_id) = s.id
      WHERE ${whereClause}
      ORDER BY i.name ASC
    `, params)

    return rows || []
  }
}
