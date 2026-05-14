import { Router } from 'express'
import database from '../config/database.js'
import { InventoryRepository } from '../repository/inventory.repository.js'
import { ItemsRepository } from '../repository/items.repository.js'
import { AdjustmentRepository } from '../repository/adjustment.repository.js'
import { TransferRepository } from '../repository/transfer.repository.js'
import { InventoryModel } from '../models/inventory.model.js'
import { AdjustmentModel } from '../models/adjustment.model.js'
import { TransferModel } from '../models/transfer.model.js'
import { InventoryController } from '../controllers/inventory.controller.js'
import { AdjustmentController } from '../controllers/adjustment.controller.js'
import { TransferController } from '../controllers/transfer.controller.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const inventoryRepo = new InventoryRepository(database)
const itemsRepo = new ItemsRepository(database)
const adjustmentRepo = new AdjustmentRepository(database)
const transferRepo = new TransferRepository(database)
const inventoryModel = new InventoryModel(inventoryRepo, itemsRepo)
const adjustmentModel = new AdjustmentModel(adjustmentRepo, inventoryRepo, itemsRepo)
const transferModel = new TransferModel(transferRepo, inventoryRepo, itemsRepo)
const inventoryController = new InventoryController(inventoryModel)
const adjustmentController = new AdjustmentController(adjustmentModel)
const transferController = new TransferController()

const router = Router()
const inventoryBasePath = '/inventory'

router.get('/stock', authenticate, requirePermission('inventory.read'), (req, res, next) => inventoryController.getStock(req, res, next))
router.get('/movements', authenticate, requirePermission('inventory.read'), (req, res, next) => inventoryController.getMovements(req, res, next))
router.get('/serials', authenticate, requirePermission('inventory.read'), (req, res, next) => inventoryController.getSerials(req, res, next))
router.get('/low-stock', authenticate, requirePermission('inventory.read'), (req, res, next) => inventoryController.getLowStock(req, res, next))

router.get('/adjustments', authenticate, requirePermission('inventory.read'), (req, res, next) => adjustmentController.getAll(req, res, next))
router.get('/adjustments/:id', authenticate, requirePermission('inventory.read'), (req, res, next) => adjustmentController.getById(req, res, next))
router.post('/adjustments', authenticateActive, requirePermission('inventory.write'), (req, res, next) => adjustmentController.create(req, res, next))
router.post('/adjustments/quick', authenticateActive, requirePermission('inventory.write'), (req, res, next) => adjustmentController.createWithItem(req, res, next))
router.post('/adjustments/:id/items', authenticateActive, requirePermission('inventory.write'), (req, res, next) => adjustmentController.addItem(req, res, next))
router.delete('/adjustments/:id/items/:itemId', authenticateActive, requirePermission('inventory.delete'), (req, res, next) => adjustmentController.removeItem(req, res, next))
router.post('/adjustments/:id/confirm', authenticateActive, requirePermission('inventory.write'), (req, res, next) => adjustmentController.confirm(req, res, next))
router.post('/adjustments/:id/cancel', authenticateActive, requirePermission('inventory.write'), (req, res, next) => adjustmentController.cancel(req, res, next))
router.get('/adjustments/item-stock/:itemId', authenticate, requirePermission('inventory.read'), (req, res, next) => adjustmentController.getItemStock(req, res, next))

router.get('/transfers', authenticate, requirePermission('inventory.read'), (req, res, next) => transferController.getAll(req, res, next))
router.get('/transfers/pending-receipt', authenticate, requirePermission('inventory.read'), (req, res, next) => transferController.getPendingReceipt(req, res, next))
router.get('/transfers/:id', authenticate, requirePermission('inventory.read'), (req, res, next) => transferController.getById(req, res, next))
router.post('/transfers', authenticateActive, requirePermission('inventory.write'), (req, res, next) => transferController.create(req, res, next))
router.post('/transfers/:id/items', authenticateActive, requirePermission('inventory.write'), (req, res, next) => transferController.addItem(req, res, next))
router.delete('/transfers/:id/items/:itemId', authenticateActive, requirePermission('inventory.delete'), (req, res, next) => transferController.removeItem(req, res, next))
router.post('/transfers/:id/ship', authenticateActive, requirePermission('inventory.write'), (req, res, next) => transferController.ship(req, res, next))
router.post('/transfers/:id/receive', authenticateActive, requirePermission('inventory.write'), (req, res, next) => transferController.receive(req, res, next))
router.post('/transfers/:id/cancel', authenticateActive, requirePermission('inventory.write'), (req, res, next) => transferController.cancel(req, res, next))

router.get('/stock/in-transit', authenticate, requirePermission('inventory.read'), (req, res, next) => inventoryController.getStockInTransit(req, res, next))

export default router
