'use client'

import { useState, FormEvent } from 'react'
import { recordBatchOnlineDonation } from '@/app/actions/transactions'
import type { Database } from '@/types/database.types'
import { getTodayLocalDate } from '@/lib/utils/date'

type Fund = Database['public']['Tables']['funds']['Row']
type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface Donor {
  id: string
  name: string
  email: string | null
}

interface DonationRow {
  id: string
  donorId: string
  fundId: string
  amount: string
}

interface BatchOnlineDonationFormProps {
  donors: Donor[]
  funds: Fund[]
  incomeAccounts: Account[]
  checkingAccounts: Account[]
  feesAccount: Account
}

export default function BatchOnlineDonationForm({
  donors,
  funds,
  incomeAccounts,
  checkingAccounts,
  feesAccount,
}: BatchOnlineDonationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    journalEntryId: string
    donationCount: number
    totalAmount: number
  } | null>(null)

  // Form state
  const [date, setDate] = useState(getTodayLocalDate())
  const [checkingAccountId, setCheckingAccountId] = useState(checkingAccounts[0]?.id || '')
  const [netDeposit, setNetDeposit] = useState('')
  const [processingFees, setProcessingFees] = useState('')
  const [description, setDescription] = useState('Online donation batch')
  const [referenceNumber, setReferenceNumber] = useState('')
  
  // Default income account (first one)
  const defaultIncomeAccountId = incomeAccounts[0]?.id || ''

  // Donation rows
  const [donationRows, setDonationRows] = useState<DonationRow[]>([
    { 
      id: Math.random().toString(36).substr(2, 9), 
      donorId: donors[0]?.id || '', 
      fundId: funds[0]?.id || '', 
      amount: '' 
    }
  ])

  // Calculate gross and remaining
  const netDepositNum = parseFloat(netDeposit) || 0
  const processingFeesNum = parseFloat(processingFees) || 0
  const grossAmount = netDepositNum + processingFeesNum

  const donationsTotal = donationRows.reduce((sum, row) => {
    const amount = parseFloat(row.amount) || 0
    return sum + amount
  }, 0)

  const remaining = grossAmount - donationsTotal
  const isBalanced = Math.abs(remaining) < 0.01 && grossAmount > 0

  const addDonationRow = () => {
    setDonationRows([
      ...donationRows,
      { 
        id: Math.random().toString(36).substr(2, 9), 
        donorId: donors[0]?.id || '', 
        fundId: funds[0]?.id || '', 
        amount: '' 
      }
    ])
  }

  const removeDonationRow = (id: string) => {
    if (donationRows.length > 1) {
      setDonationRows(donationRows.filter(row => row.id !== id))
    }
  }

  const updateDonationRow = (id: string, field: keyof DonationRow, value: string) => {
    setDonationRows(donationRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all entries? This cannot be undone.')) {
      setNetDeposit('')
      setProcessingFees('')
      setDescription('Online donation batch')
      setReferenceNumber('')
      setDonationRows([
        { 
          id: Math.random().toString(36).substr(2, 9), 
          donorId: donors[0]?.id || '', 
          fundId: funds[0]?.id || '', 
          amount: '' 
        }
      ])
      setError(null)
      setSuccess(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate
    if (!isBalanced) {
      setError('Donations must equal the gross amount before saving')
      setLoading(false)
      return
    }

    // Prepare donations data
    const donations = donationRows
      .filter(row => parseFloat(row.amount) > 0)
      .map(row => ({
        donorId: row.donorId,
        fundId: row.fundId,
        incomeAccountId: defaultIncomeAccountId,
        amount: parseFloat(row.amount),
      }))

    if (donations.length === 0) {
      setError('At least one donation with an amount is required')
      setLoading(false)
      return
    }

    try {
      const result = await recordBatchOnlineDonation({
        date,
        netDeposit: netDepositNum,
        processingFees: processingFeesNum,
        checkingAccountId: checkingAccountId,
        feesAccountId: feesAccount.id,
        description: description || 'Online donation batch',
        referenceNumber: referenceNumber || undefined,
        donations,
      })

      if (result.success) {
        setSuccess({
          journalEntryId: result.journalEntryId!,
          donationCount: result.donationCount!,
          totalAmount: result.totalAmount!,
        })
      } else {
        setError(result.error || 'Failed to save batch')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Batch Saved Successfully!
          </h2>
          <p className="text-green-800 mb-4">
            Recorded {success.donationCount} donations totaling {formatCurrency(success.totalAmount)}
          </p>
          <div className="text-sm text-green-700 mb-6">
            Journal Entry ID: <span className="font-mono font-semibold">{success.journalEntryId}</span>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setSuccess(null)
                clearAll()
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Record Another Batch
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Print Summary
            </button>
          </div>
        </div>

        {/* Print-friendly summary */}
        <div className="hidden print:block bg-white p-8">
          <h1 className="text-2xl font-bold mb-4">Online Donation Batch Summary</h1>
          <div className="mb-6">
            <p><strong>Date:</strong> {date}</p>
            <p><strong>Journal Entry ID:</strong> {success.journalEntryId}</p>
            <p><strong>Net Deposit:</strong> {formatCurrency(netDepositNum)}</p>
            <p><strong>Processing Fees:</strong> {formatCurrency(processingFeesNum)}</p>
            <p><strong>Gross Amount:</strong> {formatCurrency(success.totalAmount)}</p>
          </div>
          <h2 className="text-xl font-bold mb-2">Donations:</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-2">Donor</th>
                <th className="text-left py-2">Fund</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {donationRows.filter(row => parseFloat(row.amount) > 0).map((row: any) => (
                <tr key={row.id} className="border-b">
                  <td className="py-2">{donors.find(d => d.id === row.donorId)?.name}</td>
                  <td className="py-2">{funds.find(f => f.id === row.fundId)?.name}</td>
                  <td className="text-right py-2">{formatCurrency(parseFloat(row.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit Information</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Deposit Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cash/Bank Account */}
          <div>
            <label htmlFor="checkingAccount" className="block text-sm font-medium text-gray-700 mb-1">
              Cash/Bank Account <span className="text-red-500">*</span>
            </label>
            <select
              id="checkingAccount"
              value={checkingAccountId}
              onChange={(e) => setCheckingAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {checkingAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} - {account.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Account where deposit was received</p>
          </div>

          {/* Net Deposit */}
          <div>
            <label htmlFor="netDeposit" className="block text-sm font-medium text-gray-700 mb-1">
              Total Net Deposit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="netDeposit"
                value={netDeposit}
                onChange={(e) => setNetDeposit(e.target.value)}
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Amount shown on bank statement</p>
          </div>

          {/* Processing Fees */}
          <div>
            <label htmlFor="processingFees" className="block text-sm font-medium text-gray-700 mb-1">
              Processing Fees <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="processingFees"
                value={processingFees}
                onChange={(e) => setProcessingFees(e.target.value)}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Platform fees deducted</p>
          </div>

          {/* Calculated Gross */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calculated Gross
            </label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-lg font-bold text-gray-900">
              {formatCurrency(grossAmount)}
            </div>
            <p className="mt-1 text-xs text-gray-500">Net + Fees</p>
          </div>
        </div>

        {/* Description and Reference */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Online donation batch"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Transaction ID, batch number, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Donor Entry Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Donor Donations</h3>
          <button
            type="button"
            onClick={addDonationRow}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            + Add Donor
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donationRows.map((row: any) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <select
                      value={row.donorId}
                      onChange={(e) => updateDonationRow(row.id, 'donorId', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {donors.map((donor) => (
                        <option key={donor.id} value={donor.id}>
                          {donor.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.fundId}
                      onChange={(e) => updateDonationRow(row.id, 'fundId', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {funds.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                          {fund.name} {fund.is_restricted && '(Restricted)'}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => updateDonationRow(row.id, 'amount', e.target.value)}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeDonationRow(row.id)}
                      disabled={donationRows.length === 1}
                      className="text-red-600 hover:text-red-900 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Math Display */}
      <div className={`p-6 rounded-lg border-2 ${
        isBalanced 
          ? 'bg-green-50 border-green-500' 
          : remaining > 0 
            ? 'bg-yellow-50 border-yellow-500' 
            : 'bg-red-50 border-red-500'
      }`}>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium text-gray-600">Gross Amount</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(grossAmount)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Assigned to Donors</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(donationsTotal)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Remaining to Assign</div>
            <div className={`text-3xl font-bold ${
              isBalanced ? 'text-green-600' : remaining > 0 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {formatCurrency(Math.abs(remaining))}
            </div>
            {isBalanced && <div className="text-sm text-green-700 mt-1">✓ Balanced!</div>}
            {!isBalanced && remaining > 0 && <div className="text-sm text-yellow-700 mt-1">Still need to assign</div>}
            {!isBalanced && remaining < 0 && <div className="text-sm text-red-700 mt-1">Over-assigned!</div>}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || !isBalanced}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium text-lg"
        >
          {loading ? 'Saving Batch...' : !isBalanced ? 'Balance Required to Save' : 'Save Batch'}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Accounting Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-xs">
        <p className="font-semibold text-gray-900 mb-2">📘 Accounting Logic:</p>
        <ul className="space-y-1 text-gray-700">
          <li>• <strong>Debit:</strong> {checkingAccounts.find(acc => acc.id === checkingAccountId)?.name || 'Selected Account'} for {formatCurrency(netDepositNum)}</li>
          {processingFeesNum > 0 && (
            <li>• <strong>Debit:</strong> {feesAccount.name} for {formatCurrency(processingFeesNum)}</li>
          )}
          <li>• <strong>Credit:</strong> Income accounts for each donor donation (with donor linkage)</li>
          <li>• <strong>Total Debits:</strong> {formatCurrency(grossAmount)}</li>
          <li>• <strong>Total Credits:</strong> {formatCurrency(donationsTotal)}</li>
        </ul>
      </div>
    </form>
  )
}
