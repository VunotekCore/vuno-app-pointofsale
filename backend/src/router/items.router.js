import { Router } from 'express'
import database from '../config/database.js'
import { ItemsRepository } from '../repository/items.repository.js'
import { ItemsModel } from '../models/items.model.js'
import { ItemsController } from '../controllers/items.controller.js'
import { SequenceRepository } from '../repository/sequence.repository.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const sequenceRepo = new SequenceRepository(database)
const itemsRepo = new ItemsRepository(database, sequenceRepo)
const itemsModel = new ItemsModel(itemsRepo, sequenceRepo)
const itemsController = new ItemsController(itemsModel)

const router = Router()
const itemsBasePath = '/items'

router.get('/', authenticate, requirePermission('items.read'), (req, res, next) => itemsController.getAll(req, res, next))
router.get('/:id', authenticate, requirePermission('items.read'), (req, res, next) => itemsController.getById(req, res, next))
router.get('/:id/price-history', authenticate, requirePermission('items.read'), (req, res, next) => itemsController.getPriceHistory(req, res, next))
router.post('/:id/image', authenticateActive, requirePermission('items.write'), (req, res, next) => itemsController.uploadImage(req, res, next))
router.post('/', authenticateActive, requirePermission('items.write'), (req, res, next) => itemsController.create(req, res, next))
router.put('/:id', authenticateActive, requirePermission('items.write'), (req, res, next) => itemsController.update(req, res, next))
router.delete('/:id', authenticateActive, requirePermission('items.delete'), (req, res, next) => itemsController.delete(req, res, next))
router.post('/:id/restore', authenticateActive, requirePermission('items.write'), (req, res, next) => itemsController.restore(req, res, next))

export default router
