'use client'

import { useState, FormEvent, useEffect } from 'react'
import { recordInKindDonation } from '@/app/actions/transactions'
import { fetchDonors, createDonor, type Donor } from '@/app/actions/donors'
import type { Database } from '@/types/database.types'
import { getTodayLocalDate } from '@/lib/utils/date'

type Fund = Database['public']['Tables']['funds']['Row']
type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface InKindDonationFormProps {
  funds: Fund[]
  assetAccounts: Account[]
  expenseAccounts: Account[]
  inKindIncomeAccount: Account
}

export default function InKindDonationForm({
  funds,
  assetAccounts,
  expenseAccounts,
  inKindIncomeAccount,
}: InKindDonationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Donor state
  const [donors, setDonors] = useState<Donor[]>([])
  const [donorId, setDonorId] = useState('')
  const [donorSearch, setDonorSearch] = useState('')
  const [showAddDonor, setShowAddDonor] = useState(false)
  const [newDonorName, setNewDonorName] = useState('')

  // Form state
  const [date, setDate] = useState(getTodayLocalDate())
  const [fundId, setFundId] = useState(funds[0]?.id || '')
  const [itemDescription, setItemDescription] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [category, setCategory] = useState<'asset' | 'expense'>('asset')
  const [accountId, setAccountId] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')

  // Set default account when category changes
  useEffect(() => {
    if (category === 'asset' && assetAccounts.length > 0) {
      setAccountId(assetAccounts[0].id)
    } else if (category === 'expense' && expenseAccounts.length > 0) {
      setAccountId(expenseAccounts[0].id)
    }
  }, [category, assetAccounts, expenseAccounts])

  // Load donors on mount
  useEffect(() => {
    loadDonors()
  }, [])

  const loadDonors = async () => {
    const result = await fetchDonors()
    if (result.success && result.data) {
      setDonors(result.data)
    }
  }

  const handleAddDonor = async () => {
    if (!newDonorName.trim()) {
      setError('Please enter a donor name')
      return
    }

    const result = await createDonor({ name: newDonorName.trim() })
    if (result.success && result.data) {
      setDonors([...donors, result.data])
      setDonorId(result.data.id)
      setNewDonorName('')
      setShowAddDonor(false)
      setError(null)
    } else {
      setError(result.error || 'Failed to add donor')
    }
  }

  // Filter donors based on search
  const filteredDonors = donors.filter(donor =>
    donor.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
    (donor.envelope_number && donor.envelope_number.includes(donorSearch))
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate amount
    const valueNum = parseFloat(estimatedValue)
    if (isNaN(valueNum) || valueNum <= 0) {
      setError('Please enter a valid estimated value greater than zero')
      setLoading(false)
      return
    }

    // Validate required fields
    if (!date || !fundId || !accountId || !donorId || !itemDescription.trim()) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const result = await recordInKindDonation({
        date,
        donorId,
        itemDescription: itemDescription.trim(),
        estimatedValue: valueNum,
        category,
        assetOrExpenseAccountId: accountId,
        inKindIncomeAccountId: inKindIncomeAccount.id,
        fundId,
        referenceNumber: referenceNumber || undefined,
      })

      if (result.success) {
        setSuccess(`In-kind donation recorded successfully! Entry ID: ${result.journalEntryId}`)
        // Reset form
        setItemDescription('')
        setEstimatedValue('')
        setReferenceNumber('')
        setDonorId('')
        setDonorSearch('')
        // Keep date, fund, category, and account selections
      } else {
        setError(result.error || 'Failed to record donation')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const currentAccounts = category === 'asset' ? assetAccounts : expenseAccounts

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

      {/* Donor Field - REQUIRED */}
      <div>
        <label htmlFor="donor" className="block text-sm font-medium text-gray-700 mb-1">
          Donor <span className="text-red-500">*</span>
        </label>
        
        {!showAddDonor ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search by name or envelope number..."
              value={donorSearch}
              onChange={(e) => setDonorSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              id="donor"
              value={donorId}
              onChange={(e) => setDonorId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Donor (Required) --</option>
              {filteredDonors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donor.name} {donor.envelope_number && `(#${donor.envelope_number})`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAddDonor(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add New Donor
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-3 bg-gray-50 rounded-md">
            <input
              type="text"
              placeholder="Donor name"
              value={newDonorName}
              onChange={(e) => setNewDonorName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddDonor}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
              >
                Add Donor
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddDonor(false)
                  setNewDonorName('')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Item Description Field */}
      <div>
        <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Item Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="itemDescription"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          required
          placeholder="e.g., John Deere Riding Mower"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Estimated Value Field */}
      <div>
        <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Value <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            id="estimatedValue"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Dropdown */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as 'asset' | 'expense')}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="asset">Fixed Asset (1000s) - Equipment, Tools, etc.</option>
          <option value="expense">Donated Supply/Expense (5000s) - Supplies consumed</option>
        </select>
      </div>

      {/* Account Dropdown - Dynamic based on category */}
      <div>
        <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
          {category === 'asset' ? 'Asset Account' : 'Expense Account'} <span className="text-red-500">*</span>
        </label>
        <select
          id="account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {currentAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.account_number} - {account.name}
            </option>
          ))}
        </select>
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
          placeholder="Receipt #, Documentation #, etc."
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
        {loading ? 'Recording Donation...' : 'Record In-Kind Donation'}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">📘 Double-Entry Logic (Non-Cash):</p>
        <ul className="text-xs space-y-1">
          <li>• Debit: {category === 'asset' ? 'Asset Account' : 'Expense Account'} (Church receives value)</li>
          <li>• Credit: {inKindIncomeAccount.account_number} - {inKindIncomeAccount.name}</li>
          <li>• Note: No checking account involved - this is a non-cash transaction</li>
          <li>• Will appear on donor statements as "In-Kind/Non-Cash" per IRS guidelines</li>
        </ul>
      </div>
    </form>
  )
}
