import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PDFHeaderConfig {
  logoUrl?: string | null
  churchName: string
  churchAddress: string
  reportTitle: string
  reportSubtitle?: string
  reportDate?: string
}

/**
 * Add professional header to PDF with church logo
 */
export async function addPDFHeader(
  doc: jsPDF,
  config: PDFHeaderConfig
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = margin

  // Set font
  doc.setFont('times', 'normal')

  try {
    if (config.logoUrl) {
      const logoSize = 20 // 20mm square
      
      // Add logo on the left
      doc.addImage(config.logoUrl, 'JPEG', margin, yPosition, logoSize, logoSize)
      
      // Church info next to logo
      const textStartX = margin + logoSize + 5
      doc.setFontSize(16)
      doc.setFont('times', 'bold')
      doc.text(config.churchName, textStartX, yPosition + 5)
      
      doc.setFontSize(9)
      doc.setFont('times', 'normal')
      const addressLines = config.churchAddress.split('\n')
      let addressY = yPosition + 11
      addressLines.forEach(line => {
        if (line.trim()) {
          doc.text(line, textStartX, addressY)
          addressY += 4
        }
      })
      
      yPosition += Math.max(logoSize, addressY - yPosition) + 5
    } else {
      // Fallback without logo
      doc.setFontSize(16)
      doc.setFont('times', 'bold')
      doc.text(config.churchName, margin, yPosition)
      yPosition += 7

      doc.setFontSize(9)
      doc.setFont('times', 'normal')
      const addressLines = config.churchAddress.split('\n')
      addressLines.forEach(line => {
        if (line.trim()) {
          doc.text(line, margin, yPosition)
          yPosition += 4
        }
      })
      yPosition += 5
    }
  } catch (error) {
    console.warn('Could not load logo for PDF, using text-only header:', error)
    
    // Fallback header
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
    doc.text(config.churchName, margin, yPosition)
    yPosition += 7

    doc.setFontSize(9)
    doc.setFont('times', 'normal')
    const addressLines = config.churchAddress.split('\n')
    addressLines.forEach(line => {
      if (line.trim()) {
        doc.text(line, margin, yPosition)
        yPosition += 4
      }
    })
    yPosition += 5
  }

  // Horizontal line
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  // Report Title
  doc.setFontSize(14)
  doc.setFont('times', 'bold')
  doc.text(config.reportTitle, margin, yPosition)
  yPosition += 6

  // Report Subtitle
  if (config.reportSubtitle) {
    doc.setFontSize(11)
    doc.setFont('times', 'normal')
    doc.text(config.reportSubtitle, margin, yPosition)
    yPosition += 6
  }

  // Report Date
  if (config.reportDate) {
    doc.setFontSize(10)
    doc.setFont('times', 'italic')
    doc.text(config.reportDate, margin, yPosition)
    yPosition += 8
  }

  return yPosition
}

/**
 * Format currency for PDF
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format date for PDF
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

/**
 * Add footer to PDF
 */
export function addPDFFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  doc.setFontSize(8)
  doc.setFont('times', 'italic')
  doc.setTextColor(128, 128, 128)
  
  const footerText = `Generated on ${new Date().toLocaleDateString('en-US')} - Church Ledger Pro`
  const textWidth = doc.getTextWidth(footerText)
  doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10)
  
  doc.setTextColor(0, 0, 0) // Reset to black
}

/**
 * Create basic table styling
 */
export const defaultTableStyles = {
  headStyles: {
    fillColor: [41, 128, 185], // Blue
    textColor: 255,
    fontStyle: 'bold',
    fontSize: 10,
  },
  bodyStyles: {
    fontSize: 9,
  },
  alternateRowStyles: {
    fillColor: [245, 245, 245],
  },
  margin: { top: 20, left: 20, right: 20 },
}
