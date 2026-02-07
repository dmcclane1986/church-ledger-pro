'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getUnclearedTransactions,
  calculateBalanceForTransactions,
  startReconciliation,
  finalizeReconciliation,
  getCurrentReconciliation,
  getReconciliationHistory,
} from '@/app/actions/reconciliation'
import { getCheckingAccounts } from '@/app/actions/transactions'

interface Transaction {
  id: string
  debit: number
  credit: number
  memo: string | null
  journal_entries: {
    id: string
    entry_date: string
    description: string
    reference_number: string | null
  }
  chart_of_accounts: {
    name: string
    account_number: number
  }
}

export default function BankReconciliationPage() {
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Reconciliation state
  const [statementBalance, setStatementBalance] = useState<string>('')
  const [statementDate, setStatementDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [currentReconciliation, setCurrentReconciliation] = useState<any>(null)
  const [clearedBalance, setClearedBalance] = useState<number>(0)
  const [reconciliationHistory, setReconciliationHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load accounts on mount
  useEffect(() => {
    loadAccounts()
  }, [])

  // Load transactions when account changes
  useEffect(() => {
    if (selectedAccount) {
      loadData()
    }
  }, [selectedAccount])

  // Update cleared balance when checked items change
  useEffect(() => {
    if (selectedAccount && checkedItems.size > 0) {
      updateClearedBalanceForChecked()
    } else {
      setClearedBalance(0)
    }
  }, [checkedItems, selectedAccount])

  const loadAccounts = async () => {
    const result = await getCheckingAccounts()
    if (result.success && result.data) {
      setAccounts(result.data)
      if (result.data.length > 0 && !selectedAccount) {
        setSelectedAccount(result.data[0].id)
      }
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load uncleared transactions
      const transactionsResult = await getUnclearedTransactions(selectedAccount)
      if (transactionsResult.success && transactionsResult.data) {
        setTransactions(transactionsResult.data)
      } else {
        setError(transactionsResult.error || 'Failed to load transactions')
      }

      // Load current reconciliation
      const reconciliationResult = await getCurrentReconciliation(selectedAccount)
      if (reconciliationResult.success && reconciliationResult.data) {
        setCurrentReconciliation(reconciliationResult.data)
        setStatementBalance(reconciliationResult.data.statement_balance.toString())
        setStatementDate(reconciliationResult.data.statement_date)
      } else {
        setCurrentReconciliation(null)
      }

      // Load reconciliation history
      const historyResult = await getReconciliationHistory(selectedAccount)
      if (historyResult.success && historyResult.data) {
        setReconciliationHistory(historyResult.data)
      }

      // Reset checked items when loading new data
      setCheckedItems(new Set())
      setClearedBalance(0)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateClearedBalanceForChecked = async () => {
    if (checkedItems.size === 0) {
      setClearedBalance(0)
      return
    }

    const transactionIds = Array.from(checkedItems)
    const result = await calculateBalanceForTransactions(selectedAccount, transactionIds)
    if (result.success) {
      setClearedBalance(result.balance)
    }
  }

  const handleCheckboxChange = (transactionId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(transactionId)) {
      newChecked.delete(transactionId)
    } else {
      newChecked.add(transactionId)
    }
    setCheckedItems(newChecked)
  }

  const handleStartReconciliation = async () => {
    const balance = parseFloat(statementBalance)
    if (isNaN(balance)) {
      setError('Please enter a valid statement balance')
      return
    }

    setLoading(true)
    setError(null)

    const result = await startReconciliation({
      accountId: selectedAccount,
      statementDate,
      statementBalance: balance,
    })

    if (result.success) {
      setSuccess('Reconciliation started successfully!')
      await loadData()
    } else {
      setError(result.error || 'Failed to start reconciliation')
    }

    setLoading(false)
  }

  const handleFinalizeReconciliation = async () => {
    if (!currentReconciliation) {
      setError('No active reconciliation found')
      return
    }

    const balance = parseFloat(statementBalance)
    if (isNaN(balance)) {
      setError('Please enter a valid statement balance')
      return
    }

    if (checkedItems.size === 0) {
      setError('Please check at least one transaction before finalizing')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await finalizeReconciliation({
      reconciliationId: currentReconciliation.id,
      accountId: selectedAccount,
      statementBalance: balance,
      clearedTransactionIds: Array.from(checkedItems),
    })

    if (result.success) {
      setSuccess(
        result.message || 
        `Reconciliation completed successfully! ${result.transactionsCleared} transactions cleared.`
      )
      // Reset checked items and reload data
      setCheckedItems(new Set())
      await loadData()
    } else {
      setError(result.error || 'Failed to finalize reconciliation')
    }

    setLoading(false)
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

  const getTransactionAmount = (transaction: Transaction) => {
    return transaction.debit > 0 ? transaction.debit : -transaction.credit
  }

  const balancesMatch = () => {
    const balance = parseFloat(statementBalance)
    if (isNaN(balance)) return false
    return Math.abs(clearedBalance - balance) < 0.01
  }

  const difference = () => {
    const balance = parseFloat(statementBalance)
    if (isNaN(balance)) return 0
    return clearedBalance - balance
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bank Reconciliation
          </h1>
          <p className="text-gray-600">
            Match your bank statement with your ledger to ensure accuracy
          </p>
        </div>

        {/* Account Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Select an account...</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_number} - {account.name}
              </option>
            ))}
          </select>
        </div>

        {selectedAccount && (
          <>
            {/* Statement Information */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Statement Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statement Date
                  </label>
                  <input
                    type="date"
                    value={statementDate}
                    onChange={(e) => setStatementDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading || !!currentReconciliation}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statement Ending Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={statementBalance}
                    onChange={(e) => setStatementBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {!currentReconciliation && (
                <button
                  onClick={handleStartReconciliation}
                  disabled={loading || !statementBalance}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Start Reconciliation
                </button>
              )}
            </div>

            {/* Running Total Display */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Statement Balance</p>
                  <p className="text-3xl font-bold">
                    {statementBalance ? formatCurrency(parseFloat(statementBalance)) : '$0.00'}
                  </p>
                </div>

                <div>
                  <p className="text-blue-100 text-sm mb-1">Cleared Balance</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(clearedBalance)}
                  </p>
                </div>

                <div>
                  <p className="text-blue-100 text-sm mb-1">Difference</p>
                  <p className={`text-3xl font-bold ${
                    balancesMatch() ? 'text-green-300' : 'text-yellow-300'
                  }`}>
                    {formatCurrency(Math.abs(difference()))}
                  </p>
                  {balancesMatch() && (
                    <p className="text-green-200 text-sm mt-1">✓ Balanced!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>{success}</p>
                </div>
              </div>
            )}

            {/* Transactions Checklist */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Uncleared Transactions ({transactions.length})
              </h2>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-lg">All transactions are cleared!</p>
                  <p className="text-gray-500 text-sm mt-2">
                    There are no pending transactions for this account.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems.has(transaction.id)}
                        onChange={() => handleCheckboxChange(transaction.id)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.journal_entries.description}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaction.journal_entries.entry_date)}
                              {transaction.journal_entries.reference_number && (
                                <span className="ml-2">
                                  • Ref: {transaction.journal_entries.reference_number}
                                </span>
                              )}
                            </p>
                            {transaction.memo && (
                              <p className="text-sm text-gray-600 mt-1">
                                {transaction.memo}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right ml-4">
                            <p className={`text-lg font-semibold ${
                              getTransactionAmount(transaction) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(getTransactionAmount(transaction))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Finalize Button */}
            {currentReconciliation && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  onClick={handleFinalizeReconciliation}
                  disabled={loading || !balancesMatch()}
                  className={`w-full py-4 px-6 font-semibold rounded-lg text-white text-lg transition-all ${
                    balancesMatch()
                      ? 'bg-green-600 hover:bg-green-700 shadow-lg'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {balancesMatch() ? '✓ Finalize Reconciliation' : 'Balance Must Match to Finalize'}
                </button>
              </div>
            )}

            {/* Reconciliation History */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-xl font-semibold text-gray-900">
                  Reconciliation History
                </h2>
                <svg
                  className={`w-6 h-6 transform transition-transform ${showHistory ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showHistory && (
                <div className="mt-4 space-y-2">
                  {reconciliationHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No completed reconciliations yet
                    </p>
                  ) : (
                    reconciliationHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(rec.statement_date)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Status: <span className="capitalize">{rec.status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(rec.statement_balance)}
                          </p>
                          {rec.status === 'completed' && (
                            <p className="text-sm text-green-600">✓ Completed</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
