export class PermissionController {
  constructor (permissionModel) {
    this.permissionModel = permissionModel
  }

  async getAll (req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 20
      const offset = (page - 1) * limit
      const search = req.query.search || ''
      const action = req.query.action || ''
      const result = await this.permissionModel.getAll({ page, limit, offset, search, action })

      res.status(200).json({ success: true, data: result.permissions, pagination: result.pagination })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const permission = await this.permissionModel.getById(req.params.id)
      res.status(200).json({ success: true, data: permission })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      await this.permissionModel.create(req.body)
      res.status(201).json({ success: true, message: 'Permission created' })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      await this.permissionModel.update(req.params.id, req.body)
      res.status(200).json({ success: true, message: 'Permission updated' })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      await this.permissionModel.delete(req.params.id)
      res.status(200).json({ success: true, message: 'Permission deleted' })
    } catch (error) {
      next(error)
    }
  }

  async getPermissionsByRole (req, res, next) {
    try {
      const permissions = await this.permissionModel.getPermissionsByRole(req.params.roleId)
      res.status(200).json({ success: true, data: permissions })
    } catch (error) {
      next(error)
    }
  }

  async updateRolePermissions (req, res, next) {
    try {
      const { permissionIds } = req.body
      await this.permissionModel.updateRolePermissions(req.params.roleId, permissionIds)
      res.status(200).json({ success: true, message: 'Role permissions updated' })
    } catch (error) {
      next(error)
    }
  }

  async getPermissionsByUser (req, res, next) {
    try {
      const permissions = await this.permissionModel.getPermissionsByUser(req.params.userId)
      res.status(200).json({ success: true, data: permissions })
    } catch (error) {
      next(error)
    }
  }

  async updateUserPermissions (req, res, next) {
    try {
      const { permissionIds } = req.body
      await this.permissionModel.updateUserPermissions(req.params.userId, permissionIds)
      res.status(200).json({ success: true, message: 'User permissions updated' })
    } catch (error) {
      next(error)
    }
  }

  async getEffectivePermissions (req, res, next) {
    try {
      const permissions = await this.permissionModel.getEffectivePermissions(req.params.userId)
      res.status(200).json({ success: true, data: permissions })
    } catch (error) {
      next(error)
    }
  }

  async syncTables (req, res, next) {
    try {
      const result = await this.permissionModel.detectAndCleanTables()
      res.status(200).json({ success: true, message: result.message, data: result })
    } catch (error) {
      next(error)
    }
  }

  async syncViews (req, res, next) {
    try {
      const routes = req.body?.routes || []
      const result = await this.permissionModel.syncUIViewPermissions(routes)
      res.status(200).json({ success: true, message: result.message, data: result })
    } catch (error) {
      next(error)
    }
  }
}
