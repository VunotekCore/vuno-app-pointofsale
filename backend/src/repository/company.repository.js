import database from '../config/database.js'
import { v4 as uuidv4 } from 'uuid'

export class CompanyRepository {
  constructor(db = database) {
    this.db = db
  }

  async create(data) {
    const id = uuidv4()
    const slug = this.generateSlug(data.name)

    const result = await this.db.query(
      `INSERT INTO companies (id, name, slug, logo_url, address, phone, business_email, nit, invoice_prefix, invoice_sequence, currency_code, currency_symbol, decimal_places, settings, is_active)
       VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        data.name,
        slug,
        data.logo_url || null,
        data.address || null,
        data.phone || null,
        data.business_email || data.email || null,
        data.nit || null,
        data.invoice_prefix || 'F',
        data.invoice_sequence || 1,
        data.currency_code || 'NIO',
        data.currency_symbol || 'C$',
        data.decimal_places || 2,
        JSON.stringify(data.settings || {})
      ]
    )

    return { id, slug, ...data }
  }

  async findById(id) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, name, slug, logo_url, address, phone, business_email, nit, invoice_prefix, invoice_sequence, currency_code, currency_symbol, decimal_places, settings, is_active, is_default, imagekit_private_key, imagekit_url_endpoint, created_at, updated_at
       FROM companies WHERE id = UUID_TO_BIN(?)`,
      [id]
    )
    return rows[0] || null
  }

  async findBySlug(slug) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, name, slug, logo_url, address, phone, business_email, nit, invoice_prefix, invoice_sequence, currency_code, currency_symbol, decimal_places, settings, is_active, is_default, imagekit_private_key, imagekit_url_endpoint, created_at, updated_at
       FROM companies WHERE slug = ?`,
      [slug]
    )
    return rows[0] || null
  }

  async findAll(filters = {}) {
    let sql = `SELECT BIN_TO_UUID(id) as id, name, slug, logo_url, address, phone, business_email, nit, invoice_prefix, invoice_sequence, currency_code, currency_symbol, decimal_places, settings, is_active, is_default, imagekit_private_key, imagekit_url_endpoint, created_at, updated_at FROM companies WHERE 1=1`
    const params = []

    if (filters.is_active !== undefined) {
      sql += ' AND is_active = ?'
      params.push(filters.is_active)
    }

    sql += ' ORDER BY name ASC'

    if (filters.limit) {
      sql += ' LIMIT ?'
      params.push(filters.limit)
    }

    if (filters.offset) {
      sql += ' OFFSET ?'
      params.push(filters.offset)
    }

    const rows = await this.db.query(sql, params)
    return rows
  }

  async update(id, data) {
    const updates = []
    const params = []

    if (data.name) {
      updates.push('name = ?')
      params.push(data.name)
      updates.push('slug = ?')
      params.push(this.generateSlug(data.name))
    }
    if (data.logo_url !== undefined) {
      updates.push('logo_url = ?')
      params.push(data.logo_url)
    }
    if (data.address !== undefined) {
      updates.push('address = ?')
      params.push(data.address)
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?')
      params.push(data.phone)
    }
    if (data.business_email !== undefined) {
      updates.push('business_email = ?')
      params.push(data.business_email)
    }
    if (data.email !== undefined) {
      updates.push('business_email = ?')
      params.push(data.email)
    }
    if (data.nit !== undefined) {
      updates.push('nit = ?')
      params.push(data.nit)
    }
    if (data.invoice_prefix !== undefined) {
      updates.push('invoice_prefix = ?')
      params.push(data.invoice_prefix)
    }
    if (data.invoice_sequence !== undefined) {
      updates.push('invoice_sequence = ?')
      params.push(data.invoice_sequence)
    }
    if (data.currency_code !== undefined) {
      updates.push('currency_code = ?')
      params.push(data.currency_code)
    }
    if (data.currency_symbol !== undefined) {
      updates.push('currency_symbol = ?')
      params.push(data.currency_symbol)
    }
    if (data.decimal_places !== undefined) {
      updates.push('decimal_places = ?')
      params.push(data.decimal_places)
    }
    if (data.settings) {
      updates.push('settings = ?')
      params.push(JSON.stringify(data.settings))
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?')
      params.push(data.is_active)
    }
    if (data.imagekit_private_key !== undefined) {
      updates.push('imagekit_private_key = ?')
      params.push(data.imagekit_private_key)
    }
    if (data.imagekit_url_endpoint !== undefined) {
      updates.push('imagekit_url_endpoint = ?')
      params.push(data.imagekit_url_endpoint)
    }

    if (updates.length === 0) return null

    params.push(id)

    await this.db.query(
      `UPDATE companies SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      params
    )

    return this.findById(id)
  }

  async delete(id) {
    await this.db.query(
      'UPDATE companies SET is_active = 0 WHERE id = UUID_TO_BIN(?)',
      [id]
    )
    return true
  }

  async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as total FROM companies WHERE 1=1'
    const params = []

    if (filters.is_active !== undefined) {
      sql += ' AND is_active = ?'
      params.push(filters.is_active)
    }

    const rows = await this.db.query(sql, params)
    return rows[0].total
  }

  async getStats(id) {
    const stats = {}

    const users = await this.db.query(
      `SELECT COUNT(*) as total FROM users WHERE company_id = UUID_TO_BIN(?) AND is_delete = 0`,
      [id]
    )
    stats.users = users[0].total

    const locations = await this.db.query(
      `SELECT COUNT(*) as total FROM locations WHERE company_id = UUID_TO_BIN(?) AND is_delete = 0`,
      [id]
    )
    stats.locations = locations[0].total

    const sales = await this.db.query(
      `SELECT COUNT(*) as total FROM sales WHERE company_id = UUID_TO_BIN(?)`,
      [id]
    )
    stats.sales = sales[0].total

    return stats
  }

  async getAdminUser(companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(u.id) as id, u.username, u.email, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.company_id = UUID_TO_BIN(?) AND u.is_delete = 0 AND r.is_admin = 1
       LIMIT 1`,
      [companyId]
    )
    return rows[0] || null
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100)
  }
}
