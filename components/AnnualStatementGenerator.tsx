'use client'

import { useState } from 'react'
import { getAnnualGiving, type AnnualGivingData } from '@/app/actions/reports'
import { fetchDonors, type Donor } from '@/app/actions/donors'
import { useEffect } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface AnnualStatementGeneratorProps {
  churchName?: string
  churchAddress?: string
}

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export default function AnnualStatementGenerator({
  churchName = 'Your Church Name',
  churchAddress = '123 Church Street\nCity, State ZIP',
}: AnnualStatementGeneratorProps) {
  const [donors, setDonors] = useState<Donor[]>([])
  const [selectedDonorId, setSelectedDonorId] = useState('')
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear() - 1) // Default to previous year
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Load donors on mount
  useEffect(() => {
    loadDonors()
  }, [])

  const loadDonors = async () => {
    setLoading(true)
    const result = await fetchDonors()
    if (result.success && result.data) {
      setDonors(result.data)
    } else {
      setError(result.error || 'Failed to load donors')
    }
    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
  }

  const generatePDF = async (donorData: AnnualGivingData) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPosition = margin

    // Set font
    doc.setFont('times', 'normal')

    // Church Letterhead
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
    doc.text(churchName, margin, yPosition)
    yPosition += 7

    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    const addressLines = churchAddress.split('\n')
    addressLines.forEach(line => {
      doc.text(line, margin, yPosition)
      yPosition += 5
    })
    yPosition += 10

    // Title
    doc.setFontSize(14)
    doc.setFont('times', 'bold')
    doc.text('Annual Giving Statement', margin, yPosition)
    yPosition += 5
    doc.setFontSize(11)
    doc.text(`Tax Year ${donorData.year}`, margin, yPosition)
    yPosition += 15

    // Donor Information (formatted for windowed envelope)
    doc.setFontSize(11)
    doc.setFont('times', 'normal')
    doc.text(donorData.donor_name, margin, yPosition)
    yPosition += 6

    if (donorData.donor_address) {
      const donorAddressLines = donorData.donor_address.split('\n')
      donorAddressLines.forEach(line => {
        doc.text(line, margin, yPosition)
        yPosition += 6
      })
    }
    yPosition += 10

    // Date of generation
    const today = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    doc.setFontSize(10)
    doc.text(`Statement Date: ${today}`, margin, yPosition)
    yPosition += 15

    // Cash Gifts Table
    if (donorData.cash_gifts.length > 0) {
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('Cash Contributions', margin, yPosition)
      yPosition += 7

      // Prepare table data
      const tableData = donorData.cash_gifts.map(gift => [
        formatDate(gift.entry_date),
        gift.fund_name,
        gift.reference_number || '-',
        formatCurrency(gift.amount),
      ])

      doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Fund/Account', 'Check/Ref #', 'Amount']],
        body: tableData,
        theme: 'plain',
        styles: {
          font: 'times',
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fontStyle: 'bold',
          fillColor: [240, 240, 240],
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 60 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: margin, right: margin },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10

      // Total
      doc.setFont('times', 'bold')
      doc.setFontSize(11)
      const totalText = `Total Tax-Deductible Contributions: ${formatCurrency(donorData.total_cash_amount)}`
      doc.text(totalText, pageWidth - margin, yPosition, { align: 'right' })
      yPosition += 15
    } else {
      doc.setFontSize(11)
      doc.text('No cash contributions recorded for this year.', margin, yPosition)
      yPosition += 15
    }

    // In-Kind Gifts Section
    if (donorData.in_kind_gifts.length > 0) {
      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('In-Kind (Non-Cash) Contributions', margin, yPosition)
      yPosition += 7

      doc.setFontSize(9)
      doc.setFont('times', 'italic')
      doc.text('(No dollar value assigned per IRS guidelines - donor-valued)', margin, yPosition)
      yPosition += 7

      // List in-kind gifts (description only, no amount)
      const inKindTableData = donorData.in_kind_gifts.map(gift => [
        formatDate(gift.entry_date),
        gift.description,
        gift.fund_name,
      ])

      doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Description', 'Fund']],
        body: inKindTableData,
        theme: 'plain',
        styles: {
          font: 'times',
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fontStyle: 'bold',
          fillColor: [240, 240, 240],
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 90 },
          2: { cellWidth: 40 },
        },
        margin: { left: margin, right: margin },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15
    }

    // Legal Disclaimer (IRS requirement)
    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(9)
    doc.setFont('times', 'normal')
    
    const disclaimerLines = [
      'IMPORTANT TAX INFORMATION:',
      '',
      'This statement is provided for your tax records. No goods or services were provided in exchange',
      'for this contribution, other than intangible religious benefits.',
      '',
      'Cash contributions are tax-deductible to the extent allowed by law. Please consult with a',
      'qualified tax professional regarding the deductibility of these contributions.',
      '',
      'In-kind donations: Per IRS guidelines, donors are responsible for determining and',
      'documenting the fair market value of non-cash contributions. This organization provides',
      'acknowledgment of receipt but does not assign valuation. Items valued over $5,000 may',
      'require an independent appraisal.',
      '',
      'Please retain this statement for your records. If you have any questions or discrepancies,',
      'please contact us immediately.',
    ]

    disclaimerLines.forEach(line => {
      if (yPosition > 280) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin, yPosition, { maxWidth: pageWidth - (margin * 2) })
      yPosition += line === '' ? 3 : 5
    })

    // Footer
    if (yPosition > 270) {
      doc.addPage()
      yPosition = margin
    } else {
      yPosition = 280
    }
    
    doc.setFontSize(8)
    doc.setFont('times', 'italic')
    doc.text(`Generated on ${today}`, pageWidth / 2, yPosition, { align: 'center' })

    // Save the PDF
    doc.save(`${donorData.donor_name.replace(/[^a-z0-9]/gi, '_')}_${donorData.year}_Statement.pdf`)
  }

  const handleGenerateSingle = async () => {
    if (!selectedDonorId) {
      setError('Please select a donor')
      return
    }

    setGeneratingPDF(true)
    setError(null)

    try {
      const result = await getAnnualGiving(selectedDonorId, selectedYear)
      
      if (result.success && result.data) {
        await generatePDF(result.data)
      } else {
        setError(result.error || 'Failed to generate statement')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleGenerateAll = async () => {
    if (donors.length === 0) {
      setError('No donors available')
      return
    }

    setGeneratingPDF(true)
    setError(null)

    try {
      let successCount = 0
      let errorCount = 0

      for (const donor of donors) {
        try {
          const result = await getAnnualGiving(donor.id, selectedYear)
          
          if (result.success && result.data) {
            // Only generate PDF if donor has contributions
            if (result.data.gifts.length > 0) {
              await generatePDF(result.data)
              successCount++
              // Small delay between PDFs to avoid overwhelming the browser
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          } else {
            errorCount++
          }
        } catch (err) {
          console.error(`Error generating for ${donor.name}:`, err)
          errorCount++
        }
      }

      if (successCount > 0) {
        alert(`Successfully generated ${successCount} statement(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
      } else {
        setError('No statements generated - donors may not have contributions for this year')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selection UI */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Annual Statements</h2>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Year Picker */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Tax Year <span className="text-red-500">*</span>
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year} {year === currentYear - 1 && '(Previous Year)'}
                </option>
              ))}
            </select>
          </div>

          {/* Donor Selector */}
          <div>
            <label htmlFor="donor" className="block text-sm font-medium text-gray-700 mb-1">
              Donor
            </label>
            <select
              id="donor"
              value={selectedDonorId}
              onChange={(e) => setSelectedDonorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Select Donor --</option>
              {donors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donor.name} {donor.envelope_number && `(#${donor.envelope_number})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerateSingle}
            disabled={!selectedDonorId || generatingPDF}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {generatingPDF ? 'Generating...' : 'Generate PDF for Selected Donor'}
          </button>

          <button
            onClick={handleGenerateAll}
            disabled={generatingPDF}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {generatingPDF ? 'Generating...' : 'Generate PDFs for All Donors'}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">PDF Statement Features:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Professional church letterhead with your organization name and address</li>
          <li>• Donor information formatted for windowed envelopes</li>
          <li>• Complete list of all cash contributions with dates, funds, and amounts</li>
          <li>• Separate section for in-kind donations (descriptions only, per IRS)</li>
          <li>• Total tax-deductible contributions (cash only)</li>
          <li>• IRS-compliant legal disclaimer</li>
          <li>• Serif font suitable for formal legal documents</li>
        </ul>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Usage Tips:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Default year is set to previous year for year-end tax statements</li>
          <li>• "All Donors" option generates PDFs for every donor with contributions</li>
          <li>• PDFs are automatically downloaded to your browser's download folder</li>
          <li>• Batch generation includes a small delay between files to avoid browser issues</li>
          <li>• Only donors with actual contributions for the selected year receive statements</li>
        </ul>
      </div>
    </div>
  )
}
