import { Router } from 'express'
import database from '../config/database.js'
import { GenericRepository } from '../repository/generic.repository.js'
import { GenericModel } from '../models/generic.model.js'
import { GenericController } from '../controllers/generic.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const tableConfig = {
  categories: {
    columns: ['name', 'parent_id', 'description', 'image_url', 'is_active'],
    required: ['name']
  },
  suppliers: {
    columns: ['name', 'contact_name', 'email', 'phone', 'address', 'is_active', 'custom_fields'],
    required: ['name']
  },
  item_variations: {
    columns: ['item_id', 'sku', 'unit_price', 'cost_price', 'attributes', 'image_url', 'is_active'],
    required: ['item_id', 'sku']
  }
}

function createCrudRouter (tableName, config) {
  const genericRepo = new GenericRepository(database, tableName)
  const genericModel = new GenericModel(genericRepo, config, tableName)
  const genericController = new GenericController(genericModel)

  const router = Router()
  const basePath = `/core/${tableName}`

  router.get('/', authenticate, requireRoutePermission(basePath), (req, res, next) => genericController.getAll(req, res, next))
  router.get('/:id', authenticate, requireRoutePermission(basePath), (req, res, next) => genericController.getById(req, res, next))
  router.post('/', authenticate, requireRoutePermission(basePath), (req, res, next) => genericController.create(req, res, next))
  router.put('/:id', authenticate, requireRoutePermission(basePath), (req, res, next) => genericController.update(req, res, next))
  router.delete('/:id', authenticate, requireRoutePermission(basePath), (req, res, next) => genericController.delete(req, res, next))
  router.post('/:id/restore', authenticate, requireRoutePermission(basePath), (req, res, next) => genericController.restore(req, res, next))

  return router
}

const router = Router()

router.use('/categories', createCrudRouter('categories', tableConfig.categories))
router.use('/suppliers', createCrudRouter('suppliers', tableConfig.suppliers))
router.use('/item-variations', createCrudRouter('item_variations', tableConfig.item_variations))

export default router
