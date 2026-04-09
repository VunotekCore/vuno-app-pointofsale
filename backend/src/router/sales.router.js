import { Router } from 'express'
import database from '../config/database.js'
import { SalesRepository, ReturnsRepository } from '../repository/sales.repository.js'
import { InventoryRepository } from '../repository/inventory.repository.js'
import { ItemsRepository } from '../repository/items.repository.js'
import { CompanyRepository } from '../repository/company.repository.js'
import { PaymentRepository } from '../repository/payment.repository.js'
import { SequenceRepository } from '../repository/sequence.repository.js'
import { SalesModel, ReturnsModel } from '../models/sales.model.js'
import { SalesController, ReturnsController } from '../controllers/sales.controller.js'
import { authenticate, requireRoutePermission } from '../middleware/auth.middleware.js'
import { generateTicketPDF } from '../utils/ticket.utils.js'

const companyRepo = new CompanyRepository(database)
const sequenceRepo = new SequenceRepository(database, companyRepo)
const salesRepo = new SalesRepository(database, companyRepo, sequenceRepo)
const returnsRepo = new ReturnsRepository(database, companyRepo, sequenceRepo)
const inventoryRepo = new InventoryRepository(database)
const itemsRepo = new ItemsRepository(database)
const paymentRepo = new PaymentRepository(database)

const salesModel = new SalesModel(salesRepo, inventoryRepo, itemsRepo, paymentRepo)
const returnsModel = new ReturnsModel(returnsRepo, salesRepo, inventoryRepo, itemsRepo)

const salesController = new SalesController(salesModel, returnsModel)
const returnsController = new ReturnsController(returnsModel)

const router = Router()
const salesBasePath = '/sales'

router.get('/daily', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.getDailySales(req, res, next))
router.get('/summary', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.getSummary(req, res, next))
router.get('/top-items', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.getTopSellingItems(req, res, next))
router.get('/suspended', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.getSuspended(req, res, next))

router.get('/returns', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => returnsController.getAll(req, res, next))
router.get('/returns/:id', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => returnsController.getById(req, res, next))
router.post('/returns', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => returnsController.create(req, res, next))
router.post('/returns/:id/process', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => returnsController.process(req, res, next))

router.get('/', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.getAll(req, res, next))
router.get('/:id', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.getById(req, res, next))
router.post('/', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.create(req, res, next))
router.post('/:id/complete', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.complete(req, res, next))
router.post('/:id/suspend', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.suspend(req, res, next))
router.post('/:id/resume', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.resume(req, res, next))
router.post('/:id/cancel', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.cancel(req, res, next))
router.post('/:id/payments', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.addPayment(req, res, next))

router.put('/:id/items/:itemId', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.updateItem(req, res, next))
router.delete('/:id/items/:itemId', authenticate, requireRoutePermission(salesBasePath), (req, res, next) => salesController.removeItem(req, res, next))

router.get('/:id/ticket', authenticate, requireRoutePermission(salesBasePath), async (req, res, next) => {
  try {
    const { id } = req.params
    const isAdmin = req.user?.is_admin == 1
    const userLocations = req.userLocations || []
    const companyId = req.user?.company_id
    
    const sale = await salesModel.getSale(id, userLocations, isAdmin)
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada' })
    }

    const company = await companyRepo.findById(companyId)
    const pdfBuffer = await generateTicketPDF(sale, company)
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${sale.sale_number}.pdf"`)
    
    res.send(Buffer.from(pdfBuffer))
  } catch (error) {
    next(error)
  }
})

router.get('/:id/ticket/html', authenticate, requireRoutePermission(salesBasePath), async (req, res, next) => {
  try {
    const { id } = req.params
    const isAdmin = req.user?.is_admin == 1
    const userLocations = req.userLocations || []
    const companyId = req.user?.company_id
    
    const sale = await salesModel.getSale(id, userLocations, isAdmin)
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada' })
    }

    const company = await companyRepo.findById(companyId)
    const invoicePrefix = company?.invoice_prefix || 'F'
    const invoiceSequence = company?.invoice_sequence || 1
    const invoiceNumber = `${invoicePrefix}-${String(invoiceSequence).padStart(6, '0')}`
    const currencySymbol = company?.currency_symbol || '$'
    
    res.json({ 
      success: true, 
      data: { 
        html: generateTicketHTMLForPreview(sale, company, invoiceNumber, currencySymbol),
        saleNumber: sale.sale_number 
      } 
    })
  } catch (error) {
    next(error)
  }
})

