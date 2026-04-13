export class ExpirationRepository {
  constructor (db) {
    this.db = db
  }

  async getExpiring (companyId, daysAhead = 10, locationId = null) {
    const params = [companyId, daysAhead]
    let locationFilter = ''
    
    if (locationId) {
      locationFilter = ' AND ie.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    }

    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(ie.id) as id,
        BIN_TO_UUID(ie.item_id) as item_id,
        i.name as item_name,
        i.item_number,
        BIN_TO_UUID(ie.location_id) as location_id,
        l.name as location_name,
        l.code as location_code,
        ie.quantity,
        ie.expiration_date,
        ie.lot_number,
        ie.is_expired,
        ie.is_processed,
        DATEDIFF(ie.expiration_date, CURDATE()) as days_remaining
      FROM item_expirations ie
      JOIN items i ON ie.item_id = i.id
      JOIN locations l ON ie.location_id = l.id
      WHERE i.company_id = UUID_TO_BIN(?)
        AND i.tracks_expiration = 1
        AND ie.is_expired = 0
        AND ie.is_processed = 0
        AND ie.expiration_date IS NOT NULL
        AND ie.expiration_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ${locationFilter}
      ORDER BY ie.expiration_date ASC
    `, params)

    return rows.map(row => ({
      ...row,
      days_remaining: parseInt(row.days_remaining) || 0
    }))
  }

  async getExpired (companyId, locationId = null) {
    const params = [companyId]
    let locationFilter = ''

    if (locationId) {
      locationFilter = ' AND ie.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    }

    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(ie.id) as id,
        BIN_TO_UUID(ie.item_id) as item_id,
        i.name as item_name,
        i.item_number,
        BIN_TO_UUID(ie.location_id) as location_id,
        l.name as location_name,
        l.code as location_code,
        ie.quantity,
        ie.expiration_date,
        ie.lot_number,
        ie.is_expired,
        ie.is_processed,
        DATEDIFF(CURDATE(), ie.expiration_date) as days_overdue
      FROM item_expirations ie
      JOIN items i ON ie.item_id = i.id
      JOIN locations l ON ie.location_id = l.id
      WHERE i.company_id = UUID_TO_BIN(?)
        AND i.tracks_expiration = 1
        AND ie.is_expired = 0
        AND ie.expiration_date IS NOT NULL
        AND ie.expiration_date < CURDATE()
        ${locationFilter}
      ORDER BY ie.expiration_date ASC
    `, params)

    return rows.map(row => ({
      ...row,
      days_overdue: parseInt(row.days_overdue) || 0
    }))
  }

  async getByItem (itemId, companyId) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(ie.id) as id,
        BIN_TO_UUID(ie.item_id) as item_id,
        BIN_TO_UUID(ie.location_id) as location_id,
        l.name as location_name,
        l.code as location_code,
        ie.quantity,
        ie.expiration_date,
        ie.lot_number,
        ie.is_expired,
        ie.is_processed,
        DATEDIFF(ie.expiration_date, CURDATE()) as days_remaining,
        ie.created_at
      FROM item_expirations ie
      JOIN locations l ON ie.location_id = l.id
      JOIN items i ON ie.item_id = i.id
      WHERE ie.item_id = UUID_TO_BIN(?)
        AND i.company_id = UUID_TO_BIN(?)
        AND ie.expiration_date IS NOT NULL
      ORDER BY ie.expiration_date ASC
    `, [itemId, companyId])

    return rows.map(row => ({
      ...row,
      days_remaining: parseInt(row.days_remaining) || 0
    }))
  }

  async create (data) {
    const { item_id, location_id, receiving_item_id, quantity, expiration_date, lot_number } = data
    
    const result = await this.db.query(`
      INSERT INTO item_expirations (id, item_id, location_id, receiving_item_id, quantity, expiration_date, lot_number)
      VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?)
    `, [item_id, location_id, receiving_item_id || null, quantity, expiration_date || null, lot_number || null])

    return result.insertId
  }

  async createBatch (records) {
    if (!records || records.length === 0) return

    for (const record of records) {
      await this.create(record)
    }
  }

  async markAsProcessed (id) {
    await this.db.query(`
      UPDATE item_expirations 
      SET is_processed = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = UUID_TO_BIN(?)
    `, [id])
  }

  async markAsExpired (id) {
    await this.db.query(`
      UPDATE item_expirations 
      SET is_expired = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = UUID_TO_BIN(?)
    `, [id])
  }

  async updateExpiredStatus () {
    await this.db.query(`
      UPDATE item_expirations ie
      JOIN items i ON ie.item_id = i.id
      SET ie.is_expired = 1, ie.updated_at = CURRENT_TIMESTAMP
      WHERE ie.expiration_date < CURDATE()
        AND ie.is_expired = 0
        AND i.tracks_expiration = 1
    `)
  }

  async getCountSummary (companyId) {
    const expiring = await this.db.query(`
      SELECT COUNT(*) as count
      FROM item_expirations ie
      JOIN items i ON ie.item_id = i.id
      WHERE i.company_id = UUID_TO_BIN(?)
        AND i.tracks_expiration = 1
        AND ie.is_expired = 0
        AND ie.is_processed = 0
        AND ie.expiration_date IS NOT NULL
        AND ie.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 10 DAY)
    `, [companyId])

    const expired = await this.db.query(`
      SELECT COUNT(*) as count
      FROM item_expirations ie
      JOIN items i ON ie.item_id = i.id
      WHERE i.company_id = UUID_TO_BIN(?)
        AND i.tracks_expiration = 1
        AND ie.is_expired = 0
        AND ie.expiration_date IS NOT NULL
        AND ie.expiration_date < CURDATE()
    `, [companyId])

    return {
      expiring: expiring[0]?.count || 0,
      expired: expired[0]?.count || 0
    }
  }
}
