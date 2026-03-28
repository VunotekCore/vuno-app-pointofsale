import { Router } from 'express'
import database from '../config/database.js'
import { EmployeesRepository } from '../repository/employees.repository.js'
import { UsersRepository } from '../repository/users.repository.js'
import { EmployeesModel } from '../models/employees.model.js'
import { EmployeesController } from '../controllers/employees.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const employeesRepo = new EmployeesRepository(database)
const usersRepo = new UsersRepository(database)
const employeesModel = new EmployeesModel(employeesRepo, usersRepo)
const employeesController = new EmployeesController(employeesModel)

const router = Router()
const employeesBasePath = '/employees'

router.get('/', authenticate, requireRoutePermission(employeesBasePath), (req, res, next) => employeesController.getAll(req, res, next))
router.get('/positions', authenticate, requireRoutePermission(employeesBasePath), (req, res, next) => employeesController.getPositions(req, res, next))
router.get('/departments', authenticate, requireRoutePermission(employeesBasePath), (req, res, next) => employeesController.getDepartments(req, res, next))
router.get('/user/:userId', authenticate, (req, res, next) => employeesController.getByUserId(req, res, next))
router.get('/:id', authenticate, requireRoutePermission(employeesBasePath), (req, res, next) => employeesController.getById(req, res, next))
router.post('/', authenticate, requireRoutePermission(employeesBasePath), (req, res, next) => employeesController.create(req, res, next))
router.put('/:id', authenticate, requireRoutePermission(employeesBasePath), (req, res, next) => employeesController.update(req, res, next))
router.delete('/:id', authenticate, requireRoutePermission(employeesBasePath), (req, res, next) => employeesController.delete(req, res, next))

export default router
