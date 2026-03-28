import { ShiftRepository } from '../repository/shift.repository.js'
import { BadRequestError, NotFoundError } from '../errors/index.js'

export class ShiftModel {
  constructor (shiftRepository) {
    this.shiftRepo = shiftRepository
  }

  async getShiftConfigs (locationId = null) {
    if (locationId) {
      return await this.shiftRepo.getShiftConfigsByLocation(locationId)
    }
    return await this.shiftRepo.getAllShiftConfigs()
  }

  async getShiftConfigById (id) {
    const config = await this.shiftRepo.getShiftConfigById(id)
    if (!config) {
      throw new NotFoundError('Configuración de turno no encontrada')
    }
    return config
  }

  async createShiftConfig (data) {
    if (!data.location_id) {
      throw new BadRequestError('La ubicación es requerida')
    }
    if (!data.name) {
      throw new BadRequestError('El nombre del turno es requerido')
    }
    if (!data.start_time) {
      throw new BadRequestError('La hora de inicio es requerida')
    }
    if (!data.end_time) {
      throw new BadRequestError('La hora de fin es requerida')
    }

    const newConfig = await this.shiftRepo.createShiftConfig(data)
    return newConfig
  }

  async updateShiftConfig (id, data) {
    await this.getShiftConfigById(id)
    return await this.shiftRepo.updateShiftConfig(id, data)
  }

  async deleteShiftConfig (id) {
    await this.getShiftConfigById(id)
    await this.shiftRepo.deleteShiftConfig(id)
  }

  async getActiveShiftForLocation (locationId) {
    return await this.shiftRepo.getActiveShiftForLocation(locationId)
  }

  async getOpenShiftSession (locationId) {
    return await this.shiftRepo.getOpenShiftSession(locationId)
  }

  async openShift (locationId, userId) {
    const activeShift = await this.shiftRepo.getActiveShiftForLocation(locationId)

    if (!activeShift) {
      throw new BadRequestError('No hay un turno configurado para el horario actual')
    }

    const now = new Date()

    const sessionId = await this.shiftRepo.createShiftSession({
      shift_config_id: activeShift.id,
      location_id: locationId,
      user_id: userId,
      date: now.toISOString().slice(0, 10),
      day_of_week: now.getDay(),
      scheduled_start: activeShift.start_time,
      scheduled_end: activeShift.end_time,
      initial_amount: activeShift.default_initial_amount
    })

    return await this.shiftRepo.getShiftSessionById(sessionId)
  }

  async closeShift (sessionId, closingAmount, notes) {
    const session = await this.shiftRepo.getShiftSessionById(sessionId)

    if (!session) {
      throw new NotFoundError('Sesión de turno no encontrada')
    }

    if (session.status === 'closed') {
      throw new BadRequestError('Esta sesión ya está cerrada')
    }

    return await this.shiftRepo.updateShiftSessionStatus(sessionId, 'closed', closingAmount, notes)
  }

  async getShiftSessions (locationId, startDate = null, endDate = null) {
    return await this.shiftRepo.getShiftSessionsByLocation(locationId, startDate, endDate)
  }

  async getShiftsNeedingCloseReminder (locationId) {
    return await this.shiftRepo.getShiftsNeedingCloseReminder(locationId)
  }
}
