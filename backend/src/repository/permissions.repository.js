import database from '../config/database.js'

export class PermissionsRepository {
  constructor(db = database) {
    this.db = db
  }

  async getAll() {
    const rows = await this.db.query('SELECT code FROM `permissions`')
    return rows
  }

  async userHasPermission(userId, permissionCode) {
    const rows = await this.db.query(
      `SELECT COUNT(*) as count FROM \`users\` u
       JOIN \`roles\` r ON u.role_id = r.id
       JOIN \`role_permissions\` rp ON r.id = rp.role_id
       JOIN \`permissions\` p ON rp.permission_id = p.id
       WHERE u.id = ? AND p.code = ?`,
      [userId, permissionCode]
    )
    return rows[0].count > 0
  }

  async getUserPermissions(userId) {
    const rows = await this.db.query(
      `SELECT p.code FROM \`permissions\` p
       JOIN \`role_permissions\` rp ON p.id = rp.permission_id
       JOIN \`roles\` r ON rp.role_id = r.id
       JOIN \`users\` u ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    )
    return rows.map((row) => row.code)
  }
}

export const permissionsRepository = new PermissionsRepository(database)
