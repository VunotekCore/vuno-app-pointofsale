import { permissionsRepository } from '../repository/permissions.repository.js'

export class PermissionsModel {
  constructor () {
    this.permissionsRepo = permissionsRepository
  }

  async getAll () {
    return await this.permissionsRepo.getAll()
  }

  async userHasPermission (userId, permissionCode) {
    return await this.permissionsRepo.userHasPermission(userId, permissionCode)
  }

  async getUserPermissions (userId) {
    return await this.permissionsRepo.getUserPermissions(userId)
  }
}

export const permissionsModel = new PermissionsModel()
