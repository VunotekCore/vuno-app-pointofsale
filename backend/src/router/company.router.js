import { Router } from 'express'
import database from '../config/database.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { UserRepository } from '../repository/user.repository.js'
import { CompanyModel } from '../models/company.model.js'
import { CompanyController } from '../controllers/company.controller.js'
import { platformAuth, superAdminOnly } from '../middleware/platform-auth.middleware.js'

const companyRepo = new CompanyRepository(database)
const userRepo = new UserRepository(database)
const companyModel = new CompanyModel(database)
const companyController = new CompanyController(companyModel)

const router = Router()

router.use(platformAuth)
router.use(superAdminOnly)

router.post('/', (req, res, next) => companyController.create(req, res, next))
router.get('/', (req, res, next) => companyController.getAll(req, res, next))
router.get('/:id', (req, res, next) => companyController.getById(req, res, next))
router.get('/:id/stats', (req, res, next) => companyController.getStats(req, res, next))
router.get('/:id/admin', (req, res, next) => companyController.getAdmin(req, res, next))
router.get('/slug/:slug', (req, res, next) => companyController.getBySlug(req, res, next))
router.put('/:id', (req, res, next) => companyController.update(req, res, next))
router.post('/:id/logo', (req, res, next) => companyController.uploadLogo(req, res, next))
router.post('/:id/change-admin-password', (req, res, next) => companyController.changeAdminPassword(req, res, next))
router.delete('/:id', (req, res, next) => companyController.delete(req, res, next))

export default router
