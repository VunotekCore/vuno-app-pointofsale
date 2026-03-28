export class ReceivingController {
  constructor(receivingModel) {
    this.receivingModel = receivingModel
  }

  async getAll (req, res, next) {
    try {
      const { status, supplier_id, location_id, search, start_date, end_date, limit, offset } = req.query
      const filters = { status, supplier_id, location_id, search, start_date, end_date, limit, offset }
      const result = await this.receivingModel.getAll(filters)
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const { id } = req.params
      const receiving = await this.receivingModel.getById(id)
      res.status(200).json({ success: true, data: receiving })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const data = req.body
      const userId = req.user?.id || req.user?.user_id || null
      const id = await this.receivingModel.create(data, userId)
      const newReceiving = await this.receivingModel.getById(id)
      res.status(201).json({ success: true, message: 'Recepción creada', data: newReceiving })
    } catch (error) {
      next(error)
    }
  }

  async complete (req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user?.id || req.user?.user_id || null
      const completedReceiving = await this.receivingModel.complete(id, userId)
      res.status(200).json({ success: true, message: 'Recepción completada', data: completedReceiving })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const { id } = req.params
      await this.receivingModel.delete(id)
      res.status(200).json({ success: true, message: 'Recepción eliminada' })
    } catch (error) {
      next(error)
    }
  }
}
