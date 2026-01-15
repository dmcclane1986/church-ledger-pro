import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface CashBreakdown {
  hundreds: number
  fifties: number
  twenties: number
  tens: number
  fives: number
  twos: number
  ones: number
  dollarCoins: number
  halfDollars: number
  quarters: number
  dimes: number
  nickels: number
  pennies: number
}

export interface CheckItem {
  referenceNumber: string
  amount: number
}

export interface FundAllocation {
  fundName: string
  amount: number
  isRestricted?: boolean
}

export interface DepositData {
  depositId: string
  date: string
  description: string
  cashBreakdown: CashBreakdown
  checks: CheckItem[]
  totalCash: number
  totalChecks: number
  totalEnvelopes: number
  looseCash: number
  fundAllocations: FundAllocation[]
  finalTotal: number
}

export function generateDepositReceiptPDF(data: DepositData, churchName: string = 'Church Name') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  let yPosition = 20

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(churchName, 105, yPosition, { align: 'center' })
  
  yPosition += 8
  doc.setFontSize(14)
  doc.text('Weekly Deposit Summary', 105, yPosition, { align: 'center' })
  
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${formatDate(data.date)}`, 20, yPosition)
  
  
  yPosition += 5
  doc.text(`Description: ${data.description}`, 20, yPosition)
  
  yPosition += 10

  // Store the starting Y position for side-by-side layout
  const sectionStartY = yPosition

  // LEFT SIDE: Cash Tally Section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Cash & Coin Breakdown', 20, yPosition)
  
  let leftSideY = yPosition + 5

  // Always show all denominations (even if zero)
  const cashData = [
    // Currency
    ['$100 Bills', formatCurrency(data.cashBreakdown.hundreds)],
    ['$50 Bills', formatCurrency(data.cashBreakdown.fifties)],
    ['$20 Bills', formatCurrency(data.cashBreakdown.twenties)],
    ['$10 Bills', formatCurrency(data.cashBreakdown.tens)],
    ['$5 Bills', formatCurrency(data.cashBreakdown.fives)],
    ['$2 Bills', formatCurrency(data.cashBreakdown.twos)],
    ['$1 Bills', formatCurrency(data.cashBreakdown.ones)],
    // Coins
    ['Dollar Coins', formatCurrency(data.cashBreakdown.dollarCoins)],
    ['Half Dollars', formatCurrency(data.cashBreakdown.halfDollars)],
    ['Quarters', formatCurrency(data.cashBreakdown.quarters)],
    ['Dimes', formatCurrency(data.cashBreakdown.dimes)],
    ['Nickels', formatCurrency(data.cashBreakdown.nickels)],
    ['Pennies', formatCurrency(data.cashBreakdown.pennies)],
  ]

  autoTable(doc, {
    startY: leftSideY,
    head: [['Denomination', 'Amount']],
    body: cashData,
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 20, right: 110 },
  })
  leftSideY = (doc as any).lastAutoTable.finalY + 3

  // Cash Total on left side
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Cash Total:', 20, leftSideY)
  doc.text(formatCurrency(data.totalCash), 100, leftSideY, { align: 'right' })

  // RIGHT SIDE: Check Listing
  let rightSideY = sectionStartY
  
  if (data.checks.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Check Listing', 110, rightSideY)
    rightSideY += 5

    const checkData = data.checks.map((check) => [
      check.referenceNumber,
      formatCurrency(check.amount),
    ])

    autoTable(doc, {
      startY: rightSideY,
      head: [['Check Number', 'Amount']],
      body: checkData,
      theme: 'grid',
      headStyles: { fillColor: [70, 70, 70], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: 110, right: 20 },
    })
    rightSideY = (doc as any).lastAutoTable.finalY + 3

    // Check Total on right side
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Check Total:', 110, rightSideY)
    doc.text(formatCurrency(data.totalChecks), 190, rightSideY, { align: 'right' })
    rightSideY += 10
  }

  // Method of Collection (right side, under checks)
  if (data.totalEnvelopes > 0 || data.looseCash > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Method of Collection', 110, rightSideY)
    rightSideY += 5

    const otherData = []
    if (data.totalEnvelopes > 0) {
      otherData.push(['Envelope Cash', formatCurrency(data.totalEnvelopes)])
    }
    if (data.looseCash > 0) {
      otherData.push(['Loose Cash', formatCurrency(data.looseCash)])
    }

    autoTable(doc, {
      startY: rightSideY,
      head: [['Description', 'Amount']],
      body: otherData,
      theme: 'grid',
      headStyles: { fillColor: [70, 70, 70], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: 110, right: 20 },
    })
    rightSideY = (doc as any).lastAutoTable.finalY + 10
  }

  // Fund Allocation (right side, under method of collection)
  if (data.fundAllocations.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Fund Allocation', 110, rightSideY)
    rightSideY += 5

    const fundData = data.fundAllocations.map((fund) => [
      fund.fundName + (fund.isRestricted ? ' (Restricted)' : ''),
      formatCurrency(fund.amount),
    ])

    autoTable(doc, {
      startY: rightSideY,
      head: [['Fund', 'Amount']],
      body: fundData,
      theme: 'grid',
      headStyles: { fillColor: [70, 70, 70], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: 110, right: 20 },
    })
    rightSideY = (doc as any).lastAutoTable.finalY + 10
  }

  // Move to the lower of the two sections, plus extra spacing
  yPosition = Math.max(leftSideY, rightSideY) + 10

  // Check if content would overflow onto signature area
  // If so, add a new page
  if (yPosition > 210) {
    doc.addPage()
  }

  // Total Deposit - Fixed position at bottom
  const totalDepositY = 220
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(20, totalDepositY - 5, 170, 12)
  doc.text('TOTAL DEPOSIT:', 25, totalDepositY + 3)
  doc.text(formatCurrency(data.finalTotal), 185, totalDepositY + 3, { align: 'right' })

  // Signature Section - Fixed position at bottom
  const signatureStartY = 240
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Internal Control - Counter Signatures', 20, signatureStartY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  // First Counter
  let sigY = signatureStartY + 10
  doc.text('Counter 1:', 20, sigY)
  sigY += 3
  doc.line(20, sigY, 100, sigY)
  doc.setFontSize(8)
  sigY += 4
  doc.text('Signature', 20, sigY)

  // Second Counter
  sigY += 10
  doc.setFontSize(10)
  doc.text('Counter 2:', 20, sigY)
  sigY += 3
  doc.line(20, sigY, 100, sigY)
  doc.setFontSize(8)
  sigY += 4
  doc.text('Signature', 20, sigY)

  

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'Generated on ' + new Date().toLocaleString(),
    105,
    280,
    { align: 'center' }
  )

  // Save the PDF
  const fileName = `Deposit_${data.depositId}_${data.date}.pdf`
  doc.save(fileName)
}

function formatCurrency(amount: number): string {
  return '$' + amount.toFixed(2)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
