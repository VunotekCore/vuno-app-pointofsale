import pool from '../config/database.js'
import crypto from 'crypto'
import { NotFoundError } from '../errors/NotFoundError.js'

export class CustomersRepository {
  constructor(db = pool) {
    this.db = db
  }

  async create(data) {
    const {
      customer_number,
      first_name,
      last_name,
      email,
      phone,
      company,
      tax_id,
      address,
      city,
      state,
      country,
      postal_code,
      customer_group_id,
      credit_limit,
      price_tier,
      tax_exempt,
      is_default,
      notes,
      company_id
    } = data

    if (is_default) {
      await this.db.query(`UPDATE customers SET is_default = 0 WHERE company_id = UUID_TO_BIN(?)`, [company_id])
    }

    const customerUUID = crypto.randomUUID()
    await this.db.query(
      `INSERT INTO customers (id, customer_number, first_name, last_name, email, phone, company, tax_id, address, city, state, country, postal_code, customer_group_id, credit_limit, price_tier, tax_exempt, is_default, notes, company_id)
       VALUES (UUID_TO_BIN('${customerUUID}'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?))`,
      [
        customer_number || null,
        first_name,
        last_name || null,
        email || null,
        phone || null,
        company || null,
        tax_id || null,
        address || null,
        city || null,
        state || null,
        country || 'Mexico',
        postal_code || null,
        customer_group_id || null,
        credit_limit || 0,
        price_tier || 1,
        tax_exempt || 0,
        is_default || 0,
        notes || null,
        company_id
      ]
    )

    return customerUUID
  }

  async update(id, data, companyId) {
    if (data.is_default) {
      await this.db.query(`UPDATE customers SET is_default = 0 WHERE company_id = UUID_TO_BIN(?)`, [companyId])
    }

    const fields = []
    const values = []

    const allowedFields = [
      'customer_number', 'first_name', 'last_name', 'email', 'phone',
      'company', 'tax_id', 'address', 'city', 'state', 'country',
      'postal_code', 'customer_group_id', 'credit_limit', 'price_tier',
      'tax_exempt', 'is_default', 'notes', 'is_active'
    ]

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) return false

    values.push(id, companyId)

    await this.db.query(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      values
    )

