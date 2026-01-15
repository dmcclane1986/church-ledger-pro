'use client'

import { useState } from 'react'
import { fetchDonorStatement, type Donor, type DonorStatementData } from '@/app/actions/donors'

interface DonorStatementFormProps {
  donors: Donor[]
}

export default function DonorStatementForm({ donors }: DonorStatementFormProps) {
  const [selectedDonorId, setSelectedDonorId] = useState('')
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statementData, setStatementData] = useState<DonorStatementData | null>(null)

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  const handleGenerateStatement = async () => {
    if (!selectedDonorId) {
      setError('Please select a donor')
      return
    }

    setLoading(true)
    setError(null)

    const result = await fetchDonorStatement(selectedDonorId, parseInt(selectedYear))
    
    if (result.success && result.data) {
      setStatementData(result.data)
    } else {
      setError(result.error || 'Failed to generate statement')
    }

    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div>
      {/* Form Section (hidden when printing) */}
      <div className="print:hidden space-y-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="donor" className="block text-sm font-medium text-gray-700 mb-1">
              Select Donor <span className="text-red-500">*</span>
            </label>
            <select
              id="donor"
              value={selectedDonorId}
              onChange={(e) => setSelectedDonorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Donor --</option>
              {donors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donor.name} {donor.envelope_number && `(#${donor.envelope_number})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year <span className="text-red-500">*</span>
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleGenerateStatement}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Statement'}
          </button>

          {statementData && (
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              🖨️ Print Statement
            </button>
          )}
        </div>
      </div>

      {/* Statement Display */}
      {statementData && (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-8 print:border-0">
          {/* Header */}
          <div className="text-center mb-8 pb-4 border-b-2 border-gray-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Contribution Statement
            </h2>
            <p className="text-lg text-gray-700">Tax Year {statementData.year}</p>
          </div>

          {/* Donor Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Donor Information</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-medium text-gray-900">{statementData.donor.name}</p>
              {statementData.donor.envelope_number && (
                <p className="text-sm text-gray-600">Envelope #: {statementData.donor.envelope_number}</p>
              )}
              {statementData.donor.address && (
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                  {statementData.donor.address}
                </p>
              )}
              {statementData.donor.email && (
                <p className="text-sm text-gray-600">{statementData.donor.email}</p>
              )}
            </div>
          </div>

          {/* Contributions Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contributions</h3>
            
            {statementData.contributions.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-md text-center text-gray-600">
                No contributions recorded for {statementData.year}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Fund
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statementData.contributions.map((contribution, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(contribution.entry_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contribution.description}
                        {contribution.reference_number && (
                          <span className="text-xs text-gray-500 ml-1">
                            (Ref: {contribution.reference_number})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contribution.fund_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(contribution.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-900">
                      Total Contributions:
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg">
                      {formatCurrency(statementData.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Footer / Disclaimer */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
            <p className="mb-2">
              <strong>Important Tax Information:</strong>
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>This statement reflects contributions received and recorded during the calendar year {statementData.year}.</li>
              <li>No goods or services were provided in exchange for these contributions.</li>
              <li>Please consult with a tax professional regarding the deductibility of these contributions.</li>
              <li>Keep this statement for your tax records.</li>
            </ul>
            <p className="mt-4 text-center text-gray-500">
              Generated on {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
