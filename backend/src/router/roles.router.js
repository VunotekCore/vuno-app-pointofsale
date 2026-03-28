import { Router } from 'express'
import database from '../config/database.js'
import { RolesRepository, PermissionsRepository } from '../repository/roles.repository.js'
import { RolesModel, PermissionsModel } from '../models/roles.model.js'
import { RolesController, PermissionsController } from '../controllers/roles.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const rolesRepo = new RolesRepository(database)
const rolesModel = new RolesModel(rolesRepo)
const rolesController = new RolesController(rolesModel)

const permRepo = new PermissionsRepository(database)
const permModel = new PermissionsModel(permRepo)
const permController = new PermissionsController(permModel)

const rolesRouter = Router()
const rolesBasePath = '/roles'

rolesRouter.get('/', authenticate, requireRoutePermission(rolesBasePath), (req, res, next) => rolesController.getAll(req, res, next))
rolesRouter.get('/:id', authenticate, requireRoutePermission(rolesBasePath), (req, res, next) => rolesController.getById(req, res, next))
rolesRouter.get('/:id/table-permissions', authenticate, requireRoutePermission(rolesBasePath), (req, res, next) => rolesController.getByIdWithTablePermissions(req, res, next))
rolesRouter.post('/', authenticate, requireRoutePermission(rolesBasePath), (req, res, next) => rolesController.create(req, res, next))
rolesRouter.put('/:id', authenticate, requireRoutePermission(rolesBasePath), (req, res, next) => rolesController.update(req, res, next))
rolesRouter.delete('/:id', authenticate, requireRoutePermission(rolesBasePath), (req, res, next) => rolesController.delete(req, res, next))
rolesRouter.post('/:id/restore', authenticate, requireRoutePermission(rolesBasePath), (req, res, next) => rolesController.restore(req, res, next))

const permissionsRouter = Router()
const permissionsBasePath = '/permissions'

permissionsRouter.get('/', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.getAll(req, res, next))
permissionsRouter.get('/all', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.getAllWithMeta(req, res, next))
permissionsRouter.get('/grouped', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.getAllGroupedByTable(req, res, next))
permissionsRouter.get('/tables', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.getDatabaseTables(req, res, next))
permissionsRouter.get('/menu', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.getAllMenuPermissions(req, res, next))
permissionsRouter.get('/menu-config', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.getMenuConfig(req, res, next))
permissionsRouter.get('/route-permissions', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.getRoutePermissions(req, res, next))
permissionsRouter.post('/sync', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.syncTablePermissions(req, res, next))
permissionsRouter.post('/clean-orphan', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.cleanOrphanPermissions(req, res, next))
permissionsRouter.post('/sync-menu', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.syncMenuPermissions(req, res, next))
permissionsRouter.post('/', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.create(req, res, next))
permissionsRouter.put('/:id', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.update(req, res, next))
permissionsRouter.delete('/:id', authenticate, requireRoutePermission(permissionsBasePath), (req, res, next) => permController.delete(req, res, next))

export { rolesRouter, permissionsRouter }
