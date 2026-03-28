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

export function generateDrawerClosePDF (summary, companyConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150]
  })

  const currencySymbol = companyConfig?.currency_symbol || '$'
  const companyName = companyConfig?.company_name || 'EMPRESA'
  const companyAddress = companyConfig?.address || ''
  const companyNit = companyConfig?.nit || ''

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
  doc.text('CIERRE DE CAJA', 40, y, { align: 'center' })
  y += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  doc.text(`Caja: ${summary.drawer?.name || 'N/A'}`, 5, y)
  y += 3
  doc.text(`Ubicación: ${summary.drawer?.location_name || 'N/A'}`, 5, y)
  y += 3
  doc.text(`Fecha apertura: ${formatDate(summary.drawer?.opened_at)}`, 5, y)
  y += 3
  doc.text(`Fecha cierre: ${formatDate(new Date())}`, 5, y)
  y += 3
  doc.text(`Cajero: ${summary.drawer?.opened_by_name || 'N/A'}`, 5, y)
  y += 4

  doc.line(5, y, 75, y)
  y += 3

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN', 40, y, { align: 'center' })
  y += 4

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  doc.text('Monto Inicial:', 5, y)
  doc.text(formatMoney(summary.initial_amount, currencySymbol), 75, y, { align: 'right' })
  y += 4

  doc.text('Ventas en Efectivo:', 5, y)
  doc.text(formatMoney(summary.total_cash_sales, currencySymbol), 75, y, { align: 'right' })
  y += 4

  doc.text('Retiros:', 5, y)
  doc.text(formatMoney(summary.total_withdrawals, currencySymbol), 75, y, { align: 'right' })
  y += 4

  doc.line(5, y, 75, y)
  y += 3

  doc.setFont('helvetica', 'bold')
  doc.text('Efectivo Esperado:', 5, y)
  doc.text(formatMoney(summary.expected_cash, currencySymbol), 75, y, { align: 'right' })
  y += 4

  if (summary.current_amount !== undefined && summary.current_amount !== null) {
    doc.setFont('helvetica', 'normal')
    doc.text('Efectivo Contado:', 5, y)
    doc.text(formatMoney(summary.current_amount, currencySymbol), 75, y, { align: 'right' })
    y += 4

    const difference = summary.current_amount - summary.expected_cash
    if (Math.abs(difference) > 0.01) {
      if (difference > 0) {
        doc.setTextColor(0, 100, 0)
        doc.text('SOBRANTE:', 5, y)
      } else {
        doc.setTextColor(200, 0, 0)
        doc.text('FALTANTE:', 5, y)
      }
      doc.text(formatMoney(Math.abs(difference), currencySymbol), 75, y, { align: 'right' })
      doc.setTextColor(0, 0, 0)
      y += 4
    }
  }

  y += 2
  doc.line(5, y, 75, y)
  y += 3

  if (summary.sales && summary.sales.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DE VENTAS', 40, y, { align: 'center' })
    y += 3
    doc.setFont('helvetica', 'normal')

    for (const sale of summary.sales) {
      doc.setTextColor(0, 80, 150)
      doc.text(`Venta: ${sale.sale_number}`, 5, y)
      doc.setTextColor(0, 0, 0)
      doc.text(formatMoney(sale.total, currencySymbol), 75, y, { align: 'right' })
      y += 3
      if (sale.created_by_name) {
        doc.setFontSize(6)
        doc.text(`Cajero: ${sale.created_by_name} - ${formatDate(sale.sale_date)}`, 5, y)
        y += 3
        doc.setFontSize(8)
      }
      if (sale.first_name || sale.last_name) {
        doc.setFontSize(6)
        doc.text(`Cliente: ${sale.first_name || ''} ${sale.last_name || ''}`, 5, y)
        y += 3
        doc.setFontSize(8)
      }
      y += 2
    }
  }

  if (summary.transactions && summary.transactions.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DE TRANSACCIONES', 40, y, { align: 'center' })
    y += 3
    doc.setFont('helvetica', 'normal')

    for (const tx of summary.transactions) {
      if (tx.transaction_type === 'withdrawal') {
        doc.setTextColor(200, 0, 0)
        doc.text(`- Retiro: ${formatMoney(tx.amount, currencySymbol)}`, 5, y)
        doc.setTextColor(0, 0, 0)
        y += 3
        if (tx.notes) {
          doc.setFontSize(6)
          const splitNotes = doc.splitTextToSize(`Nota: ${tx.notes}`, 70)
          doc.text(splitNotes, 5, y)
          y += splitNotes.length * 2.5
          doc.setFontSize(8)
        }
        if (tx.created_by_name) {
          doc.setFontSize(6)
          doc.text(`Por: ${tx.created_by_name} - ${formatDate(tx.created_at)}`, 5, y)
          y += 3
          doc.setFontSize(8)
        }
        y += 2
      } else if (tx.transaction_type === 'deposit') {
        doc.setTextColor(0, 100, 0)
        doc.text(`+ Depósito: ${formatMoney(tx.amount, currencySymbol)}`, 5, y)
        doc.setTextColor(0, 0, 0)
        y += 3
        if (tx.notes) {
          doc.setFontSize(6)
          const splitNotes = doc.splitTextToSize(`Nota: ${tx.notes}`, 70)
          doc.text(splitNotes, 5, y)
          y += splitNotes.length * 2.5
          doc.setFontSize(8)
        }
        y += 2
      }
    }
  }

  y += 6
  doc.line(5, y, 75, y)
  y += 4

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Cierre generado automáticamente', 40, y, { align: 'center' })
  y += 3
  doc.text(new Date().toLocaleString('es-MX'), 40, y, { align: 'center' })

  return doc.output('arraybuffer')
}
