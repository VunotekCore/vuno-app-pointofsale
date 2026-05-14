import { Router } from 'express'
import database from '../config/database.js'
import { RolesRepository, PermissionsRepository } from '../repository/roles.repository.js'
import { RolesModel, PermissionsModel } from '../models/roles.model.js'
import { RolesController, PermissionsController } from '../controllers/roles.controller.js'
import { PermissionController } from '../controllers/permission.controller.js'
import { PermissionModel } from '../models/permission.model.js'
import { PermissionRepository } from '../repository/permission.repository.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const rolesRepo = new RolesRepository(database)
const rolesModel = new RolesModel(rolesRepo)
const rolesController = new RolesController(rolesModel)

const permRepo = new PermissionsRepository(database)
const permModel = new PermissionsModel(permRepo)
const permController = new PermissionsController(permModel)

const newPermRepo = new PermissionRepository(database)
const newPermModel = new PermissionModel(newPermRepo)
const newPermController = new PermissionController(newPermModel)

const rolesRouter = Router()

rolesRouter.get('/', authenticate, requirePermission('roles.read'), (req, res, next) => rolesController.getAll(req, res, next))
rolesRouter.get('/:id', authenticate, requirePermission('roles.read'), (req, res, next) => rolesController.getById(req, res, next))
rolesRouter.get('/:id/table-permissions', authenticate, requirePermission('roles.read'), (req, res, next) => rolesController.getByIdWithTablePermissions(req, res, next))
rolesRouter.post('/', authenticateActive, requirePermission('roles.write'), (req, res, next) => rolesController.create(req, res, next))
rolesRouter.put('/:id', authenticateActive, requirePermission('roles.write'), (req, res, next) => rolesController.update(req, res, next))
rolesRouter.delete('/:id', authenticateActive, requirePermission('roles.delete'), (req, res, next) => rolesController.delete(req, res, next))
rolesRouter.post('/:id/restore', authenticateActive, requirePermission('roles.write'), (req, res, next) => rolesController.restore(req, res, next))

const permissionsRouter = Router()

permissionsRouter.get('/', authenticate, (req, res, next) => permController.getAll(req, res, next))
permissionsRouter.get('/all', authenticate, (req, res, next) => permController.getAllWithMeta(req, res, next))
permissionsRouter.get('/grouped', authenticate, (req, res, next) => permController.getAllGroupedByTable(req, res, next))
permissionsRouter.get('/tables', authenticate, (req, res, next) => permController.getDatabaseTables(req, res, next))
permissionsRouter.get('/menu', authenticate, (req, res, next) => permController.getAllMenuPermissions(req, res, next))
permissionsRouter.get('/menu-config', authenticate, (req, res, next) => permController.getMenuConfig(req, res, next))
permissionsRouter.get('/route-permissions', authenticate, (req, res, next) => permController.getRoutePermissions(req, res, next))
permissionsRouter.post('/sync', authenticateActive, (req, res, next) => permController.syncTablePermissions(req, res, next))
permissionsRouter.post('/clean-orphan', authenticateActive, (req, res, next) => permController.cleanOrphanPermissions(req, res, next))
permissionsRouter.post('/sync-menu', authenticateActive, (req, res, next) => permController.syncMenuPermissions(req, res, next))

permissionsRouter.get('/role/:roleId', authenticate, (req, res, next) => newPermController.getPermissionsByRole(req, res, next))
permissionsRouter.put('/role/:roleId', authenticateActive, (req, res, next) => newPermController.updateRolePermissions(req, res, next))
permissionsRouter.get('/user/:userId', authenticate, (req, res, next) => newPermController.getPermissionsByUser(req, res, next))
permissionsRouter.put('/user/:userId', authenticateActive, (req, res, next) => newPermController.updateUserPermissions(req, res, next))
permissionsRouter.get('/effective/:userId', authenticate, (req, res, next) => newPermController.getEffectivePermissions(req, res, next))

permissionsRouter.post('/detect', authenticateActive, (req, res, next) => newPermController.syncTables(req, res, next))
permissionsRouter.post('/detect-views', authenticateActive, (req, res, next) => newPermController.syncViews(req, res, next))

permissionsRouter.get('/:id', authenticate, (req, res, next) => newPermController.getById(req, res, next))
permissionsRouter.post('/', authenticateActive, (req, res, next) => newPermController.create(req, res, next))
permissionsRouter.put('/:id', authenticateActive, (req, res, next) => newPermController.update(req, res, next))
permissionsRouter.delete('/:id', authenticateActive, (req, res, next) => newPermController.delete(req, res, next))

export { rolesRouter, permissionsRouter }
