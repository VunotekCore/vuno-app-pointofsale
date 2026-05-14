import { Router } from 'express'
import database from '../config/database.js'
import { PurchaseOrderRepository } from '../repository/purchase-order.repository.js'
import { PurchaseOrderModel } from '../models/purchase-order.model.js'
import { PurchaseOrderController } from '../controllers/purchase-order.controller.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { SequenceRepository } from '../repository/sequence.repository.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const companyRepo = new CompanyRepository(database)
const sequenceRepo = new SequenceRepository(database, companyRepo)
const poRepo = new PurchaseOrderRepository(database, companyRepo, sequenceRepo)
const poModel = new PurchaseOrderModel(poRepo)
const poController = new PurchaseOrderController(poModel)

const router = Router()

router.get('/', authenticate, requirePermission('purchase_orders.read'), (req, res, next) => poController.getAll(req, res, next))
router.get('/:id', authenticate, requirePermission('purchase_orders.read'), (req, res, next) => poController.getById(req, res, next))
router.post('/', authenticateActive, requirePermission('purchase_orders.write'), (req, res, next) => poController.create(req, res, next))
router.put('/:id', authenticateActive, requirePermission('purchase_orders.write'), (req, res, next) => poController.update(req, res, next))
router.delete('/:id', authenticateActive, requirePermission('purchase_orders.delete'), (req, res, next) => poController.delete(req, res, next))
router.post('/generate-auto', authenticateActive, requirePermission('purchase_orders.write'), (req, res, next) => poController.generateAuto(req, res, next))

export default router
