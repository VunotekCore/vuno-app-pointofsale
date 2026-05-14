import { Router } from 'express'
import database from '../config/database.js'
import { ShiftRepository } from '../repository/shift.repository.js'
import { ShiftModel } from '../models/shift.model.js'
import { ShiftController } from '../controllers/shift.controller.js'
import { authenticate, authenticateActive } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/permission.middleware.js'

const shiftRepo = new ShiftRepository(database)
const shiftModel = new ShiftModel(shiftRepo)
const shiftController = new ShiftController(shiftModel)

const router = Router()
const shiftsBasePath = '/shifts'

router.get('/configs', authenticate, requirePermission('shifts.read'), (req, res, next) => shiftController.getShiftConfigs(req, res, next))
router.get('/configs/:id', authenticate, requirePermission('shifts.read'), (req, res, next) => shiftController.getShiftConfig(req, res, next))
router.post('/configs', authenticateActive, requirePermission('shifts.write'), (req, res, next) => shiftController.createShiftConfig(req, res, next))
router.put('/configs/:id', authenticateActive, requirePermission('shifts.write'), (req, res, next) => shiftController.updateShiftConfig(req, res, next))
router.delete('/configs/:id', authenticateActive, requirePermission('shifts.delete'), (req, res, next) => shiftController.deleteShiftConfig(req, res, next))

router.get('/active', authenticate, requirePermission('shifts.read'), (req, res, next) => shiftController.getActiveShift(req, res, next))
router.get('/sessions/open', authenticate, requirePermission('shifts.read'), (req, res, next) => shiftController.getOpenSession(req, res, next))
router.post('/sessions', authenticateActive, requirePermission('shifts.write'), (req, res, next) => shiftController.openSession(req, res, next))
router.post('/sessions/:id/close', authenticateActive, requirePermission('shifts.write'), (req, res, next) => shiftController.closeSession(req, res, next))
router.get('/sessions', authenticate, requirePermission('shifts.read'), (req, res, next) => shiftController.getSessions(req, res, next))
router.get('/reminders', authenticate, requirePermission('shifts.read'), (req, res, next) => shiftController.getCloseReminders(req, res, next))

export default router
