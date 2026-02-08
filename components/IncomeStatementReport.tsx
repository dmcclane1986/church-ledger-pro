'use client'

import { useState, useEffect } from 'react'
import { fetchIncomeStatement, IncomeStatementData } from '@/app/actions/reports'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addPDFHeader, formatCurrency as pdfFormatCurrency, addPDFFooter, defaultTableStyles } from '@/lib/pdf/report-generator'

export default function IncomeStatementReport() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [data, setData] = useState<IncomeStatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [year, month])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchIncomeStatement(year, month)
    
    if (result.success && result.data) {
      setData(result.data)
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  const exportToPDF = async () => {
    if (!data) return
    
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
        reportTitle: 'Income Statement',
        reportSubtitle: 'Statement of Activities',
        reportDate: `For the period: ${monthNames[month - 1]} ${year}`
      })
      
      let currentY = yPosition
      
      // Revenue Section
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('REVENUE', 20, currentY)
      currentY += 8
      
      const revenueData = data.income.map(account => [
        account.account_name,
        pdfFormatCurrency(account.budgeted_amount || 0),
        pdfFormatCurrency(account.total)
      ])
      
      const totalPlannedIncome = data.income.reduce((sum, account) => sum + (account.budgeted_amount || 0), 0)
      
      autoTable(doc, {
        startY: currentY,
        head: [['Account', 'Planned', 'Actual']],
        body: revenueData,
        foot: [['Total Revenue', pdfFormatCurrency(totalPlannedIncome), pdfFormatCurrency(data.totalIncome)]],
        ...defaultTableStyles,
        footStyles: {
          fillColor: [46, 204, 113] as [number, number, number],
          textColor: 255,
          fontStyle: 'bold' as const,
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Expenses Section
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('EXPENSES', 20, currentY)
      currentY += 8
      
      const expenseData = data.expenses.map(account => [
        account.account_name,
        pdfFormatCurrency(account.budgeted_amount || 0),
        pdfFormatCurrency(account.total)
      ])
      
      const totalPlannedExpenses = data.expenses.reduce((sum, account) => sum + (account.budgeted_amount || 0), 0)
      
      autoTable(doc, {
        startY: currentY,
        head: [['Account', 'Planned', 'Actual']],
        body: expenseData,
        foot: [['Total Expenses', pdfFormatCurrency(totalPlannedExpenses), pdfFormatCurrency(data.totalExpenses)]],
        ...defaultTableStyles,
        footStyles: {
          fillColor: [231, 76, 60] as [number, number, number],
          textColor: 255,
          fontStyle: 'bold' as const,
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Net Income
      const netPlannedIncome = totalPlannedIncome - totalPlannedExpenses
      const netActualIncome = data.totalIncome - data.totalExpenses
      const netIncomeColor: [number, number, number] = netActualIncome >= 0 ? [46, 204, 113] : [231, 76, 60]
      
      autoTable(doc, {
        startY: currentY,
        head: [['', '', '']],
        body: [[
          'NET INCOME (LOSS)',
          pdfFormatCurrency(netPlannedIncome),
          pdfFormatCurrency(netActualIncome)
        ]],
        theme: 'plain',
        headStyles: { fillColor: [255, 255, 255] },
        bodyStyles: {
          fillColor: netIncomeColor,
          textColor: 255,
          fontStyle: 'bold' as const,
          fontSize: 11,
        },
        margin: { left: 20, right: 20 }
      })
      
      // Add footer
      addPDFFooter(doc)
      
      // Save PDF
      doc.save(`Income-Statement-${monthNames[month - 1]}-${year}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Month/Year Picker */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Print Button */}
      {data && !loading && !error && (
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

      {/* Report */}
      {data && !loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6 text-white">
            <h1 className="text-2xl font-bold">Statement of Activities</h1>
            <p className="text-blue-100 mt-1">
              {monthNames[month - 1]} {year}
            </p>
          </div>

          {/* Income Section */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Income</h2>
            {data.income.length === 0 ? (
              <p className="text-gray-500 italic">No income recorded for this period</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 font-medium text-right">Planned</th>
                    <th className="pb-2 font-medium text-right">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {data.income.map((line) => (
                    <tr key={line.account_id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">
                        <span className="text-gray-500 text-sm mr-2">
                          {line.account_number}
                        </span>
                        {line.account_name}
                      </td>
                      <td className="py-3 text-right text-gray-500">
                        {line.budgeted_amount ? formatCurrency(line.budgeted_amount) : '-'}
                      </td>
                      <td className="py-3 text-right text-gray-900 font-medium">
                        {formatCurrency(line.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-semibold">
                    <td className="py-3 text-gray-900">Total Income</td>
                    <td className="py-3 text-right text-blue-700">
                      {formatCurrency(data.income.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0))}
                    </td>
                    <td className="py-3 text-right text-blue-900">
                      {formatCurrency(data.totalIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Expenses Section */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h2>
            {data.expenses.length === 0 ? (
              <p className="text-gray-500 italic">No expenses recorded for this period</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 font-medium text-right">Planned</th>
                    <th className="pb-2 font-medium text-right">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map((line) => (
                    <tr key={line.account_id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">
                        <span className="text-gray-500 text-sm mr-2">
                          {line.account_number}
                        </span>
                        {line.account_name}
                      </td>
                      <td className="py-3 text-right text-gray-500">
                        {line.budgeted_amount ? formatCurrency(line.budgeted_amount) : '-'}
                      </td>
                      <td className="py-3 text-right text-gray-900 font-medium">
                        {formatCurrency(line.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-semibold">
                    <td className="py-3 text-gray-900">Total Expenses</td>
                    <td className="py-3 text-right text-red-700">
                      {formatCurrency(data.expenses.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0))}
                    </td>
                    <td className="py-3 text-right text-red-900">
                      {formatCurrency(data.totalExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Net Increase/Decrease */}
          <div className="px-6 py-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Net {data.netIncrease >= 0 ? 'Increase' : 'Decrease'}
              </h2>
              <p
                className={`text-2xl font-bold ${
                  data.netIncrease >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(data.netIncrease)}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total Income minus Total Expenses
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          📘 About This Report
        </h3>
        <p className="text-blue-800 text-sm">
          The Statement of Activities (Income Statement) shows your church&apos;s revenue and 
          expenses for the selected period. A positive Net Increase means you had more income 
          than expenses. This report is based on your double-entry bookkeeping transactions.
        </p>
      </div>
    </div>
  )
}
