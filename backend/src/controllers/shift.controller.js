export class ShiftController {
  constructor(shiftModel) {
    this.shiftModel = shiftModel
  }

  async getShiftConfigs(req, res, next) {
    try {
      const { location_id } = req.query
      const companyId = req.user?.company_id
      const configs = await this.shiftModel.getShiftConfigs(location_id || null, companyId)
      res.status(200).json({ success: true, data: configs, total: configs.length })
    } catch (error) {
      next(error)
    }
  }

  async getShiftConfig(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const config = await this.shiftModel.getShiftConfigById(id, companyId)
      res.status(200).json({ success: true, data: config })
    } catch (error) {
      next(error)
    }
  }

  async createShiftConfig(req, res, next) {
    try {
      const companyId = req.user?.company_id
      const config = await this.shiftModel.createShiftConfig(req.body, companyId)
      res.status(201).json({ success: true, message: 'Turno creado', data: config })
    } catch (error) {
      next(error)
    }
  }

  async updateShiftConfig(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const config = await this.shiftModel.updateShiftConfig(id, req.body, companyId)
      res.status(200).json({ success: true, message: 'Turno actualizado', data: config })
    } catch (error) {
      next(error)
    }
  }

  async deleteShiftConfig(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      await this.shiftModel.deleteShiftConfig(id, companyId)
      res.status(200).json({ success: true, message: 'Turno eliminado' })
    } catch (error) {
      next(error)
    }
  }

  async getActiveShift(req, res, next) {
    try {
      const { location_id } = req.query
      if (!location_id) {
        return res.status(400).json({ success: false, message: 'Location ID requerido' })
      }
      const companyId = req.user?.company_id
      const shift = await this.shiftModel.getActiveShiftForLocation(location_id, companyId)
      res.status(200).json({ success: true, data: shift })
    } catch (error) {
      next(error)
    }
  }

  async getOpenSession(req, res, next) {
    try {
      const { location_id } = req.query
      if (!location_id) {
        return res.status(400).json({ success: false, message: 'Location ID requerido' })
      }
      const companyId = req.user?.company_id
      const session = await this.shiftModel.getOpenShiftSession(location_id, companyId)
      res.status(200).json({ success: true, data: session })
    } catch (error) {
      next(error)
    }
  }

  async openSession(req, res, next) {
    try {
      const { location_id } = req.body
      if (!location_id) {
        return res.status(400).json({ success: false, message: 'Location ID requerido' })
      }
      const companyId = req.user?.company_id
      const session = await this.shiftModel.openShift(location_id, req.userId, companyId)
      res.status(201).json({ success: true, message: 'Turno abierto', data: session })
    } catch (error) {
      next(error)
    }
  }

  async closeSession(req, res, next) {
    try {
      const { id } = req.params
      const { closing_amount, notes } = req.body
      const companyId = req.user?.company_id
      
      if (closing_amount === undefined || closing_amount === null) {
        return res.status(400).json({ success: false, message: 'Closing amount requerido' })
      }
      
      const session = await this.shiftModel.closeShift(id, parseFloat(closing_amount), notes, companyId)
      res.status(200).json({ success: true, message: 'Turno cerrado', data: session })
    } catch (error) {
      next(error)
    }
  }

  async getSessions(req, res, next) {
    try {
      const { location_id, start_date, end_date } = req.query
      const companyId = req.user?.company_id
      
      if (!location_id) {
        return res.status(400).json({ success: false, message: 'Location ID requerido' })
      }
      
      const sessions = await this.shiftModel.getShiftSessions(
        location_id,
        start_date,
        end_date,
        companyId
      )
      res.status(200).json({ success: true, data: sessions, total: sessions.length })
    } catch (error) {
      next(error)
    }
  }

  async getCloseReminders(req, res, next) {
    try {
      const { location_id } = req.query
      const companyId = req.user?.company_id
      if (!location_id) {
        return res.status(400).json({ success: false, message: 'Location ID requerido' })
      }
      const shifts = await this.shiftModel.getShiftsNeedingCloseReminder(location_id, companyId)
      res.status(200).json({ success: true, data: shifts })
    } catch (error) {
      next(error)
    }
  }
}