    return true
  }

  async getById(id, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(c.id) as id, c.customer_number, c.first_name, c.last_name, c.email, c.phone, c.company, c.tax_id, c.address, c.city, c.state, c.country, c.postal_code, BIN_TO_UUID(c.customer_group_id) as customer_group_id, c.credit_limit, c.credit_balance, c.price_tier, c.tax_exempt, c.points_balance, c.is_default, c.is_active, c.is_delete, c.notes, c.created_at, c.updated_at, cg.name as group_name, cg.discount_percent as group_discount
       FROM customers c
       LEFT JOIN customer_groups cg ON c.customer_group_id = cg.id
       WHERE c.id = UUID_TO_BIN(?) AND c.company_id = UUID_TO_BIN(?) AND (c.is_delete = 0 OR c.is_delete IS NULL)`,
      [id, companyId]
    )

    return rows[0] || null
  }

  async getAll(filters = {}) {
    const { search, customer_group_id, is_active, is_default, company_id, limit = 100, offset = 0 } = filters

    let query = `
      SELECT BIN_TO_UUID(c.id) as id, c.customer_number, c.first_name, c.last_name, c.email, c.phone, c.company, c.tax_id, c.address, c.city, c.state, c.country, c.postal_code, BIN_TO_UUID(c.customer_group_id) as customer_group_id, c.credit_limit, c.credit_balance, c.price_tier, c.tax_exempt, c.points_balance, c.is_default, c.is_active, c.is_delete, c.notes, c.created_at, c.updated_at, cg.name as group_name
      FROM customers c
      LEFT JOIN customer_groups cg ON c.customer_group_id = cg.id
      WHERE (c.is_delete = 0 OR c.is_delete IS NULL)
    `
    const params = []

    if (company_id) {
      query += ' AND c.company_id = UUID_TO_BIN(?)'
      params.push(company_id)
    }

    if (search) {
      query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.customer_number LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (customer_group_id) {
      query += ' AND c.customer_group_id = UUID_TO_BIN(?)'
      params.push(customer_group_id)
    }

    if (is_active !== undefined && is_active !== null) {
      query += ' AND c.is_active = ?'
      params.push(is_active)
    }

    if (is_default !== undefined && is_default !== null) {
      query += ' AND c.is_default = ?'
      params.push(is_default)
    }

    query += ' ORDER BY c.first_name, c.last_name LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const rows = await this.db.query(query, params)
    return rows
  }

  async getCount(filters = {}) {
    const { search, customer_group_id, is_active } = filters

    let query = `SELECT COUNT(*) as total FROM customers c WHERE (c.is_delete = 0 OR c.is_delete IS NULL)`
    const params = []

    if (search) {
      query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (customer_group_id) {
      query += ' AND c.customer_group_id = UUID_TO_BIN(?)'
      params.push(customer_group_id)
    }

    if (is_active !== undefined && is_active !== null) {
      query += ' AND c.is_active = ?'
      params.push(is_active)
    }

    const rows = await this.db.query(query, params)
    return rows[0].total
  }

  async getByEmail(email, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, customer_number, first_name, last_name, email, phone, company, address, city, state, country, postal_code, BIN_TO_UUID(customer_group_id) as customer_group_id, credit_limit, credit_balance, price_tier, tax_exempt, points_balance, is_active, is_delete, created_at, updated_at FROM customers WHERE email = ? AND company_id = UUID_TO_BIN(?) AND (is_delete = 0 OR is_delete IS NULL)`,
      [email, companyId]
    )
    return rows[0] || null
  }

  async getByPhone(phone, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, customer_number, first_name, last_name, email, phone, company, address, city, state, country, postal_code, BIN_TO_UUID(customer_group_id) as customer_group_id, credit_limit, credit_balance, price_tier, tax_exempt, points_balance, is_active, is_delete, created_at, updated_at FROM customers WHERE phone = ? AND company_id = UUID_TO_BIN(?) AND (is_delete = 0 OR is_delete IS NULL)`,
      [phone, companyId]
    )
    return rows[0] || null
  }

  async addPoints(customerId, points, referenceType, referenceId, description, companyId) {
    const customer = await this.getById(customerId, companyId)
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    const pointsAfter = customer.points_balance + points
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 12)

    await this.db.query(
      `UPDATE customers SET points_balance = ? WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      [pointsAfter, customerId, companyId]
    )

    await this.db.query(
      `INSERT INTO customer_points_log (customer_id, points, points_after, reference_type, reference_id, description, expires_at)
       VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)`,
      [customerId, points, pointsAfter, referenceType, referenceId, description, expiresAt]
    )

    return pointsAfter
  }

  async redeemPoints(customerId, points, referenceType, referenceId, description, companyId) {
    const customer = await this.getById(customerId, companyId)
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    if (customer.points_balance < points) {
      throw new Error('Puntos insuficientes')
    }

    const pointsAfter = customer.points_balance - points

    await this.db.query(
      `UPDATE customers SET points_balance = ? WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      [pointsAfter, customerId, companyId]
    )

    await this.db.query(
      `INSERT INTO customer_points_log (customer_id, points, points_after, reference_type, reference_id, description)
       VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?)`,
      [customerId, -points, pointsAfter, referenceType, referenceId, description]
    )

    return pointsAfter
  }

  async getPointsLog(customerId) {
    return await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, customer_id, points, points_after, reference_type, reference_id, description, expires_at, created_at FROM customer_points_log WHERE customer_id = UUID_TO_BIN(?) ORDER BY created_at DESC`,
      [customerId]
    )
  }

  async getSalesHistory(customerId, limit = 20, companyId) {
    return await this.db.query(
      `SELECT BIN_TO_UUID(s.id) as id, s.sale_number, s.subtotal, s.tax_amount, s.discount_amount, s.total, s.payment_method, s.status, s.sale_date, s.created_at, BIN_TO_UUID(s.location_id) as location_id, l.name as location_name
       FROM sales s
       JOIN locations l ON s.location_id = l.id
       WHERE s.customer_id = UUID_TO_BIN(?) AND s.status = 'completed' AND s.company_id = UUID_TO_BIN(?)
       ORDER BY s.sale_date DESC
       LIMIT ?`,
      [customerId, companyId, limit]
    )
  }

  async updateCreditBalance(customerId, amount, companyId) {
    await this.db.query(
      `UPDATE customers SET credit_balance = credit_balance + ? WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      [amount, customerId, companyId]
    )
    return this.getById(customerId, companyId)
  }

  async delete(id, companyId) {
    await this.db.query(
      `UPDATE customers SET is_delete = 1 WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      [id, companyId]
    )
    return { success: true }
  }
}

export class CustomerGroupsRepository {
  constructor(db = pool) {
    this.db = db
  }

  async create(data) {
    const { name, description, discount_percent, price_tier, points_multiplier, is_default, company_id } = data

    if (is_default) {
      await this.db.query(`UPDATE customer_groups SET is_default = 0 WHERE company_id = UUID_TO_BIN(?)`, [company_id])
    }

    const result = await this.db.query(
      `INSERT INTO customer_groups (name, description, discount_percent, price_tier, points_multiplier, is_default, company_id)
       VALUES (?, ?, ?, ?, ?, ?, UUID_TO_BIN(?))`,
      [name, description || null, discount_percent || 0, price_tier || 1, points_multiplier || 1.00, is_default || 0, company_id]
    )

    return result.insertId
  }

  async update(id, data, companyId) {
    if (data.is_default) {
      await this.db.query(`UPDATE customer_groups SET is_default = 0 WHERE company_id = UUID_TO_BIN(?)`, [companyId])
    }

    const fields = []
    const values = []

    const allowedFields = ['name', 'description', 'discount_percent', 'price_tier', 'points_multiplier', 'is_default', 'is_active']

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) return false