function generateTicketHTMLForPreview(sale, companyConfig, invoiceNumber, currencySymbol) {
  const formatMoney = (amount) => {
    const num = parseFloat(amount) || 0
    return `${currencySymbol}${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-MX', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }
  
  const itemsHtml = (sale.items || []).map(item => {
    const qty = Number.isInteger(Number(item.quantity)) ? Number(item.quantity) : Number(item.quantity).toFixed(2)
    const unitAbbr = item.unit_abbreviation || ''
    return `
      <tr>
        <td style="padding: 3px 0; font-size: 10px;">${(item.item_name || 'Producto').substring(0, 20)}</td>
        <td style="text-align: center; padding: 3px 0; font-size: 10px;">${qty}${unitAbbr ? ' ' + unitAbbr : ''}</td>
        <td style="text-align: right; padding: 3px 0; font-size: 10px;">${formatMoney(item.unit_price)}</td>
        <td style="text-align: right; padding: 3px 0; font-size: 10px;">${formatMoney(item.line_total)}</td>
      </tr>
    `
  }).join('')
  
  const paymentsHtml = (sale.payments || []).map(p => `
    <div style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px;">
      <span>${p.payment_type}:</span>
      <span>${formatMoney(p.amount)}</span>
    </div>
  `).join('')
  
  const totalPaid = (sale.payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const change = totalPaid - parseFloat(sale.total)
  
  return `
    <div style="width: 220px; font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff;">
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 14px; font-weight: bold;">${companyConfig?.company_name || 'EMPRESA'}</div>
        ${companyConfig?.address ? `<div style="font-size: 10px;">${companyConfig.address}</div>` : ''}
        ${companyConfig?.phone ? `<div style="font-size: 10px;">Tel: ${companyConfig.phone}</div>` : ''}
        ${companyConfig?.nit ? `<div style="font-size: 10px;">NIT: ${companyConfig.nit}</div>` : ''}
      </div>
      <div style="border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 8px 0; margin: 8px 0; text-align: center;">
        <div style="font-weight: bold; font-size: 12px;">FACTURA DE VENTA</div>
        <div style="font-size: 10px; margin-top: 4px;">No: ${invoiceNumber}</div>
        <div style="font-size: 10px;">Venta: ${sale.sale_number}</div>
      </div>
      <div style="font-size: 10px; margin-bottom: 8px;">
        <div>Fecha: ${formatDate(sale.sale_date)}</div>
        ${sale.customer_name ? `<div>Cliente: ${sale.customer_name}</div>` : ''}
        <div>Ubicación: ${sale.location_name || 'N/A'}</div>
        <div>Atendió: ${sale.employee_name}</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <thead>
          <tr style="border-bottom: 1px solid #333;">
            <th style="text-align: left; font-size: 9px; padding: 2px 0;">PRODUCTO</th>
            <th style="text-align: center; font-size: 9px; padding: 2px 0;">CANT</th>
            <th style="text-align: right; font-size: 9px; padding: 2px 0;">PRECIO</th>
            <th style="text-align: right; font-size: 9px; padding: 2px 0;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="border-top: 1px solid #333; padding-top: 8px; margin-top: 4px; font-size: 10px;">
        <div style="display: flex; justify-content: space-between; padding: 2px 0;">
          <span>Subtotal:</span><span>${formatMoney(sale.subtotal)}</span>
        </div>
        ${sale.discount_amount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 2px 0;">
            <span>Descuento:</span><span>-${formatMoney(sale.discount_amount)}</span>
          </div>
        ` : ''}
        ${sale.tax_amount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 2px 0;">
            <span>Impuesto:</span><span>${formatMoney(sale.tax_amount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; padding: 4px 0; border-top: 1px solid #333; margin-top: 4px;">
          <span>TOTAL:</span><span>${formatMoney(sale.total)}</span>
        </div>
      </div>
      ${sale.payments?.length > 0 ? `
        <div style="margin-top: 8px; font-size: 10px;">
          <div style="border-top: 1px dashed #ccc; padding-top: 8px;"></div>
          <div style="font-weight: bold; padding: 4px 0;">PAGOS</div>
          ${paymentsHtml}
          <div style="display: flex; justify-content: space-between; padding: 2px 0; font-weight: bold;">
            <span>Total Pagado:</span><span>${formatMoney(totalPaid)}</span>
          </div>
          ${change > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 2px 0; font-weight: bold; color: green;">
              <span>Cambio:</span><span>${formatMoney(change)}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
      <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 10px; text-align: center; font-size: 9px;">
        <div>Gracias por su compra</div>
        <div>Conserve este ticket</div>
      </div>
    </div>
  `
}

export default router
