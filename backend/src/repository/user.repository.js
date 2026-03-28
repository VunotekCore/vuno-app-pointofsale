import database from '../config/database.js'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export class UserRepository {
  constructor(db = database) {
    this.db = db
  }

  async create(data) {
    const id = uuidv4()
    const passwordHash = await bcrypt.hash(data.password, 10)

    await this.db.query(
      `INSERT INTO users (id, username, email, password_hash, role_id, company_id, is_active, created_by)
       VALUES (UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), 1, UUID_TO_BIN(?))`,
      [id, data.username, data.email, passwordHash, data.role_id, data.company_id, data.created_by || null]
    )

    return {
      id,
      username: data.username,
      email: data.email,
      role_id: data.role_id,
      company_id: data.company_id
    }
  }

  async findByEmail(email) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, username, email, password_hash, role_id, company_id, is_active, is_delete, created_at
       FROM users WHERE email = ? AND is_delete = 0`,
      [email]
    )
    return rows[0] || null
  }

  async findByUsername(username) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, username, email, password_hash, role_id, company_id, is_active, is_delete, created_at
       FROM users WHERE username = ? AND is_delete = 0`,
      [username]
    )
    return rows[0] || null
  }

  async findById(id) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, username, email, role_id, company_id, is_active, is_delete, created_at, updated_at
       FROM users WHERE id = UUID_TO_BIN(?) AND is_delete = 0`,
      [id]
    )
    return rows[0] || null
  }

  async findByRoleId(roleId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, username, email, role_id, company_id, is_active, created_at
       FROM users WHERE role_id = UUID_TO_BIN(?) AND is_delete = 0`,
      [roleId]
    )
    return rows
  }

  async updatePassword(userId, passwordHash) {
    await this.db.query(
      'UPDATE users SET password_hash = ? WHERE id = UUID_TO_BIN(?)',
      [passwordHash, userId]
    )
  }
}
