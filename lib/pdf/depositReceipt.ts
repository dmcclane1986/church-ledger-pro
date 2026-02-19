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
  cashAmount?: number
  checkAmount?: number
  isRestricted?: boolean
}

export interface AccountAllocation {
  accountNumber: number
  accountName: string
  amount: number
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
  accountAllocations?: AccountAllocation[]
  finalTotal: number
  logoUrl?: string | null
  churchName?: string
  churchAddress?: string
}

export function generateDepositReceiptPDF(data: DepositData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = margin

  // Header with Logo and Church Name
  doc.setFont('times', 'normal')
  const churchName = data.churchName || 'Church Ledger Pro'

  try {
    if (data.logoUrl) {
      const logoSize = 20 // 20mm square
      
      // Add logo on the left
      doc.addImage(data.logoUrl, 'JPEG', margin, yPosition, logoSize, logoSize)
      
      // Church name next to logo
      const textStartX = margin + logoSize + 5
      doc.setFontSize(16)
      doc.setFont('times', 'bold')
      doc.text(churchName, textStartX, yPosition + 5)
      
      // Church address if provided
      if (data.churchAddress) {
        doc.setFontSize(9)
        doc.setFont('times', 'normal')
        const addressLines = data.churchAddress.split('\n')
        let addressY = yPosition + 11
        addressLines.forEach(line => {
          if (line.trim()) {
            doc.text(line, textStartX, addressY)
            addressY += 4
          }
        })
        yPosition += Math.max(logoSize, addressY - yPosition) + 5
      } else {
        yPosition += logoSize + 5
      }
    } else {
      // Fallback without logo
      doc.setFontSize(16)
      doc.setFont('times', 'bold')
      doc.text(churchName, margin, yPosition)
      yPosition += 7

      if (data.churchAddress) {
        doc.setFontSize(9)
        doc.setFont('times', 'normal')
        const addressLines = data.churchAddress.split('\n')
        addressLines.forEach(line => {
          if (line.trim()) {
            doc.text(line, margin, yPosition)
            yPosition += 4
          }
        })
      }
      yPosition += 5
    }
  } catch (error) {
    console.warn('Could not load logo for PDF, using text-only header:', error)
    
    // Fallback header
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
    doc.text(churchName, margin, yPosition)
    yPosition += 7

    if (data.churchAddress) {
      doc.setFontSize(9)
      doc.setFont('times', 'normal')
      const addressLines = data.churchAddress.split('\n')
      addressLines.forEach(line => {
        if (line.trim()) {
          doc.text(line, margin, yPosition)
          yPosition += 4
        }
      })
    }
    yPosition += 5
  }

  // Horizontal line
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  // Report Title
  doc.setFontSize(14)
  doc.setFont('times', 'bold')
  doc.text('Weekly Deposit Summary', margin, yPosition)
  yPosition += 6
  
  // Date and Description
  doc.setFontSize(10)
  doc.setFont('times', 'normal')
  doc.text(`Date: ${formatDate(data.date)}`, margin, yPosition)
  yPosition += 5
  doc.text(`Description: ${data.description}`, margin, yPosition)
  
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

  // RIGHT SIDE: Method of Collection (above Check Listing)
  let rightSideY = sectionStartY
  
  // Method of Collection
  if (data.totalEnvelopes > 0 || data.looseCash > 0 || data.totalChecks > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Method of Collection', 110, rightSideY)
    rightSideY += 5

    const methodData = []
    if (data.totalEnvelopes > 0) {
      methodData.push(['Envelope Cash', formatCurrency(data.totalEnvelopes)])
    }
    if (data.looseCash > 0) {
      methodData.push(['Loose Cash', formatCurrency(data.looseCash)])
    }
    if (data.totalChecks > 0) {
      methodData.push(['Total Checks', formatCurrency(data.totalChecks)])
    }

    if (methodData.length > 0) {
      autoTable(doc, {
        startY: rightSideY,
        head: [['Description', 'Amount']],
        body: methodData,
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
  }
  
  // Check Listing
  
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

  // Deposit Information (right side, under checks)
  if (data.fundAllocations.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Deposit Information', 110, rightSideY)
    rightSideY += 5

    // Calculate total deposit for percentage calculations
    const totalDeposit = data.totalCash + data.totalChecks
    const totalCash = data.totalEnvelopes + data.looseCash

    const fundData = data.fundAllocations.map((fund) => {
      // Use explicit cash/check amounts if provided, otherwise calculate based on percentage
      // If explicitly set to 0, use 0. If undefined, calculate from percentage.
      const fundPercentage = totalDeposit > 0 ? fund.amount / totalDeposit : 0
      const fundCash = fund.cashAmount !== undefined && fund.cashAmount !== null 
        ? fund.cashAmount 
        : totalCash * fundPercentage
      const fundCheck = fund.checkAmount !== undefined && fund.checkAmount !== null 
        ? fund.checkAmount 
        : data.totalChecks * fundPercentage

      return [
        fund.fundName + (fund.isRestricted ? ' (Restricted)' : ''),
        formatCurrency(fundCash),
        formatCurrency(fundCheck),
        formatCurrency(fund.amount),
      ]
    })

    autoTable(doc, {
      startY: rightSideY,
      head: [['Fund', 'Cash', 'Check', 'Total']],
      body: fundData,
      theme: 'grid',
      headStyles: { fillColor: [70, 70, 70], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35, halign: 'left' },
        1: { cellWidth: 18, halign: 'right' },
        2: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 18, halign: 'right' },
      },
      margin: { left: 110, right: 20 },
    })
    rightSideY = (doc as any).lastAutoTable.finalY + 10
  }

  // Account Allocations Section (if multiple accounts)
  if (data.accountAllocations && data.accountAllocations.length > 1) {
    yPosition = Math.max(leftSideY, rightSideY) + 10
    
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Account Allocations', margin, yPosition)
    yPosition += 5

    const accountData = data.accountAllocations.map((alloc) => [
      `${alloc.accountNumber} - ${alloc.accountName}`,
      formatCurrency(alloc.amount),
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Account', 'Amount']],
      body: accountData,
      theme: 'grid',
      headStyles: { fillColor: [70, 70, 70], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    })
    yPosition = (doc as any).lastAutoTable.finalY + 5

    // Account Total
    const accountTotal = data.accountAllocations.reduce((sum, alloc) => sum + alloc.amount, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Total Allocated:', margin, yPosition)
    doc.text(formatCurrency(accountTotal), 185, yPosition, { align: 'right' })
    yPosition += 10
  }

  // Move to the lower of the two sections, plus extra spacing
  yPosition = Math.max(yPosition, Math.max(leftSideY, rightSideY) + 10)

  // Check if content would overflow onto signature area
  // If so, add a new page
  if (yPosition > 210) {
    doc.addPage()
    yPosition = margin
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
