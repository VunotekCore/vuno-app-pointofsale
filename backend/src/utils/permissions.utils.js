import { permissionsModel } from '../models/permissions.model.js'

class PermissionsService {
  constructor () {
    this.permissions = new Set()
    this.isLoaded = false
  }

  async loadPermissions () {
    const rows = await permissionsModel.getAll()
    this.permissions = new Set(rows.map((r) => r.code))
    this.isLoaded = true
  }

  hasPermission (code) {
    return this.permissions.has(code)
  }

  getAllPermissions () {
    return Array.from(this.permissions)
  }

  async syncAndReload () {
    await this.loadPermissions()
  }
}

export const permissionsService = new PermissionsService()
