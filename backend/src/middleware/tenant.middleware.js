import { UnauthorizedError, ForbiddenError } from '../errors/index.js'

export const tenantContext = async (req, res, next) => {
  try {
    if (req.platformUser) {
      req.companyId = req.platformUser.company_id
      req.isPlatformUser = true
      req.isSuperAdmin = req.platformUser.is_super_admin === 1
    } else if (req.user) {
      req.companyId = req.user.company_id
      req.isPlatformUser = false
      req.isSuperAdmin = false
    } else {
      throw new UnauthorizedError('No se encontró contexto de tenant')
    }

    next()
  } catch (error) {
    next(error)
  }
}

export const requireCompanyId = (req, res, next) => {
  if (!req.companyId && !req.isSuperAdmin) {
    return res.status(400).json({
      success: false,
      message: 'Company ID es requerido'
    })
  }
  next()
}

export const companyFilter = (tableAlias = 't') => {
  return (req, res, next) => {
    if (req.isSuperAdmin && req.query.all_companies === '1') {
      req.companyFilter = null
    } else {
      req.companyFilter = req.companyId
      req.companyFilterAlias = tableAlias
    }
    next()
  }
}

export function buildCompanyWhereClause(tableAlias = 'company_id', params = []) {
  return function(req, res, next) {
    if (req.isSuperAdmin && req.query.all_companies === '1') {
      req.whereClause = ''
    } else if (req.companyId) {
      req.whereClause = ` AND ${tableAlias} = UUID_TO_BIN(?)`
      params.push(req.companyId)
    } else {
      req.whereClause = ''
    }
    next()
  }
}
