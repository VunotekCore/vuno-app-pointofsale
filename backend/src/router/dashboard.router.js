import { Router } from 'express'
import database from '../config/database.js'
import { DashboardRepository } from '../repository/dashboard.repository.js'
import { DashboardModel } from '../models/dashboard.model.js'
import { DashboardController } from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const dashboardRepo = new DashboardRepository(database)
const dashboardModel = new DashboardModel(dashboardRepo)
const dashboardController = new DashboardController(dashboardModel)

const router = Router()

router.get('/locations', (req, res, next) => dashboardController.getLocations(req, res, next))
router.get('/daily', authenticate, (req, res, next) => dashboardController.getDailyStats(req, res, next))
router.get('/stats', authenticate, (req, res, next) => dashboardController.getStatsByDateRange(req, res, next))
router.get('/sales-by-period', authenticate, (req, res, next) => dashboardController.getSalesByPeriod(req, res, next))
router.get('/top-items', authenticate, (req, res, next) => dashboardController.getTopSellingItems(req, res, next))
router.get('/payments', authenticate, (req, res, next) => dashboardController.getPaymentSummary(req, res, next))
router.get('/low-stock', authenticate, (req, res, next) => dashboardController.getLowStock(req, res, next))
router.get('/new-customers', authenticate, (req, res, next) => dashboardController.getNewCustomers(req, res, next))
router.get('/customers-by-period', authenticate, (req, res, next) => dashboardController.getCustomersByPeriod(req, res, next))
router.get('/recent-sales', authenticate, (req, res, next) => dashboardController.getRecentSales(req, res, next))
router.get('/recent-movements', authenticate, (req, res, next) => dashboardController.getRecentMovements(req, res, next))
router.get('/admin-dashboard', authenticate, (req, res, next) => dashboardController.getAdminFinancialDashboard(req, res, next))
router.get('/manager-dashboard', authenticate, (req, res, next) => dashboardController.getManagerOperationalDashboard(req, res, next))
router.get('/cashier-dashboard', authenticate, (req, res, next) => dashboardController.getCashierDashboard(req, res, next))
router.get('/', authenticate, (req, res, next) => dashboardController.getFullDashboard(req, res, next))

export default router
