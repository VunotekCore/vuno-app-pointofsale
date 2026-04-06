import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { MENU_ITEMS, MENU_SECTIONS } from '../config/menu.config.js'

function UUID_TO_BIN(uuid) {
  return uuid
}

function BIN_TO_UUID(binary) {
  return binary
}

export class RolesRepository {
  constructor (db) {
    this.db = db
  }

  async getAll (companyId) {
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id, name, description, is_delete, created_at, updated_at FROM `roles` WHERE (is_delete = 0 OR is_delete IS NULL) AND company_id = UUID_TO_BIN(?) ORDER BY id', [companyId])
    for (const role of rows) {
      const permissions = await this.db.query(
        'SELECT BIN_TO_UUID(p.id) as id, p.code, p.description FROM `permissions` p JOIN `role_permissions` rp ON p.id = rp.permission_id WHERE rp.role_id = UUID_TO_BIN(?)',
        [role.id]
      )
      role.permissions = permissions
    }
    return rows
  }

  async getById (id, companyId = null) {
    let whereClause = 'WHERE id = UUID_TO_BIN(?) AND (is_delete = 0 OR is_delete IS NULL)'
    const params = [id]
    
    if (companyId) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(`SELECT BIN_TO_UUID(id) as id, name, description, is_delete, created_at, updated_at FROM \`roles\` ${whereClause}`, params)
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Rol no encontrado')
    }
    const permissions = await this.db.query(
      'SELECT BIN_TO_UUID(p.id) as id, p.code, p.description FROM `permissions` p JOIN `role_permissions` rp ON p.id = rp.permission_id WHERE rp.role_id = UUID_TO_BIN(?)',
      [id]
    )
    return { ...rows[0], permissions }
  }

  async getByIdWithTablePermissions (id, companyId = null) {
    let whereClause = 'WHERE id = UUID_TO_BIN(?) AND (is_delete = 0 OR is_delete IS NULL)'
    const params = [id]
    
    if (companyId) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(`SELECT BIN_TO_UUID(id) as id, name, description, is_delete, created_at, updated_at FROM \`roles\` ${whereClause}`, params)
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Rol no encontrado')
    }

    const allPermissions = await this.db.query('SELECT BIN_TO_UUID(id) as id, code, description FROM `permissions`')
    const rolePermissions = await this.db.query(
      `SELECT p.code FROM \`permissions\` p
       JOIN \`role_permissions\` rp ON p.id = rp.permission_id
       WHERE rp.role_id = UUID_TO_BIN(?)`,
      [id]
    )
    const rolePermCodes = new Set(rolePermissions.map(p => p.code))

    const grouped = {}
    for (const perm of allPermissions) {
      const parts = perm.code.split('.')
      if (parts.length === 2) {
        const [table, operation] = parts
        if (!grouped[table]) {
          grouped[table] = { table, permissions: { create: false, read: false, update: false, delete: false } }
        }
        const op = operation.toLowerCase()
        if (['create', 'read', 'update', 'delete'].includes(op)) {
          grouped[table].permissions[op] = {
            id: perm.id,
            code: perm.code,
            enabled: rolePermCodes.has(perm.code)
          }
        }
      }
    }

    const menuPermissions = allPermissions
      .filter(p => p.code.startsWith('menu.'))
      .map(p => ({
        id: p.id,
        code: p.code,
        enabled: rolePermCodes.has(p.code)
      }))

    return { ...rows[0], tablePermissions: Object.values(grouped), menuPermissions }
  }

  async create ({ name, description, permissions = [], tablePermissions = [], menuPermissions = [], company_id = null }, userId = null) {
    if (!name) {
      throw new BadRequestError('Nombre del rol requerido')
    }

    let existingQuery = 'SELECT id FROM `roles` WHERE name = ? AND (is_delete = 0 OR is_delete IS NULL)'
    const existingParams = [name]
    
    if (company_id) {
      existingQuery += ' AND company_id = UUID_TO_BIN(?)'
      existingParams.push(company_id)
    }
    
    const existing = await this.db.query(existingQuery, existingParams)
    if (existing && existing.length > 0) {
      throw new BadRequestError('El rol ya existe')
    }

    const fields = ['name', 'description']
    const values = [name, description || null]
    const sqlFields = []

    if (company_id) {
      sqlFields.push('company_id = UUID_TO_BIN(?)')
      values.push(company_id)
    }

    if (userId) {
      sqlFields.push('created_by = UUID_TO_BIN(?)')
      values.push(userId)
    }

    let sql = `INSERT INTO \`roles\` (id, name, description${company_id ? ', company_id' : ''}${userId ? ', created_by' : ''}) VALUES (UUID_TO_BIN(UUID()), ?, ?${company_id ? ', UUID_TO_BIN(?)' : ''}${userId ? ', UUID_TO_BIN(?)' : ''})`

    const sqlValues = [name, description || null]
    if (company_id) sqlValues.push(company_id)
    if (userId) sqlValues.push(userId)

    await this.db.query(sql, sqlValues)

    const role = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM roles WHERE name = ?', [name])
    const roleId = role[0]?.id

    const permIdsToAdd = []

    if (tablePermissions && tablePermissions.length > 0) {
      for (const tablePerm of tablePermissions) {
        if (tablePerm.permissions) {
          for (const [op, permData] of Object.entries(tablePerm.permissions)) {
            if (permData.enabled && permData.id) {
              permIdsToAdd.push(permData.id)
            }
          }
        }
      }
    }

    if (menuPermissions && menuPermissions.length > 0) {
      for (const menuKey of menuPermissions) {
        const menuPermCode = menuKey.startsWith('menu.') ? menuKey : `menu.${menuKey}`
        const menuPerm = await this.db.query(
          'SELECT BIN_TO_UUID(id) as id FROM `permissions` WHERE code = ?',
          [menuPermCode]
        )
        if (menuPerm.length > 0) {
          permIdsToAdd.push(menuPerm[0].id)
        }
      }
    }

    if (permIdsToAdd.length > 0) {
      const roleBinId = `UUID_TO_BIN('${roleId}')`
      const placeholders = permIdsToAdd.map(() => `(${roleBinId}, UUID_TO_BIN(?))`).join(', ')
      await this.db.query(
        `INSERT INTO \`role_permissions\` (role_id, permission_id) VALUES ${placeholders}`,
        permIdsToAdd
      )
    }

    return { id: roleId }
  }

  async update (id, { name, description, permissions, tablePermissions, menuPermissions }, userId = null, companyId = null) {
    let whereClause = 'WHERE id = UUID_TO_BIN(?)'
    const params = [id]
    
    if (companyId) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const existing = await this.db.query(`SELECT id, name, description, is_delete, created_at, updated_at FROM \`roles\` ${whereClause}`, params)
    if (!existing || existing.length === 0) {
      throw new NotFoundError('Rol no encontrado')
    }

    const updates = []
    const updateParams = []

    if (name) {
      updates.push('name = ?')
      updateParams.push(name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      updateParams.push(description)
    }
    if (userId) {
      updates.push('updated_by = ?')
      updateParams.push('UUID_TO_BIN(?)')
      updateParams.push(userId)
    }

    if (updates.length > 0) {
      updateParams.push(UUID_TO_BIN(id))
      await this.db.query(`UPDATE \`roles\` SET ${updates.join(', ')} WHERE id = ?`, updateParams)
    }

    if (tablePermissions !== undefined || menuPermissions !== undefined) {
      await this.db.query('DELETE FROM `role_permissions` WHERE role_id = UUID_TO_BIN(?)', [id])

      const permIdsToAdd = []

      if (tablePermissions) {
        for (const tablePerm of tablePermissions) {
          for (const [op, permData] of Object.entries(tablePerm.permissions)) {
            if (permData && permData.enabled) {
              permIdsToAdd.push(permData.id)
            }
          }
        }
      }

      if (menuPermissions) {
        for (const menuKey of menuPermissions) {
          const menuPermCode = menuKey.startsWith('menu.') ? menuKey : `menu.${menuKey}`
          const menuPerm = await this.db.query(
            'SELECT BIN_TO_UUID(id) as id FROM `permissions` WHERE code = ?',
            [menuPermCode]
          )
          if (menuPerm.length > 0) {
            permIdsToAdd.push(menuPerm[0].id)
          }
        }
      }

      if (permIdsToAdd.length > 0) {
        const roleBinId = `UUID_TO_BIN('${id}')`
        const placeholders = permIdsToAdd.map(() => `(${roleBinId}, UUID_TO_BIN(?))`).join(', ')
        const permParams = [...permIdsToAdd]
        await this.db.query(
          `INSERT INTO \`role_permissions\` (role_id, permission_id) VALUES ${placeholders}`,
          permParams
        )
      }
    } else if (permissions !== undefined) {
      await this.db.query('DELETE FROM `role_permissions` WHERE role_id = UUID_TO_BIN(?)', [id])

      if (permissions.length > 0) {
        const roleBinId = `UUID_TO_BIN('${id}')`
        const placeholders = permissions.map(() => `(${roleBinId}, UUID_TO_BIN(?))`).join(', ')
        const permParams = [...permissions]
        await this.db.query(
          `INSERT INTO \`role_permissions\` (role_id, permission_id) VALUES ${placeholders}`,
          permParams
        )
      }
    }

    return { success: true }
  }

  async delete (id, userId = null, companyId = null) {
    if (id === 1) {
      throw new BadRequestError('No se puede eliminar el rol de administrador')
    }

    const exists = await this.getById(id, companyId)
    
    let whereClause = 'WHERE id = UUID_TO_BIN(?)'
    const params = [id]
    
    if (companyId) {
      whereClause += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    if (userId) {
      await this.db.query(`UPDATE \`roles\` SET is_delete = 1, updated_by = UUID_TO_BIN(?) ${whereClause}`, [userId, ...params])
    } else {
      await this.db.query(`UPDATE \`roles\` SET is_delete = 1 ${whereClause}`, params)
    }

    return { success: true }
  }

  async restore (id) {
    const rows = await this.db.query('SELECT id, name, description, is_delete, created_at, updated_at FROM `roles` WHERE id = UUID_TO_BIN(?)', [id])
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Rol no encontrado')
    }

    await this.db.query('UPDATE `roles` SET is_delete = 0 WHERE id = UUID_TO_BIN(?)', [id])
    return { success: true }
  }
}

