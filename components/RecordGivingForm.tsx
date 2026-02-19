'use client'

import { useState, FormEvent, useEffect } from 'react'
import { recordWeeklyGiving } from '@/app/actions/transactions'
import { fetchDonors, createDonor, type Donor } from '@/app/actions/donors'
import type { Database } from '@/types/database.types'
import { getTodayLocalDate } from '@/lib/utils/date'

type Fund = Database['public']['Tables']['funds']['Row']
type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface RecordGivingFormProps {
  funds: Fund[]
  incomeAccounts: Account[]
  checkingAccounts: Account[]
}

export default function RecordGivingForm({
  funds,
  incomeAccounts,
  checkingAccounts,
}: RecordGivingFormProps) {
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
  const [incomeAccountId, setIncomeAccountId] = useState(incomeAccounts[0]?.id || '')
  const [checkingAccountId, setCheckingAccountId] = useState(checkingAccounts[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('Weekly giving')
  const [referenceNumber, setReferenceNumber] = useState('')

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
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than zero')
      setLoading(false)
      return
    }

    // Validate required fields
    if (!date || !fundId || !incomeAccountId || !checkingAccountId) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const result = await recordWeeklyGiving({
        date,
        fundId,
        incomeAccountId,
        amount: amountNum,
        checkingAccountId: checkingAccountId,
        description: description || 'Weekly giving',
        referenceNumber: referenceNumber || undefined,
        donorId: donorId || undefined,
      })

      if (result.success) {
        setSuccess(`Transaction recorded successfully! Entry ID: ${result.journalEntryId}`)
        // Reset form
        setAmount('')
        setReferenceNumber('')
        setDescription('Weekly giving')
        setDonorId('')
        setDonorSearch('')
        // Keep date, fund, and account selections
      } else {
        setError(result.error || 'Failed to record transaction')
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

      {/* Donor Field */}
      <div>
        <label htmlFor="donor" className="block text-sm font-medium text-gray-700 mb-1">
          Donor (Optional)
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Donor (Optional) --</option>
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

      {/* Checking Account Dropdown */}
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
      </div>

      {/* Income Account Dropdown */}
      <div>
        <label htmlFor="incomeAccount" className="block text-sm font-medium text-gray-700 mb-1">
          Income Account <span className="text-red-500">*</span>
        </label>
        <select
          id="incomeAccount"
          value={incomeAccountId}
          onChange={(e) => setIncomeAccountId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {incomeAccounts.map((account) => (
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
          placeholder="Weekly giving"
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
          placeholder="Check #, Receipt #, etc."
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
        {loading ? 'Recording Transaction...' : 'Record Transaction'}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">📘 Double-Entry Logic:</p>
        <ul className="text-xs space-y-1">
          <li>• Debit: {checkingAccounts.find(a => a.id === checkingAccountId)?.name || 'Selected Account'} (Increase Cash)</li>
          <li>• Credit: Selected Income Account (Increase Revenue)</li>
        </ul>
      </div>
    </form>
  )
}
