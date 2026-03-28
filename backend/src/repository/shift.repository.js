import pool from '../config/database.js'

function UUID_TO_BIN(uuid) {
  return uuid
}

function BIN_TO_UUID(binary) {
  return binary
}

export class ShiftRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getShiftConfigsByLocation(locationId) {
    return await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(location_id) as location_id, name, start_time, end_time, default_initial_amount, is_active, sort_order 
       FROM shift_configs 
       WHERE location_id = UUID_TO_BIN('${locationId}') 
       ORDER BY sort_order, start_time`
    )
  }

  async getAllShiftConfigs() {
    return await this.db.query(
      `SELECT BIN_TO_UUID(sc.id) as id, BIN_TO_UUID(sc.location_id) as location_id, sc.name, sc.start_time, sc.end_time, 
              sc.default_initial_amount, sc.is_active, sc.sort_order,
              l.name as location_name
       FROM shift_configs sc
       JOIN locations l ON sc.location_id = l.id
       ORDER BY l.name, sc.sort_order, sc.start_time`
    )
  }

  async getShiftConfigById(id) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(location_id) as location_id, name, start_time, end_time, default_initial_amount, is_active, sort_order 
       FROM shift_configs WHERE id = UUID_TO_BIN('${id}')`
    )
    return rows[0] || null
  }

  async createShiftConfig(data) {
    const { location_id, name, start_time, end_time, default_initial_amount, is_active, sort_order } = data
    
    const amount = default_initial_amount !== undefined ? default_initial_amount : 0
    const active = is_active !== undefined ? is_active : 1
    const order = sort_order !== undefined ? sort_order : 0
    
    await this.db.query(
      `INSERT INTO shift_configs (id, location_id, name, start_time, end_time, default_initial_amount, is_active, sort_order)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN('${location_id}'), ?, ?, ?, ?, ?, ?)`,
      [name, start_time, end_time, amount, active, order]
    )
    
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(location_id) as location_id, name, start_time, end_time, default_initial_amount, is_active, sort_order 
       FROM shift_configs ORDER BY created_at DESC LIMIT 1`
    )
    return rows[0]
  }

  async updateShiftConfig(id, data) {
    const fields = []
    const values = []
    
    const allowedFields = ['location_id', 'name', 'start_time', 'end_time', 'default_initial_amount', 'is_active', 'sort_order']
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        if (key === 'location_id') {
          fields.push(`${key} = UUID_TO_BIN('${value}')`)
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
    }
    
    if (fields.length === 0) return null
    
    await this.db.query(
      `UPDATE shift_configs SET ${fields.join(', ')} WHERE id = UUID_TO_BIN('${id}')`,
      values
    )
    
    return await this.getShiftConfigById(id)
  }

  async deleteShiftConfig(id) {
    await this.db.query('DELETE FROM shift_configs WHERE id = UUID_TO_BIN(\'' + id + '\')')
  }

  async getActiveShiftForLocation(locationId) {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8)
    const currentDayOfWeek = now.getDay()
    
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(location_id) as location_id, name, start_time, end_time, default_initial_amount
       FROM shift_configs 
       WHERE location_id = UUID_TO_BIN('${locationId}') 
         AND is_active = 1
         AND start_time <= ?
         AND end_time >= ?
       ORDER BY start_time DESC
       LIMIT 1`,
      [currentTime, currentTime]
    )
    
    return rows[0] || null
  }

  async getShiftSessionById(id) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(ss.id) as id, BIN_TO_UUID(ss.shift_config_id) as shift_config_id, BIN_TO_UUID(ss.location_id) as location_id, BIN_TO_UUID(ss.user_id) as user_id, ss.date, ss.day_of_week, ss.scheduled_start, ss.scheduled_end, ss.initial_amount, ss.actual_start, ss.actual_end, ss.closing_amount, ss.difference, ss.status, ss.notes, ss.created_at, ss.updated_at, sc.name as shift_name, sc.start_time as scheduled_start, sc.end_time as scheduled_end
       FROM shift_sessions ss
       JOIN shift_configs sc ON ss.shift_config_id = sc.id
       WHERE ss.id = UUID_TO_BIN('${id}')`
    )
    return rows[0] || null
  }

  async getOpenShiftSession(locationId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(ss.id) as id, BIN_TO_UUID(ss.shift_config_id) as shift_config_id, BIN_TO_UUID(ss.location_id) as location_id, BIN_TO_UUID(ss.user_id) as user_id, ss.date, ss.day_of_week, ss.scheduled_start, ss.scheduled_end, ss.initial_amount, ss.actual_start, ss.actual_end, ss.closing_amount, ss.difference, ss.status, ss.notes, ss.created_at, ss.updated_at, sc.name as shift_name, sc.start_time as scheduled_start, sc.end_time as scheduled_end,
              sc.default_initial_amount
       FROM shift_sessions ss
       JOIN shift_configs sc ON ss.shift_config_id = sc.id
       WHERE ss.location_id = UUID_TO_BIN('${locationId}') AND ss.status IN ('open', 'closing')
       ORDER BY ss.actual_start DESC
       LIMIT 1`
    )
    return rows[0] || null
  }

  async getShiftSessionsByLocation(locationId, startDate = null, endDate = null) {
    let sql = `SELECT BIN_TO_UUID(ss.id) as id, BIN_TO_UUID(ss.shift_config_id) as shift_config_id, BIN_TO_UUID(ss.location_id) as location_id, BIN_TO_UUID(ss.user_id) as user_id, ss.date, ss.day_of_week, ss.scheduled_start, ss.scheduled_end, ss.initial_amount, ss.actual_start, ss.actual_end, ss.closing_amount, ss.difference, ss.status, ss.notes, ss.created_at, ss.updated_at, sc.name as shift_name, u.username as user_name
               FROM shift_sessions ss
               JOIN shift_configs sc ON ss.shift_config_id = sc.id
               JOIN users u ON ss.user_id = u.id
               WHERE ss.location_id = UUID_TO_BIN('${locationId}')`
    
    const params = []
    
    if (startDate) {
      sql += ' AND ss.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      sql += ' AND ss.date <= ?'
      params.push(endDate)
    }
    
    sql += ' ORDER BY ss.date DESC, ss.actual_start DESC'
    
    return await this.db.query(sql, params)
  }

  async createShiftSession(data) {
    const { shift_config_id, location_id, user_id, date, day_of_week, scheduled_start, scheduled_end, initial_amount } = data
    
    const result = await this.db.query(
      `INSERT INTO shift_sessions 
       (shift_config_id, location_id, user_id, date, day_of_week, scheduled_start, scheduled_end, initial_amount, actual_start, status)
       VALUES (UUID_TO_BIN('${shift_config_id}'), UUID_TO_BIN('${location_id}'), UUID_TO_BIN('${user_id}'), ?, ?, ?, ?, ?, NOW(), 'open')`,
      [date, day_of_week, scheduled_start, scheduled_end, initial_amount]
    )
    
    return result.insertId
  }

  async updateShiftSessionStatus(id, status, closingAmount = null, notes = null) {
    if (status === 'closed') {
      const session = await this.getShiftSessionById(id)
      if (!session) return null
      
      const expected = parseFloat(session.initial_amount || 0)
      const difference = closingAmount !== null ? closingAmount - expected : null
      
      await this.db.query(
        `UPDATE shift_sessions 
         SET status = 'closed', actual_end = NOW(), closing_amount = ?, difference = ?, notes = ?
         WHERE id = UUID_TO_BIN('${id}')`,
        [closingAmount, difference, notes]
      )
    } else if (status === 'closing') {
      await this.db.query(
        `UPDATE shift_sessions SET status = 'closing' WHERE id = UUID_TO_BIN('${id}')`
      )
    } else if (status === 'cancelled') {
      await this.db.query(
        `UPDATE shift_sessions SET status = 'cancelled', actual_end = NOW() WHERE id = UUID_TO_BIN('${id}')`
      )
    }
    
    return await this.getShiftSessionById(id)
  }

  async getShiftsNeedingCloseReminder(locationId) {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8)
    const today = now.toISOString().slice(0, 10)
    
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(ss.id) as id, BIN_TO_UUID(ss.shift_config_id) as shift_config_id, BIN_TO_UUID(ss.location_id) as location_id, ss.date, ss.status, ss.actual_start, sc.name as shift_name, sc.end_time
       FROM shift_sessions ss
       JOIN shift_configs sc ON ss.shift_config_id = sc.id
       WHERE ss.location_id = UUID_TO_BIN('${locationId}')
         AND ss.date = ?
         AND ss.status = 'open'
         AND TIME_TO_SEC(TIMEDIFF(sc.end_time, ?)) <= 1800
         AND TIME_TO_SEC(TIMEDIFF(sc.end_time, ?)) >= 0`,
      [today, currentTime, currentTime]
    )
    
    return rows
  }
}
