import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { ForbiddenError } from '../errors/ForbiddenError.js'

export class CustomersModel {
  constructor(customersRepository, customerGroupsRepository, customerRewardsRepository) {
    this.customersRepo = customersRepository
    this.groupsRepo = customerGroupsRepository
    this.rewardsRepo = customerRewardsRepository
  }

  async create(data, userId, companyId) {
    const { email, phone } = data

    if (email) {
      const existing = await this.customersRepo.getByEmail(email, companyId)
      if (existing && existing.company_id === companyId) {
        throw new BadRequestError('Ya existe un cliente con este email')
      }
    }

    if (phone) {
      const existing = await this.customersRepo.getByPhone(phone, companyId)
      if (existing && existing.company_id === companyId) {
        throw new BadRequestError('Ya existe un cliente con este teléfono')
      }
    }

    const customerId = await this.customersRepo.create({ ...data, company_id: companyId })
    return this.customersRepo.getById(customerId, companyId)
  }

  async update(id, data, companyId) {
    const existing = await this.customersRepo.getById(id, companyId)
    if (!existing) {
      throw new NotFoundError('Cliente no encontrado')
    }

    if (data.email && data.email !== existing.email) {
      const duplicate = await this.customersRepo.getByEmail(data.email, companyId)
      if (duplicate && duplicate.company_id === companyId) {
        throw new BadRequestError('Ya existe un cliente con este email')
      }
    }

    await this.customersRepo.update(id, data, companyId)
    return this.customersRepo.getById(id, companyId)
  }

  async getById(id, companyId) {
    const customer = await this.customersRepo.getById(id, companyId)
    if (!customer) {
      throw new NotFoundError('Cliente no encontrado')
    }
    return customer
  }

  async getAll(filters = {}) {
    const customers = await this.customersRepo.getAll(filters)
    const total = await this.customersRepo.getCount(filters)
    return { customers, total }
  }

  async addPoints(customerId, points, referenceType, referenceId, description, companyId) {
    return await this.customersRepo.addPoints(customerId, points, referenceType, referenceId, description, companyId)
  }

  async redeemPoints(customerId, points, referenceType, referenceId, description, companyId) {
    return await this.customersRepo.redeemPoints(customerId, points, referenceType, referenceId, description, companyId)
  }

  async getPointsLog(customerId) {
    return await this.customersRepo.getPointsLog(customerId)
  }

  async getSalesHistory(customerId, limit, companyId) {
    return await this.customersRepo.getSalesHistory(customerId, limit, companyId)
  }

  async updateCreditBalance(customerId, amount, companyId) {
    return await this.customersRepo.updateCreditBalance(customerId, amount, companyId)
  }

  async delete(id, companyId) {
    const existing = await this.customersRepo.getById(id, companyId)
    if (!existing) {
      throw new NotFoundError('Cliente no encontrado')
    }
    return await this.customersRepo.delete(id, companyId)
  }

  async search(query, companyId) {
    return await this.customersRepo.getAll({ search: query, company_id: companyId, limit: 10 })
  }
}

export class CustomerGroupsModel {
  constructor(customerGroupsRepository) {
    this.groupsRepo = customerGroupsRepository
  }

  async create(data) {
    const groupId = await this.groupsRepo.create(data)
    return this.groupsRepo.getById(groupId, data.company_id)
  }

  async update(id, data, companyId) {
    const existing = await this.groupsRepo.getById(id, companyId)
    if (!existing) {
      throw new NotFoundError('Grupo no encontrado')
    }

    await this.groupsRepo.update(id, data, companyId)
    return this.groupsRepo.getById(id, companyId)
  }

  async getById(id, companyId) {
    const group = await this.groupsRepo.getById(id, companyId)
    if (!group) {
      throw new NotFoundError('Grupo no encontrado')
    }
    return group
  }

  async getAll(company_id) {
    return await this.groupsRepo.getAll(company_id)
  }

  async delete(id, companyId) {
    const existing = await this.groupsRepo.getById(id, companyId)
    if (!existing) {
      throw new NotFoundError('Grupo no encontrado')
    }
    if (existing.is_default) {
      throw new BadRequestError('No se puede eliminar el grupo por defecto')
    }
    return await this.groupsRepo.delete(id, companyId)
  }

  async getDefault(companyId) {
    return await this.groupsRepo.getDefault(companyId)
  }
}

export class CustomerRewardsModel {
  constructor(customerRewardsRepository) {
    this.rewardsRepo = customerRewardsRepository
  }

  async create(data, companyId) {
    const rewardId = await this.rewardsRepo.create({ ...data, company_id: companyId })
    return this.rewardsRepo.getById(rewardId, companyId)
  }

  async update(id, data, companyId) {
    const existing = await this.rewardsRepo.getById(id, companyId)
    if (!existing) {
      throw new NotFoundError('Recompensa no encontrada')
    }

    await this.rewardsRepo.update(id, data)
    return this.rewardsRepo.getById(id, companyId)
  }

  async getById(id, companyId) {
    const reward = await this.rewardsRepo.getById(id, companyId)
    if (!reward) {
      throw new NotFoundError('Recompensa no encontrada')
    }
    return reward
  }

  async getAll(activeOnly = true, companyId = null) {
    return await this.rewardsRepo.getAll(activeOnly, companyId)
  }

  async delete(id, companyId) {
    return await this.rewardsRepo.delete(id)
  }

  async redeem(rewardId, customerId, saleId, companyId) {
    return await this.rewardsRepo.redeem(rewardId, customerId, saleId, companyId)
  }
}
