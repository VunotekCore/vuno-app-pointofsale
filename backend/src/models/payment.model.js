import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { ForbiddenError } from '../errors/ForbiddenError.js'

export class PaymentModel {
  constructor (paymentRepository, salesRepository, shiftRepository = null) {
    this.paymentRepo = paymentRepository
    this.salesRepo = salesRepository
    this.shiftRepo = shiftRepository
  }

  async getPaymentMethods () {
    return await this.paymentRepo.getAllPaymentMethods()
  }

  async getPaymentMethod (id) {
    const method = await this.paymentRepo.getPaymentMethodById(id)
    if (!method) {
      throw new NotFoundError('Método de pago no encontrado')
    }
    return method
  }

  async createPaymentMethod (data, userId, isAdmin = false) {
    if (!isAdmin) {
      throw new ForbiddenError('No tienes permiso para crear métodos de pago')
    }

    const existing = await this.paymentRepo.getPaymentMethodByCode(data.code)
    if (existing) {
      throw new BadRequestError('Ya existe un método de pago con este código')
    }

    const id = await this.paymentRepo.createPaymentMethod(data)
    return await this.paymentRepo.getPaymentMethodById(id)
  }

  async updatePaymentMethod (id, data, userId, isAdmin = false) {
    if (!isAdmin) {
      throw new ForbiddenError('No tienes permiso para actualizar métodos de pago')
    }

    const method = await this.paymentRepo.getPaymentMethodById(id)
    if (!method) {
      throw new NotFoundError('Método de pago no encontrado')
    }

    if (data.code && data.code !== method.code) {
      const existing = await this.paymentRepo.getPaymentMethodByCode(data.code)
      if (existing) {
        throw new BadRequestError('Ya existe un método de pago con este código')
      }
    }

    await this.paymentRepo.updatePaymentMethod(id, data)
    return await this.paymentRepo.getPaymentMethodById(id)
  }

  async deletePaymentMethod (id, userId, isAdmin = false) {
    if (!isAdmin) {
      throw new ForbiddenError('No tienes permiso para eliminar métodos de pago')
    }

    const method = await this.paymentRepo.getPaymentMethodById(id)
    if (!method) {
      throw new NotFoundError('Método de pago no encontrado')
    }

    await this.paymentRepo.deletePaymentMethod(id)
    return { success: true }
  }

  async getCashDrawers (locationId = null, userLocations = [], isAdmin = false, companyId) {
    let locId = locationId
    if (!isAdmin && userLocations.length > 0 && !locationId) {
      locId = userLocations[0]
    }
    return await this.paymentRepo.getCashDrawers(locId, companyId)
  }

  async getCashDrawer (id, userLocations = [], isAdmin = false, companyId) {
    const drawer = await this.paymentRepo.getCashDrawerById(id, companyId)
    if (!drawer) {
      throw new NotFoundError('Caja no encontrada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(drawer.location_id)) {
      throw new ForbiddenError('No tienes permiso para ver esta caja')
    }

    return drawer
  }

  async getOpenDrawer (locationId, userId, userLocations = [], isAdmin = false, companyId) {
    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(locationId)) {
      throw new ForbiddenError('No tienes permiso para abrir caja en esta ubicación')
    }

    const drawer = await this.paymentRepo.getOpenDrawer(locationId, userId, companyId)
    return drawer
  }

  async openDrawer (data, userId, userLocations = [], isAdmin = false, companyId = null) {
    const { location_id, initial_amount, name, notes } = data

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(location_id)) {
      throw new ForbiddenError('No tienes permiso para abrir caja en esta ubicación')
    }

    const existingOpen = await this.paymentRepo.getOpenDrawer(location_id, userId, companyId)
    if (existingOpen) {
      throw new BadRequestError('Ya tienes una caja abierta en esta ubicación')
    }

    let shiftConfig = null
    let finalInitialAmount = initial_amount || 0

