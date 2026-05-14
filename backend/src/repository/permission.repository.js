export class PermissionRepository {
  constructor (db) {
    this.db = db
  }

  async findAll (options = {}) {
    let {
      limit = 20,
      offset = 0,
      search = '',
      action = '',
      codeStart = '',
      codeExclude = ''
    } = options

    const applyPagination = limit > 0
    const safeLimit = applyPagination ? Math.min(Math.max(parseInt(limit), 1), 100) : null
    const safeOffset = applyPagination ? Math.max(parseInt(offset) || 0, 0) : null

    let whereClauses = ['p.is_delete = 0']
    const params = []

    if (search) {
      whereClauses.push('p.code LIKE ?')
      const searchParam = `%${search}%`
      params.push(searchParam)
    }

    if (action) {
      whereClauses.push('p.code LIKE ?')
      params.push(`%${action}%`)
    }

    if (codeStart) {
      whereClauses.push('p.code LIKE ?')
      params.push(`${codeStart}%`)
    }

    if (codeExclude) {
      whereClauses.push('p.code NOT LIKE ?')
      params.push(`${codeExclude}%`)
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''
    const dataParams = applyPagination ? [...params, safeLimit, safeOffset] : params

    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(p.id) as id, p.code, p.name, p.description FROM permissions p ' + whereSQL + ' ORDER BY p.code ASC' + (applyPagination ? ' LIMIT ? OFFSET ?' : ''),
      dataParams
    )

    const countResult = await this.db.query('SELECT COUNT(*) as total FROM permissions p ' + whereSQL, params)
    const total = countResult[0]?.total || 0

    return {
      permissions: rows,
      total,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
        page: applyPagination ? Math.ceil(safeOffset / safeLimit) + 1 : 1,
        totalPages: applyPagination ? Math.ceil(total / safeLimit) : 1
      }
    }
  }

  async findAllNoPagination () {
    return await this.db.query('SELECT BIN_TO_UUID(id) as id, code, name, description FROM permissions WHERE is_delete = 0 ORDER BY code')
  }

  async findById (id) {
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id, code, name, description FROM permissions WHERE id = UUID_TO_BIN(?) AND is_delete = 0', [id])
    return rows[0] || null
  }

  async findByCode (code) {
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id, code, name, description FROM permissions WHERE code = ? AND is_delete = 0', [code])
    return rows[0] || null
  }

  async create (permissionData) {
    const { code, name, description } = permissionData
    const existing = await this.db.query('SELECT id FROM permissions WHERE code = ?', [code])
    if (existing.length > 0) {
      await this.db.query('UPDATE permissions SET description = ?, updated_at = NOW() WHERE code = ?', [description || null, code])
    } else {
      await this.db.query('INSERT INTO permissions (id, code, name, description, is_delete, created_at, updated_at) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, 0, NOW(), NOW())', [code, name || null, description || null])
    }
  }

  async update (id, permissionData) {
    const fields = []
    const values = []
    if (permissionData.description !== undefined) {
      fields.push('description = ?')
      values.push(permissionData.description)
    }
    if (fields.length === 0) return
    values.push(id)
    await this.db.query(`UPDATE permissions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = UUID_TO_BIN(?)`, values)
  }

  async delete (id) {
    await this.db.query('UPDATE permissions SET is_delete = 1, updated_at = NOW() WHERE id = UUID_TO_BIN(?)', [id])
  }

  async assignPermissionToRole (roleId, permissionId) {
    const existing = await this.db.query('SELECT id FROM role_permissions WHERE role_id = UUID_TO_BIN(?) AND permission_id = UUID_TO_BIN(?)', [roleId, permissionId])
    if (existing.length > 0) {
      await this.db.query('UPDATE role_permissions SET is_delete = 0, updated_at = NOW() WHERE role_id = UUID_TO_BIN(?) AND permission_id = UUID_TO_BIN(?)', [roleId, permissionId])
    } else {
      await this.db.query('INSERT INTO role_permissions (id, role_id, permission_id, created_at) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), NOW())', [roleId, permissionId])
    }
  }

  async removePermissionFromRole (roleId, permissionId) {
    await this.db.query('UPDATE role_permissions SET is_delete = 1, updated_at = NOW() WHERE role_id = UUID_TO_BIN(?) AND permission_id = UUID_TO_BIN(?) AND is_delete = 0', [roleId, permissionId])
  }

  async getPermissionsByRole (roleId) {
    return await this.db.query(
      `SELECT BIN_TO_UUID(rp.permission_id) as id, BIN_TO_UUID(rp.permission_id) as permission_id, p.code, p.name, p.description
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = UUID_TO_BIN(?) AND p.is_delete = 0 AND rp.is_delete = 0`,
      [roleId]
    )
  }

  async assignPermissionToUser (userId, permissionId) {
    const existing = await this.db.query('SELECT id FROM user_permissions WHERE user_id = UUID_TO_BIN(?) AND permission_id = UUID_TO_BIN(?)', [userId, permissionId])
    if (existing.length > 0) {
      await this.db.query('UPDATE user_permissions SET is_delete = 0, updated_at = NOW() WHERE user_id = UUID_TO_BIN(?) AND permission_id = UUID_TO_BIN(?)', [userId, permissionId])
    } else {
      await this.db.query('INSERT INTO user_permissions (id, user_id, permission_id, created_at) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), NOW())', [userId, permissionId])
    }
  }

  async removePermissionFromUser (userId, permissionId) {
    await this.db.query('UPDATE user_permissions SET is_delete = 1, updated_at = NOW() WHERE user_id = UUID_TO_BIN(?) AND permission_id = UUID_TO_BIN(?) AND is_delete = 0', [userId, permissionId])
  }

  async getPermissionsByUser (userId) {
    return await this.db.query(
      `SELECT BIN_TO_UUID(up.permission_id) as id, BIN_TO_UUID(up.permission_id) as permission_id, p.code, p.name, p.description
       FROM permissions p
       JOIN user_permissions up ON up.permission_id = p.id
       WHERE up.user_id = UUID_TO_BIN(?) AND p.is_delete = 0 AND up.is_delete = 0`,
      [userId]
    )
  }

  async getEffectivePermissions (userId) {
    const userRole = await this.db.query(
      `SELECT r.is_admin
       FROM users u
       JOIN roles r ON r.id = u.role_id AND r.is_delete = 0
       WHERE u.id = UUID_TO_BIN(?) AND u.is_delete = 0`,
      [userId]
    )

    const isAdmin = userRole[0]?.is_admin === 1

    if (isAdmin) {
      return await this.db.query(
        `SELECT BIN_TO_UUID(p.id) as id, p.code, p.name, p.description
         FROM permissions p
         WHERE p.is_delete = 0
         ORDER BY p.code`
      )
    }

    const rows = await this.db.query(
      `SELECT DISTINCT BIN_TO_UUID(p.id) as id, p.code, p.name, p.description
       FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id AND rp.is_delete = 0
       JOIN permissions p ON p.id = rp.permission_id AND p.is_delete = 0
       WHERE u.id = UUID_TO_BIN(?) AND u.is_delete = 0
       UNION
       SELECT DISTINCT BIN_TO_UUID(p.id) as id, p.code, p.name, p.description
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id AND p.is_delete = 0
       WHERE up.user_id = UUID_TO_BIN(?) AND up.is_delete = 0
       ORDER BY code`,
      [userId, userId]
    )
    return rows
  }

  async detectNewTables () {
    const tables = await this.db.query('SHOW TABLES')
    const tableNames = tables.map((t) => Object.values(t)[0])

    const existingPermissions = await this.db.query('SELECT code FROM permissions WHERE is_delete = 0')
    const existingCodes = existingPermissions.map((p) => p.code)

    const systemTables = ['permissions']
    const newTables = []
    for (const table of tableNames) {
      if (systemTables.includes(table)) continue
      const readCode = `${table}.read`
      if (!existingCodes.includes(readCode)) {
        newTables.push({ table, exists: false })
      }
    }
    return newTables
  }

  async createFromTables (tableNames) {
    const created = []
    const systemTables = ['permissions']

    for (const table of tableNames) {
      if (systemTables.includes(table)) continue
      const capitalizedName = table.charAt(0).toUpperCase() + table.slice(1).replace(/_/g, ' ')

      await this.create({ code: `${table}.read`, name: `Ver ${capitalizedName}`, description: `Permiso para visualizar ${table}` })
      await this.create({ code: `${table}.write`, name: `Gestionar ${capitalizedName}`, description: `Permiso para crear y editar ${table}` })
      await this.create({ code: `${table}.delete`, name: `Eliminar ${capitalizedName}`, description: `Permiso para eliminar ${table}` })
      created.push(table)
    }
    return created
  }

  async detectAndCleanTables () {
    const tables = await this.db.query('SHOW TABLES')
    const tableNames = tables.map((t) => Object.values(t)[0].toLowerCase())
    const systemTables = ['permissions']
    let newCount = 0

    const adminRoles = await this.db.query("SELECT id FROM roles WHERE is_admin = 1 OR name = 'admin' LIMIT 1")
    const adminRoleId = adminRoles[0]?.id || null

    for (const table of tableNames) {
      if (systemTables.includes(table)) continue
      const capitalizedName = table.charAt(0).toUpperCase() + table.slice(1).replace(/_/g, ' ')

      for (const [action, verb] of [['read', 'Ver'], ['write', 'Gestionar'], ['delete', 'Eliminar']]) {
        const code = `${table}.${action}`
        const existing = await this.db.query('SELECT id, is_delete FROM permissions WHERE code = ? LIMIT 1', [code])
        let permissionId = existing[0]?.id

        if (existing.length === 0) {
          await this.db.query('INSERT INTO permissions (id, code, name, description, is_delete, created_at, updated_at) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, 0, NOW(), NOW())', [code, `${verb} ${capitalizedName}`, `Permiso para ${verb.toLowerCase()} ${table}`])
          const newPerm = await this.db.query('SELECT id FROM permissions WHERE code = ? LIMIT 1', [code])
          permissionId = newPerm[0]?.id
          newCount++
        }

        if (adminRoleId && permissionId) {
          const existingRolePerm = await this.db.query('SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ? AND is_delete = 0 LIMIT 1', [adminRoleId, permissionId])
          if (existingRolePerm.length === 0) {
            await this.db.query('INSERT IGNORE INTO role_permissions (id, role_id, permission_id, is_delete, created_at, updated_at) VALUES (UUID_TO_BIN(UUID()), ?, ?, 0, NOW(), NOW())', [adminRoleId, permissionId])
          }
        }
      }
    }

    const msg = newCount > 0 ? `+${newCount} permisos agregados` : 'No se detectaron nuevas tablas'
    return { newCount, removedCount: 0, message: msg }
  }

  async syncUIViewPermissions (routes) {
    let newCount = 0

    const adminRoles = await this.db.query("SELECT id FROM roles WHERE is_admin = 1 OR name = 'admin' LIMIT 1")
    const adminRoleId = adminRoles[0]?.id || null

    for (const route of routes) {
      const viewCode = route.permission || `view.${route.path === '' ? 'dashboard' : route.path.split('/').pop().toLowerCase()}`
      const viewName = route.name

      const existing = await this.db.query('SELECT id, is_delete FROM permissions WHERE code = ? LIMIT 1', [viewCode])
      let permissionId = existing[0]?.id

      if (existing.length === 0) {
        await this.db.query('INSERT INTO permissions (id, code, name, description, is_delete, created_at, updated_at) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, 0, NOW(), NOW())', [viewCode, viewName, `Permite acceder a la vista ${viewName}`])
        const newPerm = await this.db.query('SELECT id FROM permissions WHERE code = ? AND is_delete = 0 LIMIT 1', [viewCode])
        permissionId = newPerm[0]?.id
        newCount++
      }

      if (adminRoleId && permissionId) {
        const existingRolePerm = await this.db.query('SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ? AND is_delete = 0 LIMIT 1', [adminRoleId, permissionId])
        if (existingRolePerm.length === 0) {
          await this.db.query('INSERT IGNORE INTO role_permissions (id, role_id, permission_id, is_delete, created_at, updated_at) VALUES (UUID_TO_BIN(UUID()), ?, ?, 0, NOW(), NOW())', [adminRoleId, permissionId])
        }
      }
    }

    const msg = newCount > 0 ? `+${newCount} vistas detectadas` : 'No se detectaron nuevas vistas'
    return { newCount, removedCount: 0, message: msg }
  }
}
