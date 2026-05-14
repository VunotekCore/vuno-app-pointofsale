import { Router } from 'express'
import database from '../config/database.js'
import { CustomersRepository, CustomerGroupsRepository, CustomerRewardsRepository } from '../repository/customers.repository.js'
import { CustomersModel, CustomerGroupsModel, CustomerRewardsModel } from '../models/customers.model.js'
import { CustomersController, CustomerGroupsController, CustomerRewardsController } from '../controllers/customers.controller.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const customersRepo = new CustomersRepository(database)
const groupsRepo = new CustomerGroupsRepository(database)
const rewardsRepo = new CustomerRewardsRepository(database)

const customersModel = new CustomersModel(customersRepo, groupsRepo, rewardsRepo)
const groupsModel = new CustomerGroupsModel(groupsRepo)
const rewardsModel = new CustomerRewardsModel(rewardsRepo)

const customersController = new CustomersController(customersModel)
const groupsController = new CustomerGroupsController(groupsModel)
const rewardsController = new CustomerRewardsController(rewardsModel)

const router = Router()
const customersBasePath = '/customers'

router.get('/search', authenticate, requirePermission('customers.read'), (req, res, next) => customersController.search(req, res, next))

router.get('/groups', authenticate, requirePermission('customers.read'), (req, res, next) => groupsController.getAll(req, res, next))
router.get('/groups/:id', authenticate, requirePermission('customers.read'), (req, res, next) => groupsController.getById(req, res, next))
router.post('/groups', authenticateActive, requirePermission('customers.write'), (req, res, next) => groupsController.create(req, res, next))
router.put('/groups/:id', authenticateActive, requirePermission('customers.write'), (req, res, next) => groupsController.update(req, res, next))
router.delete('/groups/:id', authenticateActive, requirePermission('customers.delete'), (req, res, next) => groupsController.delete(req, res, next))

router.get('/rewards', authenticate, requirePermission('customers.read'), (req, res, next) => rewardsController.getAll(req, res, next))
router.get('/rewards/:id', authenticate, requirePermission('customers.read'), (req, res, next) => rewardsController.getById(req, res, next))
router.post('/rewards', authenticateActive, requirePermission('customers.write'), (req, res, next) => rewardsController.create(req, res, next))
router.put('/rewards/:id', authenticateActive, requirePermission('customers.write'), (req, res, next) => rewardsController.update(req, res, next))
router.delete('/rewards/:id', authenticateActive, requirePermission('customers.delete'), (req, res, next) => rewardsController.delete(req, res, next))
router.post('/rewards/:id/redeem', authenticateActive, requirePermission('customers.write'), (req, res, next) => rewardsController.redeem(req, res, next))

router.get('/', authenticate, requirePermission('customers.read'), (req, res, next) => customersController.getAll(req, res, next))
router.get('/:id', authenticate, requirePermission('customers.read'), (req, res, next) => customersController.getById(req, res, next))
router.post('/', authenticateActive, requirePermission('customers.write'), (req, res, next) => customersController.create(req, res, next))
router.put('/:id', authenticateActive, requirePermission('customers.write'), (req, res, next) => customersController.update(req, res, next))
router.put('/:id/toggle-status', authenticateActive, requirePermission('customers.write'), (req, res, next) => customersController.toggleStatus(req, res, next))
router.delete('/:id', authenticateActive, requirePermission('customers.delete'), (req, res, next) => customersController.delete(req, res, next))

router.post('/:id/points', authenticateActive, requirePermission('customers.write'), (req, res, next) => customersController.addPoints(req, res, next))
router.post('/:id/points/redeem', authenticateActive, requirePermission('customers.write'), (req, res, next) => customersController.redeemPoints(req, res, next))
router.get('/:id/points', authenticate, requirePermission('customers.read'), (req, res, next) => customersController.getPointsLog(req, res, next))
router.get('/:id/sales', authenticate, requirePermission('customers.read'), (req, res, next) => customersController.getSalesHistory(req, res, next))

export default router
