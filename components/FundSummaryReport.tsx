'use client'

import { useState, useEffect } from 'react'
import { fetchFundSummary, FundSummaryData } from '@/app/actions/reports'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addPDFHeader, formatCurrency as pdfFormatCurrency, addPDFFooter, defaultTableStyles } from '@/lib/pdf/report-generator'
import { getTodayLocalDate } from '@/lib/utils/date'

export default function FundSummaryReport() {
  const [startDate, setStartDate] = useState(() => {
    // Default to January 1st of current year
    const now = new Date()
    return `${now.getFullYear()}-01-01`
  })
  const [endDate, setEndDate] = useState(getTodayLocalDate())
  const [data, setData] = useState<FundSummaryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [serverDebug, setServerDebug] = useState<string[]>([])  

  useEffect(() => {
    loadData()
  }, [startDate, endDate])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    setServerDebug([])
    
    const result = await fetchFundSummary(startDate, endDate)
    
    // Capture server debug info
    if (result.debug) {
      setServerDebug(result.debug)
    }
    
    if (result.success && result.data) {
      setData(result.data)
      
      // Create debug info
      const debugLines: string[] = []
      debugLines.push(`Report Period: ${startDate} to ${endDate}`)
      debugLines.push(`Funds Found: ${result.data.length}`)
      result.data.forEach(fund => {
        debugLines.push(`\n${fund.fund_name}:`)
        debugLines.push(`  - Beginning Balance: $${fund.beginning_balance.toFixed(2)}`)
        debugLines.push(`  - Income: $${fund.total_income.toFixed(2)}`)
        debugLines.push(`  - Expenses: $${fund.total_expenses.toFixed(2)}`)
        debugLines.push(`  - Ending Balance: $${fund.ending_balance.toFixed(2)}`)
      })
      setDebugInfo(debugLines.join('\n'))
    } else {
      setError(result.error || 'Failed to load data')
    }
    
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Calculate totals
  const unrestrictedFunds = data.filter(f => !f.is_restricted)
  const restrictedFunds = data.filter(f => f.is_restricted)

  const totalUnrestrictedBeginning = unrestrictedFunds.reduce((sum, f) => sum + f.beginning_balance, 0)
  const totalUnrestrictedIncome = unrestrictedFunds.reduce((sum, f) => sum + f.total_income, 0)
  const totalUnrestrictedExpenses = unrestrictedFunds.reduce((sum, f) => sum + f.total_expenses, 0)
  const totalUnrestrictedEnding = unrestrictedFunds.reduce((sum, f) => sum + f.ending_balance, 0)

  const totalRestrictedBeginning = restrictedFunds.reduce((sum, f) => sum + f.beginning_balance, 0)
  const totalRestrictedIncome = restrictedFunds.reduce((sum, f) => sum + f.total_income, 0)
  const totalRestrictedExpenses = restrictedFunds.reduce((sum, f) => sum + f.total_expenses, 0)
  const totalRestrictedEnding = restrictedFunds.reduce((sum, f) => sum + f.ending_balance, 0)

  const grandTotalBeginning = totalUnrestrictedBeginning + totalRestrictedBeginning
  const grandTotalIncome = totalUnrestrictedIncome + totalRestrictedIncome
  const grandTotalExpenses = totalUnrestrictedExpenses + totalRestrictedExpenses
  const grandTotalEnding = totalUnrestrictedEnding + totalRestrictedEnding

  const exportToPDF = async () => {
    if (data.length === 0) return
    
    setExporting(true)
    try {
      const doc = new jsPDF()
      const settings = await getChurchSettings()
      const address = await getFormattedChurchAddress()
      
      const churchName = settings.data?.organization_name || 'Church Ledger Pro'
      const logoUrl = settings.data?.logo_url || null
      
      // Add header
      const yPosition = await addPDFHeader(doc, {
        logoUrl,
        churchName,
        churchAddress: address,
        reportTitle: 'Fund Summary Report',
        reportSubtitle: 'Fund Activity Report',
        reportDate: `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      })
      
      let currentY = yPosition
      
      // Unrestricted Funds Section
      if (unrestrictedFunds.length > 0) {
        doc.setFontSize(12)
        doc.setFont('times', 'bold')
        doc.text('UNRESTRICTED FUNDS', 20, currentY)
        currentY += 8
        
        const unrestrictedData = unrestrictedFunds.map(fund => [
          fund.fund_name,
          pdfFormatCurrency(fund.beginning_balance),
          pdfFormatCurrency(fund.total_income),
          pdfFormatCurrency(fund.total_expenses),
          pdfFormatCurrency(fund.ending_balance)
        ])
        
        autoTable(doc, {
          startY: currentY,
          head: [['Fund', 'Beginning', 'Income', 'Expenses', 'Ending']],
          body: unrestrictedData,
          foot: [[
            'Total Unrestricted',
            pdfFormatCurrency(totalUnrestrictedBeginning),
            pdfFormatCurrency(totalUnrestrictedIncome),
            pdfFormatCurrency(totalUnrestrictedExpenses),
            pdfFormatCurrency(totalUnrestrictedEnding)
          ]],
          ...defaultTableStyles,
          footStyles: {
            fillColor: [52, 152, 219] as [number, number, number],
            textColor: 255,
            fontStyle: 'bold' as const,
          }
        })
        
        currentY = (doc as any).lastAutoTable.finalY + 15
      }
      
      // Restricted Funds Section
      if (restrictedFunds.length > 0) {
        doc.setFontSize(12)
        doc.setFont('times', 'bold')
        doc.text('RESTRICTED FUNDS', 20, currentY)
        currentY += 8
        
        const restrictedData = restrictedFunds.map(fund => [
          fund.fund_name,
          pdfFormatCurrency(fund.beginning_balance),
          pdfFormatCurrency(fund.total_income),
          pdfFormatCurrency(fund.total_expenses),
          pdfFormatCurrency(fund.ending_balance)
        ])
        
        autoTable(doc, {
          startY: currentY,
          head: [['Fund', 'Beginning', 'Income', 'Expenses', 'Ending']],
          body: restrictedData,
          foot: [[
            'Total Restricted',
            pdfFormatCurrency(totalRestrictedBeginning),
            pdfFormatCurrency(totalRestrictedIncome),
            pdfFormatCurrency(totalRestrictedExpenses),
            pdfFormatCurrency(totalRestrictedEnding)
          ]],
          ...defaultTableStyles,
          headStyles: {
            fillColor: [155, 89, 182],
            textColor: 255,
            fontStyle: 'bold' as const,
          },
          footStyles: {
            fillColor: [155, 89, 182],
            textColor: 255,
            fontStyle: 'bold' as const,
          }
        })
        
        currentY = (doc as any).lastAutoTable.finalY + 15
      }
      
      // Grand Total
      autoTable(doc, {
        startY: currentY,
        head: [['', '', '', '', '']],
        body: [[
          'GRAND TOTAL',
          pdfFormatCurrency(grandTotalBeginning),
          pdfFormatCurrency(grandTotalIncome),
          pdfFormatCurrency(grandTotalExpenses),
          pdfFormatCurrency(grandTotalEnding)
        ]],
        theme: 'plain',
        headStyles: { fillColor: [255, 255, 255] },
        bodyStyles: {
          fillColor: [41, 128, 185] as [number, number, number],
          textColor: 255,
          fontStyle: 'bold' as const,
          fontSize: 11,
        },
        margin: { left: 20, right: 20 }
      })
      
      // Add footer
      addPDFFooter(doc)
      
      // Save PDF
      const startDateStr = new Date(startDate).toISOString().split('T')[0]
      const endDateStr = new Date(endDate).toISOString().split('T')[0]
      doc.save(`Fund-Summary-${startDateStr}-to-${endDateStr}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Always Visible Debug - Will show even if data hasn't loaded */}
      <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-red-900 mb-2">🔴 DEBUG MODE ACTIVE</h3>
        <div className="text-sm text-red-800 space-y-1">
          <p><strong>Report Period:</strong> {startDate} to {endDate}</p>
          <p><strong>Data Loaded:</strong> {data.length > 0 ? 'YES' : 'NO'}</p>
          <p><strong>Funds Count:</strong> {data.length}</p>
          {data.length > 0 && data.map((fund, idx) => (
            <div key={idx} className="mt-2 p-2 bg-red-50 rounded">
              <p className="font-semibold">{fund.fund_name}:</p>
              <p>Beginning: ${fund.beginning_balance.toFixed(2)}</p>
              <p>Income: ${fund.total_income.toFixed(2)}</p>
              <p>Expenses: ${fund.total_expenses.toFixed(2)}</p>
              <p>Ending: ${fund.ending_balance.toFixed(2)}</p>
            </div>
          ))}
          {serverDebug.length > 0 && (
            <div className="mt-4 p-2 bg-white rounded border border-red-300">
              <p className="font-semibold mb-2">Server Debug Log:</p>
              <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                {serverDebug.join('\n')}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {debugInfo && !loading && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">🔍 Debug Information</h3>
          <pre className="text-xs text-yellow-800 font-mono whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}

      {/* Print Button */}
      {data.length > 0 && !loading && !error && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Report</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Report Display */}
      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Unrestricted Funds */}
          {unrestrictedFunds.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Unrestricted Funds</h2>
                <p className="text-green-100 text-sm">Available for general operations</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fund Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Beginning Balance
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Income (Planned)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Income (Actual)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Expenses (Planned)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Expenses (Actual)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Ending Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unrestrictedFunds.map((fund) => (
                      <tr key={fund.fund_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {fund.fund_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(fund.beginning_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {fund.planned_income ? formatCurrency(fund.planned_income) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700 font-medium">
                          {formatCurrency(fund.total_income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {fund.planned_expenses ? formatCurrency(fund.planned_expenses) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700 font-medium">
                          {formatCurrency(fund.total_expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCurrency(fund.ending_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-green-50 font-semibold">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Total Unrestricted</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(totalUnrestrictedBeginning)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatCurrency(unrestrictedFunds.reduce((sum, f) => sum + (f.planned_income || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-700">
                        {formatCurrency(totalUnrestrictedIncome)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatCurrency(unrestrictedFunds.reduce((sum, f) => sum + (f.planned_expenses || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-700">
                        {formatCurrency(totalUnrestrictedExpenses)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(totalUnrestrictedEnding)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Restricted Funds */}
          {restrictedFunds.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-yellow-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Restricted Funds</h2>
                <p className="text-yellow-100 text-sm">Can only be used for designated purposes</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fund Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Beginning Balance
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Income (Planned)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Income (Actual)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Expenses (Planned)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Expenses (Actual)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Ending Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restrictedFunds.map((fund) => (
                      <tr key={fund.fund_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {fund.fund_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(fund.beginning_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {fund.planned_income ? formatCurrency(fund.planned_income) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700 font-medium">
                          {formatCurrency(fund.total_income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {fund.planned_expenses ? formatCurrency(fund.planned_expenses) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700 font-medium">
                          {formatCurrency(fund.total_expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCurrency(fund.ending_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-yellow-50 font-semibold">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Total Restricted</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(totalRestrictedBeginning)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatCurrency(restrictedFunds.reduce((sum, f) => sum + (f.planned_income || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-700">
                        {formatCurrency(totalRestrictedIncome)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatCurrency(restrictedFunds.reduce((sum, f) => sum + (f.planned_expenses || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-700">
                        {formatCurrency(totalRestrictedExpenses)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(totalRestrictedEnding)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Grand Totals */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Grand Totals - All Funds</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody className="bg-white">
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Total Beginning Balance</td>
                    <td className="px-6 py-4 text-right font-bold text-xl text-gray-900">
                      {formatCurrency(grandTotalBeginning)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Total Income</td>
                    <td className="px-6 py-4 text-right font-bold text-xl text-green-700">
                      + {formatCurrency(grandTotalIncome)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Total Expenses</td>
                    <td className="px-6 py-4 text-right font-bold text-xl text-red-700">
                      - {formatCurrency(grandTotalExpenses)}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50">
                    <td className="px-6 py-4 font-bold text-lg text-indigo-900">Total Ending Balance</td>
                    <td className="px-6 py-4 text-right font-bold text-2xl text-indigo-900">
                      {formatCurrency(grandTotalEnding)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {data.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No funds found or no activity in the selected period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
