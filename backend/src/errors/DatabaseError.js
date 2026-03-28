import { AppError } from './AppError.js'

export class DatabaseError extends AppError {
  constructor (message = 'Error de base de datos', statusCode = 500) {
    super(message, statusCode)
    this.name = 'DatabaseError'
  }
}
