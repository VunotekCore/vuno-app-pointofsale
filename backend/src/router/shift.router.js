import { Router } from 'express'
import database from '../config/database.js'
import { ShiftRepository } from '../repository/shift.repository.js'
import { ShiftModel } from '../models/shift.model.js'
import { ShiftController } from '../controllers/shift.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'

const shiftRepo = new ShiftRepository(database)
const shiftModel = new ShiftModel(shiftRepo)
const shiftController = new ShiftController(shiftModel)

const router = Router()
const shiftsBasePath = '/shifts'

router.get('/configs', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.getShiftConfigs(req, res, next))
router.get('/configs/:id', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.getShiftConfig(req, res, next))
router.post('/configs', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.createShiftConfig(req, res, next))
router.put('/configs/:id', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.updateShiftConfig(req, res, next))
router.delete('/configs/:id', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.deleteShiftConfig(req, res, next))

router.get('/active', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.getActiveShift(req, res, next))
router.get('/sessions/open', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.getOpenSession(req, res, next))
router.post('/sessions', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.openSession(req, res, next))
router.post('/sessions/:id/close', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.closeSession(req, res, next))
router.get('/sessions', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.getSessions(req, res, next))
router.get('/reminders', authenticate, requireRoutePermission(shiftsBasePath), (req, res, next) => shiftController.getCloseReminders(req, res, next))

export default router
