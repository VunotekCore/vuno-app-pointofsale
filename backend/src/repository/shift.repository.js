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

  async getShiftConfigsByLocation(locationId, companyId) {
    let query = `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(location_id) as location_id, name, start_time, end_time, default_initial_amount, is_active, sort_order 
       FROM shift_configs 
       WHERE location_id = UUID_TO_BIN(?)`
    const params = [locationId]
    
    if (companyId) {
      query += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' ORDER BY sort_order, start_time'
    
    return await this.db.query(query, params)
  }

  async getAllShiftConfigs(companyId) {
    return await this.db.query(
      `SELECT BIN_TO_UUID(sc.id) as id, BIN_TO_UUID(sc.location_id) as location_id, sc.name, sc.start_time, sc.end_time, 
              sc.default_initial_amount, sc.is_active, sc.sort_order,
              l.name as location_name
       FROM shift_configs sc
       JOIN locations l ON sc.location_id = l.id
       WHERE sc.company_id = UUID_TO_BIN(?)
       ORDER BY l.name, sc.sort_order, sc.start_time`,
      [companyId]
    )
  }

  async getShiftConfigById(id, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(location_id) as location_id, name, start_time, end_time, default_initial_amount, is_active, sort_order 
       FROM shift_configs WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
      [id, companyId]
    )
    return rows[0] || null
  }

  async createShiftConfig(data) {
    const { location_id, company_id, name, start_time, end_time, default_initial_amount, is_active, sort_order } = data
    
    const amount = default_initial_amount !== undefined ? default_initial_amount : 0
    const active = is_active !== undefined ? is_active : 1
    const order = sort_order !== undefined ? sort_order : 0
    
    await this.db.query(
      `INSERT INTO shift_configs (id, location_id, company_id, name, start_time, end_time, default_initial_amount, is_active, sort_order)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN('${location_id}'), UUID_TO_BIN('${company_id}'), ?, ?, ?, ?, ?, ?)`,
      [name, start_time, end_time, amount, active, order]
    )
    
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(location_id) as location_id, name, start_time, end_time, default_initial_amount, is_active, sort_order 
       FROM shift_configs ORDER BY created_at DESC LIMIT 1`
    )
    return rows[0]
  }

  async updateShiftConfig(id, data, companyId) {
    const fields = []
    const values = []
    
    const allowedFields = ['location_id', 'name', 'start_time', 'end_time', 'default_initial_amount', 'is_active', 'sort_order']
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        if (key === 'location_id') {
          fields.push(`${key} = UUID_TO_BIN(?)`)
          values.push(value)
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
    }
    
    if (fields.length === 0) return null
    
    if (companyId) {
      values.push(id, companyId)
      await this.db.query(
        `UPDATE shift_configs SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`,
        values
      )
    } else {
      values.push(id)
      await this.db.query(
        `UPDATE shift_configs SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`,
        values
      )
    }
    
    return await this.getShiftConfigById(id, companyId)
  }

  async deleteShiftConfig(id, companyId) {
    if (companyId) {
      await this.db.query('DELETE FROM shift_configs WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)', [id, companyId])
    } else {
      await this.db.query('DELETE FROM shift_configs WHERE id = UUID_TO_BIN(?)', [id])
    }
  }

  async getActiveShiftForLocation(locationId, companyId) {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8)
    const currentDayOfWeek = now.getDay()
    
    let query = `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(location_id) as location_id, name, start_time, end_time, default_initial_amount
       FROM shift_configs 
       WHERE location_id = UUID_TO_BIN(?) 
         AND is_active = 1
         AND start_time <= ?
         AND end_time >= ?`
    const params = [locationId, currentTime, currentTime]
    
    if (companyId) {
      query += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' ORDER BY start_time DESC LIMIT 1'
    
    const rows = await this.db.query(query, params)
    
    return rows[0] || null
  }

  async getShiftSessionById(id, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(ss.id) as id, BIN_TO_UUID(ss.shift_config_id) as shift_config_id, BIN_TO_UUID(ss.location_id) as location_id, BIN_TO_UUID(ss.user_id) as user_id, ss.date, ss.day_of_week, ss.scheduled_start, ss.scheduled_end, ss.initial_amount, ss.actual_start, ss.actual_end, ss.closing_amount, ss.difference, ss.status, ss.notes, ss.created_at, ss.updated_at, sc.name as shift_name, sc.start_time as scheduled_start, sc.end_time as scheduled_end
       FROM shift_sessions ss
       JOIN shift_configs sc ON ss.shift_config_id = sc.id
       WHERE ss.id = UUID_TO_BIN(?) AND sc.company_id = UUID_TO_BIN(?)`,
      [id, companyId]
    )
    return rows[0] || null
  }

  async getOpenShiftSession(locationId, companyId) {
    let query = `SELECT BIN_TO_UUID(ss.id) as id, BIN_TO_UUID(ss.shift_config_id) as shift_config_id, BIN_TO_UUID(ss.location_id) as location_id, BIN_TO_UUID(ss.user_id) as user_id, ss.date, ss.day_of_week, ss.scheduled_start, ss.scheduled_end, ss.initial_amount, ss.actual_start, ss.actual_end, ss.closing_amount, ss.difference, ss.status, ss.notes, ss.created_at, ss.updated_at, sc.name as shift_name, sc.start_time as scheduled_start, sc.end_time as scheduled_end,
              sc.default_initial_amount
       FROM shift_sessions ss
       JOIN shift_configs sc ON ss.shift_config_id = sc.id
       WHERE ss.location_id = UUID_TO_BIN(?) AND ss.status IN ('open', 'closing')`
    const params = [locationId]
    
    if (companyId) {
      query += ' AND sc.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' ORDER BY ss.actual_start DESC LIMIT 1'
    
    const rows = await this.db.query(query, params)
    return rows[0] || null
  }

  async getShiftSessionsByLocation(locationId, startDate = null, endDate = null, companyId) {
    let sql = `SELECT BIN_TO_UUID(ss.id) as id, BIN_TO_UUID(ss.shift_config_id) as shift_config_id, BIN_TO_UUID(ss.location_id) as location_id, BIN_TO_UUID(ss.user_id) as user_id, ss.date, ss.day_of_week, ss.scheduled_start, ss.scheduled_end, ss.initial_amount, ss.actual_start, ss.actual_end, ss.closing_amount, ss.difference, ss.status, ss.notes, ss.created_at, ss.updated_at, sc.name as shift_name, u.username as user_name
               FROM shift_sessions ss
               JOIN shift_configs sc ON ss.shift_config_id = sc.id
               JOIN users u ON ss.user_id = u.id
               WHERE ss.location_id = UUID_TO_BIN(?)`
    const params = [locationId]
    
    if (companyId) {
      sql += ' AND sc.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
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
    const { shift_config_id, location_id, company_id, user_id, date, day_of_week, scheduled_start, scheduled_end, initial_amount } = data
    
    const result = await this.db.query(
      `INSERT INTO shift_sessions 
       (shift_config_id, location_id, company_id, user_id, date, day_of_week, scheduled_start, scheduled_end, initial_amount, actual_start, status)
       VALUES (UUID_TO_BIN('${shift_config_id}'), UUID_TO_BIN('${location_id}'), UUID_TO_BIN('${company_id}'), UUID_TO_BIN('${user_id}'), ?, ?, ?, ?, ?, NOW(), 'open')`,
      [date, day_of_week, scheduled_start, scheduled_end, initial_amount]
    )
    
    return result.insertId
  }

  async updateShiftSessionStatus(id, status, closingAmount = null, notes = null, companyId) {
    if (status === 'closed') {
      const session = await this.getShiftSessionById(id, companyId)
      if (!session) return null
      
      const expected = parseFloat(session.initial_amount || 0)
      const difference = closingAmount !== null ? closingAmount - expected : null
      
      await this.db.query(
        `UPDATE shift_sessions 
         SET status = 'closed', actual_end = NOW(), closing_amount = ?, difference = ?, notes = ?
         WHERE id = UUID_TO_BIN(?)`,
        [closingAmount, difference, notes, id]
      )
    } else if (status === 'closing') {
      await this.db.query(
        `UPDATE shift_sessions SET status = 'closing' WHERE id = UUID_TO_BIN(?)`,
        [id]
      )
    } else if (status === 'cancelled') {
      await this.db.query(
        `UPDATE shift_sessions SET status = 'cancelled', actual_end = NOW() WHERE id = UUID_TO_BIN(?)`,
        [id]
      )
    }
    
    return await this.getShiftSessionById(id, companyId)
  }

  async getShiftsNeedingCloseReminder(locationId, companyId) {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8)
    const today = now.toISOString().slice(0, 10)
    
    let query = `SELECT BIN_TO_UUID(ss.id) as id, BIN_TO_UUID(ss.shift_config_id) as shift_config_id, BIN_TO_UUID(ss.location_id) as location_id, ss.date, ss.status, ss.actual_start, sc.name as shift_name, sc.end_time
       FROM shift_sessions ss
       JOIN shift_configs sc ON ss.shift_config_id = sc.id
       WHERE ss.location_id = UUID_TO_BIN(?)
         AND ss.date = ?
         AND ss.status = 'open'
         AND TIME_TO_SEC(TIMEDIFF(sc.end_time, ?)) <= 1800
         AND TIME_TO_SEC(TIMEDIFF(sc.end_time, ?)) >= 0`
    const params = [locationId, today, currentTime, currentTime]
    
    if (companyId) {
      query += ' AND sc.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(query, params)
    return rows
  }
}
