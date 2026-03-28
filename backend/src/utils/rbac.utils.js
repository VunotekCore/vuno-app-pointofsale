import { permissionsModel } from '../models/permissions.model.js'

export const userHasPermission = async (userId, permissionCode) => {
  try {
    return await permissionsModel.userHasPermission(userId, permissionCode)
  } catch (error) {
    console.error('RBAC check error:', error.message)
    return false
  }
}

export const getUserPermissions = async (userId) => {
  try {
    return await permissionsModel.getUserPermissions(userId)
  } catch (error) {
    console.error('Get permissions error:', error.message)
    return []
  }
}

export const getGenericPermissionCode = (table, method) => {
  let moduleName = table.split('_')[0].toUpperCase()

  const pluralMap = {
    CLIENTS: 'CLIENT',
    USERS: 'USER',
    TASKS: 'TASK',
    ROLES: 'ROLE',
    PERMISSIONS: 'PERMISSION',
    INVOICES: 'INVOICE',
    MODULES: 'MODULE',
    ACTIVITIES: 'ACTIVITY',
    UNITS: 'UNIT',
    LOCATIONS: 'LOCATION',
    BRANCHES: 'BRANCH'
  }

  if (pluralMap[moduleName]) {
    moduleName = pluralMap[moduleName]
  }

  const actionMap = {
    GET: 'READ',
    POST: 'CREATE',
    PUT: 'EDIT',
    DELETE: 'DELETE'
  }

  if (actionMap[method]) {
    return `${moduleName}_${actionMap[method]}`
  }
  return null
}
