export class UsersModel {
  constructor (usersRepository) {
    this.usersRepo = usersRepository
  }

  async getUserWithRole (id) {
    return await this.usersRepo.getUserWithRole(id)
  }

  async getUserLocations (userId) {
    return await this.usersRepo.getUserLocations(userId)
  }

  async getAll (reqQuery = {}) {
    const { limit, offset, search, ...filters } = reqQuery
    return await this.usersRepo.getAll({ limit, offset, search, ...filters })
  }

  async getById (id) {
    return await this.usersRepo.getById(id)
  }

  async create (data, userId = null) {
    const { location_ids, employee, ...userData } = data
    return await this.usersRepo.createWithDetails({ ...userData, location_ids, employee }, userId)
  }

  async update (id, data, userId = null) {
    const { location_ids, employee, ...userData } = data
    return await this.usersRepo.updateWithDetails(id, { ...userData, location_ids, employee }, userId)
  }

  async delete (id, userId = null) {
    return await this.usersRepo.delete(id, userId)
  }

  async restore (id) {
    return await this.usersRepo.restore(id)
  }
}

import { usersRepository } from '../repository/users.repository.js'
export const usersModel = new UsersModel(usersRepository)
