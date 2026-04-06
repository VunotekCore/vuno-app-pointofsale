import pool from '../config/database.js'

export class UserLocationsRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getByUserId(userId) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(ul.id) as id,
        BIN_TO_UUID(ul.user_id) as user_id,
        BIN_TO_UUID(ul.location_id) as location_id,
        ul.is_default,
        ul.created_at,
        l.name as location_name, l.code as location_code, l.is_active
       FROM user_locations ul 
       JOIN locations l ON ul.location_id = l.id 
       WHERE ul.user_id = UUID_TO_BIN(?)`,
      [userId]
    )
    return rows
  }

  async getUsersByLocationId(locationId) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(ul.id) as id,
        BIN_TO_UUID(ul.user_id) as user_id,
        BIN_TO_UUID(ul.location_id) as location_id,
        ul.is_default,
        ul.created_at,
        u.username, u.email 
       FROM user_locations ul 
       JOIN users u ON ul.user_id = u.id 
       WHERE ul.location_id = UUID_TO_BIN(?)`,
      [locationId]
    )
    return rows
  }

  async add(userId, locationId, isDefault = false, companyId = null) {
    if (isDefault) {
      await this.db.query(
        'UPDATE user_locations SET is_default = 0 WHERE user_id = UUID_TO_BIN(?)',
        [userId]
      )
    }
    
    const companyIdField = companyId ? ', company_id' : ''
    const companyIdValue = companyId ? ', UUID_TO_BIN(?)' : ''
    const params = companyId ? [userId, locationId, isDefault ? 1 : 0, isDefault ? 1 : 0, companyId] : [userId, locationId, isDefault ? 1 : 0, isDefault ? 1 : 0]
    
    await this.db.query(
      `INSERT INTO user_locations (id, user_id, location_id, is_default${companyIdField}) 
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), ?${companyIdValue})
       ON DUPLICATE KEY UPDATE is_default = ?`,
      params
    )
  }

  async remove(userId, locationId) {
    await this.db.query(
      'DELETE FROM user_locations WHERE user_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
      [userId, locationId]
    )
  }

  async setDefault(userId, locationId) {
    await this.db.query(
      'UPDATE user_locations SET is_default = 0 WHERE user_id = UUID_TO_BIN(?)',
      [userId]
    )
    await this.db.query(
      'UPDATE user_locations SET is_default = 1 WHERE user_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
      [userId, locationId]
    )
  }
}
