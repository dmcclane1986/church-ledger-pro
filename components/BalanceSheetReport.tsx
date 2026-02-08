'use client'

import { useState, useEffect } from 'react'
import { fetchBalanceSheet, BalanceSheetData } from '@/app/actions/reports'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addPDFHeader, formatCurrency as pdfFormatCurrency, addPDFFooter, defaultTableStyles } from '@/lib/pdf/report-generator'

export default function BalanceSheetReport() {
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchBalanceSheet()
    
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
        reportTitle: 'Balance Sheet',
        reportSubtitle: 'Statement of Financial Position',
        reportDate: `As of ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
      })
      
      let currentY = yPosition
      
      // Fund Balances Summary
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('Fund Balances', 20, currentY)
      currentY += 8
      
      const fundData = data.fundBalances.map(fund => [
        fund.fund_name,
        fund.is_restricted ? 'Restricted' : 'Unrestricted',
        pdfFormatCurrency(fund.balance)
      ])
      
      autoTable(doc, {
        startY: currentY,
        head: [['Fund Name', 'Type', 'Balance']],
        body: fundData,
        foot: [['Total Fund Balances', '', pdfFormatCurrency(data.totalFundBalances)]],
        ...defaultTableStyles,
        footStyles: {
          fillColor: [41, 128, 185] as [number, number, number],
          textColor: 255,
          fontStyle: 'bold' as const,
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Assets Section
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('ASSETS', 20, currentY)
      currentY += 8
      
      const assetData = data.assets.map(account => [
        account.account_name,
        pdfFormatCurrency(account.balance)
      ])
      
      autoTable(doc, {
        startY: currentY,
        head: [['Account', 'Amount']],
        body: assetData,
        foot: [['Total Assets', pdfFormatCurrency(data.totalAssets)]],
        ...defaultTableStyles,
        footStyles: {
          fillColor: [52, 152, 219] as [number, number, number],
          textColor: 255,
          fontStyle: 'bold' as const,
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Liabilities Section
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('LIABILITIES', 20, currentY)
      currentY += 8
      
      const liabilityData = data.liabilities.map(account => [
        account.account_name,
        pdfFormatCurrency(account.balance)
      ])
      
      autoTable(doc, {
        startY: currentY,
        head: [['Account', 'Amount']],
        body: liabilityData,
        foot: [['Total Liabilities', pdfFormatCurrency(data.totalLiabilities)]],
        ...defaultTableStyles,
        footStyles: {
          fillColor: [231, 76, 60] as [number, number, number],
          textColor: 255,
          fontStyle: 'bold' as const,
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Net Assets Section
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('NET ASSETS (EQUITY)', 20, currentY)
      currentY += 8
      
      const equityData = data.netAssets.map(account => [
        account.account_name,
        pdfFormatCurrency(account.balance)
      ])
      
      autoTable(doc, {
        startY: currentY,
        head: [['Account', 'Amount']],
        body: equityData,
        foot: [['Total Net Assets', pdfFormatCurrency(data.totalNetAssets)]],
        ...defaultTableStyles,
        footStyles: {
          fillColor: [46, 204, 113] as [number, number, number],
          textColor: 255,
          fontStyle: 'bold' as const,
        }
      })
      
      // Add footer
      addPDFFooter(doc)
      
      // Save PDF
      doc.save(`Balance-Sheet-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading balance sheet...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Balance Sheet */}
      {data && !loading && !error && (
        <>
          {/* Print Button */}
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

          {/* Fund Balance Cards */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fund Balances</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {data.fundBalances.map((fund) => (
                <div
                  key={fund.fund_id}
                  className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${
                    fund.is_restricted ? 'border-purple-500' : 'border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{fund.fund_name}</h3>
                    {fund.is_restricted && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(fund.balance)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Current Balance</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Total Fund Balances</h3>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.totalFundBalances)}
                </p>
              </div>
            </div>
          </div>

          {/* Balance Sheet Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-6 text-white">
              <h1 className="text-2xl font-bold">Balance Sheet</h1>
              <p className="text-green-100 mt-1">
                As of {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Assets Section */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assets</h2>
              {data.assets.length === 0 ? (
                <p className="text-gray-500 italic">No assets recorded</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-2 font-medium">Account</th>
                      <th className="pb-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assets.map((account) => (
                      <tr key={account.account_id} className="border-b border-gray-100">
                        <td className="py-3 text-gray-900">
                          <span className="text-gray-500 text-sm mr-2">
                            {account.account_number}
                          </span>
                          {account.account_name}
                        </td>
                        <td className="py-3 text-right text-gray-900 font-medium">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-50 font-semibold">
                      <td className="py-3 text-gray-900">Total Assets</td>
                      <td className="py-3 text-right text-green-900">
                        {formatCurrency(data.totalAssets)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Liabilities Section */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Liabilities</h2>
              {data.liabilities.length === 0 ? (
                <p className="text-gray-500 italic">No liabilities recorded</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-2 font-medium">Account</th>
                      <th className="pb-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.liabilities.map((account) => (
                      <tr key={account.account_id} className="border-b border-gray-100">
                        <td className="py-3 text-gray-900">
                          <span className="text-gray-500 text-sm mr-2">
                            {account.account_number}
                          </span>
                          {account.account_name}
                        </td>
                        <td className="py-3 text-right text-gray-900 font-medium">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-red-50 font-semibold">
                      <td className="py-3 text-gray-900">Total Liabilities</td>
                      <td className="py-3 text-right text-red-900">
                        {formatCurrency(data.totalLiabilities)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Net Assets Section */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Assets (Equity)</h2>
              {data.netAssets.length === 0 ? (
                <p className="text-gray-500 italic">No net asset accounts recorded</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-2 font-medium">Account</th>
                      <th className="pb-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.netAssets.map((account) => (
                      <tr key={account.account_id} className="border-b border-gray-100">
                        <td className="py-3 text-gray-900">
                          <span className="text-gray-500 text-sm mr-2">
                            {account.account_number}
                          </span>
                          {account.account_name}
                        </td>
                        <td className="py-3 text-right text-gray-900 font-medium">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50 font-semibold">
                      <td className="py-3 text-gray-900">Total Net Assets</td>
                      <td className="py-3 text-right text-blue-900">
                        {formatCurrency(data.totalNetAssets)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Total Liabilities + Net Assets */}
            <div className="px-6 py-6 bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Total Liabilities + Net Assets
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.totalLiabilities + data.totalNetAssets)}
                </p>
              </div>
            </div>
          </div>

          {/* Accounting Check */}
          <div className={`mt-6 rounded-lg p-6 border-2 ${
            data.isBalanced 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold mb-2 ${
                  data.isBalanced ? 'text-green-900' : 'text-red-900'
                }`}>
                  {data.isBalanced ? '✅ Balance Sheet is Balanced' : '⚠️ Balance Sheet NOT Balanced'}
                </h3>
                <p className={`text-sm ${
                  data.isBalanced ? 'text-green-800' : 'text-red-800'
                }`}>
                  Assets = Liabilities + Net Assets
                </p>
                <p className={`text-xs mt-1 ${
                  data.isBalanced ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(data.totalAssets)} = {formatCurrency(data.totalLiabilities)} + {formatCurrency(data.totalNetAssets)}
                </p>
              </div>
              <div className={`text-4xl ${
                data.isBalanced ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.isBalanced ? '✓' : '✗'}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              📘 About This Report
            </h3>
            <p className="text-blue-800 text-sm mb-2">
              The Balance Sheet shows your church&apos;s financial position at a specific point in time. 
              It follows the accounting equation: <strong>Assets = Liabilities + Net Assets</strong>.
            </p>
            <p className="text-blue-800 text-sm">
              <strong>Fund Balances</strong> represent the net worth of each fund and should match 
              the total Net Assets when your books are properly maintained.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
