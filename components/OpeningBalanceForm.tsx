'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOpeningBalanceEntry } from '@/app/actions/opening-balance'
import { getTodayLocalDate } from '@/lib/utils/date'

interface Fund {
  id: string
  name: string
}

interface Account {
  id: string
  account_number: number
  name: string
  account_type: string
}

interface OpeningBalanceFormProps {
  funds: Fund[]
  assetAccounts: Account[]
  equityAccounts: Account[]
}

export default function OpeningBalanceForm({
  funds,
  assetAccounts,
  equityAccounts,
}: OpeningBalanceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [date, setDate] = useState(getTodayLocalDate())
  const [assetAccountId, setAssetAccountId] = useState('')
  const [equityAccountId, setEquityAccountId] = useState('')
  const [fundId, setFundId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('Opening Balance')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    // Validation
    if (!assetAccountId || !equityAccountId || !fundId || !amount || !date) {
      setError('Please fill in all required fields')
      setIsSubmitting(false)
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than zero')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await createOpeningBalanceEntry({
        date,
        assetAccountId,
        equityAccountId,
        fundId,
        amount: amountNum,
        description: description || 'Opening Balance',
      })

      if (!result.success) {
        setError(result.error || 'Failed to create opening balance entry')
        setIsSubmitting(false)
        return
      }

      setSuccess(true)
      setIsSubmitting(false)

      // Reset form
      setAssetAccountId('')
      setEquityAccountId('')
      setAmount('')
      setDescription('Opening Balance')

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/transactions')
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Opening Balance - Operating Checking"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Fund Selection */}
      <div>
        <label htmlFor="fund" className="block text-sm font-medium text-gray-700">
          Fund <span className="text-red-500">*</span>
        </label>
        <select
          id="fund"
          value={fundId}
          onChange={(e) => setFundId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a fund...</option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name}
            </option>
          ))}
        </select>
      </div>

      {/* Asset Account (DEBIT) */}
      <div>
        <label htmlFor="assetAccount" className="block text-sm font-medium text-gray-700">
          Asset Account (Debit - Money Goes Here) <span className="text-red-500">*</span>
        </label>
        <select
          id="assetAccount"
          value={assetAccountId}
          onChange={(e) => setAssetAccountId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select an asset account...</option>
          {assetAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.account_number} - {account.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Select the bank account or asset that has the opening balance
        </p>
      </div>

      {/* Equity Account (CREDIT) */}
      <div>
        <label htmlFor="equityAccount" className="block text-sm font-medium text-gray-700">
          Equity Account (Credit - Where It Comes From) <span className="text-red-500">*</span>
        </label>
        <select
          id="equityAccount"
          value={equityAccountId}
          onChange={(e) => setEquityAccountId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select an equity account...</option>
          {equityAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.account_number} - {account.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Typically "Retained Earnings" or "Opening Balance Equity"
        </p>
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Opening Balance Amount <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-800">
            ✓ Opening balance entry created successfully! Redirecting...
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || success}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Opening Balance Entry'}
        </button>
      </div>
    </form>
  )
}
