import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'

export class SupplierRepository {
  constructor (db = pool) {
    this.db = db
  }

  async getAll (filters = {}) {
    const { search, is_active, limit, offset } = filters
    
    let whereClause = 'WHERE (s.is_delete = 0 OR s.is_delete IS NULL)'
    const params = []
    const countParams = []

    if (search) {
      whereClause += ' AND (s.name LIKE ? OR s.contact_name LIKE ? OR s.email LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
      countParams.push(searchTerm, searchTerm, searchTerm)
    }

    if (is_active !== undefined && is_active !== null && is_active !== '') {
      const activeValue = is_active === true || is_active === 'true' || is_active === '1' || is_active === 1 ? 1 : 0
      whereClause += ' AND s.is_active = ?'
      params.push(activeValue)
      countParams.push(activeValue)
    }

    const countResult = await this.db.query(`SELECT COUNT(*) as total FROM suppliers s ${whereClause}`, countParams)
    const total = countResult[0]?.total || 0

    let query = `
      SELECT 
        BIN_TO_UUID(s.id) as id,
        s.name,
        s.contact_name,
        s.email,
        s.phone,
        s.address,
        s.rfc,
        s.payment_terms,
        s.is_active,
        s.custom_fields,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM items i WHERE i.supplier_id = s.id OR i.preferred_supplier_id = s.id) as items_count
      FROM suppliers s
      ${whereClause}
      ORDER BY s.name ASC
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

  async getById (id) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(s.id) as id,
        s.name,
        s.contact_name,
        s.email,
        s.phone,
        s.address,
        s.rfc,
        s.payment_terms,
        s.is_active,
        s.custom_fields,
        s.created_at,
        s.updated_at
      FROM suppliers s
      WHERE s.id = UUID_TO_BIN(?) AND (s.is_delete = 0 OR s.is_delete IS NULL)
    `, [id])

    if (!rows || rows.length === 0) {
      throw new NotFoundError(`Proveedor con id ${id} no encontrado`)
    }

    return rows[0]
  }

  async create (data) {
    const { name, contact_name, email, phone, address, rfc, payment_terms, is_active, custom_fields } = data

    if (!name || !name.trim()) {
      throw new BadRequestError('El nombre del proveedor es requerido')
    }

    const result = await this.db.query(`
      INSERT INTO suppliers (id, name, contact_name, email, phone, address, rfc, payment_terms, is_active, custom_fields)
      VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      contact_name || null,
      email || null,
      phone || null,
      address || null,
      rfc || null,
      payment_terms || '30 días',
      is_active !== undefined ? is_active : 1,
      custom_fields || null
    ])

    console.log('Supplier created, searching by name:', name.trim())
    const newSupplier = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM suppliers WHERE name = ?', [name.trim()])
    console.log('Found supplier:', newSupplier)
    return newSupplier[0]?.id
  }

  async update (id, data) {
    await this.getById(id)

    const { name, contact_name, email, phone, address, rfc, payment_terms, is_active, custom_fields } = data

    const fields = []
    const values = []

    const allowedFields = ['name', 'contact_name', 'email', 'phone', 'address', 'rfc', 'payment_terms', 'is_active', 'custom_fields']

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'name' && data[field] && !data[field].trim()) {
          throw new BadRequestError('El nombre del proveedor no puede estar vacío')
        }
        fields.push(`${field} = ?`)
        values.push(field === 'name' ? data[field].trim() : data[field])
      }
    }

    if (fields.length === 0) {
      throw new BadRequestError('No hay campos para actualizar')
    }

    values.push(id)
    const result = await this.db.query(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`, values)
    
    if (result.affectedRows === 0) {
      throw new NotFoundError(`Proveedor con id ${id} no encontrado`)
    }
    return result.affectedRows
  }

  async delete (id) {
    await this.getById(id)
    const result = await this.db.query('UPDATE suppliers SET is_delete = 1 WHERE id = UUID_TO_BIN(?)', [id])
    if (result.affectedRows === 0) {
      throw new NotFoundError(`Proveedor con id ${id} no encontrado`)
    }
    return result.affectedRows
  }

  async getActive () {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(s.id) as id,
        s.name,
        s.contact_name,
        s.email,
        s.phone
      FROM suppliers s
      WHERE s.is_active = 1 AND (s.is_delete = 0 OR s.is_delete IS NULL)
      ORDER BY s.name ASC
    `)
    return rows || []
  }

  async getHistory (id) {
    const purchaseOrders = await this.db.query(`
      SELECT 
        BIN_TO_UUID(po.id) as id,
        po.po_number,
        po.status,
        po.total_amount,
        po.received_amount,
        po.created_at,
        l.name as location_name
      FROM purchase_orders po
      LEFT JOIN locations l ON po.location_id = l.id
      WHERE po.supplier_id = UUID_TO_BIN(?) AND (po.is_delete = 0 OR po.is_delete IS NULL)
      ORDER BY po.created_at DESC
      LIMIT 20
    `, [id])

    const receivings = await this.db.query(`
      SELECT 
        BIN_TO_UUID(r.id) as id,
        r.receiving_number,
        r.status,
        r.total_amount,
        r.received_at,
        l.name as location_name,
        po.po_number
      FROM receivings r
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN purchase_orders po ON r.purchase_order_id = po.id
      WHERE r.supplier_id = UUID_TO_BIN(?) AND r.status = 'completed' AND (r.is_delete = 0 OR r.is_delete IS NULL)
      ORDER BY r.received_at DESC
      LIMIT 20
    `, [id])

    const totals = await this.db.query(`
      SELECT 
        COALESCE(SUM(r.total_amount), 0) as total_purchases,
        COUNT(DISTINCT r.id) as total_receivings,
        COUNT(DISTINCT po.id) as total_orders
      FROM receivings r
      LEFT JOIN purchase_orders po ON r.purchase_order_id = po.id
      WHERE r.supplier_id = UUID_TO_BIN(?) AND r.status = 'completed'
    `, [id])

    return {
      purchase_orders: purchaseOrders || [],
      receivings: receivings || [],
      summary: {
        total_purchases: parseFloat(totals[0]?.total_purchases || 0),
        total_receivings: parseInt(totals[0]?.total_receivings || 0),
        total_orders: parseInt(totals[0]?.total_orders || 0)
      }
    }
  }
}
