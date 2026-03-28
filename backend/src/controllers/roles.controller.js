import { permissionsService } from '../utils/permissions.utils.js'

export class RolesController {
  constructor (rolesModel) {
    this.rolesModel = rolesModel
  }

  async getAll (req, res, next) {
    try {
      const roles = await this.rolesModel.getAll()
      res.status(200).json({ success: true, data: roles })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const { id } = req.params
      const role = await this.rolesModel.getById(id)
      res.status(200).json({ success: true, data: role })
    } catch (error) {
      next(error)
    }
  }

  async getByIdWithTablePermissions (req, res, next) {
    try {
      const { id } = req.params
      const role = await this.rolesModel.getByIdWithTablePermissions(id)
      res.status(200).json({ success: true, data: role })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const { name, description, permissions, tablePermissions, menuPermissions } = req.body
      const userId = req.user?.user_id || null
      const result = await this.rolesModel.create({ name, description, permissions, tablePermissions, menuPermissions }, userId)
      res.status(201).json({
        success: true,
        message: 'Rol creado',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const { id } = req.params
      const { name, description, permissions, tablePermissions, menuPermissions } = req.body
      const userId = req.user?.user_id || null
      await this.rolesModel.update(id, { name, description, permissions, tablePermissions, menuPermissions }, userId)
      res.status(200).json({ success: true, message: 'Rol actualizado' })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user?.user_id || null
      await this.rolesModel.delete(id, userId)
      res.status(200).json({ success: true, message: 'Rol eliminado' })
    } catch (error) {
      next(error)
    }
  }

  async restore (req, res, next) {
    try {
      const { id } = req.params
      await this.rolesModel.restore(id)
      res.status(200).json({ success: true, message: 'Rol restaurado' })
    } catch (error) {
      next(error)
    }
  }
}

export class PermissionsController {
  constructor (permissionsModel) {
    this.permModel = permissionsModel
  }

  async getAll (req, res, next) {
    try {
      const permissions = await this.permModel.getAll()
      res.status(200).json({ success: true, data: permissions })
    } catch (error) {
      next(error)
    }
  }

  async getAllGroupedByTable (req, res, next) {
    try {
      const permissions = await this.permModel.getAllGroupedByTable()
      res.status(200).json({ success: true, data: permissions })
    } catch (error) {
      next(error)
    }
  }

  async getDatabaseTables (req, res, next) {
    try {
      const tables = await this.permModel.getDatabaseTables()
      res.status(200).json({ success: true, data: tables })
    } catch (error) {
      next(error)
    }
  }

  async syncTablePermissions (req, res, next) {
    try {
      const result = await this.permModel.syncTablePermissions()
      await permissionsService.syncAndReload()
      res.status(200).json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

  async cleanOrphanPermissions (req, res, next) {
    try {
      const result = await this.permModel.cleanOrphanPermissions()
      await permissionsService.syncAndReload()
      res.status(200).json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

  async syncMenuPermissions (req, res, next) {
    try {
      const result = await this.permModel.syncMenuPermissions()
      await permissionsService.syncAndReload()
      res.status(200).json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

  async getAllMenuPermissions (req, res, next) {
    try {
      const permissions = await this.permModel.getAllMenuPermissions()
      res.status(200).json({ success: true, data: permissions })
    } catch (error) {
      next(error)
    }
  }

  async getMenuConfig (req, res, next) {
    try {
      const config = await this.permModel.getMenuConfig()
      res.status(200).json({ success: true, data: config })
    } catch (error) {
      next(error)
    }
  }

  async getAllWithMeta (req, res, next) {
    try {
      const permissions = await this.permModel.getAllWithMeta()
      res.status(200).json({ success: true, data: permissions })
    } catch (error) {
      next(error)
    }
  }

  async getRoutePermissions (req, res, next) {
    try {
      const routePerms = await this.permModel.getRoutePermissions()
      res.status(200).json({ success: true, data: routePerms })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const { id } = req.params
      const permission = await this.permModel.getById(id)
      res.status(200).json({ success: true, data: permission })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const { code, name, description } = req.body
      const userId = req.user?.user_id || null
      const result = await this.permModel.create({ code, name, description }, userId)
      await permissionsService.syncAndReload()
      res.status(201).json({
        success: true,
        message: 'Permiso creado',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const { id } = req.params
      const { code, name, description } = req.body
      const userId = req.user?.user_id || null
      await this.permModel.update(id, { code, name, description }, userId)
      await permissionsService.syncAndReload()
      res.status(200).json({ success: true, message: 'Permiso actualizado' })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user?.user_id || null
      await this.permModel.delete(id, userId)
      await permissionsService.syncAndReload()
      res.status(200).json({ success: true, message: 'Permiso eliminado' })
    } catch (error) {
      next(error)
    }
  }
}
