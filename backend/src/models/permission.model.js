import { NotFoundError, BadRequestError } from '../errors/index.js'

export class PermissionModel {
  constructor (permissionRepository) {
    this.permissionRepo = permissionRepository
  }

  async getAll (options = {}) {
    return await this.permissionRepo.findAll(options)
  }

  async findAllNoPagination () {
    return await this.permissionRepo.findAllNoPagination()
  }

  async getById (id) {
    const permission = await this.permissionRepo.findById(id)
    if (!permission) throw new NotFoundError('Permission not found')
    return permission
  }

  async create (permissionData) {
    const existing = await this.permissionRepo.findByCode(permissionData.code)
    if (existing) {
      throw new BadRequestError('Permission code already exists')
    }
    await this.permissionRepo.create(permissionData)
    return { message: 'Permission created successfully' }
  }

  async update (id, permissionData) {
    const existing = await this.permissionRepo.findById(id)
    if (!existing) throw new NotFoundError('Permission not found')
    await this.permissionRepo.update(id, permissionData)
    return { message: 'Permission updated successfully' }
  }

  async delete (id) {
    const existing = await this.permissionRepo.findById(id)
    if (!existing) throw new NotFoundError('Permission not found')
    await this.permissionRepo.delete(id)
    return { message: 'Permission deleted successfully' }
  }

  async getPermissionsByRole (roleId) {
    return await this.permissionRepo.getPermissionsByRole(roleId)
  }

  async updateRolePermissions (roleId, permissionIds) {
    const currentPermissions = await this.permissionRepo.getPermissionsByRole(roleId)
    const currentIds = currentPermissions.map((p) => p.id)

    const toRemove = currentIds.filter((id) => !permissionIds.includes(id))
    const toAdd = permissionIds.filter((id) => !currentIds.includes(id))

    for (const permissionId of toRemove) {
      await this.permissionRepo.removePermissionFromRole(roleId, permissionId)
    }
    for (const permissionId of toAdd) {
      await this.permissionRepo.assignPermissionToRole(roleId, permissionId)
    }

    return { message: 'Role permissions updated' }
  }

  async getPermissionsByUser (userId) {
    return await this.permissionRepo.getPermissionsByUser(userId)
  }

  async updateUserPermissions (userId, permissionIds) {
    const currentPermissions = await this.permissionRepo.getPermissionsByUser(userId)
    const currentIds = currentPermissions.map((p) => p.id)

    const toRemove = currentIds.filter((id) => !permissionIds.includes(id))
    const toAdd = permissionIds.filter((id) => !currentIds.includes(id))

    for (const permissionId of toRemove) {
      await this.permissionRepo.removePermissionFromUser(userId, permissionId)
    }
    for (const permissionId of toAdd) {
      await this.permissionRepo.assignPermissionToUser(userId, permissionId)
    }

    return { message: 'User permissions updated' }
  }

  async getEffectivePermissions (userId) {
    return await this.permissionRepo.getEffectivePermissions(userId)
  }

  async detectNewTables () {
    return await this.permissionRepo.detectNewTables()
  }

  async createFromTables (tableNames) {
    const created = await this.permissionRepo.createFromTables(tableNames)
    return { message: `Se crearon ${created.length} permisos`, created }
  }

  async detectAndCleanTables () {
    return await this.permissionRepo.detectAndCleanTables()
  }

  async syncUIViewPermissions (routes) {
    return await this.permissionRepo.syncUIViewPermissions(routes)
  }
}
