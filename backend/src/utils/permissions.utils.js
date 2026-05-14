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

  async syncAndReload () {
    await this.loadPermissions()
  }
}

export const permissionsService = new PermissionsService()
