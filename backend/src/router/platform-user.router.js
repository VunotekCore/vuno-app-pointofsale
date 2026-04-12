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

// console.log('platformUserRouter loaded')

router.post('/login', (req, res, next) => {
  platformUserController.login(req, res, next)
})
router.post('/register', (req, res, next) => platformUserController.register(req, res, next))
router.post('/companies/:id/switch', platformAuth, superAdminOnly, (req, res, next) => {
  platformUserController.switchToCompany(req, res, next)
})

export default router
