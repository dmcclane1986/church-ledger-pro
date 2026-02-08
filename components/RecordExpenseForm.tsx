'use client'

import { useState, FormEvent } from 'react'
import { recordExpense } from '@/app/actions/transactions'
import type { Database } from '@/types/database.types'
import { getTodayLocalDate } from '@/lib/utils/date'

type Fund = Database['public']['Tables']['funds']['Row']
type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface RecordExpenseFormProps {
  funds: Fund[]
  expenseAccounts: Account[]
  checkingAccount: Account
  liabilityAccounts?: Account[]
}

export default function RecordExpenseForm({
  funds,
  expenseAccounts,
  checkingAccount,
  liabilityAccounts = [],
}: RecordExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [date, setDate] = useState(getTodayLocalDate())
  const [fundId, setFundId] = useState(funds[0]?.id || '')
  const [expenseAccountId, setExpenseAccountId] = useState(expenseAccounts[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')
  const [liabilityAccountId, setLiabilityAccountId] = useState(liabilityAccounts[0]?.id || '')

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
    if (!date || !fundId || !expenseAccountId || !description.trim()) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const result = await recordExpense({
        date,
        fundId,
        expenseAccountId,
        amount: amountNum,
        checkingAccountId: paymentType === 'cash' ? checkingAccount.id : undefined,
        liabilityAccountId: paymentType === 'credit' ? liabilityAccountId : undefined,
        description: description.trim(),
        referenceNumber: referenceNumber || undefined,
        paymentType,
      })

      if (result.success) {
        setSuccess(`Expense recorded successfully! Entry ID: ${result.journalEntryId}`)
        // Reset form
        setAmount('')
        setDescription('')
        setReferenceNumber('')
        // Keep date, fund, and account selections
      } else {
        setError(result.error || 'Failed to record expense')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
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

      {/* Vendor/Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Vendor/Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="e.g., Electric bill, Office supplies, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Fund Dropdown */}
      <div>
        <label htmlFor="fund" className="block text-sm font-medium text-gray-700 mb-1">
          Fund <span className="text-red-500">*</span>
        </label>
        <select
          id="fund"
          value={fundId}
          onChange={(e) => setFundId(e.target.value)}
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

      {/* Payment Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="cash"
              checked={paymentType === 'cash'}
              onChange={(e) => setPaymentType(e.target.value as 'cash' | 'credit')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Cash/Check (Pay Now)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="credit"
              checked={paymentType === 'credit'}
              onChange={(e) => setPaymentType(e.target.value as 'cash' | 'credit')}
              className="mr-2"
              disabled={liabilityAccounts.length === 0}
            />
            <span className="text-sm text-gray-700">
              On Credit (Accounts Payable)
              {liabilityAccounts.length === 0 && (
                <span className="text-xs text-gray-500 ml-1">(No liability accounts available)</span>
              )}
            </span>
          </label>
        </div>
      </div>

      {/* Liability Account (shown only for credit) */}
      {paymentType === 'credit' && liabilityAccounts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <label htmlFor="liabilityAccount" className="block text-sm font-medium text-gray-700 mb-1">
            Accounts Payable Account <span className="text-red-500">*</span>
          </label>
          <select
            id="liabilityAccount"
            value={liabilityAccountId}
            onChange={(e) => setLiabilityAccountId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {liabilityAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_number} - {account.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-yellow-700 mt-2">
            This expense will increase your Accounts Payable instead of reducing cash.
          </p>
        </div>
      )}

      {/* Expense Account Dropdown */}
      <div>
        <label htmlFor="expenseAccount" className="block text-sm font-medium text-gray-700 mb-1">
          Expense Account <span className="text-red-500">*</span>
        </label>
        <select
          id="expenseAccount"
          value={expenseAccountId}
          onChange={(e) => setExpenseAccountId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {expenseAccounts.map((account) => (
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
          placeholder="Check #, Invoice #, etc."
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
        {loading ? 'Recording Expense...' : 'Record Expense'}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">📘 Double-Entry Logic:</p>
        <ul className="text-xs space-y-1">
          <li>• Debit: Selected Expense Account (Increase Expense)</li>
          <li>• Credit: {checkingAccount.name} (Decrease Cash)</li>
        </ul>
      </div>
    </form>
  )
}
