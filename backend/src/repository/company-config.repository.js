import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { uuidToBin } from '../utils/uuid.utils.js'

export class CompanyConfigRepository {
  constructor(db) {
    this.db = db
  }

  async get() {
    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id, company_name, address, phone, email, nit, logo_url, invoice_prefix, invoice_sequence, currency_code, currency_symbol, decimal_places, is_delete, created_at, updated_at FROM `company_config` WHERE is_delete = FALSE OR is_delete IS NULL LIMIT 1'
    )
    return rows[0] || null
  }

  async create(data, userId = null) {
    const allowedFields = ['company_name', 'address', 'phone', 'email', 'nit', 'logo_url', 'invoice_prefix', 'invoice_sequence', 'currency_code', 'currency_symbol', 'decimal_places']
    
    const fields = ['id']
    const values = ['UUID_TO_BIN(UUID())']
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(field)
        let value = data[field]
        if (field === 'currency_code' && !value) value = 'CLP'
        if (field === 'currency_symbol' && !value) value = '$'
        if (field === 'decimal_places' && (value === undefined || value === null)) value = 0
        if (field === 'invoice_sequence' && !value) value = 1
        if (field === 'invoice_prefix' && !value) value = 'F'
        values.push(value)
      }
    }

    if (userId) {
      fields.push('created_by')
      values.push(userId)
    }

    const placeholders = fields.map((v) => v === 'id' ? v : '?').join(', ')
    const actualValues = values.filter(v => v !== 'UUID_TO_BIN(UUID())')
    const actualFields = fields.filter(f => f !== 'id')
    
    await this.db.query(
      `INSERT INTO company_config (id, ${actualFields.join(', ')}) VALUES (UUID_TO_BIN(UUID()), ${actualFields.map(() => '?').join(', ')})`,
      actualValues
    )
    
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM company_config ORDER BY created_at DESC LIMIT 1')
    return { id: rows[0]?.id }
  }

  async update(id, data, userId = null) {
    const allowedFields = ['company_name', 'address', 'phone', 'email', 'nit', 'logo_url', 'invoice_prefix', 'invoice_sequence', 'currency_code', 'currency_symbol', 'decimal_places']
    
    const updates = []
    const values = []
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`)
        let value = data[field]
        if (field === 'currency_code' && !value) value = 'CLP'
        if (field === 'currency_symbol' && !value) value = '$'
        if (field === 'decimal_places' && (value === undefined || value === null)) value = 0
        if (field === 'invoice_sequence' && !value) value = 1
        if (field === 'invoice_prefix' && !value) value = 'F'
        values.push(value)
      }
    }

    let sql = ''
    if (userId) {
      sql = `UPDATE company_config SET ${updates.join(', ')}, updated_by = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)`
      values.push(userId, id)
    } else {
      sql = `UPDATE company_config SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?)`
      values.push(id)
    }
    
    await this.db.query(sql, values)
    return { success: true }
  }
}
