import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { UnauthorizedError } from '../errors/UnauthorizedError.js'

/**
 * Repository for authentication-related database operations
 */
export class AuthRepository {
  constructor (db) {
    this.db = db
  }

  async findUserByUsernameOrEmail (username) {
    const rows = await this.db.query(
      'SELECT id, username, email, avatar, password_hash, role_id, company_id, is_active, is_delete FROM `users` WHERE username = ? OR email = ?',
      [username, username]
    )
    return rows[0]
  }

  async findRoleById (roleId) {
    const rows = await this.db.query('SELECT id, name, description, is_admin FROM `roles` WHERE id = ?', [roleId])
    return rows[0]
  }

  async findPermissionsByRoleId (roleId) {
    const rows = await this.db.query(
      `SELECT p.code FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    )
    return rows.map(r => r.code)
  }

  async findUserByEmail (email) {
    const rows = await this.db.query('SELECT id, username, email, avatar, password_hash, role_id, is_active, is_delete FROM `users` WHERE email = ?', [email])
    return rows[0]
  }

  async updatePassword (userId, passwordHash) {
    await this.db.query('UPDATE `users` SET password_hash = ? WHERE id = ?', [passwordHash, userId])
  }
}
