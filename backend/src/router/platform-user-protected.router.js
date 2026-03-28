import { Router } from 'express'
import database from '../config/database.js'
import { PlatformUserRepository } from '../repository/platform-user.repository.js'
import { PlatformUserModel } from '../models/platform-user.model.js'
import { PlatformUserController } from '../controllers/platform-user.controller.js'
import { platformAuth, superAdminOnly } from '../middleware/platform-auth.middleware.js'

const platformUserRepo = new PlatformUserRepository(database)
const platformUserModel = new PlatformUserModel(database)
const platformUserController = new PlatformUserController(platformUserModel)

const router = Router()

router.use(platformAuth)

router.get('/', superAdminOnly, (req, res, next) => platformUserController.getAll(req, res, next))
router.get('/:id', (req, res, next) => platformUserController.getProfile(req, res, next))
router.put('/:id', superAdminOnly, (req, res, next) => platformUserController.update(req, res, next))
router.delete('/:id', superAdminOnly, (req, res, next) => platformUserController.delete(req, res, next))
router.post('/:id/change-password', (req, res, next) => platformUserController.changePassword(req, res, next))

export default router
