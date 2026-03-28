import { jsPDF } from 'jspdf'

function formatMoney (amount, symbol = '$') {
  const num = parseFloat(amount) || 0
  return `${symbol}${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate (date) {
  return new Date(date).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function generateTicketPDF (sale, companyConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150]
  })

  const currencySymbol = companyConfig?.currency_symbol || '$'
  const invoicePrefix = companyConfig?.invoice_prefix || 'F'
  const invoiceSequence = companyConfig?.invoice_sequence || 1
  const companyName = companyConfig?.company_name || 'EMPRESA'
  const companyAddress = companyConfig?.address || ''
  const companyPhone = companyConfig?.phone || ''
  const companyNit = companyConfig?.nit || ''

  const invoiceNumber = `${invoicePrefix}-${String(invoiceSequence).padStart(6, '0')}`

  let y = 8

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(companyName, 40, y, { align: 'center' })
  y += 4

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  if (companyAddress) {
    doc.text(companyAddress, 40, y, { align: 'center' })
    y += 3
  }
  if (companyPhone) {
    doc.text(`Tel: ${companyPhone}`, 40, y, { align: 'center' })
    y += 3
  }
  if (companyNit) {
    doc.text(`NIT: ${companyNit}`, 40, y, { align: 'center' })
    y += 3
  }

  y += 2
  doc.setLineWidth(0.2)
  doc.line(5, y, 75, y)
  y += 3

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURA DE VENTA', 40, y, { align: 'center' })
  y += 4

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`No: ${invoiceNumber}`, 5, y)
  y += 3
  doc.text(`Venta: ${sale.sale_number}`, 5, y)
  y += 4

  doc.text(`Fecha: ${formatDate(sale.sale_date)}`, 5, y)
  y += 3

  if (sale.customer_name) {
    doc.text(`Cliente: ${sale.customer_name}`, 5, y)
    y += 3
  }

  doc.text(`Ubicación: ${sale.location_name || 'N/A'}`, 5, y)
  y += 3
  doc.text(`Atendió: ${sale.employee_name}`, 5, y)
  y += 4

  doc.line(5, y, 75, y)
  y += 2

  doc.setFontSize(7)
  doc.text('PRODUCTO', 5, y)
  doc.text('CANT', 42, y)
  doc.text('PRECIO', 57, y)
  doc.text('TOTAL', 70, y)
  y += 2

  doc.line(5, y, 75, y)
  y += 2

  doc.setFont('helvetica', 'normal')
  for (const item of sale.items || []) {
    const itemName = item.item_name?.length > 18
      ? item.item_name.substring(0, 18)
      : item.item_name || 'Producto'

    const quantity = Number.isInteger(Number(item.quantity))
      ? Number(item.quantity)
      : Number(item.quantity).toFixed(2)

    const unitAbbr = item.unit_abbreviation || item.unit_name?.substring(0, 3) || ''
    const qtyText = `${quantity}${unitAbbr ? ' ' + unitAbbr : ''}`

    doc.text(itemName.substring(0, 20), 5, y)
    doc.text(qtyText, 42, y)
    doc.text(formatMoney(item.unit_price, currencySymbol).substring(0, 10), 57, y)
    doc.text(formatMoney(item.line_total, currencySymbol).substring(0, 10), 70, y)
    y += 3
  }

  y += 1
  doc.line(5, y, 75, y)
  y += 3

  doc.setFontSize(8)
  doc.text('Subtotal:', 40, y, { align: 'right' })
  doc.text(formatMoney(sale.subtotal, currencySymbol), 75, y, { align: 'right' })
  y += 3

  if (sale.discount_amount > 0) {
    doc.text('Descuento:', 40, y, { align: 'right' })
    doc.text(`-${formatMoney(sale.discount_amount, currencySymbol)}`, 75, y, { align: 'right' })
    y += 3
  }

  if (sale.tax_amount > 0) {
    doc.text('Impuesto:', 40, y, { align: 'right' })
    doc.text(formatMoney(sale.tax_amount, currencySymbol), 75, y, { align: 'right' })
    y += 3
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 40, y, { align: 'right' })
  doc.text(formatMoney(sale.total, currencySymbol), 75, y, { align: 'right' })
  y += 5

  if (sale.payments?.length > 0) {
    doc.setLineWidth(0.2)
    doc.line(5, y, 75, y)
    y += 3

    doc.setFontSize(8)
    doc.text('PAGOS', 5, y)
    y += 3

    doc.setFont('helvetica', 'normal')
    let totalPaid = 0
    for (const payment of sale.payments) {
      doc.text(payment.payment_type + ':', 5, y)
      doc.text(formatMoney(payment.amount, currencySymbol), 75, y, { align: 'right' })
      totalPaid += parseFloat(payment.amount)
      y += 3
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Total Pagado:', 40, y, { align: 'right' })
    doc.text(formatMoney(totalPaid, currencySymbol), 75, y, { align: 'right' })
    y += 3

    const change = totalPaid - parseFloat(sale.total)
    if (change > 0) {
      doc.text('Cambio:', 40, y, { align: 'right' })
      doc.text(formatMoney(change, currencySymbol), 75, y, { align: 'right' })
      y += 3
    }
  }

  y += 2
  doc.line(5, y, 75, y)
  y += 4

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Gracias por su compra', 40, y, { align: 'center' })
  y += 3
  doc.text('Conserve este ticket', 40, y, { align: 'center' })

  return doc.output('arraybuffer')
}
