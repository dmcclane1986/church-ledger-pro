'use client'

import { useState, useEffect } from 'react'
import { moveTransactionsBetweenAccounts, getTransactionsByAccount, getAllActiveAccounts } from '@/app/actions/transactions'
import type { Database } from '@/types/database.types'

type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface Transaction {
  id: string
  entry_date: string
  description: string
  reference_number: string | null
  created_at: string
}

export default function MoveTransactions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set())
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      const result = await getAllActiveAccounts()
      if (result.success && result.data) {
        const assetAccounts = result.data.filter((acc: Account) => acc.account_type === 'Asset')
        setAccounts(assetAccounts)
      }
    }
    loadAccounts()
  }, [])

  // Load transactions when source account changes
  useEffect(() => {
    if (sourceAccountId) {
      loadTransactions()
    } else {
      setTransactions([])
      setSelectedTransactionIds(new Set())
    }
  }, [sourceAccountId])

  const loadTransactions = async () => {
    if (!sourceAccountId) return

    setLoadingTransactions(true)
    setError(null)
    try {
      const result = await getTransactionsByAccount(sourceAccountId, 500)
      if (result.success && result.data) {
        setTransactions(result.data)
      } else {
        setError(result.error || 'Failed to load transactions')
        setTransactions([])
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactionIds)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactionIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTransactionIds.size === transactions.length) {
      setSelectedTransactionIds(new Set())
    } else {
      setSelectedTransactionIds(new Set(transactions.map(t => t.id)))
    }
  }

  const handleMove = async () => {
    if (!sourceAccountId || !destinationAccountId) {
      setError('Please select both source and destination accounts')
      return
    }

    if (selectedTransactionIds.size === 0) {
      setError('Please select at least one transaction to move')
      return
    }

    if (!confirm(
      `Are you sure you want to move ${selectedTransactionIds.size} transaction(s) from the source account to the destination account? This will update all ledger lines for these transactions.`
    )) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await moveTransactionsBetweenAccounts({
        sourceAccountId,
        destinationAccountId,
        journalEntryIds: Array.from(selectedTransactionIds),
      })

      if (result.success) {
        setSuccess(
          `Successfully moved ${result.transactionCount} transaction(s) (${result.movedCount} ledger lines updated).`
        )
        // Reload transactions
        await loadTransactions()
        setSelectedTransactionIds(new Set())
      } else {
        setError(result.error || 'Failed to move transactions')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const sourceAccount = accounts.find(a => a.id === sourceAccountId)
  const destinationAccount = accounts.find(a => a.id === destinationAccountId)

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Accounts</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Account (From) <span className="text-red-500">*</span>
            </label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select source account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} - {account.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Transactions using this account will be moved
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Account (To) <span className="text-red-500">*</span>
            </label>
            <select
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              disabled={!sourceAccountId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select destination account...</option>
              {accounts
                .filter(acc => acc.id !== sourceAccountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_number} - {account.name}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Transactions will be moved to this account
            </p>
          </div>
        </div>

        {sourceAccount && destinationAccount && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Move from:</strong> {sourceAccount.account_number} - {sourceAccount.name}
              {' → '}
              <strong>Move to:</strong> {destinationAccount.account_number} - {destinationAccount.name}
            </p>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Transactions List */}
      {sourceAccountId && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Transactions Using Source Account
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {loadingTransactions ? 'Loading...' : `${transactions.length} transaction(s) found`}
                </p>
              </div>
              {transactions.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {selectedTransactionIds.size === transactions.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
          </div>

          {loadingTransactions ? (
            <div className="p-8 text-center text-gray-500">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found using the selected source account.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                        <input
                          type="checkbox"
                          checked={selectedTransactionIds.size === transactions.length && transactions.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className={`hover:bg-gray-50 ${
                          selectedTransactionIds.has(transaction.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTransactionIds.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(transaction.entry_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {transaction.reference_number || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Move Button */}
              {selectedTransactionIds.size > 0 && destinationAccountId && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      <strong>{selectedTransactionIds.size}</strong> transaction(s) selected
                    </p>
                    <button
                      type="button"
                      onClick={handleMove}
                      disabled={loading || !destinationAccountId}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Moving...' : `Move ${selectedTransactionIds.size} Transaction(s)`}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">ℹ️ How This Works</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Select the source account (where transactions currently are)</li>
          <li>• Select the destination account (where you want to move them)</li>
          <li>• Review the list of transactions using the source account</li>
          <li>• Select which transactions to move (or select all)</li>
          <li>• Click "Move" to update all ledger lines for selected transactions</li>
          <li>• All other information (fund, amounts, memo, etc.) is preserved</li>
        </ul>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> This operation updates the account on all ledger lines for the selected transactions. 
            The transaction date, description, amounts, funds, and all other details remain unchanged.
          </p>
        </div>
      </div>
    </div>
  )
}
