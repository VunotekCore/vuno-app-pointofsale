import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { ForbiddenError } from '../errors/ForbiddenError.js'

export class EmployeesModel {
  constructor (employeesRepository, usersRepository) {
    this.employeesRepo = employeesRepository
    this.usersRepo = usersRepository
  }

  async getAll (filters = {}, userLocations = [], isAdmin = false) {
    return await this.employeesRepo.getAll(filters)
  }

  async getById (id, companyId) {
    const employee = await this.employeesRepo.getById(id, companyId)
    if (!employee) {
      throw new NotFoundError('Empleado no encontrado')
    }
    return employee
  }

  async getByUserId (userId, companyId) {
    return await this.employeesRepo.getByUserId(userId, companyId)
  }

  async create (data, userId, isAdmin = false, companyId) {
    if (!isAdmin) {
      throw new ForbiddenError('No tienes permiso para crear empleados')
    }

    if (!data.user_id) {
      throw new BadRequestError('El usuario es requerido')
    }

    const user = await this.usersRepo.getById(data.user_id)
    if (!user) {
      throw new NotFoundError('Usuario no encontrado')
    }

    const existingEmployee = await this.employeesRepo.getByUserId(data.user_id, companyId)
    if (existingEmployee) {
      throw new BadRequestError('El usuario ya tiene un perfil de empleado')
    }

    const id = await this.employeesRepo.create({ ...data, company_id: companyId })
    return await this.employeesRepo.getById(id, companyId)
  }

  async update (id, data, userId, isAdmin = false, companyId) {
    const employee = await this.employeesRepo.getById(id, companyId)
    if (!employee) {
      throw new NotFoundError('Empleado no encontrado')
    }

    if (!isAdmin && userId !== employee.user_id) {
      throw new ForbiddenError('No tienes permiso para actualizar este empleado')
    }

    return await this.employeesRepo.update(id, data, companyId)
  }

  async delete (id, userId, isAdmin = false, companyId) {
    if (!isAdmin) {
      throw new ForbiddenError('No tienes permiso para eliminar empleados')
    }

    return await this.employeesRepo.delete(id, companyId)
  }

  async getPositions (companyId) {
    return await this.employeesRepo.getPositions(companyId)
  }

  async getDepartments (companyId) {
    return await this.employeesRepo.getDepartments(companyId)
  }
}
