import { Router } from 'express'
import database from '../config/database.js'
import { UserLocationsRepository } from '../repository/user-locations.repository.js'
import { UserLocationsController } from '../controllers/user-locations.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const userLocationsRepo = new UserLocationsRepository(database)
const controller = new UserLocationsController(userLocationsRepo)

const router = Router()

router.get('/me/locations', authenticate, (req, res, next) => controller.getLocationsForUser(req, res, next))

router.get('/users/:userId/locations', authenticate, requireRoutePermission('/users'), (req, res, next) => controller.getByUserId(req, res, next))
router.post('/users/locations', authenticate, requireRoutePermission('/users'), (req, res, next) => controller.add(req, res, next))
router.delete('/users/:user_id/locations/:location_id', authenticate, requireRoutePermission('/users'), (req, res, next) => controller.remove(req, res, next))
router.put('/users/locations/default', authenticate, requireRoutePermission('/users'), (req, res, next) => controller.setDefault(req, res, next))

export default router
