import { Router } from 'express'
import { SupplierController } from '../controllers/supplier.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()
const supplierController = new SupplierController()

router.get('/', authenticate, (req, res, next) => supplierController.getAll(req, res, next))
router.get('/active', authenticate, (req, res, next) => supplierController.getActive(req, res, next))
router.get('/:id', authenticate, (req, res, next) => supplierController.getById(req, res, next))
router.get('/:id/history', authenticate, (req, res, next) => supplierController.getHistory(req, res, next))
router.post('/', authenticate, (req, res, next) => supplierController.create(req, res, next))
router.put('/:id', authenticate, (req, res, next) => supplierController.update(req, res, next))
router.delete('/:id', authenticate, (req, res, next) => supplierController.delete(req, res, next))

export default router
