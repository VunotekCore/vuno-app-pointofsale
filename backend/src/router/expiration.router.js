import { Router } from 'express'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'
import { ExpirationRepository } from '../repository/expiration.repository.js'
import { ExpirationModel } from '../models/expiration.model.js'
import { ExpirationController } from '../controllers/expiration.controller.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { Database } from '../config/database.js'

const db = new Database()
const companyRepo = new CompanyRepository(db)
const expirationRepo = new ExpirationRepository(db)
const expirationModel = new ExpirationModel(expirationRepo, companyRepo)
const expirationController = new ExpirationController(expirationModel)

const router = Router()

router.get('/expirations/expiring', authenticate, requirePermission('items.read'), (req, res, next) => expirationController.getExpiring(req, res, next))
router.get('/expirations/expired', authenticate, requirePermission('items.read'), (req, res, next) => expirationController.getExpired(req, res, next))
router.get('/expirations/summary', authenticate, requirePermission('items.read'), (req, res, next) => expirationController.getSummary(req, res, next))
router.get('/items/:id/expirations', authenticate, requirePermission('items.read'), (req, res, next) => expirationController.getByItem(req, res, next))
router.post('/expirations/:id/process', authenticateActive, requirePermission('items.write'), (req, res, next) => expirationController.markProcessed(req, res, next))

export { router as expirationRouter }
