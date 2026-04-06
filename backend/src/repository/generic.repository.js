import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'

function convertBinToUuid (row) {
  if (!row) return row
  const converted = { ...row }
  for (const key of Object.keys(converted)) {
    if (converted[key] instanceof Buffer) {
      converted[key] = converted[key].toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
    }
  }
  return converted
}

function convertRowsToUuid (rows) {
  if (!rows) return rows
  return rows.map(row => convertBinToUuid(row))
}

export class GenericRepository {
  constructor (db, tableName) {
    this.db = db
    this.tableName = tableName
  }

  async getAll (filters = {}) {
    const { search = '', is_active = '', company_id, limit = 100, offset = 0 } = filters
    
    let whereClause = 'WHERE (is_delete = 0 OR is_delete IS NULL)'
    const params = []
    
    const tablesWithCompanyId = ['locations', 'categories', 'item_variations', 'suppliers']
    if (company_id && tablesWithCompanyId.includes(this.tableName)) {
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
      const searchColumns = ['name']
      if (this.tableName === 'categories') {
        searchColumns.push('description')
      } else if (this.tableName === 'locations') {
        searchColumns.push('code', 'address')
      } else if (this.tableName === 'suppliers') {
        searchColumns.push('contact_name', 'email')
      }
      const searchConditions = searchColumns.map(col => `${col} LIKE ?`).join(' OR ')
      whereClause += ` AND (${searchConditions})`
      const searchTerm = `%${search}%`
      for (let i = 0; i < searchColumns.length; i++) {
        params.push(searchTerm)
      }
    }
    
    const countParams = [...params]
    const countRows = await this.db.query(`SELECT COUNT(*) as total FROM \`${this.tableName}\` ${whereClause}`, countParams)
    const total = countRows[0]?.total || 0
    
    const queryParams = [...params, parseInt(limit), parseInt(offset)]
    const rows = await this.db.query(
      `SELECT * FROM \`${this.tableName}\` ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      queryParams
    )
    
    return { data: convertRowsToUuid(rows), total }
  }

  async getById (id, companyId = null) {
    const tablesWithCompanyId = ['locations', 'categories', 'item_variations', 'suppliers']
    let whereClause = `WHERE id = UUID_TO_BIN(?) AND (is_delete = 0 OR is_delete IS NULL)`
    const params = [id]
    
    if (companyId && tablesWithCompanyId.includes(this.tableName)) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(`SELECT * FROM \`${this.tableName}\` ${whereClause}`, params)
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Registro no encontrado')
    }
    return convertBinToUuid(rows[0])
  }

  async create (data, userId = null) {
    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestError('No hay datos para crear')
    }

    let fields = Object.keys(data)
    let values = Object.values(data).map(v => {
      if (v && typeof v === 'object' && v.type === 'Buffer') {
        return v
      }
      return (typeof v === 'string') ? v.trim() : v
    })

    const uuidFields = ['company_id', 'location_id', 'category_id', 'item_id', 'parent_id', 'supplier_id', 'user_id', 'created_by', 'updated_by']
    const fieldPlaceholders = fields.map((f, i) => {
      if (uuidFields.includes(f) && values[i]) {
        return 'UUID_TO_BIN(?)'
      }
      return '?'
    }).join(', ')

    let sql = ''
    if (userId) {
      sql = `INSERT INTO \`${this.tableName}\` (id, ${fields.join(', ')}, created_by) VALUES (UUID_TO_BIN(UUID()), ${fieldPlaceholders}, UUID_TO_BIN('${userId}'))`
    } else {
      sql = `INSERT INTO \`${this.tableName}\` (id, ${fields.join(', ')}) VALUES (UUID_TO_BIN(UUID()), ${fieldPlaceholders})`
    }

    await this.db.query(sql, values)

    const idField = fields.includes('id') ? 'id' : 'BIN_TO_UUID(id) as id'
    const newRow = await this.db.query(`SELECT ${idField} FROM \`${this.tableName}\` ORDER BY created_at DESC LIMIT 1`)
    return convertBinToUuid(newRow[0])
  }

  async update (id, data, userId = null, companyId = null) {
    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestError('No hay datos para actualizar')
    }

    const exists = await this.getById(id, companyId)

    let fields = Object.keys(data)
    let values = Object.values(data).map(v => (typeof v === 'string') ? v.trim() : v)

    const tablesWithCompanyId = ['locations', 'categories', 'item_variations', 'suppliers']
    let whereClause = 'WHERE id = UUID_TO_BIN(?)'
    const whereParams = [id]
    
    if (companyId && tablesWithCompanyId.includes(this.tableName)) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      whereParams.push(companyId)
    }

    const uuidFields = ['company_id', 'location_id', 'category_id', 'item_id', 'parent_id', 'supplier_id', 'user_id', 'created_by', 'updated_by']
    const setClauses = fields.map((f, i) => {
      if (uuidFields.includes(f) && values[i]) {
        return `${f} = UUID_TO_BIN(?)`
      }
      return `${f} = ?`
    }).join(', ')

    let sql = ''
    if (userId) {
      sql = `UPDATE \`${this.tableName}\` SET ${setClauses}, updated_by = UUID_TO_BIN('${userId}') ${whereClause}`
    } else {
      sql = `UPDATE \`${this.tableName}\` SET ${setClauses} ${whereClause}`
    }

    await this.db.query(sql, [...values, ...whereParams])

    return await this.getById(id, companyId)
  }

  async delete (id, userId = null, companyId = null) {
    const exists = await this.getById(id, companyId)
    
    const tablesWithCompanyId = ['locations', 'categories', 'item_variations', 'suppliers']
    let whereClause = 'WHERE id = UUID_TO_BIN(?)'
    const whereParams = [id]
    
    if (companyId && tablesWithCompanyId.includes(this.tableName)) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      whereParams.push(companyId)
    }
    
    let sql = ''
    
    if (userId) {
      sql = `UPDATE \`${this.tableName}\` SET is_delete = 1, updated_by = UUID_TO_BIN('${userId}') ${whereClause}`
    } else {
      sql = `UPDATE \`${this.tableName}\` SET is_delete = 1 ${whereClause}`
    }
    
    await this.db.query(sql, whereParams)
    return { success: true }
  }

  async restore (id, userId = null) {
    const rows = await this.db.query(`SELECT * FROM \`${this.tableName}\` WHERE id = UUID_TO_BIN(?)`, [id])
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Registro no encontrado')
    }

    const updates = ['is_delete = 0']
    const values = []

    if (userId) {
      updates.push('updated_by = ?')
      values.push(userId)
    }

    values.push(id)
    await this.db.query(
      `UPDATE \`${this.tableName}\` SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      values
    )
    return { success: true }
  }
}
