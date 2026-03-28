import { AppError } from './AppError.js'

export class BadRequestError extends AppError {
  constructor (message = 'Datos inválidos') {
    super(message, 400)
    this.name = 'BadRequestError'
  }
}
