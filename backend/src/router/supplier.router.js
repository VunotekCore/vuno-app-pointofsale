import { Router } from 'express'
import { SupplierController } from '../controllers/supplier.controller.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const router = Router()
const supplierController = new SupplierController()

router.get('/', authenticate, requirePermission('suppliers.read'), (req, res, next) => supplierController.getAll(req, res, next))
router.get('/active', authenticate, requirePermission('suppliers.read'), (req, res, next) => supplierController.getActive(req, res, next))
router.get('/:id', authenticate, requirePermission('suppliers.read'), (req, res, next) => supplierController.getById(req, res, next))
router.get('/:id/history', authenticate, requirePermission('suppliers.read'), (req, res, next) => supplierController.getHistory(req, res, next))
router.post('/', authenticateActive, requirePermission('suppliers.write'), (req, res, next) => supplierController.create(req, res, next))
router.put('/:id', authenticateActive, requirePermission('suppliers.write'), (req, res, next) => supplierController.update(req, res, next))
router.delete('/:id', authenticateActive, requirePermission('suppliers.delete'), (req, res, next) => supplierController.delete(req, res, next))

export default router
