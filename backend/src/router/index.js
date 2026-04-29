import authRouter from './auth.router.js'
import usersRouter from './users.router.js'
import userLocationsRouter from './user-locations.router.js'
import { rolesRouter, permissionsRouter } from './roles.router.js'
import itemsRouter from './items.router.js'
import locationsRouter from './locations.router.js'
import inventoryRouter from './inventory.router.js'
import salesRouter from './sales.router.js'
import customersRouter from './customers.router.js'
import paymentRouter from './payment.router.js'
import employeesRouter from './employees.router.js'
import coreRouter from './core.router.js'
import dashboardRouter from './dashboard.router.js'
import shiftRouter from './shift.router.js'
import supplierRouter from './supplier.router.js'
import purchaseOrderRouter from './purchase-order.router.js'
import receivingRouter from './receiving.router.js'
import syncRouter from './sync.router.js'
import companyRouter from './company.router.js'
import companyMeRouter from './company-me.router.js'
import platformUserRouter from './platform-user.router.js'
import platformUserProtectedRouter from './platform-user-protected.router.js'
import unitsRouter from './units.router.js'
import reportsRouter from './reports.router.js'
import { expirationRouter } from './expiration.router.js'

export default {
  authRouter,
  usersRouter,
  userLocationsRouter,
  rolesRouter,
  permissionsRouter,
  itemsRouter,
  locationsRouter,
  inventoryRouter,
  salesRouter,
  customersRouter,
  paymentRouter,
  employeesRouter,
  coreRouter,
  dashboardRouter,
  shiftRouter,
  supplierRouter,
  purchaseOrderRouter,
  receivingRouter,
  syncRouter,
  companyRouter,
  companyMeRouter,
  platformUserRouter,
  platformUserProtectedRouter,
  unitsRouter,
  reportsRouter,
  expirationRouter
}