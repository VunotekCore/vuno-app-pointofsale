import { Router } from 'express'
import database from '../config/database.js'
import { UnitsRepository } from '../repository/units.repository.js'
import { UnitsModel } from '../models/units.model.js'
import { UnitsController } from '../controllers/units.controller.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const unitsRepo = new UnitsRepository(database)
const unitsModel = new UnitsModel(unitsRepo)
const unitsController = new UnitsController(unitsModel)

const router = Router()
const basePath = '/units'

router.get('/', authenticate, requirePermission('units.read'), (req, res, next) => unitsController.getAll(req, res, next))
router.get('/:id', authenticate, requirePermission('units.read'), (req, res, next) => unitsController.getById(req, res, next))
router.get('/item/:itemId/units', authenticate, requirePermission('units.read'), (req, res, next) => unitsController.getItemUnits(req, res, next))
router.get('/calculate-price', authenticate, requirePermission('units.read'), (req, res, next) => unitsController.calculatePrice(req, res, next))

router.post('/item-units', authenticateActive, requirePermission('units.write'), (req, res, next) => unitsController.createItemUnit(req, res, next))
router.put('/item-units/:id', authenticateActive, requirePermission('units.write'), (req, res, next) => unitsController.updateItemUnit(req, res, next))
router.delete('/item-units/:id', authenticateActive, requirePermission('units.delete'), (req, res, next) => unitsController.deleteItemUnit(req, res, next))

export default router
