'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { recordExpense } from '@/app/actions/transactions'
import { checkDuplicateTransaction } from '@/app/actions/transactions'
import type { Database } from '@/types/database.types'

type Fund = Database['public']['Tables']['funds']['Row']
type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface BankStatementImporterProps {
  funds: Fund[]
  expenseAccounts: Account[]
  checkingAccount: Account
}

interface ParsedTransaction {
  id: string
  accountName: string
  date: string
  description: string
  checkNumber: string
  creditOrDebit: string
  amount: number
  fundId: string
  expenseAccountId: string
  isProcessing: boolean
  error?: string
  isDuplicate?: boolean
}

interface CSVColumnMapping {
  accountName: string
  date: string
  description: string
  checkNumber: string
  creditOrDebit: string
  amount: string
}

export default function BankStatementImporter({
  funds,
  expenseAccounts,
  checkingAccount,
}: BankStatementImporterProps) {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<any[]>([])
  const [columnMapping, setColumnMapping] = useState<CSVColumnMapping>({
    accountName: '',
    date: '',
    description: '',
    checkNumber: '',
    creditOrDebit: '',
    amount: '',
  })
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'staging'>('upload')

  const handleFileUpload = (file: File) => {
    setUploadError(null)

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file')
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0] as object)
          setCsvHeaders(headers)
          setRawData(results.data)
          setStep('mapping')
        } else {
          setUploadError('CSV file is empty or invalid')
        }
      },
      error: (error) => {
        setUploadError(`Error parsing CSV: ${error.message}`)
      },
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleMappingComplete = () => {
    if (!columnMapping.accountName || !columnMapping.date || !columnMapping.description || 
        !columnMapping.checkNumber || !columnMapping.creditOrDebit || !columnMapping.amount) {
      setUploadError('Please map all required columns')
      return
    }

    const parsedTransactions: ParsedTransaction[] = rawData.map((row, index) => {
      const accountNameValue = row[columnMapping.accountName]
      const dateValue = row[columnMapping.date]
      const descriptionValue = row[columnMapping.description]
      const checkNumberValue = row[columnMapping.checkNumber]
      const creditOrDebitValue = row[columnMapping.creditOrDebit]
      const amountValue = row[columnMapping.amount]

      // Parse amount (handle negative values, commas, etc.)
      let amount = 0
      if (typeof amountValue === 'string') {
        amount = Math.abs(parseFloat(amountValue.replace(/[,$]/g, '')))
      } else {
        amount = Math.abs(parseFloat(amountValue))
      }

      // Parse date
      let date = ''
      if (dateValue) {
        const parsedDate = new Date(dateValue)
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split('T')[0]
        }
      }

      // Determine if this is a debit (expense) or credit (we'll skip credits for now)
      const isDebit = creditOrDebitValue && 
        (creditOrDebitValue.toString().toLowerCase().includes('debit') || 
         creditOrDebitValue.toString().toLowerCase().includes('dr'))

      return {
        id: `${index}-${Date.now()}`,
        accountName: accountNameValue || '',
        date,
        description: descriptionValue || '',
        checkNumber: checkNumberValue || '',
        creditOrDebit: creditOrDebitValue || '',
        amount: isNaN(amount) ? 0 : amount,
        fundId: funds[0]?.id || '',
        expenseAccountId: expenseAccounts[0]?.id || '',
        isProcessing: false,
      }
    }).filter(t => {
      // Only include debits (expenses) with valid data
      const isDebit = t.creditOrDebit && 
        (t.creditOrDebit.toLowerCase().includes('debit') || 
         t.creditOrDebit.toLowerCase().includes('dr'))
      return isDebit && t.amount > 0 && t.date && t.description
    })

    setTransactions(parsedTransactions)
    setStep('staging')
  }

  const handleProcessTransaction = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (!transaction) return

    // Set processing state
    setTransactions(prev =>
      prev.map(t => (t.id === transactionId ? { ...t, isProcessing: true, error: undefined } : t))
    )

    try {
      // Check for duplicates
      const duplicateCheck = await checkDuplicateTransaction(
        transaction.date,
        transaction.amount,
        transaction.description
      )

      if (duplicateCheck.isDuplicate) {
        setTransactions(prev =>
          prev.map(t =>
            t.id === transactionId
              ? { ...t, isProcessing: false, error: 'Duplicate transaction detected', isDuplicate: true }
              : t
          )
        )
        return
      }

      // Process the transaction
      const result = await recordExpense({
        date: transaction.date,
        fundId: transaction.fundId,
        expenseAccountId: transaction.expenseAccountId,
        amount: transaction.amount,
        checkingAccountId: checkingAccount.id,
        description: transaction.description,
        referenceNumber: transaction.checkNumber || undefined,
      })

      if (result.success) {
        // Remove the transaction from the list (inbox-style)
        setTransactions(prev => prev.filter(t => t.id !== transactionId))
      } else {
        setTransactions(prev =>
          prev.map(t =>
            t.id === transactionId
              ? { ...t, isProcessing: false, error: result.error || 'Failed to process' }
              : t
          )
        )
      }
    } catch (error) {
      setTransactions(prev =>
        prev.map(t =>
          t.id === transactionId
            ? { ...t, isProcessing: false, error: 'An unexpected error occurred' }
            : t
        )
      )
    }
  }

  const handleUpdateTransaction = (transactionId: string, field: keyof ParsedTransaction, value: any) => {
    setTransactions(prev =>
      prev.map(t => (t.id === transactionId ? { ...t, [field]: value } : t))
    )
  }

  const handleReset = () => {
    setCsvHeaders([])
    setRawData([])
    setColumnMapping({ 
      accountName: '', 
      date: '', 
      description: '', 
      checkNumber: '', 
      creditOrDebit: '', 
      amount: '' 
    })
    setTransactions([])
    setUploadError(null)
    setStep('upload')
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Upload CSV */}
      {step === 'upload' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Upload CSV File</h2>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-12 text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="space-y-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-gray-600">
                <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                  Click to upload
                </label>
                {' '}or drag and drop
              </div>
              <p className="text-xs text-gray-500">CSV files only</p>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </div>
          {uploadError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 'mapping' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Map CSV Columns</h2>
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Map your CSV columns to the required fields
            </p>

            {/* Account Name Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.accountName}
                onChange={(e) => setColumnMapping({ ...columnMapping, accountName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Processed Date Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.date}
                onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.description}
                onChange={(e) => setColumnMapping({ ...columnMapping, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Check Number Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Number Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.checkNumber}
                onChange={(e) => setColumnMapping({ ...columnMapping, checkNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Credit or Debit Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit or Debit Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.creditOrDebit}
                onChange={(e) => setColumnMapping({ ...columnMapping, creditOrDebit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.amount}
                onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            {columnMapping.accountName && columnMapping.date && columnMapping.description && 
             columnMapping.checkNumber && columnMapping.creditOrDebit && columnMapping.amount && 
             rawData.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (first row):</h3>
                <div className="bg-white rounded border border-gray-200 p-3 text-sm space-y-1">
                  <p><strong>Account Name:</strong> {rawData[0][columnMapping.accountName]}</p>
                  <p><strong>Processed Date:</strong> {rawData[0][columnMapping.date]}</p>
                  <p><strong>Description:</strong> {rawData[0][columnMapping.description]}</p>
                  <p><strong>Check Number:</strong> {rawData[0][columnMapping.checkNumber]}</p>
                  <p><strong>Credit or Debit:</strong> {rawData[0][columnMapping.creditOrDebit]}</p>
                  <p><strong>Amount:</strong> {rawData[0][columnMapping.amount]}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMappingComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Continue to Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Process Transactions */}
      {step === 'staging' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Step 3: Review & Process Transactions</h2>
              <p className="text-sm text-gray-600 mt-1">
                {transactions.length} transaction(s) ready to process
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Start Over
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-green-500 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-green-900 mb-1">All Done!</h3>
              <p className="text-sm text-green-700 mb-4">All transactions have been processed.</p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Import Another File
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`bg-white border rounded-lg p-4 ${
                    transaction.isDuplicate ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Transaction Info */}
                    <div className="md:col-span-5">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-gray-600 mt-1">
                          {transaction.date} • ${transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {transaction.accountName}
                          {transaction.checkNumber && ` • Check #${transaction.checkNumber}`}
                        </p>
                      </div>
                    </div>

                    {/* Fund Selector */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fund</label>
                      <select
                        value={transaction.fundId}
                        onChange={(e) => handleUpdateTransaction(transaction.id, 'fundId', e.target.value)}
                        disabled={transaction.isProcessing}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {funds.map((fund) => (
                          <option key={fund.id} value={fund.id}>
                            {fund.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expense Account Selector */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Expense Account</label>
                      <select
                        value={transaction.expenseAccountId}
                        onChange={(e) =>
                          handleUpdateTransaction(transaction.id, 'expenseAccountId', e.target.value)
                        }
                        disabled={transaction.isProcessing}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {expenseAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_number} - {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Process Button */}
                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => handleProcessTransaction(transaction.id)}
                        disabled={transaction.isProcessing || transaction.isDuplicate}
                        className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {transaction.isProcessing ? '...' : 'Process'}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {transaction.error && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-700">{transaction.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
