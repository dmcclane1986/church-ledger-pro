'use client'

import { useState } from 'react'
import { deleteTransaction } from '@/app/actions/transactions'
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

interface TransactionManagementProps {
  initialTransactions: TransactionWithDetails[]
}

export default function TransactionManagement({ 
  initialTransactions 
}: TransactionManagementProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const handleDelete = async (journalEntryId: string) => {
    setDeletingId(journalEntryId)

    try {
      const result = await deleteTransaction(journalEntryId)

      if (result.success) {
        // Remove from local state
        setTransactions(prev => prev.filter(t => t.id !== journalEntryId))
        setConfirmDeleteId(null)
        setExpandedId(null)
      } else {
        alert(`Error deleting transaction: ${result.error}`)
      }
    } catch (error) {
      alert('An unexpected error occurred while deleting the transaction')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = !filterDate || transaction.entry_date === filterDate

    return matchesSearch && matchesDate
  })

  // Calculate transaction totals
  const getTransactionTotal = (transaction: TransactionWithDetails) => {
    return transaction.ledger_lines.reduce((sum, line) => sum + line.debit, 0)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Description or Reference
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {(searchTerm || filterDate) && (
          <div className="mt-3">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterDate('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Transaction Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
            >
              {/* Transaction Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpanded(transaction.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {transaction.description}
                      </h3>
                      {transaction.reference_number && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Ref: {transaction.reference_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{formatDate(transaction.entry_date)}</span>
                      <span>•</span>
                      <span className="font-medium">
                        ${getTransactionTotal(transaction).toFixed(2)}
                      </span>
                      <span>•</span>
                      <span>{transaction.ledger_lines.length} lines</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDeleteId(transaction.id)
                      }}
                      disabled={deletingId === transaction.id}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-300 disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedId === transaction.id ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === transaction.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Journal Entry Details
                  </h4>
                  <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Account
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Fund
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Memo
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Debit
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transaction.ledger_lines.map((line) => (
                          <tr key={line.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">
                              <div className="font-medium text-gray-900">
                                {line.chart_of_accounts.account_number} - {line.chart_of_accounts.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {line.chart_of_accounts.account_type}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {line.funds.name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {line.memo || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                              {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                              {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-right text-gray-700">
                            Totals:
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">
                            ${transaction.ledger_lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">
                            ${transaction.ledger_lines.reduce((sum, line) => sum + line.credit, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Created: {new Date(transaction.created_at).toLocaleString()}</p>
                    {transaction.updated_at !== transaction.created_at && (
                      <p>Updated: {new Date(transaction.updated_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Delete Confirmation */}
              {confirmDeleteId === transaction.id && (
                <div className="border-t border-gray-200 bg-red-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Are you sure you want to delete this transaction?
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        This action cannot be undone. All associated ledger lines will be permanently deleted.
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deletingId === transaction.id}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === transaction.id ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
