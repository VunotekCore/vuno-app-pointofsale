import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export class UsersRepository {
  constructor (db) {
    this.db = db
  }

  async getUserWithRole (id) {
    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(u.id) as id, u.username, u.email, BIN_TO_UUID(u.role_id) as role_id, BIN_TO_UUID(u.company_id) as company_id, u.is_active, r.name as role_name, r.is_admin FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = UUID_TO_BIN(?) AND (u.is_delete = 0 OR u.is_delete IS NULL)',
      [id]
    )
    if (!rows || rows.length === 0) {
      return null
    }
    return rows[0]
  }

  async getUserLocations (userId) {
    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(ul.location_id) as location_id, l.name as location_name, l.code as location_code, ul.is_default FROM user_locations ul JOIN locations l ON ul.location_id = l.id WHERE ul.user_id = UUID_TO_BIN(?)',
      [userId]
    )
    return rows
  }

  async getAll (filters = {}) {
    const { limit, offset, search } = filters
    let sql = 'SELECT BIN_TO_UUID(u.id) as id, u.username, u.email, u.avatar, BIN_TO_UUID(u.role_id) as role_id, u.is_active, u.is_delete, u.created_at, u.updated_at, BIN_TO_UUID(u.company_id) as company_id, r.name as role_name FROM `users` u LEFT JOIN roles r ON u.role_id = r.id WHERE (u.is_delete = 0 OR u.is_delete IS NULL)'
    const conditions = []
    const params = []

    if (filters.company_id) {
      conditions.push('u.company_id = UUID_TO_BIN(?)')
      params.push(filters.company_id)
    }

    if (search) {
      conditions.push('(u.username LIKE ? OR u.email LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    for (const [key, value] of Object.entries(filters)) {
      if (key === 'company_id' || key === 'limit' || key === 'offset' || key === 'search') continue
      if (value && value.includes('%')) {
        conditions.push(`u.${key} LIKE ?`)
        params.push(value)
      } else if (value !== undefined) {
        conditions.push(`u.${key} = ?`)
        params.push(value)
      }
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ')
    }

    const countSql = sql.replace('SELECT BIN_TO_UUID(u.id) as id, u.username, u.email, u.avatar, BIN_TO_UUID(u.role_id) as role_id, u.is_active, u.is_delete, u.created_at, u.updated_at, BIN_TO_UUID(u.company_id) as company_id, r.name as role_name', 'SELECT COUNT(*) as total')
    const countResult = await this.db.query(countSql, params)
    const total = countResult[0]?.total || 0

    sql += ' ORDER BY u.id DESC'

    if (limit) {
      sql += ' LIMIT ?'
      params.push(parseInt(limit))
    }
    if (offset) {
      sql += ' OFFSET ?'
      params.push(parseInt(offset))
    }

    const rows = await this.db.query(sql, params)
    return { data: rows, total }
  }

  async getById (id) {
    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id, username, email, avatar, BIN_TO_UUID(role_id) as role_id, is_active, is_delete, created_at, updated_at FROM `users` WHERE id = UUID_TO_BIN(\'' + id + '\') AND (is_delete = 0 OR is_delete IS NULL)'
    )
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Usuario no encontrado')
    }
    return rows[0]
  }

  async create ({ username, email, password, role_id: roleId, is_active: isActive = true, company_id: companyId }, userId = null) {
    if (!username || !email || !password) {
      throw new BadRequestError('Username, email y contraseña requeridos')
    }

    if (!companyId) {
      throw new BadRequestError('Company ID es requerido')
    }

    const existing = await this.db.query(
      'SELECT id FROM `users` WHERE username = ? OR email = ?',
      [username, email]
    )

    if (existing && existing.length > 0) {
      throw new BadRequestError('Usuario o email ya existe')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    if (!roleId) {
      throw new BadRequestError('El rol es requerido')
    }

    const fields = ['id', 'username', 'email', 'password_hash', 'role_id', 'is_active', 'company_id']
    const values = ['UUID_TO_BIN(UUID())', username, email, passwordHash, 'UUID_TO_BIN(?)', isActive ?? true, 'UUID_TO_BIN(?)']
    const placeholders = ['UUID_TO_BIN(UUID())', '?', '?', '?', 'UUID_TO_BIN(?)', '?', 'UUID_TO_BIN(?)']
    const actualParams = [username, email, passwordHash, roleId, isActive ?? true, companyId]

    if (userId) {
      fields.push('created_by')
      placeholders.push('UUID_TO_BIN(?)')
      actualParams.push(userId)
    }

    const result = await this.db.query(
      `INSERT INTO \`users\` (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
      actualParams
    )

    const newUser = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM `users` WHERE username = ?', [username])
    return { id: newUser[0]?.id }
  }

  async createWithDetails (data, userId = null, companyId = null) {
    const { username, email, password, role_id, is_active, location_ids, employee, avatar, company_id: companyIdFromData } = data

    if (!username || !email || !password) {
      throw new BadRequestError('Username, email y contraseña requeridos')
    }

    const finalCompanyId = companyIdFromData || companyId

    if (!finalCompanyId) {
      throw new BadRequestError('Company ID es requerido')
    }

    const existing = await this.db.query(
      'SELECT id FROM `users` WHERE username = ? OR email = ?',
      [username, email]
    )

    if (existing && existing.length > 0) {
      throw new BadRequestError('Usuario o email ya existe')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    if (!role_id) {
      throw new BadRequestError('El rol es requerido')
    }

    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const userIdBin = crypto.randomUUID()
      const avatarValue = avatar || null
      
      let userSql = ''
      const userInsertValues = [userIdBin, username, email, avatarValue, passwordHash, role_id, is_active ?? true, finalCompanyId]
      
      if (userId) {
        userSql = `INSERT INTO users (id, username, email, avatar, password_hash, role_id, is_active, company_id, created_by) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, UUID_TO_BIN(?), ?, UUID_TO_BIN(?), UUID_TO_BIN(?))`
        userInsertValues.push(userId)
      } else {
        userSql = `INSERT INTO users (id, username, email, avatar, password_hash, role_id, is_active, company_id) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, UUID_TO_BIN(?), ?, UUID_TO_BIN(?))`
      }
      
      await conn.query(userSql, userInsertValues)

      if (location_ids && location_ids.length > 0) {
        for (const locationId of location_ids) {
          await conn.query(
            `INSERT INTO user_locations (id, user_id, location_id, is_default, company_id) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), 0, UUID_TO_BIN(?))`,
            [userIdBin, locationId, finalCompanyId]
          )
        }
      }

      if (employee && (employee.first_name || employee.last_name)) {
        const employeeIdBin = crypto.randomUUID()
        await conn.query(
          `INSERT INTO employees (id, user_id, first_name, last_name, phone, email, address, city, state, country, postal_code, position, department, hire_date, salary, emergency_contact_name, emergency_contact_phone, company_id) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?))`,
          [employeeIdBin, userIdBin, employee.first_name, employee.last_name || null, employee.phone || null, employee.email || null, employee.address || null, employee.city || null, employee.state || null, employee.country || 'Mexico', employee.postal_code || null, employee.position || null, employee.department || null, employee.hire_date || null, employee.salary || null, employee.emergency_contact_name || null, employee.emergency_contact_phone || null, finalCompanyId]
        )
      }

      await conn.commit()
      return { id: userIdBin }
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async updateWithDetails (id, data, userId = null, companyId = null) {
    const { username, email, password, role_id, is_active, location_ids, employee, avatar, company_id: companyIdFromData } = data
    
    const finalCompanyId = companyIdFromData || companyId
    
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const updates = []
      const params = []

      if (username) {
        updates.push('username = ?')
        params.push(username)
      }
      if (email) {
        updates.push('email = ?')
        params.push(email)
      }
      if (password) {
        updates.push('password_hash = ?')
        params.push(await bcrypt.hash(password, 10))
      }
      if (role_id !== undefined) {
        updates.push('role_id = UUID_TO_BIN(?)')
        params.push(role_id)
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?')
        params.push(is_active)
      }
      if (avatar !== undefined) {
        updates.push('avatar = ?')
        params.push(avatar || null)
      }
      if (userId) {
        updates.push('updated_by = UUID_TO_BIN(?)')
        params.push(userId)
      }

      if (updates.length > 0) {
        params.push(id)
        await conn.query(`UPDATE \`users\` SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?)`, params)
      }

      if (location_ids && Array.isArray(location_ids)) {
        const currentLocsResult = await conn.query(
          'SELECT BIN_TO_UUID(location_id) as location_id FROM user_locations WHERE user_id = UUID_TO_BIN(?)',
          [id]
        )
        const currentLocs = Array.isArray(currentLocsResult) ? currentLocsResult[0] : currentLocsResult
        const currentIds = currentLocs.map(l => l.location_id)
        
        const toAdd = location_ids.filter(lid => !currentIds.includes(lid))
        const toRemove = currentIds.filter(cid => !location_ids.includes(cid))

        for (const locId of toRemove) {
          await conn.query(
            'DELETE FROM user_locations WHERE user_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
            [id, locId]
          )
        }
        for (const locId of toAdd) {
          await conn.query(
            'INSERT INTO user_locations (id, user_id, location_id, is_default) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), 0)',
            [id, locId]
          )
        }
      }

      if (employee) {
        const existingEmpResult = await conn.query(
          'SELECT id, user_id FROM employees WHERE user_id = UUID_TO_BIN(?)',
          [id]
        )
        const existingEmp = existingEmpResult[0] || []
        
        if (existingEmp.length > 0) {
          const empUpdates = []
          const empParams = []
          if (employee.first_name) { empUpdates.push('first_name = ?'); empParams.push(employee.first_name) }
          if (employee.last_name !== undefined) { empUpdates.push('last_name = ?'); empParams.push(employee.last_name) }
          if (employee.phone !== undefined) { empUpdates.push('phone = ?'); empParams.push(employee.phone || null) }
          if (employee.email !== undefined) { empUpdates.push('email = ?'); empParams.push(employee.email || null) }
          if (employee.address !== undefined) { empUpdates.push('address = ?'); empParams.push(employee.address || null) }
          if (employee.city !== undefined) { empUpdates.push('city = ?'); empParams.push(employee.city || null) }
          if (employee.state !== undefined) { empUpdates.push('state = ?'); empParams.push(employee.state || null) }
          if (employee.country !== undefined) { empUpdates.push('country = ?'); empParams.push(employee.country || null) }
          if (employee.postal_code !== undefined) { empUpdates.push('postal_code = ?'); empParams.push(employee.postal_code || null) }
          if (employee.position !== undefined) { empUpdates.push('position = ?'); empParams.push(employee.position || null) }
          if (employee.department !== undefined) { empUpdates.push('department = ?'); empParams.push(employee.department || null) }
          if (employee.hire_date !== undefined) { empUpdates.push('hire_date = ?'); empParams.push(employee.hire_date || null) }
          if (employee.salary !== undefined) { empUpdates.push('salary = ?'); empParams.push(employee.salary || null) }
          if (employee.emergency_contact_name !== undefined) { empUpdates.push('emergency_contact_name = ?'); empParams.push(employee.emergency_contact_name || null) }
          if (employee.emergency_contact_phone !== undefined) { empUpdates.push('emergency_contact_phone = ?'); empParams.push(employee.emergency_contact_phone || null) }
          
          if (empUpdates.length > 0) {
            empParams.push(id)
            await conn.query(`UPDATE employees SET ${empUpdates.join(', ')} WHERE user_id = UUID_TO_BIN(?)`, empParams)
          }
        } else if (employee.first_name || employee.last_name) {
          await conn.query(
            `INSERT INTO employees (id, user_id, first_name, last_name, phone, email, address, city, state, country, postal_code, position, department, hire_date, salary, emergency_contact_name, emergency_contact_phone) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, employee.first_name, employee.last_name || null, employee.phone || null, employee.email || null, employee.address || null, employee.city || null, employee.state || null, employee.country || 'Mexico', employee.postal_code || null, employee.position || null, employee.department || null, employee.hire_date || null, employee.salary || null, employee.emergency_contact_name || null, employee.emergency_contact_phone || null]
          )
        }
      }

      await conn.commit()
      return { success: true }
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async delete (id, userId = null, companyId = null) {
    const updates = ['is_delete = 1']
    const params = []

    if (userId) {
      updates.push('updated_by = UUID_TO_BIN(?)')
      params.push(userId)
    }

    let whereClause = 'WHERE id = UUID_TO_BIN(?)'
    if (companyId) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    params.push(id)
    await this.db.query(`UPDATE \`users\` SET ${updates.join(', ')} ${whereClause}`, params)
    return { success: true }
  }

  async restore (id) {
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM `users` WHERE id = UUID_TO_BIN(?)', [id])
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Usuario no encontrado')
    }

    await this.db.query('UPDATE `users` SET is_delete = 0 WHERE id = UUID_TO_BIN(?)', [id])
    return { success: true }
  }
}

import database from '../config/database.js'
export const usersRepository = new UsersRepository(database)
