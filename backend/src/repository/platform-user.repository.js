import database from '../config/database.js'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export class PlatformUserRepository {
  constructor(db = database) {
    this.db = db
  }

  async create(data) {
    const id = uuidv4()
    const passwordHash = await bcrypt.hash(data.password, 10)

    await this.db.query(
      `INSERT INTO platform_users (id, email, password_hash, name, is_super_admin, is_active)
       VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, 1)`,
      [id, data.email, passwordHash, data.name || null, data.is_super_admin ? 1 : 0]
    )

    return { id, email: data.email, name: data.name, is_super_admin: data.is_super_admin || false }
  }

  async findById(id) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, email, name, is_super_admin, is_active, created_at, updated_at
       FROM platform_users WHERE id = UUID_TO_BIN(?)`,
      [id]
    )
    return rows[0] || null
  }

  async findByEmail(email) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, email, password_hash, name, is_super_admin, is_active, created_at, updated_at
       FROM platform_users WHERE email = ?`,
      [email]
    )
    return rows[0] || null
  }

  async findAll(filters = {}) {
    let sql = `SELECT BIN_TO_UUID(id) as id, email, name, is_super_admin, is_active, created_at, updated_at
               FROM platform_users WHERE 1=1`
    const params = []

    if (filters.is_super_admin !== undefined) {
      sql += ' AND is_super_admin = ?'
      params.push(filters.is_super_admin)
    }

    if (filters.is_active !== undefined) {
      sql += ' AND is_active = ?'
      params.push(filters.is_active)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = await this.db.query(sql, params)
    return rows
  }

  async update(id, data) {
    const updates = []
    const params = []

    if (data.email) {
      updates.push('email = ?')
      params.push(data.email)
    }
    if (data.name !== undefined) {
      updates.push('name = ?')
      params.push(data.name)
    }
    if (data.is_super_admin !== undefined) {
      updates.push('is_super_admin = ?')
      params.push(data.is_super_admin ? 1 : 0)
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?')
      params.push(data.is_active ? 1 : 0)
    }
    if (data.password) {
      updates.push('password_hash = ?')
      params.push(await bcrypt.hash(data.password, 10))
    }

    if (updates.length === 0) return null

    params.push(id)

    await this.db.query(
      `UPDATE platform_users SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      params
    )

    return this.findById(id)
  }

  async delete(id) {
    await this.db.query(
      'UPDATE platform_users SET is_active = 0 WHERE id = UUID_TO_BIN(?)',
      [id]
    )
    return true
  }

  async verifyPassword(platformUser, password) {
    return await bcrypt.compare(password, platformUser.password_hash)
  }
}