export class PermissionsRepository {
  constructor (db) {
    this.db = db
  }

  async getAll () {
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id, code, description FROM `permissions` ORDER BY id')
    return rows
  }

  async getAllGroupedByTable () {
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id, code, description FROM `permissions` ORDER BY code')
    
    const grouped = {}
    for (const row of rows) {
      if (row.code.startsWith('menu.')) {
        continue
      }
      const parts = row.code.split('.')
      if (parts.length === 2) {
        const [table, operation] = parts
        if (!grouped[table]) {
          grouped[table] = { table, permissions: { create: false, read: false, update: false, delete: false } }
        }
        const op = operation.toLowerCase()
        if (['create', 'read', 'update', 'delete'].includes(op)) {
          grouped[table].permissions[op] = { id: row.id, code: row.code, enabled: true }
        }
      }
    }
    
    return Object.values(grouped)
  }

  async getDatabaseTables () {
    const tables = await this.db.query("SHOW TABLES")
    const tableKey = `Tables_in_${process.env.MYSQL_DATABASE || 'vuno_pointofsale'}`
    const excludeTables = [
      'dashboard',
      'drawer',
      'inventory',
      'payments',
      'reports',
      'settings',
      'shift_configs',
      'shift_sessions',
      'sales',
      'sale_items',
      'sale_payments',
      'sale_suspensions',
      'returns',
      'return_items',
      'cash_drawers',
      'drawer_transactions',
      'adjustments',
      'adjustment_items',
      'transfers',
      'transfer_items'
    ]
    return tables.map(t => t[tableKey]).filter(t => !t.startsWith('role_') && !t.startsWith('_') && !excludeTables.includes(t))
  }