    if (!initial_amount && this.shiftRepo) {
      shiftConfig = await this.shiftRepo.getActiveShiftForLocation(location_id)
      if (shiftConfig) {
        finalInitialAmount = parseFloat(shiftConfig.default_initial_amount) || 0
      }
    }

    const drawerId = await this.paymentRepo.openDrawer({
      name: name || (shiftConfig ? `Caja - ${shiftConfig.name}` : `Caja - ${new Date().toLocaleDateString()}`),
      location_id,
      company_id: companyId,
      initial_amount: finalInitialAmount,
      opened_by: userId,
      notes: shiftConfig ? `${notes || ''} [Turno: ${shiftConfig.name}]`.trim() : notes
    })

    const drawer = await this.paymentRepo.getCashDrawerById(drawerId, companyId)
    if (shiftConfig) {
      drawer.shift_config = {
        id: shiftConfig.id,
        name: shiftConfig.name,
        default_initial_amount: parseFloat(shiftConfig.default_initial_amount)
      }
    }
    return drawer
  }

  async closeDrawer (id, data, userId, userLocations = [], isAdmin = false, companyId = null) {
    const drawer = await this.paymentRepo.getCashDrawerById(id, companyId)
    if (!drawer) {
      throw new NotFoundError('Caja no encontrada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(drawer.location_id)) {
      throw new ForbiddenError('No tienes permiso para cerrar esta caja')
    }

    if (drawer.status !== 'open') {
      throw new BadRequestError('La caja no está abierta')
    }

    const { closing_amount, notes } = data

    const summary = await this.paymentRepo.getCashSalesSummary(id, null, null, companyId)
    const expectedCash = summary ? summary.expected_cash : parseFloat(drawer.initial_amount)

    const result = await this.paymentRepo.closeDrawer(id, userId, closing_amount, notes, companyId)

    const difference = closing_amount - expectedCash
    if (Math.abs(difference) > 0.01) {
      const adjustmentType = difference > 0 ? 'overage' : 'shortage'
      const adjustmentNotes = difference > 0
        ? `Sobrante en cierre: ${Math.abs(difference).toFixed(2)}`
        : `Faltante en cierre: ${Math.abs(difference).toFixed(2)}`
      await this.paymentRepo.createAdjustment(id, drawer.opened_by, companyId, adjustmentType, Math.abs(difference), adjustmentNotes)
    }

    return {
      ...result,
      drawer: await this.paymentRepo.getCashDrawerById(id, companyId),
      expected_cash: expectedCash,
      difference
    }
  }

  async getDrawerTransactions (drawerId, filters = {}, userLocations = [], isAdmin = false, companyId) {
    const drawer = await this.paymentRepo.getCashDrawerById(drawerId, companyId)
    if (!drawer) {
      throw new NotFoundError('Caja no encontrada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(drawer.location_id)) {
      throw new ForbiddenError('No tienes permiso para ver transacciones de esta caja')
    }

    return await this.paymentRepo.getDrawerTransactions(
      drawerId,
      filters.start_date,
      filters.end_date,
      companyId
    )
  }

  async getDrawerSummary (drawerId, userLocations = [], isAdmin = false, companyId) {
    const drawer = await this.paymentRepo.getCashDrawerById(drawerId, companyId)
    if (!drawer) {
      throw new NotFoundError('Caja no encontrada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(drawer.location_id)) {
      throw new ForbiddenError('No tienes permiso para ver esta caja')
    }

    return await this.paymentRepo.getDrawerSummary(drawerId, companyId)
  }

  async getPaymentSummary (locationId, startDate, endDate, userLocations = [], isAdmin = false, companyId) {
    let locId = locationId
    if (!isAdmin && userLocations.length > 0 && !locationId) {
      locId = userLocations[0]
    }

    return await this.paymentRepo.getPaymentSummaryByDate(locId, startDate, endDate, companyId)
  }

  async getCashDrawerSummary (drawerId, userLocations = [], isAdmin = false, startDate = null, endDate = null, companyId) {
    const drawer = await this.paymentRepo.getCashDrawerById(drawerId, companyId)
    if (!drawer) {
      throw new NotFoundError('Caja no encontrada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(drawer.location_id)) {
      throw new ForbiddenError('No tienes permiso para ver esta caja')
    }

    return await this.paymentRepo.getCashSalesSummary(drawerId, startDate, endDate, companyId)
  }

  async getDrawerHistory (locationId, userLocations = [], isAdmin = false, filters = {}, companyId) {
    let locId = locationId
    if (!isAdmin && userLocations.length > 0 && !locationId) {
      locId = userLocations[0]
    }

    return await this.paymentRepo.getDrawerHistory(locId, filters, companyId)
  }

  async addTransaction (drawerId, data, userId, userLocations = [], isAdmin = false, companyId = null) {
    const drawer = await this.paymentRepo.getCashDrawerById(drawerId, companyId)
    if (!drawer) {
      throw new NotFoundError('Caja no encontrada')
    }

    if (!isAdmin && userLocations.length > 0 && !userLocations.includes(drawer.location_id)) {
      throw new ForbiddenError('No tienes permiso para realizar transacciones en esta caja')
    }

    if (drawer.status !== 'open') {
      throw new BadRequestError('La caja está cerrada')
    }

    const { transaction_type, amount, notes } = data
    if (!transaction_type || !amount) {
      throw new BadRequestError('Tipo de transacción y monto son requeridos')
    }

    const transactionId = await this.paymentRepo.addTransaction({
      drawer_id: drawerId,
      company_id: companyId,
      transaction_type,
      amount: parseFloat(amount),
      notes: notes || '',
      created_by: userId
    })

    return { id: transactionId, drawer_id: drawerId, transaction_type, amount: parseFloat(amount), notes }
  }

  async createAdjustment (drawerId, userId, companyId, adjustmentType, amount, notes) {
    await this.paymentRepo.createAdjustment(drawerId, userId, companyId, adjustmentType, amount, notes)
  }

  async getAdjustmentsByDrawer (drawerId, companyId) {
    return await this.paymentRepo.getAdjustmentsByDrawer(drawerId, companyId)
  }

  async getUserAdjustments (userId, filters = {}, companyId) {
    return await this.paymentRepo.getAdjustmentsByUser(userId, filters, companyId)
  }

  async updateAdjustmentStatus (adjustmentId, status, userId = null, companyId = null) {
    await this.paymentRepo.updateAdjustmentStatus(adjustmentId, status)

    if (status === 'approved' && userId) {
      const adjustment = await this.paymentRepo.getAdjustmentById(adjustmentId, companyId)
      if (adjustment && adjustment.adjustment_type === 'shortage') {
        await this.paymentRepo.createAccountReceivable(
          userId,
          adjustmentId,
          companyId,
          adjustment.amount,
          `Cuenta por cobrar por faltante en caja: ${adjustment.notes}`
        )
      }
    }
  }

  async getAccountsReceivable (filters = {}, companyId) {
    return await this.paymentRepo.getAccountsReceivable(filters, companyId)
  }

  async updateAccountReceivable (id, paidAmount, companyId = null) {
    const account = await this.paymentRepo.getAccountReceivableById(id, companyId)
    if (!account) {
      throw new NotFoundError('Cuenta por cobrar no encontrada')
    }

    const newPaidAmount = parseFloat(account.paid_amount || 0) + parseFloat(paidAmount)
    const newStatus = newPaidAmount >= parseFloat(account.amount) ? 'paid' : 'partial'

    await this.paymentRepo.updateAccountReceivable(id, newPaidAmount, newStatus)
    return { id, paid_amount: newPaidAmount, status: newStatus }
  }

  async getAccountReceivableById (id, companyId = null) {
    return await this.paymentRepo.getAccountReceivableById(id, companyId)
  }

  async getCashiers (companyId) {
    return await this.paymentRepo.getCashiers(companyId)
  }
}
