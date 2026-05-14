import { Router } from 'express'
import database from '../config/database.js'
import { ReceivingRepository } from '../repository/receiving.repository.js'
import { ReceivingModel } from '../models/receiving.model.js'
import { ReceivingController } from '../controllers/receiving.controller.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { SequenceRepository } from '../repository/sequence.repository.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const companyRepo = new CompanyRepository(database)
const sequenceRepo = new SequenceRepository(database, companyRepo)
const receivingRepo = new ReceivingRepository(database, companyRepo, sequenceRepo)
const receivingModel = new ReceivingModel(receivingRepo)
const receivingController = new ReceivingController(receivingModel)

const router = Router()

router.get('/', authenticate, requirePermission('receivings.read'), (req, res, next) => receivingController.getAll(req, res, next))
router.get('/:id', authenticate, requirePermission('receivings.read'), (req, res, next) => receivingController.getById(req, res, next))
router.post('/', authenticateActive, requirePermission('receivings.write'), (req, res, next) => receivingController.create(req, res, next))
router.put('/:id/complete', authenticateActive, requirePermission('receivings.write'), (req, res, next) => receivingController.complete(req, res, next))
router.delete('/:id', authenticateActive, requirePermission('receivings.delete'), (req, res, next) => receivingController.delete(req, res, next))

export default router
