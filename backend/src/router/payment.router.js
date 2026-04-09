import { Router } from 'express'
import database from '../config/database.js'
import { PaymentRepository } from '../repository/payment.repository.js'
import { PaymentModel } from '../models/payment.model.js'
import { PaymentController } from '../controllers/payment.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { ShiftRepository } from '../repository/shift.repository.js'
import { generateDrawerClosePDF } from '../utils/drawer-close.utils.js'

const paymentRepo = new PaymentRepository(database)
const shiftRepo = new ShiftRepository(database)
const companyRepo = new CompanyRepository(database)
const paymentModel = new PaymentModel(paymentRepo, null, shiftRepo)
const paymentController = new PaymentController(paymentModel)

const router = Router()
const paymentsBasePath = '/payments'

router.get('/methods', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getPaymentMethods(req, res, next))
router.get('/methods/:id', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getPaymentMethod(req, res, next))
router.post('/methods', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.createPaymentMethod(req, res, next))
router.put('/methods/:id', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.updatePaymentMethod(req, res, next))
router.delete('/methods/:id', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.deletePaymentMethod(req, res, next))

router.get('/drawers', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getCashDrawers(req, res, next))
router.get('/drawers/open', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getOpenDrawer(req, res, next))
router.get('/drawers/:id', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getCashDrawer(req, res, next))
router.post('/drawers', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.openDrawer(req, res, next))
router.post('/drawers/:id/close', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.closeDrawer(req, res, next))
router.get('/drawers/:id/transactions', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getDrawerTransactions(req, res, next))
router.get('/drawers/:id/summary', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getDrawerSummary(req, res, next))
router.get('/drawers/:id/cash-summary', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getCashDrawerSummary(req, res, next))
router.post('/drawers/:id/transactions', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.addTransaction(req, res, next))

router.get('/summary', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getPaymentSummary(req, res, next))
router.get('/history', authenticate, requireRoutePermission(paymentsBasePath), (req, res, next) => paymentController.getDrawerHistory(req, res, next))

router.post('/adjustments', authenticate, requireRoutePermission(paymentsBasePath), async (req, res, next) => {
  try {
    const { drawer_id, adjustment_type, amount, notes } = req.body
    const isAdmin = req.user?.is_admin == 1
    const userLocations = req.userLocations || []
    const companyId = req.user?.company_id

    const drawer = await paymentRepo.getCashDrawerById(drawer_id, companyId)
    if (!drawer) {
      return res.status(404).json({ success: false, message: 'Caja no encontrada' })
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(drawer.location_id)) {
      return res.status(403).json({ success: false, message: 'Sin permiso para esta caja' })
    }

    const userId = req.userId
    await paymentModel.createAdjustment(drawer_id, userId, companyId, adjustment_type, amount, notes)
    res.status(201).json({ success: true, message: 'Ajuste registrado' })
  } catch (error) {
    next(error)
  }
})

router.get('/drawers/:id/adjustments', authenticate, requireRoutePermission(paymentsBasePath), async (req, res, next) => {
  try {
    const { id } = req.params
    const isAdmin = req.user?.is_admin == 1
    const userLocations = req.userLocations || []
    const companyId = req.user?.company_id

    const drawer = await paymentRepo.getCashDrawerById(id, companyId)
    if (!drawer) {
      return res.status(404).json({ success: false, message: 'Caja no encontrada' })
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(drawer.location_id)) {
      return res.status(403).json({ success: false, message: 'Sin permiso para esta caja' })
    }

    const adjustments = await paymentModel.getAdjustmentsByDrawer(id, companyId)
    res.status(200).json({ success: true, data: adjustments })
  } catch (error) {
    next(error)
  }
})

router.get('/my-adjustments', authenticate, requireRoutePermission(paymentsBasePath), async (req, res, next) => {
  try {
    const { status, search, limit = 20, offset = 0, start_date, end_date } = req.query
    const userId = req.userId
    const companyId = req.user?.company_id
    const result = await paymentModel.getUserAdjustments(userId, { status, search, limit: parseInt(limit), offset: parseInt(offset), start_date, end_date }, companyId)
    res.status(200).json({ success: true, data: result.data, total: result.total })
  } catch (error) {
    next(error)
  }
})

router.put('/adjustments/:id/status', authenticate, requireRoutePermission(paymentsBasePath), async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const isAdmin = req.user?.is_admin == 1
    const companyId = req.user?.company_id

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden aprobar/rechazar ajustes' })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' })
    }

    const adjustment = await paymentRepo.getAdjustmentById(id, companyId)
    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Ajuste no encontrado' })
    }

    await paymentModel.updateAdjustmentStatus(id, status, adjustment.user_id, companyId)
    res.status(200).json({ success: true, message: `Ajuste ${status}` })
  } catch (error) {
    next(error)
  }
})

router.get('/drawers/:id/close-pdf', authenticate, requireRoutePermission(paymentsBasePath), async (req, res, next) => {
  try {
    const { id } = req.params
    const isAdmin = req.user?.is_admin == 1
    const userLocations = req.userLocations || []
    const companyId = req.user?.company_id
    
    const summary = await paymentModel.getCashDrawerSummary(id, userLocations, isAdmin, null, null, companyId)
    
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Caja no encontrada' })
    }
    
    const drawer = await paymentRepo.getCashDrawerById(id, companyId)
    const company = await companyRepo.findById(companyId)
    
    const pdfBuffer = generateDrawerClosePDF(summary, company)
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="cierre-caja-${drawer.name}-${new Date().toISOString().split('T')[0]}.pdf"`)
    
    res.send(Buffer.from(pdfBuffer))
  } catch (error) {
    next(error)
  }
})

router.get('/accounts-receivable', authenticate, requireRoutePermission(paymentsBasePath), async (req, res, next) => {
  try {
    const { user_id, status, search, limit = 20, offset = 0, start_date, end_date } = req.query
    const isAdmin = req.user?.is_admin == 1
    const companyId = req.user?.company_id
    
    let targetUserId = user_id
    if (!isAdmin) {
      targetUserId = req.userId
    }
    
    const result = await paymentModel.getAccountsReceivable({ userId: targetUserId, status, search, limit: parseInt(limit), offset: parseInt(offset), start_date, end_date }, companyId)
    const accounts = result.data
    
    const summary = {
      total_debt: accounts.reduce((sum, acc) => sum + parseFloat(acc.amount || 0), 0),
      total_paid: accounts.reduce((sum, acc) => sum + parseFloat(acc.paid_amount || 0), 0),
      total_pending: accounts.reduce((sum, acc) => sum + (parseFloat(acc.amount || 0) - parseFloat(acc.paid_amount || 0)), 0),
      count: result.total
    }
    
    res.status(200).json({ success: true, data: accounts, total: result.total, summary })
  } catch (error) {
    next(error)
  }
})

router.get('/cashiers', authenticate, requireRoutePermission(paymentsBasePath), async (req, res, next) => {
  try {
    const companyId = req.user?.company_id
    const cashiers = await paymentModel.getCashiers(companyId)
    res.status(200).json({ success: true, data: cashiers })
  } catch (error) {
    next(error)
  }
})

router.post('/accounts-receivable/:id/payment', authenticate, requireRoutePermission(paymentsBasePath), async (req, res, next) => {
  try {
    const { id } = req.params
    const { amount } = req.body
    const isAdmin = req.user?.is_admin == 1
    const companyId = req.user?.company_id
    
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden registrar pagos' })
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Monto inválido' })
    }

    const result = await paymentModel.updateAccountReceivable(id, amount, companyId)
    res.status(200).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

export default router
