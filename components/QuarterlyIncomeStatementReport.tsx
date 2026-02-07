'use client'

import { useState, useEffect } from 'react'
import { fetchQuarterlyIncomeStatement, QuarterlyIncomeStatementData } from '@/app/actions/reports'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addPDFHeader, formatCurrency as pdfFormatCurrency, addPDFFooter, defaultTableStyles } from '@/lib/pdf/report-generator'

export default function QuarterlyIncomeStatementReport() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState<number>(0) // 0 = All, 1-4 = specific quarters
  const [data, setData] = useState<QuarterlyIncomeStatementData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [year])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchQuarterlyIncomeStatement(year)
    
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

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  // Filter data based on selected quarter
  const filteredData = selectedQuarter === 0 
    ? data 
    : data.filter(q => q.quarterNumber === selectedQuarter)

  const exportToPDF = async () => {
    if (filteredData.length === 0) return
    
    setExporting(true)
    try {
      const doc = new jsPDF('portrait') // Portrait mode for better readability
      const settings = await getChurchSettings()
      const address = await getFormattedChurchAddress()
      
      const churchName = settings.data?.organization_name || 'Church Ledger Pro'
      const logoUrl = settings.data?.logo_url || null
      
      // Determine report subtitle
      const quarterNames = ['', 'Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)']
      const subtitle = selectedQuarter === 0 
        ? 'Quarterly Comparison - All Quarters'
        : `Quarter ${selectedQuarter} - ${quarterNames[selectedQuarter]}`
      
      // Add header
      const yPosition = await addPDFHeader(doc, {
        logoUrl,
        churchName,
        churchAddress: address,
        reportTitle: 'Quarterly Income Statement',
        reportSubtitle: subtitle,
        reportDate: `Year: ${year}`
      })
      
      let currentY = yPosition
      
      // Prepare columns based on filtered data - show Planned and Actual for each quarter
      const columns = ['Account']
      filteredData.forEach(q => {
        columns.push(`Q${q.quarterNumber}\nPlanned`)
        columns.push(`Q${q.quarterNumber}\nActual`)
      })
      
      // Get all unique account names
      const allAccounts = new Set<string>()
      filteredData.forEach(q => {
        if (q.income && Array.isArray(q.income)) {
          q.income.forEach(r => allAccounts.add(r.account_name))
        }
        if (q.expenses && Array.isArray(q.expenses)) {
          q.expenses.forEach(e => allAccounts.add(e.account_name))
        }
      })
      
      // Revenue Section
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('REVENUE', 20, currentY)
      currentY += 8
      
      // Get unique revenue accounts
      const revenueAccounts = new Set<string>()
      filteredData.forEach(q => {
        if (q.income && Array.isArray(q.income)) {
          q.income.forEach(r => revenueAccounts.add(r.account_name))
        }
      })
      
      const revenueData: any[] = []
      Array.from(revenueAccounts).sort().forEach(accountName => {
        const row = [accountName]
        filteredData.forEach(q => {
          const account = q.income && Array.isArray(q.income) 
            ? q.income.find(r => r.account_name === accountName)
            : null
          row.push(pdfFormatCurrency(account?.budgeted_amount || 0))
          row.push(pdfFormatCurrency(account?.total || 0))
        })
        revenueData.push(row)
      })
      
      // Revenue totals
      const revenueTotalRow = ['Total Revenue']
      filteredData.forEach(q => {
        const totalBudgeted = q.income && Array.isArray(q.income)
          ? q.income.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0)
          : 0
        revenueTotalRow.push(pdfFormatCurrency(totalBudgeted))
        revenueTotalRow.push(pdfFormatCurrency(q.totalIncome || 0))
      })
      
      autoTable(doc, {
        startY: currentY,
        head: [columns],
        body: revenueData,
        foot: [revenueTotalRow],
        ...defaultTableStyles,
        footStyles: {
          fillColor: [46, 204, 113],
          textColor: 255,
          fontStyle: 'bold',
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Expenses Section
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('EXPENSES', 20, currentY)
      currentY += 8
      
      // Get unique expense accounts
      const expenseAccounts = new Set<string>()
      filteredData.forEach(q => {
        if (q.expenses && Array.isArray(q.expenses)) {
          q.expenses.forEach(e => expenseAccounts.add(e.account_name))
        }
      })
      
      const expenseData: any[] = []
      Array.from(expenseAccounts).sort().forEach(accountName => {
        const row = [accountName]
        filteredData.forEach(q => {
          const account = q.expenses && Array.isArray(q.expenses) 
            ? q.expenses.find(e => e.account_name === accountName)
            : null
          row.push(pdfFormatCurrency(account?.budgeted_amount || 0))
          row.push(pdfFormatCurrency(account?.total || 0))
        })
        expenseData.push(row)
      })
      
      // Expense totals
      const expenseTotalRow = ['Total Expenses']
      filteredData.forEach(q => {
        const totalBudgeted = q.expenses && Array.isArray(q.expenses)
          ? q.expenses.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0)
          : 0
        expenseTotalRow.push(pdfFormatCurrency(totalBudgeted))
        expenseTotalRow.push(pdfFormatCurrency(q.totalExpenses || 0))
      })
      
      autoTable(doc, {
        startY: currentY,
        head: [columns],
        body: expenseData,
        foot: [expenseTotalRow],
        ...defaultTableStyles,
        footStyles: {
          fillColor: [231, 76, 60],
          textColor: 255,
          fontStyle: 'bold',
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Net Income
      const netIncomeRow = ['NET INCOME (LOSS)']
      filteredData.forEach(q => {
        const totalBudgetedIncome = q.income && Array.isArray(q.income)
          ? q.income.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0)
          : 0
        const totalBudgetedExpenses = q.expenses && Array.isArray(q.expenses)
          ? q.expenses.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0)
          : 0
        const netBudgeted = totalBudgetedIncome - totalBudgetedExpenses
        const netActual = (q.totalIncome || 0) - (q.totalExpenses || 0)
        
        netIncomeRow.push(pdfFormatCurrency(netBudgeted))
        netIncomeRow.push(pdfFormatCurrency(netActual))
      })
      
      autoTable(doc, {
        startY: currentY,
        head: [columns],
        body: [netIncomeRow],
        theme: 'plain',
        headStyles: { fillColor: [255, 255, 255] },
        bodyStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 11,
        },
        margin: { left: 20, right: 20 }
      })
      
      // Add footer
      addPDFFooter(doc)
      
      // Save PDF
      const quarterSuffix = selectedQuarter === 0 ? 'All-Quarters' : `Q${selectedQuarter}`
      doc.save(`Quarterly-Income-Statement-${year}-${quarterSuffix}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Year and Quarter Picker */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
          <div>
            <label htmlFor="quarter" className="block text-sm font-medium text-gray-700 mb-1">
              Quarter
            </label>
            <select
              id="quarter"
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>All Quarters</option>
              <option value={1}>Q1 (Jan-Mar)</option>
              <option value={2}>Q2 (Apr-Jun)</option>
              <option value={3}>Q3 (Jul-Sep)</option>
              <option value={4}>Q4 (Oct-Dec)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Print Button */}
      {filteredData.length > 0 && !loading && !error && (
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
          <h3 className="text-sm font-medium text-red-800 mb-2">Error Loading Report</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Report Display */}
      {!loading && !error && filteredData && (
        <div className="space-y-6">
          {filteredData.map((quarterData) => (
            <div key={quarterData.quarterNumber} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Quarter Header */}
              <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-2xl font-bold">
                  Quarterly Income Statement - {quarterData.quarter} {year}
                </h2>
              </div>

              <div className="p-6">
                {/* Income Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
                    Income
                  </h3>
                  {quarterData.income.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No income recorded this quarter</p>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600">
                          <th className="py-2 w-24">Account #</th>
                          <th className="py-2">Account Name</th>
                          <th className="py-2 text-right">Planned</th>
                          <th className="py-2 text-right">Actual</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {quarterData.income.map((line) => (
                          <tr key={line.account_id} className="border-t border-gray-100">
                            <td className="py-2 text-gray-700">{line.account_number}</td>
                            <td className="py-2 text-gray-900">{line.account_name}</td>
                            <td className="py-2 text-right text-gray-500">
                              {line.budgeted_amount ? formatCurrency(line.budgeted_amount) : '-'}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-900">
                              {formatCurrency(line.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 font-semibold">
                          <td className="py-3" colSpan={2}>Total Income</td>
                          <td className="py-3 text-right text-green-700">
                            {formatCurrency(quarterData.income.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0))}
                          </td>
                          <td className="py-3 text-right text-green-700">
                            {formatCurrency(quarterData.totalIncome)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                {/* Expenses Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
                    Expenses
                  </h3>
                  {quarterData.expenses.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No expenses recorded this quarter</p>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600">
                          <th className="py-2 w-24">Account #</th>
                          <th className="py-2">Account Name</th>
                          <th className="py-2 text-right">Planned</th>
                          <th className="py-2 text-right">Actual</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {quarterData.expenses.map((line) => (
                          <tr key={line.account_id} className="border-t border-gray-100">
                            <td className="py-2 text-gray-700">{line.account_number}</td>
                            <td className="py-2 text-gray-900">{line.account_name}</td>
                            <td className="py-2 text-right text-gray-500">
                              {line.budgeted_amount ? formatCurrency(line.budgeted_amount) : '-'}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-900">
                              {formatCurrency(line.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 font-semibold">
                          <td className="py-3" colSpan={2}>Total Expenses</td>
                          <td className="py-3 text-right text-red-700">
                            {formatCurrency(quarterData.expenses.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0))}
                          </td>
                          <td className="py-3 text-right text-red-700">
                            {formatCurrency(quarterData.totalExpenses)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                {/* Net Summary */}
                <div className="border-t-4 border-gray-400 pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Net Increase (Decrease)</span>
                    <span className={quarterData.netIncrease >= 0 ? 'text-green-700' : 'text-red-700'}>
                      {formatCurrency(quarterData.netIncrease)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Annual Summary - Only show when viewing all quarters */}
          {selectedQuarter === 0 && data.length > 0 && (
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-indigo-600 text-white px-6 py-4">
                <h2 className="text-2xl font-bold">
                  Annual Summary - {year}
                </h2>
              </div>
              <div className="p-6">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                      <th className="py-3">Quarter</th>
                      <th className="py-3 text-right">Income</th>
                      <th className="py-3 text-right">Expenses</th>
                      <th className="py-3 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.map((quarterData) => (
                      <tr key={quarterData.quarterNumber} className="border-t border-gray-200">
                        <td className="py-3 font-medium text-gray-900">{quarterData.quarter}</td>
                        <td className="py-3 text-right text-green-700">
                          {formatCurrency(quarterData.totalIncome)}
                        </td>
                        <td className="py-3 text-right text-red-700">
                          {formatCurrency(quarterData.totalExpenses)}
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          quarterData.netIncrease >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatCurrency(quarterData.netIncrease)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-4 border-gray-400 font-bold text-base">
                    <tr>
                      <td className="py-4">Annual Total</td>
                      <td className="py-4 text-right text-green-700">
                        {formatCurrency(data.reduce((sum, q) => sum + q.totalIncome, 0))}
                      </td>
                      <td className="py-4 text-right text-red-700">
                        {formatCurrency(data.reduce((sum, q) => sum + q.totalExpenses, 0))}
                      </td>
                      <td className={`py-4 text-right ${
                        data.reduce((sum, q) => sum + q.netIncrease, 0) >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(data.reduce((sum, q) => sum + q.netIncrease, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
