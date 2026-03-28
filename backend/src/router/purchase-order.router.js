import { Router } from 'express'
import database from '../config/database.js'
import { PurchaseOrderRepository } from '../repository/purchase-order.repository.js'
import { PurchaseOrderModel } from '../models/purchase-order.model.js'
import { PurchaseOrderController } from '../controllers/purchase-order.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const poRepo = new PurchaseOrderRepository(database)
const poModel = new PurchaseOrderModel(poRepo)
const poController = new PurchaseOrderController(poModel)

const router = Router()

router.get('/', authenticate, (req, res, next) => poController.getAll(req, res, next))
router.get('/:id', authenticate, (req, res, next) => poController.getById(req, res, next))
router.post('/', authenticate, (req, res, next) => poController.create(req, res, next))
router.put('/:id', authenticate, (req, res, next) => poController.update(req, res, next))
router.delete('/:id', authenticate, (req, res, next) => poController.delete(req, res, next))
router.post('/generate-auto', authenticate, (req, res, next) => poController.generateAuto(req, res, next))

export default router
