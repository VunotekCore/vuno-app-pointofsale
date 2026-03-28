import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { ForbiddenError } from '../errors/ForbiddenError.js'

export class TransferModel {
  constructor (transferRepository, inventoryRepository, itemsRepository) {
    this.transferRepo = transferRepository
    this.inventoryRepo = inventoryRepository
    this.itemsRepo = itemsRepository
  }

  async getAll (filters = {}, userLocations = [], isAdmin = false) {
    if (!isAdmin && userLocations.length > 0) {
      filters.user_locations = userLocations
    }
    return await this.transferRepo.getAll(filters)
  }

  async getPendingReceipt (userLocations = [], isAdmin = false) {
    if (!isAdmin && userLocations.length === 0) {
      return []
    }
    return await this.transferRepo.getPendingReceipt(userLocations, isAdmin)
  }

  async getById (id, userLocations = [], isAdmin = false) {
    const transfer = await this.transferRepo.getById(id)
    if (!transfer) {
      throw new NotFoundError('Transferencia no encontrada')
    }

    if (!isAdmin && userLocations.length > 0) {
      const hasAccess = userLocations.includes(transfer.from_location_id) ||
                        userLocations.includes(transfer.to_location_id)
      if (!hasAccess) {
        throw new ForbiddenError('No tienes acceso a esta transferencia')
      }
    }

    const items = await this.transferRepo.getItems(id)
    return { ...transfer, items }
  }

  async create (data, userId, userLocations = [], isAdmin = false) {
    if (data.from_location_id === data.to_location_id) {
      throw new BadRequestError('La ubicación de origen y destino no pueden ser iguales')
    }

    if (!isAdmin && userLocations.length > 0) {
      const hasAccess = userLocations.includes(data.from_location_id)
      if (!hasAccess) {
        throw new ForbiddenError('No tienes permiso para crear transferencias desde esta ubicación')
      }
    }

    const transferNumber = await this.transferRepo.getNextNumber()

    const id = await this.transferRepo.create({
      transfer_number: transferNumber,
      from_location_id: data.from_location_id,
      to_location_id: data.to_location_id,
      notes: data.notes,
      created_by: userId
    })

    return { id, transfer_number: transferNumber }
  }

  async addItem (data, userId, userLocations = [], isAdmin = false) {
    const item = await this.itemsRepo.getById(data.item_id)
    if (!item) {
      throw new NotFoundError('Producto no encontrado')
    }

    const transfer = await this.transferRepo.getById(data.transfer_id)
    if (!transfer) {
      throw new NotFoundError('Transferencia no encontrada')
    }

    if (!isAdmin && userLocations.length > 0) {
      const hasAccess = userLocations.includes(transfer.from_location_id)
      if (!hasAccess) {
        throw new ForbiddenError('No tienes permiso para agregar items a esta transferencia')
      }
    }

    if (transfer.status !== 'pending') {
      throw new BadRequestError('Solo se pueden agregar items a transferencias en estado pendiente')
    }

    const currentStock = await this.inventoryRepo.getTotalStock(
      data.item_id,
      data.variation_id,
      transfer.from_location_id
    )

    if (parseFloat(data.quantity) > currentStock) {
      throw new BadRequestError(`Stock insuficiente. Disponible: ${currentStock}`)
    }

    await this.transferRepo.addItem({
      transfer_id: data.transfer_id,
      item_id: data.item_id,
      variation_id: data.variation_id,
      quantity: data.quantity
    })

    await this.transferRepo.updateTotals(data.transfer_id)
  }

  async removeItem (transferId, itemId, userLocations = [], isAdmin = false) {
    const transfer = await this.transferRepo.getById(transferId)
    if (!transfer) {
      throw new NotFoundError('Transferencia no encontrada')
    }

    if (!isAdmin && userLocations.length > 0) {
      const hasAccess = userLocations.includes(transfer.from_location_id)
      if (!hasAccess) {
        throw new ForbiddenError('No tienes permiso para modificar esta transferencia')
      }
    }

    if (transfer.status !== 'pending') {
      throw new BadRequestError('Solo se pueden eliminar items de transferencias en estado pendiente')
    }

    await this.transferRepo.deleteItem(transferId, itemId)
    await this.transferRepo.updateTotals(transferId)
  }

  async ship (id, userId, userLocations = [], isAdmin = false) {
    const transfer = await this.transferRepo.getById(id)
    if (!transfer) {
      throw new NotFoundError('Transferencia no encontrada')
    }

    if (!isAdmin && userLocations.length > 0) {
      const hasAccess = userLocations.includes(transfer.from_location_id)
      if (!hasAccess) {
        throw new ForbiddenError('No tienes permiso para enviar esta transferencia')
      }
    }

    if (transfer.status !== 'pending') {
      throw new BadRequestError('Solo se pueden enviar transferencias en estado pendiente')
    }

    const items = await this.transferRepo.getItems(id)
    if (items.length === 0) {
      throw new BadRequestError('La transferencia no tiene items')
    }

    for (const item of items) {
      const currentStock = await this.inventoryRepo.getTotalStock(
        item.item_id,
        item.variation_id,
        transfer.from_location_id
      )

      if (parseFloat(item.quantity) > currentStock) {
        throw new BadRequestError(`Stock insuficiente para ${item.item_name}. Disponible: ${currentStock}`)
      }
    }

    await this.transferRepo.ship(id, userId)
    return true
  }

  async receive (id, userId, items = [], userLocations = [], isAdmin = false) {
    const transfer = await this.transferRepo.getById(id)
    if (!transfer) {
      throw new NotFoundError('Transferencia no encontrada')
    }

    if (!isAdmin && userLocations.length > 0) {
      const hasAccess = userLocations.includes(transfer.to_location_id)
      if (!hasAccess) {
        throw new ForbiddenError('No tienes permiso para recibir esta transferencia')
      }
    }

    if (transfer.status !== 'in_transit') {
      throw new BadRequestError('Solo se pueden recibir transferencias en tránsito')
    }

    await this.transferRepo.receive(id, userId, items)
    return true
  }

  async cancel (id, userId, userLocations = [], isAdmin = false) {
    const transfer = await this.transferRepo.getById(id)
    if (!transfer) {
      throw new NotFoundError('Transferencia no encontrada')
    }

    if (!isAdmin && userLocations.length > 0) {
      const hasAccess = userLocations.includes(transfer.from_location_id)
      if (!hasAccess) {
        throw new ForbiddenError('No tienes permiso para cancelar esta transferencia')
      }
    }

    if (transfer.status === 'received' || transfer.status === 'completed') {
      throw new BadRequestError('No se puede cancelar una transferencia completada')
    }

    await this.transferRepo.cancel(id, userId)
    return true
  }
}
