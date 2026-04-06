export class ReceivingController {
  constructor(receivingModel) {
    this.receivingModel = receivingModel
  }

  async getAll (req, res, next) {
    try {
      const { status, supplier_id, location_id, search, start_date, end_date, limit, offset } = req.query
      const companyId = req.user?.company_id
      const filters = { status, supplier_id, location_id, search, start_date, end_date, company_id: companyId, limit, offset }
      const result = await this.receivingModel.getAll(filters)
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const receiving = await this.receivingModel.getById(id, companyId)
      res.status(200).json({ success: true, data: receiving })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const data = req.body
      const userId = req.user?.id || req.user?.user_id || null
      const companyId = req.user?.company_id
      const id = await this.receivingModel.create({ ...data, company_id: companyId }, userId)
      const newReceiving = await this.receivingModel.getById(id, companyId)
      res.status(201).json({ success: true, message: 'Recepción creada', data: newReceiving })
    } catch (error) {
      next(error)
    }
  }

  async complete (req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user?.id || req.user?.user_id || null
      const companyId = req.user?.company_id
      const completedReceiving = await this.receivingModel.complete(id, userId, companyId)
      res.status(200).json({ success: true, message: 'Recepción completada', data: completedReceiving })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      await this.receivingModel.delete(id, companyId)
      res.status(200).json({ success: true, message: 'Recepción eliminada' })
    } catch (error) {
      next(error)
    }
  }
}
