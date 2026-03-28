export class RolesModel {
  constructor (rolesRepository) {
    this.rolesRepo = rolesRepository
  }

  async getAll () {
    return await this.rolesRepo.getAll()
  }

  async getById (id) {
    return await this.rolesRepo.getById(id)
  }

  async getByIdWithTablePermissions (id) {
    return await this.rolesRepo.getByIdWithTablePermissions(id)
  }

  async create (data, userId = null) {
    return await this.rolesRepo.create(data, userId)
  }

  async update (id, data, userId = null) {
    return await this.rolesRepo.update(id, data, userId)
  }

  async delete (id, userId = null) {
    return await this.rolesRepo.delete(id, userId)
  }

  async restore (id) {
    return await this.rolesRepo.restore(id)
  }
}

export class PermissionsModel {
  constructor (permissionsRepository) {
    this.permRepo = permissionsRepository
  }

  async getAll () {
    return await this.permRepo.getAll()
  }

  async getAllGroupedByTable () {
    return await this.permRepo.getAllGroupedByTable()
  }

  async getDatabaseTables () {
    return await this.permRepo.getDatabaseTables()
  }

  async syncTablePermissions () {
    return await this.permRepo.syncTablePermissions()
  }

  async cleanOrphanPermissions () {
    return await this.permRepo.cleanOrphanPermissions()
  }

  async syncMenuPermissions () {
    return await this.permRepo.syncMenuPermissions()
  }

  async getAllMenuPermissions () {
    return await this.permRepo.getAllMenuPermissions()
  }

  async getMenuConfig () {
    return await this.permRepo.getMenuConfig()
  }

  async getAllWithMeta () {
    return await this.permRepo.getAllWithMeta()
  }

  async getRoutePermissions () {
    return await this.permRepo.getRoutePermissions()
  }

  async getById (id) {
    return await this.permRepo.getById(id)
  }

  async create (data, userId = null) {
    return await this.permRepo.create(data, userId)
  }

  async update (id, data, userId = null) {
    return await this.permRepo.update(id, data, userId)
  }

  async delete (id, userId = null) {
    return await this.permRepo.delete(id, userId)
  }
}