  async syncTablePermissions () {
    const tables = await this.getDatabaseTables()
    const operations = ['create', 'read', 'update', 'delete']
    
    for (const table of tables) {
      for (const op of operations) {
        const code = `${table}.${op}`
        const existing = await this.db.query('SELECT id FROM `permissions` WHERE code = ?', [code])
        if (existing.length === 0) {
          await this.db.query(
            'INSERT INTO `permissions` (id, code, description) VALUES (UUID_TO_BIN(UUID()), ?, ?)',
            [code, `${op.charAt(0).toUpperCase() + op.slice(1)} ${table}`]
          )
        }
      }
    }
    
    return { success: true, message: 'Permisos de tabla sincronizados' }
  }

  async cleanOrphanPermissions () {
    const validSuffixes = ['create', 'read', 'update', 'delete', 'view', 'manage', 'open', 'close']
    const excludedPrefixes = [
      'menu.',
      'dashboard.',
      'drawer.',
      'inventory.',
      'payments.',
      'reports.',
      'settings.',
      'shift_configs.',
      'shift_sessions.',
      'sales.',
      'sale_items.',
      'sale_payments.',
      'sale_suspensions.',
      'returns.',
      'return_items.',
      'cash_drawers.',
      'drawer_transactions.',
      'adjustments.',
      'adjustment_items.',
      'transfers.',
      'transfer_items.'
    ]

    let deletedCount = 0

    const allPerms = await this.db.query('SELECT BIN_TO_UUID(id) as id, code FROM `permissions`')
    
    for (const perm of allPerms) {
      const suffix = perm.code.split('.')[1]
      const prefix = perm.code.split('.')[0]

      const isValidSuffix = validSuffixes.includes(suffix)
      const isExcludedPrefix = excludedPrefixes.some(p => perm.code.startsWith(p))
      const isMenuPerm = perm.code.startsWith('menu.')

      if (!isMenuPerm && !isValidSuffix) {
        await this.db.query('DELETE FROM `role_permissions` WHERE permission_id = UUID_TO_BIN(\'' + perm.id + '\')')
        await this.db.query('DELETE FROM `permissions` WHERE id = UUID_TO_BIN(\'' + perm.id + '\')')
        deletedCount++
      } else if (isExcludedPrefix && !isMenuPerm) {
        await this.db.query('DELETE FROM `role_permissions` WHERE permission_id = UUID_TO_BIN(\'' + perm.id + '\')')
        await this.db.query('DELETE FROM `permissions` WHERE id = UUID_TO_BIN(\'' + perm.id + '\')')
        deletedCount++
      }
    }

    return { success: true, message: `Se eliminaron ${deletedCount} permisos huérfanos` }
  }

