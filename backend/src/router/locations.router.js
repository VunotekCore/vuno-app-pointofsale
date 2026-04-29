import { Router } from 'express'
import database from '../config/database.js'
import { LocationsRepository } from '../repository/locations.repository.js'
import { LocationsModel } from '../models/locations.model.js'
import { LocationsController } from '../controllers/locations.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const locationsRepo = new LocationsRepository(database)
const locationsModel = new LocationsModel(locationsRepo)
const locationsController = new LocationsController(locationsModel)

const router = Router()
const locationsBasePath = '/locations'

router.get('/', authenticate, requireRoutePermission(locationsBasePath), (req, res, next) => locationsController.getAll(req, res, next))
router.get('/:id', authenticate, requireRoutePermission(locationsBasePath), (req, res, next) => locationsController.getById(req, res, next))
router.post('/', authenticate, requireRoutePermission(locationsBasePath), (req, res, next) => locationsController.create(req, res, next))
router.put('/:id', authenticate, requireRoutePermission(locationsBasePath), (req, res, next) => locationsController.update(req, res, next))
router.delete('/:id', authenticate, requireRoutePermission(locationsBasePath), (req, res, next) => locationsController.delete(req, res, next))
router.post('/:id/restore', authenticate, requireRoutePermission(locationsBasePath), (req, res, next) => locationsController.restore(req, res, next))

export default router
