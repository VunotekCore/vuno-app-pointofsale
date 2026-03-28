import database from '../config/database.js'
import { BadRequestError } from '../errors/index.js'

export class TenantAwareRepository {
  constructor(db = database, tableName) {
    this.db = db
    this.tableName = tableName
    this.hasCompanyId = true
  }

  buildCompanyFilter(companyId, alias = 't') {
    if (!companyId) return ''
    return `${alias}.company_id = UUID_TO_BIN('${companyId}')`
  }

  async getAll(filters = {}, companyId = null) {
    let sql = `SELECT * FROM \`${this.tableName}\` WHERE (is_delete = 0 OR is_delete IS NULL)`
    const params = []

    if (companyId && this.hasCompanyId) {
      sql += ` AND ${this.buildCompanyFilter(companyId)}`
    }

    if (filters && Object.keys(filters).length > 0) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          sql += ` AND ${key} = ?`
          params.push(value)
        }
      }
    }

    sql += ' ORDER BY created_at DESC'

    const rows = await this.db.query(sql, params)
    return this.convertBinToUuid(rows)
  }

  async getById(id, companyId = null) {
    let sql = `SELECT * FROM \`${this.tableName}\` WHERE id = UUID_TO_BIN(?) AND (is_delete = 0 OR is_delete IS NULL)`
    const params = [id]

    if (companyId && this.hasCompanyId) {
      sql += ` AND ${this.buildCompanyFilter(companyId)}`
    }

    const rows = await this.db.query(sql, params)
    if (!rows || rows.length === 0) {
      return null
    }
    return this.convertBinToUuid(rows[0])
  }

  async create(data, userId = null, companyId = null) {
    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestError('No hay datos para crear')
    }

    const fields = []
    const placeholders = []
    const params = []

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(key)
        placeholders.push('?')
        params.push(value)
      }
    }

    if (companyId && this.hasCompanyId && !data.company_id) {
      fields.push('company_id')
      placeholders.push('UUID_TO_BIN(?)')
      params.push(companyId)
    }

    let sql = `INSERT INTO \`${this.tableName}\` (id, ${fields.join(', ')}) VALUES (UUID_TO_BIN(UUID()), ${placeholders.join(', ')})`

    if (userId) {
      sql = `INSERT INTO \`${this.tableName}\` (id, ${fields.join(', ')}, created_by) VALUES (UUID_TO_BIN(UUID()), ${placeholders.join(', ')}, UUID_TO_BIN(?))`
      params.push(userId)
    }

    await this.db.query(sql, params)
    return { success: true }
  }

  async update(id, data, userId = null, companyId = null) {
    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestError('No hay datos para actualizar')
    }

    const existing = await this.getById(id, companyId)
    if (!existing) {
      throw new BadRequestError('Registro no encontrado')
    }

    const updates = []
    const params = []

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'company_id') {
        updates.push(`${key} = ?`)
        params.push(value)
      }
    }

    if (updates.length === 0) return existing

    params.push(id)

    let sql = `UPDATE \`${this.tableName}\` SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?)`
    
    if (userId) {
      sql = `UPDATE \`${this.tableName}\` SET ${updates.join(', ')}, updated_by = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)`
      params.unshift(userId)
    }

    await this.db.query(sql, params)
    return await this.getById(id, companyId)
  }

  async delete(id, userId = null, companyId = null) {
    const existing = await this.getById(id, companyId)
    if (!existing) {
      throw new BadRequestError('Registro no encontrado')
    }

    let sql = `UPDATE \`${this.tableName}\` SET is_delete = 1 WHERE id = UUID_TO_BIN(?)`
    const params = [id]

    if (userId) {
      sql = `UPDATE \`${this.tableName}\` SET is_delete = 1, updated_by = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)`
      params.unshift(userId)
    }

    await this.db.query(sql, params)
    return { success: true }
  }

  convertBinToUuid(row) {
    if (!row) return row
    if (Array.isArray(row)) {
      return row.map(r => this._convertRow(r))
    }
    return this._convertRow(row)
  }

  _convertRow(r) {
    if (!r) return r
    const converted = { ...r }
    for (const key of Object.keys(converted)) {
      if (converted[key] instanceof Buffer) {
        converted[key] = converted[key].toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
      }
    }
    return converted
  }
}
