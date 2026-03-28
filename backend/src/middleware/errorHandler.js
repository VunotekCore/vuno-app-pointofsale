import { AppError } from '../errors/AppError.js'

/**
 * Global error handler middleware
 * Catches all errors and returns appropriate HTTP responses
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  if (err instanceof ReferenceError || err instanceof TypeError) {
    return res.status(500).json({
      success: false,
      message: `Error de código: ${err.message}`
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    })
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      success: false,
      message: 'Conexión refusada, servicio de base de datos no disponible'
    })
  }

  if (err.code === 'ER_DATA_TOO_LONG') {
    return res.status(400).json({
      success: false,
      message: 'El registro es demasiado largo'
    })
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'El registro ya existe'
    })
  }

  if (err.code === 'ER_PARSE_ERROR') {
    return res.status(500).json({
      success: false,
      message: 'Error de sintaxis SQL'
    })
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referencia inválida: el registro relacionado no existe'
    })
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message })
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' })
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  })
}
