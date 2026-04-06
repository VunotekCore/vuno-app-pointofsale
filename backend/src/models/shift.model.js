import { ShiftRepository } from '../repository/shift.repository.js'
import { BadRequestError, NotFoundError } from '../errors/index.js'

export class ShiftModel {
  constructor (shiftRepository) {
    this.shiftRepo = shiftRepository
  }

  async getShiftConfigs (locationId = null, companyId = null) {
    if (locationId) {
      return await this.shiftRepo.getShiftConfigsByLocation(locationId, companyId)
    }
    return await this.shiftRepo.getAllShiftConfigs(companyId)
  }

  async getShiftConfigById (id, companyId) {
    const config = await this.shiftRepo.getShiftConfigById(id, companyId)
    if (!config) {
      throw new NotFoundError('Configuración de turno no encontrada')
    }
    return config
  }

  async createShiftConfig (data, companyId = null) {
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

    const newConfig = await this.shiftRepo.createShiftConfig({ ...data, company_id: companyId })
    return newConfig
  }

  async updateShiftConfig (id, data, companyId) {
    await this.getShiftConfigById(id, companyId)
    return await this.shiftRepo.updateShiftConfig(id, data, companyId)
  }

  async deleteShiftConfig (id, companyId) {
    await this.getShiftConfigById(id, companyId)
    await this.shiftRepo.deleteShiftConfig(id, companyId)
  }

  async getActiveShiftForLocation (locationId, companyId) {
    return await this.shiftRepo.getActiveShiftForLocation(locationId, companyId)
  }

  async getOpenShiftSession (locationId, companyId) {
    return await this.shiftRepo.getOpenShiftSession(locationId, companyId)
  }

  async openShift (locationId, userId, companyId = null) {
    const activeShift = await this.shiftRepo.getActiveShiftForLocation(locationId, companyId)

    if (!activeShift) {
      throw new BadRequestError('No hay un turno configurado para el horario actual')
    }

    const now = new Date()

    const sessionId = await this.shiftRepo.createShiftSession({
      shift_config_id: activeShift.id,
      location_id: locationId,
      company_id: companyId,
      user_id: userId,
      date: now.toISOString().slice(0, 10),
      day_of_week: now.getDay(),
      scheduled_start: activeShift.start_time,
      scheduled_end: activeShift.end_time,
      initial_amount: activeShift.default_initial_amount
    })

    return await this.shiftRepo.getShiftSessionById(sessionId, companyId)
  }

  async closeShift (sessionId, closingAmount, notes, companyId) {
    const session = await this.shiftRepo.getShiftSessionById(sessionId, companyId)

    if (!session) {
      throw new NotFoundError('Sesión de turno no encontrada')
    }

    if (session.status === 'closed') {
      throw new BadRequestError('Esta sesión ya está cerrada')
    }

    return await this.shiftRepo.updateShiftSessionStatus(sessionId, 'closed', closingAmount, notes, companyId)
  }

  async getShiftSessions (locationId, startDate = null, endDate = null, companyId) {
    return await this.shiftRepo.getShiftSessionsByLocation(locationId, startDate, endDate, companyId)
  }

  async getShiftsNeedingCloseReminder (locationId, companyId) {
    return await this.shiftRepo.getShiftsNeedingCloseReminder(locationId, companyId)
  }
}
