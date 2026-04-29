import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'

export class LocationsRepository {
  constructor (db = pool) {
    this.db = db
  }

  async getAll (filters = {}) {
    const { search = '', is_active = '', company_id, limit = 100, offset = 0 } = filters

    let whereClause = 'WHERE (is_delete = 0 OR is_delete IS NULL)'
    const params = []

    if (company_id) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      params.push(company_id)
    }

    if (is_active !== '' && is_active !== undefined) {
      whereClause += ' AND is_active = ?'
      if (is_active === 'true' || is_active === '1') {
        params.push(1)
      } else {
        params.push(0)
      }
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR code LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }

    const countParams = [...params]
    const countRows = await this.db.query(
      `SELECT COUNT(*) as total FROM locations ${whereClause}`,
      countParams
    )
    const total = countRows[0]?.total || 0

    const queryParams = [...params, parseInt(limit), parseInt(offset)]
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(id) as id,
        name, code, address, phone, email,
        BIN_TO_UUID(manager_user_id) as manager_user_id,
        is_warehouse, is_active, timezone, default_tax_rate,
        is_default, company_id,
        created_at, updated_at, is_delete
       FROM locations
       ${whereClause}
       ORDER BY name ASC
       LIMIT ? OFFSET ?`,
      queryParams
    )

    return { items: rows, total }
  }

  async getById (id, companyId) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(id) as id,
        name, code, address, phone, email,
        BIN_TO_UUID(manager_user_id) as manager_user_id,
        is_warehouse, is_active, timezone, default_tax_rate,
        is_default, company_id,
        created_at, updated_at, is_delete
       FROM locations
       WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?) 
       AND (is_delete = 0 OR is_delete IS NULL)`,
      [id, companyId]
    )

    if (!rows || rows.length === 0) {
      throw new NotFoundError(`Ubicación con id ${id} no encontrada`)
    }

    return rows[0]
  }

  async create (data, userId = null, companyId = null) {
    const {
      name, code, address, phone, email, manager_user_id,
      is_warehouse, is_active, timezone, default_tax_rate, is_default
    } = data

    if (!name || !name.trim()) {
      throw new BadRequestError('El nombre de la ubicación es requerido')
    }
    if (!code || !code.trim()) {
      throw new BadRequestError('El código de la ubicación es requerido')
    }

    if (is_default) {
      await this.clearDefaultForCompany(companyId)
    }

    const result = await this.db.query(
      `INSERT INTO locations 
        (id, name, code, address, phone, email, manager_user_id,
         is_warehouse, is_active, timezone, default_tax_rate, is_default, company_id, created_by)
       VALUES (
         UUID_TO_BIN(UUID()), ?, ?, ?, ?, ?, UUID_TO_BIN(?),
         ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?)
       )`,
      [
        name.trim(), code.trim(), address || null, phone || null, email || null,
        manager_user_id || null,
        is_warehouse || 0, is_active !== undefined ? is_active : 1,
        timezone || 'America/Santiago', default_tax_rate || 0,
        is_default ? 1 : 0, companyId, userId
      ]
    )

    const newLocation = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id FROM locations WHERE name = ? AND company_id = UUID_TO_BIN(?)',
      [name.trim(), companyId]
    )

    return newLocation[0]?.id
  }

  async update (id, data, userId = null, companyId = null) {
    const existing = await this.getById(id, companyId)

    const {
      name, code, address, phone, email, manager_user_id,
      is_warehouse, is_active, timezone, default_tax_rate, is_default
    } = data

    if (is_default && !existing.is_default) {
      await this.clearDefaultForCompany(companyId)
    }

    const fields = []
    const values = []

    const fieldMap = {
      name: name?.trim(),
      code: code?.trim(),
      address,
      phone,
      email,
      manager_user_id: manager_user_id ? `UUID_TO_BIN(${manager_user_id})` : null,
      is_warehouse,
      is_active,
      timezone,
      default_tax_rate,
      is_default
    }

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        if (key === 'manager_user_id' && value) {
          fields.push(`${key} = UUID_TO_BIN(?)`)
          values.push(value)
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
    }

    if (userId) {
      fields.push('updated_by = UUID_TO_BIN(?)')
      values.push(userId)
    }

    if (fields.length === 0) {
      throw new BadRequestError('No hay campos para actualizar')
    }

    values.push(id, companyId)
    await this.db.query(
      `UPDATE locations SET ${fields.join(', ')} 
       WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      values
    )

    return 1
  }

  async delete (id, userId = null, companyId = null) {
    await this.getById(id, companyId)

    const updates = ['is_delete = 1']
    const values = []

    if (userId) {
      updates.push('updated_by = UUID_TO_BIN(?)')
      values.push(userId)
    }

    values.push(id, companyId)
    const result = await this.db.query(
      `UPDATE locations SET ${updates.join(', ')} 
       WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      values
    )

    return result.affectedRows
  }

  async restore (id, companyId) {
    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id FROM locations WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)',
      [id, companyId]
    )

    if (!rows || rows.length === 0) {
      throw new NotFoundError(`Ubicación con id ${id} no encontrada`)
    }

    const result = await this.db.query(
      'UPDATE locations SET is_delete = 0 WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)',
      [id, companyId]
    )

    return result.affectedRows
  }

  async clearDefaultForCompany (companyId) {
    await this.db.query(
      'UPDATE locations SET is_default = 0 WHERE company_id = UUID_TO_BIN(?) AND is_default = 1',
      [companyId]
    )
  }
}
