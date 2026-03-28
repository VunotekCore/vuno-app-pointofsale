import { Router } from 'express'
import database from '../config/database.js'
import { UsersRepository } from '../repository/users.repository.js'
import { UsersModel } from '../models/users.model.js'
import { UsersController } from '../controllers/users.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const usersRepo = new UsersRepository(database)
const usersModel = new UsersModel(usersRepo)
const usersController = new UsersController(usersModel)

const router = Router()

const usersBasePath = '/users'

router.get('/', authenticate, requireRoutePermission(usersBasePath), (req, res, next) => usersController.getAll(req, res, next))
router.get('/:id', authenticate, requireRoutePermission(usersBasePath), (req, res, next) => usersController.getById(req, res, next))
router.post('/', authenticate, requireRoutePermission(usersBasePath), (req, res, next) => usersController.create(req, res, next))
router.put('/:id', authenticate, requireRoutePermission(usersBasePath), (req, res, next) => usersController.update(req, res, next))
router.delete('/:id', authenticate, requireRoutePermission(usersBasePath), (req, res, next) => usersController.delete(req, res, next))
router.post('/:id/restore', authenticate, requireRoutePermission(usersBasePath), (req, res, next) => usersController.restore(req, res, next))
router.post('/:id/avatar', authenticate, requireRoutePermission(usersBasePath), (req, res, next) => usersController.uploadAvatar(req, res, next))

export default router