  async syncMenuPermissions () {
    let inserted = 0
    for (const item of MENU_ITEMS) {
      const existing = await this.db.query('SELECT id FROM `permissions` WHERE code = ?', [item.permission])
      if (existing.length === 0) {
        await this.db.query(
          'INSERT INTO `permissions` (id, code, description) VALUES (UUID_TO_BIN(UUID()), ?, ?)',
          [item.permission, `Ver ${item.name}`]
        )
        inserted++
      }
    }
    
    return { success: true, message: `Permisos de menú sincronizados: ${inserted} nuevos de ${MENU_ITEMS.length} páginas` }
  }

  async getAllMenuPermissions () {
    const rows = await this.db.query(
      'SELECT BIN_TO_UUID(id) as id, code, description FROM `permissions` WHERE code LIKE \'menu.%\' ORDER BY code'
    )
    return rows
  }

  async getMenuConfig () {
    return { sections: MENU_SECTIONS, items: MENU_ITEMS }
  }

  async getById (id) {
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id, code, description, created_at, updated_at FROM `permissions` WHERE id = UUID_TO_BIN(?)', [id])
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Permiso no encontrado')
    }
    return rows[0]
  }

  async getAllWithMeta () {
    const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id, code, description, created_at, updated_at FROM `permissions` ORDER BY code')
    const menuPerms = rows.filter(p => p.code.startsWith('menu.'))
    const tablePerms = rows.filter(p => !p.code.startsWith('menu.'))
    
    return {
      menu: menuPerms,
      tables: tablePerms
    }
  }

  async getRoutePermissions () {
    const rows = await this.db.query('SELECT code FROM `permissions`')
    return rows.map(r => r.code)
  }

  async create ({ code, name, description }, userId = null) {
    if (!code) {
      throw new BadRequestError('Código del permiso requerido')
    }

    const existing = await this.db.query('SELECT id FROM `permissions` WHERE code = ?', [code])
    if (existing && existing.length > 0) {
      throw new BadRequestError('El permiso ya existe')
    }

    const fields = ['code', 'name', 'description']
    const values = [code, name || null, description || null]

    if (userId) {
      fields.push('created_by')
      values.push('UUID_TO_BIN(?)')
      values.push(userId)
    }

    const placeholders = fields.map(() => '?').join(', ')
    const result = await this.db.query(
      `INSERT INTO \`permissions\` (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    )

    return { id: result.insertId }
  }

  async update (id, { code, name, description }, userId = null) {
    const existing = await this.db.query('SELECT id FROM `permissions` WHERE id = UUID_TO_BIN(?)', [id])
    if (!existing || existing.length === 0) {
      throw new NotFoundError('Permiso no encontrado')
    }

    const updates = []
    const params = []

    if (code) {
      updates.push('code = ?')
      params.push(code)
    }
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (userId) {
      updates.push('updated_by = ?')
      params.push('UUID_TO_BIN(?)')
      params.push(userId)
    }

    if (updates.length > 0) {
      params.push(UUID_TO_BIN(id))
      await this.db.query(`UPDATE \`permissions\` SET ${updates.join(', ')} WHERE id = ?`, params)
    }

    return { success: true }
  }

  async delete (id) {
    await this.db.query('DELETE FROM `role_permissions` WHERE permission_id = UUID_TO_BIN(?)', [id])
    await this.db.query('DELETE FROM `permissions` WHERE id = UUID_TO_BIN(?)', [id])
    return { success: true }
  }
}
