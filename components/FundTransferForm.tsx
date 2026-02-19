'use client'

import { useState, FormEvent } from 'react'
import { transferBetweenFunds } from '@/app/actions/transactions'
import type { Database } from '@/types/database.types'
import { getTodayLocalDate } from '@/lib/utils/date'

type Fund = Database['public']['Tables']['funds']['Row']
type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface FundTransferFormProps {
  funds: Fund[]
  accounts: Account[]
}

export default function FundTransferForm({
  funds,
  accounts,
}: FundTransferFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [date, setDate] = useState(getTodayLocalDate())
  const [sourceFundId, setSourceFundId] = useState(funds[0]?.id || '')
  const [destinationFundId, setDestinationFundId] = useState(funds[1]?.id || funds[0]?.id || '')
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '')
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('Fund transfer')
  const [referenceNumber, setReferenceNumber] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate amount
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than zero')
      setLoading(false)
      return
    }

    // Validate required fields
    if (!date || !sourceFundId || !destinationFundId) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Validate source and destination are different (fund or account)
    if (sourceFundId === destinationFundId && sourceAccountId === destinationAccountId) {
      setError('Source and destination must be different (fund or account)')
      setLoading(false)
      return
    }
    
    // Validate required fields
    if (!sourceAccountId || !destinationAccountId) {
      setError('Please select both source and destination accounts')
      setLoading(false)
      return
    }

    try {
      const result = await transferBetweenFunds({
        date,
        sourceFundId,
        destinationFundId,
        sourceAccountId,
        destinationAccountId,
        amount: amountNum,
        description: description || 'Fund transfer',
        referenceNumber: referenceNumber || undefined,
      })

      if (result.success) {
        setSuccess(`Transfer completed successfully! Entry ID: ${result.journalEntryId}`)
        // Reset form
        setAmount('')
        setReferenceNumber('')
        setDescription('Fund transfer')
        // Keep date and fund selections
      } else {
        setError(result.error || 'Failed to complete transfer')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Helper to get fund name by ID
  const getFundName = (fundId: string) => {
    return funds.find(f => f.id === fundId)?.name || 'Unknown Fund'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date Field */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date <span className="text-red-500">*</span>
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

      {/* Source Fund Dropdown */}
      <div>
        <label htmlFor="sourceFund" className="block text-sm font-medium text-gray-700 mb-1">
          Source Fund (Transfer From) <span className="text-red-500">*</span>
        </label>
        <select
          id="sourceFund"
          value={sourceFundId}
          onChange={(e) => setSourceFundId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name} {fund.is_restricted && '(Restricted)'}
            </option>
          ))}
        </select>
      </div>

      {/* Destination Fund Dropdown */}
      <div>
        <label htmlFor="destinationFund" className="block text-sm font-medium text-gray-700 mb-1">
          Destination Fund (Transfer To) <span className="text-red-500">*</span>
        </label>
        <select
          id="destinationFund"
          value={destinationFundId}
          onChange={(e) => setDestinationFundId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name} {fund.is_restricted && '(Restricted)'}
            </option>
          ))}
        </select>
      </div>

      {/* Source Account Dropdown */}
      <div>
        <label htmlFor="sourceAccount" className="block text-sm font-medium text-gray-700 mb-1">
          Source Account (Transfer From) <span className="text-red-500">*</span>
        </label>
        <select
          id="sourceAccount"
          value={sourceAccountId}
          onChange={(e) => setSourceAccountId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.account_number} - {account.name}
            </option>
          ))}
        </select>
      </div>

      {/* Destination Account Dropdown */}
      <div>
        <label htmlFor="destinationAccount" className="block text-sm font-medium text-gray-700 mb-1">
          Destination Account (Transfer To) <span className="text-red-500">*</span>
        </label>
        <select
          id="destinationAccount"
          value={destinationAccountId}
          onChange={(e) => setDestinationAccountId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.account_number} - {account.name}
            </option>
          ))}
        </select>
      </div>

      {/* Amount Field */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Fund transfer"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Reference Number Field */}
      <div>
        <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Reference Number (Optional)
        </label>
        <input
          type="text"
          id="referenceNumber"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="Transfer reference, authorization code, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processing Transfer...' : 'Transfer Funds'}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">📘 Transfer Logic:</p>
        <ul className="text-xs space-y-1">
          <li>• Credit: {accounts.find(a => a.id === sourceAccountId)?.name || 'Source Account'} in {getFundName(sourceFundId)} (Decrease)</li>
          <li>• Debit: {accounts.find(a => a.id === destinationAccountId)?.name || 'Destination Account'} in {getFundName(destinationFundId)} (Increase)</li>
          {sourceAccountId === destinationAccountId ? (
            <li>• Same account: Total bank balance unchanged (fund reallocation only)</li>
          ) : (
            <li>• Different accounts: Money moves between accounts AND funds</li>
          )}
        </ul>
      </div>
    </form>
  )
}
