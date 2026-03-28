import { Router } from 'express'
import database from '../config/database.js'
import { CustomersRepository, CustomerGroupsRepository, CustomerRewardsRepository } from '../repository/customers.repository.js'
import { CustomersModel, CustomerGroupsModel, CustomerRewardsModel } from '../models/customers.model.js'
import { CustomersController, CustomerGroupsController, CustomerRewardsController } from '../controllers/customers.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

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

router.get('/search', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.search(req, res, next))

router.get('/groups', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => groupsController.getAll(req, res, next))
router.get('/groups/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => groupsController.getById(req, res, next))
router.post('/groups', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => groupsController.create(req, res, next))
router.put('/groups/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => groupsController.update(req, res, next))
router.delete('/groups/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => groupsController.delete(req, res, next))

router.get('/rewards', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => rewardsController.getAll(req, res, next))
router.get('/rewards/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => rewardsController.getById(req, res, next))
router.post('/rewards', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => rewardsController.create(req, res, next))
router.put('/rewards/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => rewardsController.update(req, res, next))
router.delete('/rewards/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => rewardsController.delete(req, res, next))
router.post('/rewards/:id/redeem', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => rewardsController.redeem(req, res, next))

router.get('/', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.getAll(req, res, next))
router.get('/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.getById(req, res, next))
router.post('/', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.create(req, res, next))
router.put('/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.update(req, res, next))
router.put('/:id/toggle-status', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.toggleStatus(req, res, next))
router.delete('/:id', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.delete(req, res, next))

router.post('/:id/points', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.addPoints(req, res, next))
router.post('/:id/points/redeem', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.redeemPoints(req, res, next))
router.get('/:id/points', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.getPointsLog(req, res, next))
router.get('/:id/sales', authenticate, requireRoutePermission(customersBasePath), (req, res, next) => customersController.getSalesHistory(req, res, next))

export default router