    values.push(id, companyId)

    await this.db.query(
      `UPDATE customer_groups SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      values
    )

    return true
  }

  async getById(id, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, name, description, discount_percent, price_tier, points_multiplier, is_default, is_active, created_at, updated_at FROM customer_groups WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      [id, companyId]
    )
    return rows[0] || null
  }

  async getAll(company_id) {
    return await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, name, description, discount_percent, price_tier, points_multiplier, is_default, is_active, created_at, updated_at FROM customer_groups WHERE company_id = UUID_TO_BIN(?) ORDER BY is_default DESC, name`,
      [company_id]
    )
  }

  async delete(id, companyId) {
    await this.db.query(`UPDATE customers SET customer_group_id = NULL WHERE customer_group_id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`, [id, companyId])
    await this.db.query(`DELETE FROM customer_groups WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?) AND is_default = 0`, [id, companyId])
    return true
  }

  async getDefault(companyId) {
    const rows = await this.db.query(`SELECT BIN_TO_UUID(id) as id, name, description, discount_percent, price_tier, points_multiplier, is_default, is_active, created_at, updated_at FROM customer_groups WHERE is_default = 1 AND company_id = UUID_TO_BIN(?)`, [companyId])
    return rows[0] || null
  }
}

export class CustomerRewardsRepository {
  constructor(db = pool) {
    this.db = db
  }

  async create(data) {
    const { name, description, points_required, discount_percent, discount_amount, free_item_id, free_item_quantity, valid_from, valid_until, company_id } = data

    const result = await this.db.query(
      `INSERT INTO customer_rewards (name, description, points_required, discount_percent, discount_amount, free_item_id, free_item_quantity, valid_from, valid_until, company_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?))`,
      [name, description || null, points_required, discount_percent || 0, discount_amount || 0, free_item_id || null, free_item_quantity || 1, valid_from || null, valid_until || null, company_id]
    )

    return result.insertId
  }

  async update(id, data) {
    const fields = []
    const values = []

    const allowedFields = ['name', 'description', 'points_required', 'discount_percent', 'discount_amount', 'free_item_id', 'free_item_quantity', 'is_active', 'valid_from', 'valid_until']

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) return false

    values.push(UUID_TO_BIN(id))

    await this.db.query(
      `UPDATE customer_rewards SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    return true
  }

  async getById(id, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(cr.id) as id, cr.name, cr.description, cr.points_required, cr.discount_percent, cr.discount_amount, BIN_TO_UUID(cr.free_item_id) as free_item_id, cr.free_item_quantity, cr.is_active, cr.valid_from, cr.valid_until, cr.created_at, cr.updated_at, i.name as free_item_name FROM customer_rewards cr LEFT JOIN items i ON cr.free_item_id = i.id WHERE cr.id = UUID_TO_BIN(?) AND cr.company_id = UUID_TO_BIN(?)`,
      [id, companyId]
    )
    return rows[0] || null
  }

  async getAll(activeOnly = true, companyId = null) {
    let query = `SELECT BIN_TO_UUID(cr.id) as id, cr.name, cr.description, cr.points_required, cr.discount_percent, cr.discount_amount, BIN_TO_UUID(cr.free_item_id) as free_item_id, cr.free_item_quantity, cr.is_active, cr.valid_from, cr.valid_until, cr.created_at, cr.updated_at, i.name as free_item_name FROM customer_rewards cr LEFT JOIN items i ON cr.free_item_id = i.id`
    const params = []
    let whereAdded = false

    if (activeOnly) {
      query += ` WHERE cr.is_active = 1 AND (cr.valid_from IS NULL OR cr.valid_from <= CURDATE()) AND (cr.valid_until IS NULL OR cr.valid_until >= CURDATE())`
      whereAdded = true
    }

    if (companyId) {
      query += whereAdded ? ' AND' : ' WHERE'
      query += ' cr.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    query += ` ORDER BY cr.points_required`

    return await this.db.query(query, params)
  }

  async delete(id) {
    await this.db.query(`DELETE FROM customer_rewards WHERE id = UUID_TO_BIN(?)`, [id])
    return true
  }

  async redeem(rewardId, customerId, saleId, companyId) {
    const reward = await this.getById(rewardId)
    if (!reward) throw new NotFoundError('Recompensa no encontrada')

    const customerRepo = new CustomersRepository(this.db)
    await customerRepo.redeemPoints(customerId, reward.points_required, 'reward', rewardId, `Canje: ${reward.name}`)

    await this.db.query(
      `INSERT INTO customer_reward_redemptions (customer_id, reward_id, company_id, points_used, discount_provided, sale_id)
       VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, UUID_TO_BIN(?))`,
      [customerId, rewardId, companyId, reward.points_required, reward.discount_amount || 0, saleId || null]
    )

    return reward
  }
}
