import { Router } from 'express'
import database from '../config/database.js'
import { DashboardRepository } from '../repository/dashboard.repository.js'
import { DashboardModel } from '../models/dashboard.model.js'
import { DashboardController } from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const dashboardRepo = new DashboardRepository(database)
const dashboardModel = new DashboardModel(dashboardRepo)
const dashboardController = new DashboardController(dashboardModel)

const router = Router()

router.get('/locations', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getLocations(req, res, next))
router.get('/daily', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getDailyStats(req, res, next))
router.get('/stats', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getStatsByDateRange(req, res, next))
router.get('/sales-by-period', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getSalesByPeriod(req, res, next))
router.get('/top-items', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getTopSellingItems(req, res, next))
router.get('/payments', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getPaymentSummary(req, res, next))
router.get('/low-stock', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getLowStock(req, res, next))
router.get('/new-customers', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getNewCustomers(req, res, next))
router.get('/customers-by-period', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getCustomersByPeriod(req, res, next))
router.get('/recent-sales', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getRecentSales(req, res, next))
router.get('/recent-movements', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getRecentMovements(req, res, next))
router.get('/admin-dashboard', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getAdminFinancialDashboard(req, res, next))
router.get('/manager-dashboard', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getManagerOperationalDashboard(req, res, next))
router.get('/cashier-dashboard', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getCashierDashboard(req, res, next))
router.get('/', authenticate, requirePermission('dashboard.read'), (req, res, next) => dashboardController.getFullDashboard(req, res, next))

export default router
