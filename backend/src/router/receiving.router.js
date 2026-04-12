import { Router } from 'express'
import database from '../config/database.js'
import { ReceivingRepository } from '../repository/receiving.repository.js'
import { ReceivingModel } from '../models/receiving.model.js'
import { ReceivingController } from '../controllers/receiving.controller.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { SequenceRepository } from '../repository/sequence.repository.js'
import { authenticate } from '../middleware/auth.middleware.js'

const companyRepo = new CompanyRepository(database)
const sequenceRepo = new SequenceRepository(database, companyRepo)
const receivingRepo = new ReceivingRepository(database, companyRepo, sequenceRepo)
const receivingModel = new ReceivingModel(receivingRepo)
const receivingController = new ReceivingController(receivingModel)

const router = Router()

router.get('/', authenticate, (req, res, next) => receivingController.getAll(req, res, next))
router.get('/:id', authenticate, (req, res, next) => receivingController.getById(req, res, next))
router.post('/', authenticate, (req, res, next) => receivingController.create(req, res, next))
router.put('/:id/complete', authenticate, (req, res, next) => receivingController.complete(req, res, next))
router.delete('/:id', authenticate, (req, res, next) => receivingController.delete(req, res, next))

export default router
