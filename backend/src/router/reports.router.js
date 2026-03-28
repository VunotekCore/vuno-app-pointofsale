import { Router } from 'express'
import database from '../config/database.js'
import { ReportsRepository } from '../repository/reports.repository.js'
import { ReportsModel } from '../models/reports.model.js'
import { ReportsController } from '../controllers/reports.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const reportsRepo = new ReportsRepository(database)
const reportsModel = new ReportsModel(reportsRepo)
const reportsController = new ReportsController(reportsModel)

const router = Router()

router.get('/sales', authenticate, (req, res, next) => reportsController.getSalesReport(req, res, next))
router.get('/sales/export', authenticate, (req, res, next) => reportsController.exportSalesReport(req, res, next))
router.get('/sales/:id', authenticate, (req, res, next) => reportsController.getSalesReportDetails(req, res, next))
router.get('/inventory', authenticate, (req, res, next) => reportsController.getInventoryReport(req, res, next))
router.get('/inventory/export', authenticate, (req, res, next) => reportsController.exportInventoryReport(req, res, next))
router.get('/purchases', authenticate, (req, res, next) => reportsController.getPurchasesReport(req, res, next))
router.get('/purchases/export', authenticate, (req, res, next) => reportsController.exportPurchasesReport(req, res, next))
router.get('/cash', authenticate, (req, res, next) => reportsController.getCashReport(req, res, next))
router.get('/cash/export', authenticate, (req, res, next) => reportsController.exportCashReport(req, res, next))

export default router
