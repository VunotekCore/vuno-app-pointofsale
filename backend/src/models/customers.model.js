import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { ForbiddenError } from '../errors/ForbiddenError.js'

export class CustomersModel {
  constructor(customersRepository, customerGroupsRepository, customerRewardsRepository) {
    this.customersRepo = customersRepository
    this.groupsRepo = customerGroupsRepository
    this.rewardsRepo = customerRewardsRepository
  }

  async create(data, userId) {
    const { email, phone } = data

    if (email) {
      const existing = await this.customersRepo.getByEmail(email)
      if (existing) {
        throw new BadRequestError('Ya existe un cliente con este email')
      }
    }

    if (phone) {
      const existing = await this.customersRepo.getByPhone(phone)
      if (existing) {
        throw new BadRequestError('Ya existe un cliente con este teléfono')
      }
    }

    const customerId = await this.customersRepo.create(data)
    return this.customersRepo.getById(customerId)
  }

  async update(id, data) {
    const existing = await this.customersRepo.getById(id)
    if (!existing) {
      throw new NotFoundError('Cliente no encontrado')
    }

    if (data.email && data.email !== existing.email) {
      const duplicate = await this.customersRepo.getByEmail(data.email)
      if (duplicate) {
        throw new BadRequestError('Ya existe un cliente con este email')
      }
    }

    await this.customersRepo.update(id, data)
    return this.customersRepo.getById(id)
  }

  async getById(id) {
    const customer = await this.customersRepo.getById(id)
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

  async addPoints(customerId, points, referenceType, referenceId, description) {
    return await this.customersRepo.addPoints(customerId, points, referenceType, referenceId, description)
  }

  async redeemPoints(customerId, points, referenceType, referenceId, description) {
    return await this.customersRepo.redeemPoints(customerId, points, referenceType, referenceId, description)
  }

  async getPointsLog(customerId) {
    return await this.customersRepo.getPointsLog(customerId)
  }

  async getSalesHistory(customerId, limit) {
    return await this.customersRepo.getSalesHistory(customerId, limit)
  }

  async updateCreditBalance(customerId, amount) {
    return await this.customersRepo.updateCreditBalance(customerId, amount)
  }

  async delete(id) {
    const existing = await this.customersRepo.getById(id)
    if (!existing) {
      throw new NotFoundError('Cliente no encontrado')
    }
    return await this.customersRepo.delete(id)
  }

  async search(query) {
    return await this.customersRepo.getAll({ search: query, limit: 10 })
  }
}

export class CustomerGroupsModel {
  constructor(customerGroupsRepository) {
    this.groupsRepo = customerGroupsRepository
  }

  async create(data) {
    const groupId = await this.groupsRepo.create(data)
    return this.groupsRepo.getById(groupId)
  }

  async update(id, data) {
    const existing = await this.groupsRepo.getById(id)
    if (!existing) {
      throw new NotFoundError('Grupo no encontrado')
    }

    await this.groupsRepo.update(id, data)
    return this.groupsRepo.getById(id)
  }

  async getById(id) {
    const group = await this.groupsRepo.getById(id)
    if (!group) {
      throw new NotFoundError('Grupo no encontrado')
    }
    return group
  }

  async getAll() {
    return await this.groupsRepo.getAll()
  }

  async delete(id) {
    const existing = await this.groupsRepo.getById(id)
    if (!existing) {
      throw new NotFoundError('Grupo no encontrado')
    }

    if (existing.is_default) {
      throw new BadRequestError('No se puede eliminar el grupo por defecto')
    }

    return await this.groupsRepo.delete(id)
  }
}

export class CustomerRewardsModel {
  constructor(customerRewardsRepository) {
    this.rewardsRepo = customerRewardsRepository
  }

  async create(data) {
    const rewardId = await this.rewardsRepo.create(data)
    return this.rewardsRepo.getById(rewardId)
  }

  async update(id, data) {
    const existing = await this.rewardsRepo.getById(id)
    if (!existing) {
      throw new NotFoundError('Recompensa no encontrada')
    }

    await this.rewardsRepo.update(id, data)
    return this.rewardsRepo.getById(id)
  }

  async getById(id) {
    const reward = await this.rewardsRepo.getById(id)
    if (!reward) {
      throw new NotFoundError('Recompensa no encontrada')
    }
    return reward
  }

  async getAll(activeOnly = true) {
    return await this.rewardsRepo.getAll(activeOnly)
  }

  async delete(id) {
    return await this.rewardsRepo.delete(id)
  }

  async redeem(rewardId, customerId, saleId) {
    return await this.rewardsRepo.redeem(rewardId, customerId, saleId)
  }
}
