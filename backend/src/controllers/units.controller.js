export class UnitsController {
  constructor (unitsModel) {
    this.unitsModel = unitsModel
  }

  async getAll (req, res, next) {
    try {
      const { active } = req.query
      const activeOnly = active !== 'false'
      
      const units = await this.unitsModel.getAll(activeOnly)
      res.status(200).json({ success: true, data: units })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const unit = await this.unitsModel.getById(req.params.id)
      res.status(200).json({ success: true, data: unit })
    } catch (error) {
      next(error)
    }
  }

  async getItemUnits (req, res, next) {
    try {
      const units = await this.unitsModel.getItemUnits(req.params.itemId)
      res.status(200).json({ success: true, data: units })
    } catch (error) {
      next(error)
    }
  }

  async createItemUnit (req, res, next) {
    try {
      const units = await this.unitsModel.createItemUnit(req.body, req.userId)
      res.status(201).json({ success: true, message: 'Unidad agregada', data: units })
    } catch (error) {
      next(error)
    }
  }

  async updateItemUnit (req, res, next) {
    try {
      const units = await this.unitsModel.updateItemUnit(req.params.id, req.body, req.userId)
      res.status(200).json({ success: true, message: 'Unidad actualizada', data: units })
    } catch (error) {
      next(error)
    }
  }

  async deleteItemUnit (req, res, next) {
    try {
      const units = await this.unitsModel.deleteItemUnit(req.params.id, req.userId)
      res.status(200).json({ success: true, message: 'Unidad eliminada', data: units })
    } catch (error) {
      next(error)
    }
  }

  async calculatePrice (req, res, next) {
    try {
      const { item_id, unit_id, item_unit_price } = req.query
      
      if (!item_id || !unit_id || !item_unit_price) {
        return res.status(400).json({ 
          success: false, 
          message: 'Faltan parámetros: item_id, unit_id, item_unit_price' 
        })
      }
      
      const result = await this.unitsModel.calculatePriceByUnit(
        item_id, 
        unit_id, 
        parseFloat(item_unit_price)
      )
      
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
}
