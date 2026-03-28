/**
 * Controller for authentication HTTP endpoints
 */
export class AuthController {
  constructor (authModel) {
    this.authModel = authModel
  }

  async login (req, res, next) {
    try {
      const { username, password } = req.body
      const result = await this.authModel.login({ username, password })
      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async passwordRequest (req, res, next) {
    try {
      const { email } = req.body
      await this.authModel.passwordRequest({ email })
      res.status(200).json({
        success: true,
        message: 'Token de recuperación enviado al email'
      })
    } catch (error) {
      next(error)
    }
  }

  async passwordReset (req, res, next) {
    try {
      const { token, new_password: newPassword } = req.body
      await this.authModel.passwordReset({ token, newPassword })
      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}
