import { Router } from 'express'
import database from '../config/database.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { UserRepository } from '../repository/user.repository.js'
import { CompanyModel } from '../models/company.model.js'
import { CompanyController } from '../controllers/company.controller.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const companyRepo = new CompanyRepository(database)
const userRepo = new UserRepository(database)
const companyModel = new CompanyModel(database)
const companyController = new CompanyController(companyModel)

const router = Router()

router.get('/', authenticate, requirePermission('companies.read'), async (req, res, next) => {
  try {
    const companyId = req.companyId
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'No company associated' })
    }
    req.params.id = companyId
    await companyController.getById(req, res, next)
  } catch (error) {
    next(error)
  }
})

router.put('/', authenticateActive, requirePermission('companies.write'), async (req, res, next) => {
  try {
    const companyId = req.companyId
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'No company associated' })
    }
    req.params.id = companyId
    await companyController.update(req, res, next)
  } catch (error) {
    next(error)
  }
})

router.post('/logo', authenticateActive, requirePermission('companies.write'), async (req, res, next) => {
  try {
    const companyId = req.companyId
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'No company associated' })
    }
    req.params.id = companyId
    await companyController.uploadLogo(req, res, next)
  } catch (error) {
    next(error)
  }
})

export default router
