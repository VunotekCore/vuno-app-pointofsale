import { Router } from 'express'
import database from '../config/database.js'
import { ItemsRepository } from '../repository/items.repository.js'
import { ItemsModel } from '../models/items.model.js'
import { ItemsController } from '../controllers/items.controller.js'
import { SequenceRepository } from '../repository/sequence.repository.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const sequenceRepo = new SequenceRepository(database)
const itemsRepo = new ItemsRepository(database, sequenceRepo)
const itemsModel = new ItemsModel(itemsRepo, sequenceRepo)
const itemsController = new ItemsController(itemsModel)

const router = Router()
const itemsBasePath = '/items'

router.get('/', authenticate, requireRoutePermission(itemsBasePath), (req, res, next) => itemsController.getAll(req, res, next))
router.get('/:id', authenticate, requireRoutePermission(itemsBasePath), (req, res, next) => itemsController.getById(req, res, next))
router.get('/:id/price-history', authenticate, requireRoutePermission(itemsBasePath), (req, res, next) => itemsController.getPriceHistory(req, res, next))
router.post('/:id/image', authenticate, requireRoutePermission(itemsBasePath), (req, res, next) => itemsController.uploadImage(req, res, next))
router.post('/', authenticate, requireRoutePermission(itemsBasePath), (req, res, next) => itemsController.create(req, res, next))
router.put('/:id', authenticate, requireRoutePermission(itemsBasePath), (req, res, next) => itemsController.update(req, res, next))
router.delete('/:id', authenticate, requireRoutePermission(itemsBasePath), (req, res, next) => itemsController.delete(req, res, next))
router.post('/:id/restore', authenticate, requireRoutePermission(itemsBasePath), (req, res, next) => itemsController.restore(req, res, next))

export default router
