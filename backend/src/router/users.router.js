import { Router } from 'express'
import database from '../config/database.js'
import { UsersRepository } from '../repository/users.repository.js'
import { UsersModel } from '../models/users.model.js'
import { UsersController } from '../controllers/users.controller.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const usersRepo = new UsersRepository(database)
const usersModel = new UsersModel(usersRepo)
const usersController = new UsersController(usersModel)

const router = Router()

const usersBasePath = '/users'

router.get('/', authenticate, requirePermission('users.read'), (req, res, next) => usersController.getAll(req, res, next))
router.get('/:id', authenticate, requirePermission('users.read'), (req, res, next) => usersController.getById(req, res, next))
router.post('/', authenticateActive, requirePermission('users.write'), (req, res, next) => usersController.create(req, res, next))
router.put('/:id', authenticateActive, requirePermission('users.write'), (req, res, next) => usersController.update(req, res, next))
router.delete('/:id', authenticateActive, requirePermission('users.delete'), (req, res, next) => usersController.delete(req, res, next))
router.post('/:id/restore', authenticateActive, requirePermission('users.write'), (req, res, next) => usersController.restore(req, res, next))
router.post('/:id/avatar', authenticateActive, requirePermission('users.write'), (req, res, next) => usersController.uploadAvatar(req, res, next))

export default router
