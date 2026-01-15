'use client'

import { useState, useEffect } from 'react'
import {
  fetchTransactionHistory,
  fetchTransactionDetails,
  voidTransaction,
  TransactionHistoryEntry,
  TransactionDetail,
} from '@/app/actions/reports'
import { useUserRole } from '@/lib/auth/useUserRole'

export default function TransactionHistory() {
  const { canViewDonorInfo, canEditTransactions } = useUserRole()
  
  const [transactions, setTransactions] = useState<TransactionHistoryEntry[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Details modal state
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistoryEntry | null>(null)
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  
  // Void modal state
  const [voidingTransaction, setVoidingTransaction] = useState<TransactionHistoryEntry | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidLoading, setVoidLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filter transactions based on search term
    if (searchTerm.trim() === '') {
      setFilteredTransactions(transactions)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredTransactions(
        transactions.filter(
          (t) =>
            t.description.toLowerCase().includes(term) ||
            t.reference_number?.toLowerCase().includes(term)
        )
      )
    }
  }, [searchTerm, transactions])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchTransactionHistory()
    
    if (result.success && result.data) {
      setTransactions(result.data)
      setFilteredTransactions(result.data)
    } else {
      setError(result.error || 'Failed to load data')
    }
    
    setLoading(false)
  }

  const handleViewDetails = async (transaction: TransactionHistoryEntry) => {
    setSelectedTransaction(transaction)
    setDetailsLoading(true)
    
    const result = await fetchTransactionDetails(transaction.id)
    
    if (result.success && result.data) {
      setTransactionDetails(result.data)
    } else {
      setError(result.error || 'Failed to load details')
    }
    
    setDetailsLoading(false)
  }

  const handleVoidClick = (transaction: TransactionHistoryEntry) => {
    setVoidingTransaction(transaction)
    setVoidReason('')
  }

  const handleVoidConfirm = async () => {
    if (!voidingTransaction || !voidReason.trim()) {
      return
    }

    setVoidLoading(true)
    const result = await voidTransaction(voidingTransaction.id, voidReason)
    
    if (result.success) {
      // Reload data
      await loadData()
      setVoidingTransaction(null)
      setVoidReason('')
    } else {
      setError(result.error || 'Failed to void transaction')
    }
    
    setVoidLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by description or reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Found {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                {canViewDonorInfo && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className={`hover:bg-gray-50 ${
                    transaction.is_voided ? 'bg-red-50 opacity-60' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.entry_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                    {transaction.is_voided && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        VOIDED
                      </span>
                    )}
                  </td>
                  {canViewDonorInfo && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.donor_name || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.reference_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(transaction.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(transaction)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Details
                    </button>
                    {!transaction.is_voided && canEditTransactions && (
                      <button
                        onClick={() => handleVoidClick(transaction)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={canViewDonorInfo ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
              <h2 className="text-xl font-bold">Transaction Details</h2>
              <p className="text-blue-100 text-sm mt-1">
                {formatDate(selectedTransaction.entry_date)} - {selectedTransaction.description}
              </p>
            </div>

            <div className="p-6">
              {/* Transaction Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Reference Number</p>
                  <p className="font-medium">{selectedTransaction.reference_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium">{formatCurrency(selectedTransaction.total_amount)}</p>
                </div>
              </div>

              {selectedTransaction.is_voided && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-red-900 mb-2">⚠️ This Transaction is Voided</h3>
                  <p className="text-sm text-red-800">
                    <strong>Voided on:</strong> {formatDate(selectedTransaction.voided_at!)}
                  </p>
                  {selectedTransaction.voided_reason && (
                    <p className="text-sm text-red-800 mt-1">
                      <strong>Reason:</strong> {selectedTransaction.voided_reason}
                    </p>
                  )}
                </div>
              )}

              {/* Ledger Lines */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Double-Entry Ledger Lines</h3>
              {detailsLoading ? (
                <p className="text-gray-600 text-center py-4">Loading details...</p>
              ) : (
                <table className="w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Account
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Fund
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Debit
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactionDetails.map((detail) => (
                      <tr key={detail.id}>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-gray-500 mr-2">{detail.account_number}</span>
                          {detail.account_name}
                          {detail.memo && (
                            <p className="text-xs text-gray-500 mt-1">{detail.memo}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {detail.fund_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {detail.debit > 0 ? formatCurrency(detail.debit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {detail.credit > 0 ? formatCurrency(detail.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm">Totals</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(transactionDetails.reduce((sum, d) => sum + d.debit, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(transactionDetails.reduce((sum, d) => sum + d.credit, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {voidingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-red-500 px-6 py-4 text-white">
              <h2 className="text-xl font-bold">Void Transaction</h2>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Transaction:</p>
                <p className="font-medium">{voidingTransaction.description}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(voidingTransaction.entry_date)} - {formatCurrency(voidingTransaction.total_amount)}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Warning:</strong> This will mark the transaction as voided. 
                  The record will be preserved for audit purposes but excluded from reports.
                </p>
              </div>

              <div>
                <label htmlFor="voidReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Voiding <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="voidReason"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Enter the reason for voiding this transaction..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setVoidingTransaction(null)}
                disabled={voidLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVoidConfirm}
                disabled={voidLoading || !voidReason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {voidLoading ? 'Voiding...' : 'Void Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
