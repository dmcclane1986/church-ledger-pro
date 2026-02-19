'use client'

import { useState, useEffect } from 'react'
import { updateTransaction, getAllActiveAccounts } from '@/app/actions/transactions'
import { getFunds } from '@/app/actions/funds'
import type { Database } from '@/types/database.types'

type JournalEntry = Database['public']['Tables']['journal_entries']['Row']
type LedgerLine = Database['public']['Tables']['ledger_lines']['Row']

interface TransactionWithDetails extends JournalEntry {
  ledger_lines: Array<LedgerLine & {
    chart_of_accounts: {
      account_number: number
      name: string
      account_type: string
    }
    funds: {
      name: string
    }
  }>
}

interface EditTransactionFormProps {
  transaction: TransactionWithDetails
  onClose: () => void
  onSuccess: () => void
}

interface Account {
  id: string
  account_number: number
  name: string
  account_type: string
}

interface Fund {
  id: string
  name: string
  is_restricted: boolean
}

interface LedgerLineInput {
  id: string
  accountId: string
  fundId: string
  debit: number
  credit: number
  memo: string | null
}

export default function EditTransactionForm({
  transaction,
  onClose,
  onSuccess,
}: EditTransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Journal entry fields
  const [entryDate, setEntryDate] = useState(transaction.entry_date)
  const [description, setDescription] = useState(transaction.description)
  const [referenceNumber, setReferenceNumber] = useState(transaction.reference_number || '')
  const [donorId, setDonorId] = useState(transaction.donor_id || '')

  // Ledger lines
  const [ledgerLines, setLedgerLines] = useState<LedgerLineInput[]>(
    transaction.ledger_lines.map((line) => ({
      id: line.id,
      accountId: line.account_id,
      fundId: line.fund_id,
      debit: Number(line.debit),
      credit: Number(line.credit),
      memo: line.memo || '',
    }))
  )

  // Load accounts and funds
  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsResult, fundsResult] = await Promise.all([
          getAllActiveAccounts(),
          getFunds(),
        ])

        if (accountsResult.success && accountsResult.data) {
          setAccounts(accountsResult.data)
        }

        if (fundsResult.success && fundsResult.data) {
          setFunds(fundsResult.data)
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load accounts and funds')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  const handleUpdateLine = (index: number, field: keyof LedgerLineInput, value: any) => {
    const updated = [...ledgerLines]
    updated[index] = { ...updated[index], [field]: value }
    
    // If updating debit, clear credit and vice versa
    if (field === 'debit' && value > 0) {
      updated[index].credit = 0
    } else if (field === 'credit' && value > 0) {
      updated[index].debit = 0
    }
    
    setLedgerLines(updated)
  }

  const handleAddLine = () => {
    if (accounts.length === 0 || funds.length === 0) {
      setError('Please wait for accounts and funds to load')
      return
    }
    
    setLedgerLines([
      ...ledgerLines,
      {
        id: `new-${Date.now()}`,
        accountId: accounts[0].id,
        fundId: funds[0].id,
        debit: 0,
        credit: 0,
        memo: '',
      },
    ])
  }

  const handleRemoveLine = (index: number) => {
    if (ledgerLines.length <= 2) {
      setError('Transaction must have at least 2 ledger lines')
      return
    }
    setLedgerLines(ledgerLines.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const totalDebits = ledgerLines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + Number(line.credit || 0), 0)
    return { totalDebits, totalCredits, isBalanced: Math.abs(totalDebits - totalCredits) < 0.01 }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate
    if (!description.trim()) {
      setError('Description is required')
      return
    }

    if (ledgerLines.length < 2) {
      setError('Transaction must have at least 2 ledger lines')
      return
    }

    // Validate each line
    for (let i = 0; i < ledgerLines.length; i++) {
      const line = ledgerLines[i]
      if (!line.accountId || !line.fundId) {
        setError(`Line ${i + 1}: Account and Fund are required`)
        return
      }
      const hasDebit = Number(line.debit || 0) > 0
      const hasCredit = Number(line.credit || 0) > 0
      if (!hasDebit && !hasCredit) {
        setError(`Line ${i + 1}: Must have either a debit or credit amount`)
        return
      }
      if (hasDebit && hasCredit) {
        setError(`Line ${i + 1}: Cannot have both debit and credit`)
        return
      }
    }

    // Check balance
    const { isBalanced, totalDebits, totalCredits } = calculateTotals()
    if (!isBalanced) {
      setError(
        `Transaction is not balanced. Debits: $${totalDebits.toFixed(2)}, Credits: $${totalCredits.toFixed(2)}`
      )
      return
    }

    setLoading(true)

    try {
      // Filter out new lines (lines that don't exist in the original transaction)
      const existingLines = ledgerLines.filter((line) => !line.id.startsWith('new'))
      const newLines = ledgerLines.filter((line) => line.id.startsWith('new'))

      // For now, we only support editing existing lines
      // New lines would require more complex logic to add to existing transaction
      if (newLines.length > 0) {
        setError('Adding new lines to existing transactions is not yet supported. Please delete and recreate the transaction.')
        setLoading(false)
        return
      }

      const result = await updateTransaction({
        journalEntryId: transaction.id,
        entryDate,
        description: description.trim(),
        referenceNumber: referenceNumber.trim() || null,
        donorId: donorId || null,
        ledgerLines: existingLines.map((line) => ({
          id: line.id,
          accountId: line.accountId,
          fundId: line.fundId,
          debit: Number(line.debit),
          credit: Number(line.credit),
          memo: line.memo?.trim() || null,
        })),
      })

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Failed to update transaction')
      }
    } catch (err) {
      console.error('Error updating transaction:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const { totalDebits, totalCredits, isBalanced } = calculateTotals()

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Journal Entry Fields */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Journal Entry</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Ledger Lines */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Ledger Lines</h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                + Add Line
              </button>
            </div>

            <div className="space-y-3">
              {ledgerLines.map((line, index) => (
                <div key={line.id} className="bg-white rounded border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Line {index + 1}</span>
                    {ledgerLines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        className="text-sm text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Account <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={line.accountId}
                        onChange={(e) => handleUpdateLine(index, 'accountId', e.target.value)}
                        required
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_number} - {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fund <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={line.fundId}
                        onChange={(e) => handleUpdateLine(index, 'fundId', e.target.value)}
                        required
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {funds.map((fund) => (
                          <option key={fund.id} value={fund.id}>
                            {fund.name} {fund.is_restricted && '(Restricted)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Debit</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit || ''}
                        onChange={(e) => handleUpdateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Credit</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit || ''}
                        onChange={(e) => handleUpdateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Memo</label>
                      <input
                        type="text"
                        value={line.memo || ''}
                        onChange={(e) => handleUpdateLine(index, 'memo', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Balance Summary */}
            <div className="bg-white rounded border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Debits:</span>
                <span className="text-sm font-semibold text-gray-900">${totalDebits.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-gray-700">Total Credits:</span>
                <span className="text-sm font-semibold text-gray-900">${totalCredits.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Balance:</span>
                <span
                  className={`text-sm font-semibold ${
                    isBalanced ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isBalanced ? '✓ Balanced' : `Unbalanced: $${Math.abs(totalDebits - totalCredits).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isBalanced}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
