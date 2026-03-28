import { Router } from 'express'
import database from '../config/database.js'
import { CompanyConfigRepository } from '../repository/company-config.repository.js'
import { CompanyConfigModel } from '../models/company-config.model.js'
import { CompanyConfigController } from '../controllers/company-config.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const companyRepo = new CompanyConfigRepository(database)
const companyModel = new CompanyConfigModel(companyRepo)
const companyController = new CompanyConfigController(companyModel)

const router = Router()
const companyBasePath = '/company-config'

router.get('/', authenticate, requireRoutePermission(companyBasePath), (req, res, next) => companyController.get(req, res, next))
router.put('/', authenticate, requireRoutePermission(companyBasePath), (req, res, next) => companyController.update(req, res, next))

export default router
