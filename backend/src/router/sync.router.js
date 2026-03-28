import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { SyncController } from '../controllers/sync.controller.js'
import { SyncModel } from '../models/sync.model.js'
import { SyncRepository } from '../repository/sync.repository.js'
import { SalesRepository } from '../repository/sales.repository.js'
import { InventoryRepository } from '../repository/inventory.repository.js'
import { ItemsRepository } from '../repository/items.repository.js'
import { PaymentRepository } from '../repository/payment.repository.js'
import { SalesModel } from '../models/sales.model.js'
import database from '../config/database.js'

const router = Router()

const syncRepo = new SyncRepository(database)
const salesRepo = new SalesRepository(database)
const inventoryRepo = new InventoryRepository(database)
const itemsRepo = new ItemsRepository(database)
const paymentRepo = new PaymentRepository(database)

const salesModel = new SalesModel(salesRepo, inventoryRepo, itemsRepo, paymentRepo)
const syncModel = new SyncModel(syncRepo, salesModel)
const syncController = new SyncController(syncModel)

router.post('/sales', authenticate, (req, res, next) => 
  syncController.syncSales(req, res, next)
)

router.get('/history', authenticate, (req, res, next) => 
  syncController.getHistory(req, res, next)
)

router.get('/history/:sync_log_id', authenticate, (req, res, next) => 
  syncController.getDetails(req, res, next)
)

router.put('/conflicts/:conflict_id/resolve', authenticate, (req, res, next) => 
  syncController.resolveConflict(req, res, next)
)

export default router
