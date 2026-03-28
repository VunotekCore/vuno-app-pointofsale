import { Router } from 'express'
import database from '../config/database.js'
import { AuthRepository } from '../repository/auth.repository.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { AuthModel } from '../models/auth.model.js'
import { AuthController } from '../controllers/auth.controller.js'

const authRepo = new AuthRepository(database)
const companyRepo = new CompanyRepository(database)
const authModel = new AuthModel(authRepo, companyRepo)
const authController = new AuthController(authModel)

/**
 * Authentication routesaca 
 * Handles login, password request and password reset
 */
const router = Router()

router.post('/', (req, res, next) => authController.login(req, res, next))

export default router
