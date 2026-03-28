export class CompanyConfigController {
  constructor (companyConfigModel) {
    this.companyModel = companyConfigModel
  }

  async get (req, res, next) {
    try {
      const config = await this.companyModel.get()
      res.status(200).json({ success: true, data: config })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const userId = req.user?.user_id || null
      await this.companyModel.update(req.body, userId)
      res.status(200).json({ success: true, message: 'Configuración actualizada' })
    } catch (error) {
      next(error)
    }
  }
}
