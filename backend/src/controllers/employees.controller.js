export class EmployeesController {
  constructor(employeesModel) {
    this.employeesModel = employeesModel
  }

  async getAll(req, res, next) {
    try {
      const { search, is_active, position, department, limit, offset } = req.query
      const isAdmin = req.user?.is_admin == 1
      
      const employees = await this.employeesModel.getAll(
        {
          search,
          is_active: is_active !== undefined ? parseInt(is_active) : undefined,
          position,
          department,
          limit: parseInt(limit) || 100,
          offset: parseInt(offset) || 0
        },
        req.userLocations || [],
        isAdmin
      )
      
      res.status(200).json({ success: true, data: employees, total: employees.length })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const employee = await this.employeesModel.getById(id)
      res.status(200).json({ success: true, data: employee })
    } catch (error) {
      next(error)
    }
  }

  async getByUserId(req, res, next) {
    try {
      const { userId } = req.params
      const employee = await this.employeesModel.getByUserId(userId)
      
      if (!employee) {
        return res.status(200).json({ success: true, data: null })
      }
      
      res.status(200).json({ success: true, data: employee })
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const isAdmin = req.user?.is_admin == 1
      const employee = await this.employeesModel.create(req.body, req.userId, isAdmin)
      res.status(201).json({ success: true, message: 'Empleado creado', data: employee })
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      const employee = await this.employeesModel.update(id, req.body, req.userId, isAdmin)
      res.status(200).json({ success: true, message: 'Empleado actualizado', data: employee })
    } catch (error) {
      next(error)
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params
      const isAdmin = req.user?.is_admin == 1
      await this.employeesModel.delete(id, req.userId, isAdmin)
      res.status(200).json({ success: true, message: 'Empleado eliminado' })
    } catch (error) {
      next(error)
    }
  }

  async getPositions(req, res, next) {
    try {
      const positions = await this.employeesModel.getPositions()
      res.status(200).json({ success: true, data: positions })
    } catch (error) {
      next(error)
    }
  }

  async getDepartments(req, res, next) {
    try {
      const departments = await this.employeesModel.getDepartments()
      res.status(200).json({ success: true, data: departments })
    } catch (error) {
      next(error)
    }
  }
}
