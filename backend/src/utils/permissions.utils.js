import { permissionsModel } from '../models/permissions.model.js'

class PermissionsService {
  constructor () {
    this.permissions = new Set()
    this.isLoaded = false
  }

  async loadPermissions () {
    try {
      const rows = await permissionsModel.getAll()
      this.permissions = new Set(rows.map((r) => r.code))
      this.isLoaded = true
    } catch (error) {
      console.error(`[Permissions] Error: ${error.message}`)
      this.permissions = new Set()
      this.isLoaded = false
    }
  }

  hasPermission (code) {
    return this.permissions.has(code)
  }

  getAllPermissions () {
    return Array.from(this.permissions)
  }

  getPermissionCodeFromRoute (routePath, method) {
    const methodToAction = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete'
    }

    const routeToPermissionSuffix = {
      '/shifts': { GET: 'view', POST: 'open', PUT: 'update', PATCH: 'update', DELETE: 'delete' },
      '/shifts/configs': { GET: 'view', POST: 'create', PUT: 'update', DELETE: 'delete' },
      '/shifts/sessions': { GET: 'view', POST: 'create', PUT: 'update', DELETE: 'delete' },
      '/shifts/active': { GET: 'view' },
      '/shifts/sessions/open': { GET: 'view' },
      '/shifts/reminders': { GET: 'view' },
      '/payments': { GET: 'read' },
      '/payments/drawers': { GET: 'read' },
      '/sales': { GET: 'read' }
    }

    const routeToTable = {
      '/shifts': 'shift_configs',
      '/shifts/configs': 'shift_configs',
      '/shifts/sessions': 'shift_sessions',
      '/shifts/active': 'shift_sessions',
      '/shifts/sessions/open': 'shift_sessions',
      '/shifts/sessions/:id/close': 'shift_sessions',
      '/shifts/reminders': 'shift_sessions',
      '/payments': 'payments',
      '/payments/drawers': 'cash_drawers',
      '/sales': 'sales'
    }

    let action
    let table

    for (const [route, actions] of Object.entries(routeToPermissionSuffix)) {
      if (routePath.startsWith(route)) {
        action = actions[method] || methodToAction[method] || 'read'
        table = routeToTable[route]
        break
      }
    }

    if (!action) {
      action = methodToAction[method] || 'read'
    }

    const routeMapping = {
      '/core/locations': 'locations',
      '/core/categories': 'categories',
      '/core/suppliers': 'suppliers',
      '/inventory': 'items',
      '/shifts': 'shifts'
    }

    const permMapping = {
      '/users': 'users',
      '/roles': 'roles',
      '/permissions': 'permissions',
      '/customers': 'customers',
      '/sales': 'sales',
      '/items': 'items',
      '/locations': 'locations',
      '/categories': 'categories',
      '/suppliers': 'suppliers',
      '/inventory': 'inventory_transfers',
      '/shifts': 'shift_configs',
      '/payments': 'payments',
      '/payments/drawers': 'cash_drawers',
      '/payments/methods': 'payments'
    }

    const segments = routePath.split('/').filter((s) => s && !s.startsWith(':'))
    const resourceName = segments[segments.length - 1] || segments[0]

    if (!table) {
      table = resourceName
        .replace(/[^a-zA-Z]/g, '_')
        .toLowerCase()
        .replace(/^_|_$/g, '')
    }

    if (routeMapping[routePath] && !table) {
      table = routeMapping[routePath]
    }

    const viewCode = method === 'GET' ? `${table}.view` : null
    if (viewCode && this.hasPermission(viewCode)) {
      return viewCode
    }

    const code = `${table}.${action}`

    if (this.hasPermission(code)) {
      return code
    }

    if (method === 'GET' && this.hasPermission(`${table}.read`)) {
      return `${table}.read`
    }

    const fullPath = routePath
      .replace(/[^a-zA-Z]/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase()
    const fullCode = `${fullPath}.${action}`
    if (this.hasPermission(fullCode)) {
      return fullCode
    }

    if (segments.length > 1) {
      const firstResource = segments[0]
        .replace(/[^a-zA-Z]/g, '_')
        .toLowerCase()
        .replace(/^_|_$/g, '')
      const firstCode = `${firstResource}.${action}`
      if (this.hasPermission(firstCode)) {
        return firstCode
      }
      if (method === 'GET' && this.hasPermission(`${firstResource}.view`)) {
        return `${firstResource}.view`
      }
    }

    const relatedTablesMap = {
      inventory: [
        'inventory_adjustments',
        'inventory_movements',
        'item_quantities',
        'item_serials',
        'items'
      ],
      stock: ['item_quantities', 'inventory_adjustments'],
      movements: ['inventory_movements'],
      adjustments: ['inventory_adjustments', 'inventory_adjustment_items'],
      serials: ['item_serials'],
      'low-stock': ['item_quantities', 'items']
    }

    const baseResource = segments[0].replace(/[^a-zA-Z]/g, '_').toLowerCase()
    const relatedTables = relatedTablesMap[baseResource] || []

    for (const relatedTable of relatedTables) {
      const relatedCode = `${relatedTable}.${action}`
      if (this.hasPermission(relatedCode)) {
        return relatedCode
      }
      if (method === 'GET' && this.hasPermission(`${relatedTable}.view`)) {
        return `${relatedTable}.view`
      }
    }

    console.warn(`[Permissions] Permission not found: ${code} or ${fullCode}, allowing request`)
    return null
  }

  async syncAndReload () {
    await this.loadPermissions()
  }
}

export const permissionsService = new PermissionsService()
