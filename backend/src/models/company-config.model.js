import { BadRequestError } from '../errors/BadRequestError.js'

export class CompanyConfigModel {
  constructor (companyConfigRepository) {
    this.companyRepo = companyConfigRepository
  }

  async get () {
    const config = await this.companyRepo.get()
    if (!config) {
      return {
        id: null,
        company_name: '',
        address: '',
        phone: '',
        email: '',
        nit: '',
        logo_url: '',
        invoice_prefix: 'F',
        invoice_sequence: 1
      }
    }
    return config
  }

  async update (data, userId = null) {
    const { company_name: companyName, address, nit } = data

    const existing = await this.companyRepo.get()

    const isCurrencyOnly = existing && 
                          data.currency_code !== undefined && 
                          data.currency_symbol !== undefined && 
                          data.decimal_places !== undefined &&
                          !data.company_name && 
                          !data.address && 
                          !data.nit

    if (!isCurrencyOnly) {
      const errors = {}
      if (!companyName?.trim()) errors.company_name = 'El nombre de la empresa es requerido'
      if (!address?.trim()) errors.address = 'La dirección es requerida'
      if (!nit?.trim()) errors.nit = 'El NIT es requerido'

      if (Object.keys(errors).length > 0) {
        throw new BadRequestError('Validación fallida')
      }
    }

    if (!existing) {
      return await this.companyRepo.create(data, userId)
    } else {
      return await this.companyRepo.update(existing.id, data, userId)
    }
  }
}
