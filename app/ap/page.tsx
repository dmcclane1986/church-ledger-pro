'use client'

import { useState, useEffect } from 'react'
import {
  getBills,
  getTotalAmountOwed,
  getVendors,
  createBill,
  payBill,
  getBillById,
  getLiabilityAccounts,
  getExpenseAccounts,
  createVendor,
  getFunds,
} from '@/app/actions/ap_actions'
import { getCheckingAccounts } from '@/app/actions/transactions'

interface Bill {
  id: string
  description: string
  amount: number
  amount_paid: number
  due_date: string
  invoice_date: string
  status: string
  bill_number: string | null
  vendors: {
    id: string
    name: string
  }
  funds: {
    id: string
    name: string
  }
}

export default function AccountsPayablePage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [totalOwed, setTotalOwed] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Modals
  const [showPayModal, setShowPayModal] = useState(false)
  const [showCreateBillModal, setShowCreateBillModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  
  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load bills
      const billsResult = await getBills(statusFilter === 'all' ? undefined : statusFilter)
      if (billsResult.success && billsResult.data) {
        setBills(billsResult.data as any)
      } else {
        setError(billsResult.error || 'Failed to load bills')
      }

      // Load total owed
      const totalResult = await getTotalAmountOwed()
      if (totalResult.success) {
        setTotalOwed(totalResult.total)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePayClick = async (bill: Bill) => {
    const billDetails = await getBillById(bill.id)
    if (billDetails.success && billDetails.data) {
      setSelectedBill(billDetails.data)
      setShowPayModal(true)
    }
  }

  const getStatusColor = (bill: Bill) => {
    if (bill.status === 'paid') return 'bg-green-100 text-green-800'
    if (bill.status === 'cancelled') return 'bg-gray-100 text-gray-800'
    
    const today = new Date()
    const dueDate = new Date(bill.due_date)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) return 'bg-red-100 text-red-800' // Overdue
    if (daysUntilDue <= 7) return 'bg-yellow-100 text-yellow-800' // Due soon
    return 'bg-blue-100 text-blue-800' // Normal
  }

  const getStatusLabel = (bill: Bill) => {
    if (bill.status === 'paid') return 'Paid'
    if (bill.status === 'partial') return 'Partial'
    if (bill.status === 'cancelled') return 'Cancelled'
    
    const today = new Date()
    const dueDate = new Date(bill.due_date)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) return `Overdue (${Math.abs(daysUntilDue)} days)`
    if (daysUntilDue === 0) return 'Due Today'
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`
    return 'Unpaid'
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accounts Payable
          </h1>
          <p className="text-gray-600">
            Manage bills and vendor payments
          </p>
        </div>

        {/* Total Amount Owed Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow-lg p-8 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-100 text-sm mb-1">Total Amount Owed</p>
              <p className="text-5xl font-bold">{formatCurrency(totalOwed)}</p>
              <p className="text-red-100 text-sm mt-2">
                {bills.filter(b => b.status === 'unpaid' || b.status === 'partial').length} outstanding bills
              </p>
            </div>
            <button
              onClick={() => setShowCreateBillModal(true)}
              className="bg-white text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              + Record New Bill
            </button>
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

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { value: 'all', label: 'All Bills' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  statusFilter === tab.value
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bills ({bills.length})
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">No bills found</p>
              <p className="text-gray-500 text-sm mt-2">
                {statusFilter === 'all' ? 'Create your first bill to get started' : `No ${statusFilter} bills`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => {
                const remainingBalance = bill.amount - bill.amount_paid
                return (
                  <div
                    key={bill.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {bill.description}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {bill.vendors.name}
                              {bill.bill_number && ` • Bill #${bill.bill_number}`}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bill)}`}>
                            {getStatusLabel(bill)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Invoice Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(bill.invoice_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Due Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(bill.due_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(bill.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Amount Remaining</p>
                            <p className="text-sm font-bold text-red-600">
                              {formatCurrency(remainingBalance)}
                            </p>
                          </div>
                        </div>

                        {bill.status === 'partial' && (
                          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                            <p className="text-xs text-yellow-800">
                              <span className="font-semibold">Partial Payment:</span> {formatCurrency(bill.amount_paid)} paid of {formatCurrency(bill.amount)}
                            </p>
                          </div>
                        )}
                      </div>

                      {(bill.status === 'unpaid' || bill.status === 'partial') && (
                        <button
                          onClick={() => handlePayClick(bill)}
                          className="ml-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pay Bill Modal */}
        {showPayModal && selectedBill && (
          <PayBillModal
            bill={selectedBill}
            onClose={() => {
              setShowPayModal(false)
              setSelectedBill(null)
            }}
            onSuccess={(message) => {
              setSuccess(message)
              setShowPayModal(false)
              setSelectedBill(null)
              loadData()
              setTimeout(() => setSuccess(null), 5000)
            }}
            onError={(err) => {
              setError(err)
              setTimeout(() => setError(null), 5000)
            }}
          />
        )}

        {/* Create Bill Modal */}
        {showCreateBillModal && (
          <CreateBillModal
            onClose={() => setShowCreateBillModal(false)}
            onSuccess={(message) => {
              setSuccess(message)
              setShowCreateBillModal(false)
              loadData()
              setTimeout(() => setSuccess(null), 5000)
            }}
            onError={(err) => {
              setError(err)
              setTimeout(() => setError(null), 5000)
            }}
          />
        )}
      </div>
    </div>
  )
}

// Pay Bill Modal Component
function PayBillModal({ bill, onClose, onSuccess, onError }: any) {
  const [amount, setAmount] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('Check')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [liabilityAccounts, setLiabilityAccounts] = useState<any[]>([])

  useEffect(() => {
    loadAccounts()
    // Set default amount to remaining balance
    const remaining = bill.amount - bill.amount_paid
    setAmount(remaining.toFixed(2))
  }, [])

  const loadAccounts = async () => {
    const banks = await getCheckingAccounts()
    if (banks.success && banks.data) {
      setBankAccounts(banks.data)
      if (banks.data.length > 0) {
        setBankAccountId(banks.data[0].id)
      }
    }

    const liabilities = await getLiabilityAccounts()
    if (liabilities.success && liabilities.data) {
      setLiabilityAccounts(liabilities.data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await payBill({
      billId: bill.id,
      amount: parseFloat(amount),
      bankAccountId,
      fundId: bill.fund_id,
      liabilityAccountId: bill.liability_account_id,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
    })

    setLoading(false)

    if (result.success) {
      onSuccess(`Payment of $${amount} recorded successfully!`)
    } else {
      onError(result.error || 'Failed to record payment')
    }
  }

  const remainingBalance = bill.amount - bill.amount_paid

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pay Bill</h2>
              <p className="text-sm text-gray-600 mt-1">{bill.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Bill Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Vendor</p>
                <p className="font-medium">{bill.vendors.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Due Date</p>
                <p className="font-medium">{new Date(bill.due_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                <p className="font-medium">${bill.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Remaining Balance</p>
                <p className="font-bold text-red-600">${remainingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={remainingBalance}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: ${remainingBalance.toFixed(2)}
            </p>
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Account *
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select account...</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} - {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Check">Check</option>
              <option value="ACH">ACH</option>
              <option value="Wire">Wire Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number (Check #, etc.)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., Check #1234"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional payment notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Create Bill Modal Component
function CreateBillModal({ onClose, onSuccess, onError }: any) {
  const [loading, setLoading] = useState(false)
  const [showAddVendor, setShowAddVendor] = useState(false)
  
  // Form fields
  const [vendorId, setVendorId] = useState('')
  const [fundId, setFundId] = useState('')
  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [liabilityAccountId, setLiabilityAccountId] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [description, setDescription] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  
  // Dropdowns data
  const [vendors, setVendors] = useState<any[]>([])
  const [funds, setFunds] = useState<any[]>([])
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([])
  const [liabilityAccounts, setLiabilityAccounts] = useState<any[]>([])

  useEffect(() => {
    loadFormData()
    // Set due date to 30 days from invoice date by default
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    setDueDate(thirtyDaysLater.toISOString().split('T')[0])
  }, [])

  const loadFormData = async () => {
    // Load vendors
    const vendorsResult = await getVendors()
    if (vendorsResult.success && vendorsResult.data) {
      setVendors(vendorsResult.data)
    }

    // Load funds
    const fundsResult = await getFunds()
    if (fundsResult.success && fundsResult.data) {
      setFunds(fundsResult.data)
      if (fundsResult.data.length > 0) {
        setFundId(fundsResult.data[0].id)
      }
    }

    // Load expense accounts
    const expenseResult = await getExpenseAccounts()
    if (expenseResult.success && expenseResult.data) {
      setExpenseAccounts(expenseResult.data)
    }

    // Load liability accounts
    const liabilityResult = await getLiabilityAccounts()
    if (liabilityResult.success && liabilityResult.data) {
      setLiabilityAccounts(liabilityResult.data)
      // Auto-select Accounts Payable if it exists
      const apAccount = liabilityResult.data.find((acc: any) => 
        acc.name.toLowerCase().includes('payable')
      )
      if (apAccount) {
        setLiabilityAccountId(apAccount.id)
      } else if (liabilityResult.data.length > 0) {
        setLiabilityAccountId(liabilityResult.data[0].id)
      }
    }
  }

  const handleAddVendor = async (vendorData: any) => {
    const result = await createVendor(vendorData)
    if (result.success && result.vendorId) {
      // Reload vendors
      const vendorsResult = await getVendors()
      if (vendorsResult.success && vendorsResult.data) {
        setVendors(vendorsResult.data)
        setVendorId(result.vendorId)
      }
      setShowAddVendor(false)
    } else {
      onError(result.error || 'Failed to create vendor')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createBill({
      vendorId,
      fundId,
      expenseAccountId,
      liabilityAccountId,
      billNumber: billNumber || undefined,
      description,
      invoiceDate,
      dueDate,
      amount: parseFloat(amount),
      notes: notes || undefined,
    })

    setLoading(false)

    if (result.success) {
      onSuccess(`Bill created successfully! Bill ID: ${result.billId}`)
    } else {
      onError(result.error || 'Failed to create bill')
    }
  }

  // Calculate suggested due date when invoice date changes
  const handleInvoiceDateChange = (date: string) => {
    setInvoiceDate(date)
    if (date) {
      const invoiceDate = new Date(date)
      invoiceDate.setDate(invoiceDate.getDate() + 30)
      setDueDate(invoiceDate.toISOString().split('T')[0])
    }
  }

  if (showAddVendor) {
    return <AddVendorModal onClose={() => setShowAddVendor(false)} onAdd={handleAddVendor} />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Record New Bill</h2>
              <p className="text-sm text-gray-600 mt-1">Enter bill details to record expense and liability</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor *
            </label>
            <div className="flex space-x-2">
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select vendor...</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddVendor(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
              >
                + Add Vendor
              </button>
            </div>
          </div>

          {/* Fund Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fund *
            </label>
            <select
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select fund...</option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name} {fund.is_restricted ? '(Restricted)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Expense Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Account *
            </label>
            <select
              value={expenseAccountId}
              onChange={(e) => setExpenseAccountId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select expense account...</option>
              {expenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} - {account.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              What type of expense is this? (Utilities, Supplies, etc.)
            </p>
          </div>

          {/* Liability Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accounts Payable Account *
            </label>
            <select
              value={liabilityAccountId}
              onChange={(e) => setLiabilityAccountId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select A/P account...</option>
              {liabilityAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} - {account.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Usually "2100 - Accounts Payable"
            </p>
          </div>

          {/* Bill Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill/Invoice Number
            </label>
            <input
              type="text"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              placeholder="e.g., INV-12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., January Electric Bill"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => handleInvoiceDateChange(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                min={invoiceDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              min="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about this bill..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">This will create a journal entry:</p>
                <p className="font-mono text-xs">Debit: Expense Account (increases expense)</p>
                <p className="font-mono text-xs">Credit: Accounts Payable (increases liability)</p>
                <p className="mt-2 text-xs">No cash will be moved until you pay the bill.</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Record Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Vendor Modal Component
function AddVendorModal({ onClose, onAdd }: any) {
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await onAdd({
      name,
      contactName: contactName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      notes: notes || undefined,
    })

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Vendor</h2>
              <p className="text-sm text-gray-600 mt-1">Enter vendor information</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ABC Electric Company"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g., John Smith"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="billing@vendor.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-1234"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="123 Main St&#10;City, State 12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
