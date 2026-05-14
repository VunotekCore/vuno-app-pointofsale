import { Router } from 'express'
import database from '../config/database.js'
import { LocationsRepository } from '../repository/locations.repository.js'
import { LocationsModel } from '../models/locations.model.js'
import { LocationsController } from '../controllers/locations.controller.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const locationsRepo = new LocationsRepository(database)
const locationsModel = new LocationsModel(locationsRepo)
const locationsController = new LocationsController(locationsModel)

const router = Router()
const locationsBasePath = '/locations'

router.get('/', authenticate, requirePermission('locations.read'), (req, res, next) => locationsController.getAll(req, res, next))
router.get('/:id', authenticate, requirePermission('locations.read'), (req, res, next) => locationsController.getById(req, res, next))
router.post('/', authenticateActive, requirePermission('locations.write'), (req, res, next) => locationsController.create(req, res, next))
router.put('/:id', authenticateActive, requirePermission('locations.write'), (req, res, next) => locationsController.update(req, res, next))
router.delete('/:id', authenticateActive, requirePermission('locations.delete'), (req, res, next) => locationsController.delete(req, res, next))
router.post('/:id/restore', authenticateActive, requirePermission('locations.write'), (req, res, next) => locationsController.restore(req, res, next))

export default router
