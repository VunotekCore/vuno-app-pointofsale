export class CustomersController {
  constructor(customersModel) {
    this.customersModel = customersModel
  }

  async create(req, res, next) {
    try {
      const companyId = req.user?.company_id
      const customer = await this.customersModel.create(req.body, req.userId, companyId)
      res.status(201).json({ success: true, message: 'Cliente creado', data: customer })
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const customer = await this.customersModel.update(id, req.body, companyId)
      res.status(200).json({ success: true, message: 'Cliente actualizado', data: customer })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const customer = await this.customersModel.getById(id, companyId)
      res.status(200).json({ success: true, data: customer })
    } catch (error) {
      next(error)
    }
  }

  async getAll(req, res, next) {
    try {
      const { search, customer_group_id, is_active, is_default, limit, offset } = req.query
      const companyId = req.user?.company_id
      const parseActive = (val) => {
        if (val === undefined || val === null || val === '') return null
        if (val === 'true' || val === '1' || val === 1) return 1
        if (val === 'false' || val === '0' || val === 0) return 0
        return parseInt(val) || null
      }
      const { customers, total } = await this.customersModel.getAll({
        search,
        customer_group_id,
        is_active: parseActive(is_active),
        is_default: is_default !== undefined ? parseInt(is_default) : null,
        company_id: companyId,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0
      })
      res.status(200).json({ success: true, data: customers, total })
    } catch (error) {
      next(error)
    }
  }

  async addPoints(req, res, next) {
    try {
      const { id } = req.params
      const { points, reference_type, reference_id, description } = req.body
      const companyId = req.user?.company_id
      const result = await this.customersModel.addPoints(id, points, reference_type, reference_id, description, companyId)
      res.status(200).json({ success: true, message: 'Puntos agregados', points_balance: result })
    } catch (error) {
      next(error)
    }
  }

  async redeemPoints(req, res, next) {
    try {
      const { id } = req.params
      const { points, reference_type, reference_id, description } = req.body
      const companyId = req.user?.company_id
      const result = await this.customersModel.redeemPoints(id, points, reference_type, reference_id, description, companyId)
      res.status(200).json({ success: true, message: 'Puntos canjeados', points_balance: result })
    } catch (error) {
      next(error)
    }
  }

  async getPointsLog(req, res, next) {
    try {
      const { id } = req.params
      const log = await this.customersModel.getPointsLog(id)
      res.status(200).json({ success: true, data: log })
    } catch (error) {
      next(error)
    }
  }

  async getSalesHistory(req, res, next) {
    try {
      const { id } = req.params
      const { limit } = req.query
      const companyId = req.user?.company_id
      const history = await this.customersModel.getSalesHistory(id, parseInt(limit) || 20, companyId)
      res.status(200).json({ success: true, data: history, total: history.length })
    } catch (error) {
      next(error)
    }
  }

  async search(req, res, next) {
    try {
      const { q } = req.query
      if (!q || q.length < 2) {
        return res.status(200).json({ success: true, data: [] })
      }
      const companyId = req.user?.company_id
      const customers = await this.customersModel.search(q, companyId)
      res.status(200).json({ success: true, data: customers })
    } catch (error) {
      next(error)
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const customer = await this.customersModel.getById(id, companyId)
      const updated = await this.customersModel.update(id, { is_active: customer.is_active ? 0 : 1 }, companyId)
      res.status(200).json({ success: true, message: 'Estado actualizado', data: updated })
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      await this.customersModel.delete(id, companyId)
      res.status(200).json({ success: true, message: 'Cliente eliminado' })
    } catch (error) {
      next(error)
    }
  }
}

export class CustomerGroupsController {
  constructor(customerGroupsModel) {
    this.groupsModel = customerGroupsModel
  }

  async create(req, res, next) {
    try {
      const companyId = req.user?.company_id
      const group = await this.groupsModel.create({ ...req.body, company_id: companyId })
      res.status(201).json({ success: true, message: 'Grupo creado', data: group })
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const group = await this.groupsModel.update(id, req.body, companyId)
      res.status(200).json({ success: true, message: 'Grupo actualizado', data: group })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const group = await this.groupsModel.getById(id, companyId)
      res.status(200).json({ success: true, data: group })
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const group = await this.groupsModel.update(id, req.body)
      res.status(200).json({ success: true, message: 'Grupo actualizado', data: group })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const group = await this.groupsModel.getById(id)
      res.status(200).json({ success: true, data: group })
    } catch (error) {
      next(error)
    }
  }

  async getAll(req, res, next) {
    try {
      const companyId = req.user?.company_id
      const groups = await this.groupsModel.getAll(companyId)
      res.status(200).json({ success: true, data: groups, total: groups.length })
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      await this.groupsModel.delete(id, companyId)
      res.status(200).json({ success: true, message: 'Grupo eliminado' })
    } catch (error) {
      next(error)
    }
  }
}

export class CustomerRewardsController {
  constructor(customerRewardsModel) {
    this.rewardsModel = customerRewardsModel
  }

  async create(req, res, next) {
    try {
      const companyId = req.user?.company_id
      const reward = await this.rewardsModel.create(req.body, companyId)
      res.status(201).json({ success: true, message: 'Recompensa creada', data: reward })
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const reward = await this.rewardsModel.update(id, req.body, companyId)
      res.status(200).json({ success: true, message: 'Recompensa actualizada', data: reward })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      const reward = await this.rewardsModel.getById(id, companyId)
      res.status(200).json({ success: true, data: reward })
    } catch (error) {
      next(error)
    }
  }

  async getAll(req, res, next) {
    try {
      const { active } = req.query
      const companyId = req.user?.company_id
      const rewards = await this.rewardsModel.getAll(active !== 'false', companyId)
      res.status(200).json({ success: true, data: rewards, total: rewards.length })
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      const companyId = req.user?.company_id
      await this.rewardsModel.delete(id, companyId)
      res.status(200).json({ success: true, message: 'Recompensa eliminada' })
    } catch (error) {
      next(error)
    }
  }

  async redeem(req, res, next) {
    try {
      const { id } = req.params
      const { customer_id, sale_id } = req.body
      const companyId = req.user?.company_id
      const reward = await this.rewardsModel.redeem(id, customer_id, sale_id || null, companyId)
      res.status(200).json({ success: true, message: 'Recompensa canjeada', data: reward })
    } catch (error) {
      next(error)
    }
  }
}
