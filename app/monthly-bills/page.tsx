'use client'

import { useState, useEffect } from 'react'
import {
  getMonthlyBills,
  createMonthlyBill,
  updateMonthlyBill,
  toggleBillCheck,
  deleteMonthlyBill,
  copyBillsFromMonth,
  getRecurringBillTemplates,
  createRecurringTemplate,
  generateBillsFromTemplates,
} from '@/app/actions/monthly_bills'
import { getTodayLocalDate } from '@/lib/utils/date'

interface MonthlyBill {
  id: string
  month_year: string
  bill_name: string
  due_date: string
  amount: number | null
  is_checked: boolean
  recurring_template_id: string | null
  created_at: string
  updated_at: string
}

interface RecurringTemplate {
  id: string
  bill_name: string
  due_date_day: number
  amount: number | null
  is_active: boolean
}

export default function MonthlyBillsPage() {
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Month selector - default to current month
  const currentDate = new Date()
  const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear)
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null)
  
  // Recurring templates
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([])

  useEffect(() => {
    loadBills()
    loadRecurringTemplates()
  }, [selectedMonthYear])

  const loadBills = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getMonthlyBills(selectedMonthYear)
      if (result.success && result.data) {
        setBills(result.data as MonthlyBill[])
      } else {
        setError(result.error || 'Failed to load bills')
      }
    } catch (err) {
      console.error('Error loading bills:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadRecurringTemplates = async () => {
    try {
      const result = await getRecurringBillTemplates()
      if (result.success && result.data) {
        setRecurringTemplates(result.data as RecurringTemplate[])
      }
    } catch (err) {
      console.error('Error loading recurring templates:', err)
    }
  }

  const handleCheckToggle = async (billId: string, currentStatus: boolean) => {
    const result = await toggleBillCheck(billId, !currentStatus)
    if (result.success) {
      await loadBills()
      setSuccess('Bill status updated')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to update bill status')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDelete = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) {
      return
    }

    const result = await deleteMonthlyBill(billId)
    if (result.success) {
      await loadBills()
      setSuccess('Bill deleted successfully')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to delete bill')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleGenerateFromTemplates = async () => {
    if (!confirm('This will generate bills from all active recurring templates. Continue?')) {
      return
    }

    const result = await generateBillsFromTemplates(selectedMonthYear)
    if (result.success) {
      await loadBills()
      setSuccess(`Generated ${result.count} bills from templates`)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to generate bills')
      setTimeout(() => setError(null), 5000)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatDate = (dateString: string) => {
    // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
    // PostgreSQL DATE types come as "YYYY-MM-DD" strings, which new Date() 
    // interprets as UTC midnight, causing date shifts
    const parts = dateString.split('T')[0].split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1 // JavaScript months are 0-indexed
      const day = parseInt(parts[2], 10)
      return new Date(year, month, day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    // Fallback to original if parsing fails
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Generate month options (current month and 12 months before/after)
  const generateMonthOptions = () => {
    const options = []
    const current = new Date()
    for (let i = -12; i <= 12; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    return options
  }

  const monthOptions = generateMonthOptions()

  // Get statistics
  const totalBills = bills.length
  const checkedBills = bills.filter(b => b.is_checked).length
  const uncheckedBills = totalBills - checkedBills
  const totalAmount = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
  const totalAmountPending = bills
    .filter(b => !b.is_checked)
    .reduce((sum, bill) => sum + (bill.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monthly Bills Checklist
          </h1>
          <p className="text-gray-600">
            Track and manage your monthly bills
          </p>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                View Month:
              </label>
              <select
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                + Add Bill
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Copy from Month
              </button>
              <button
                onClick={handleGenerateFromTemplates}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                disabled={recurringTemplates.length === 0}
              >
                Generate from Templates
              </button>
              <button
                onClick={() => setShowRecurringModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Manage Templates
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Total Bills</p>
            <p className="text-2xl font-bold text-gray-900">{totalBills}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{uncheckedBills}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">{checkedBills}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Total Amount Pending</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalAmountPending)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
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

        {/* Bills List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading bills...</div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-4">No bills found for {formatMonthYear(selectedMonthYear)}</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first bill
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    bill.is_checked ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={bill.is_checked}
                        onChange={() => handleCheckToggle(bill.id, bill.is_checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-lg font-medium ${
                            bill.is_checked ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {bill.bill_name}
                          </h3>
                          {bill.recurring_template_id && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              Recurring
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Due: {formatDate(bill.due_date)}</span>
                          {bill.amount !== null && (
                            <span className="font-medium">{formatCurrency(bill.amount)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedBill(bill)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="text-red-600 hover:text-red-700 px-3 py-1 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <AddBillModal
          monthYear={selectedMonthYear}
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            setShowAddModal(false)
            await loadBills()
            setSuccess('Bill added successfully')
            setTimeout(() => setSuccess(null), 3000)
          }}
          onError={(err) => {
            setError(err)
            setTimeout(() => setError(null), 5000)
          }}
        />
      )}

      {/* Edit Bill Modal */}
      {showEditModal && selectedBill && (
        <EditBillModal
          bill={selectedBill}
          onClose={() => {
            setShowEditModal(false)
            setSelectedBill(null)
          }}
          onSuccess={async () => {
            setShowEditModal(false)
            setSelectedBill(null)
            await loadBills()
            setSuccess('Bill updated successfully')
            setTimeout(() => setSuccess(null), 3000)
          }}
          onError={(err) => {
            setError(err)
            setTimeout(() => setError(null), 5000)
          }}
        />
      )}

      {/* Copy from Month Modal */}
      {showCopyModal && (
        <CopyBillsModal
          targetMonthYear={selectedMonthYear}
          onClose={() => setShowCopyModal(false)}
          onSuccess={async () => {
            setShowCopyModal(false)
            await loadBills()
            setSuccess('Bills copied successfully')
            setTimeout(() => setSuccess(null), 3000)
          }}
          onError={(err) => {
            setError(err)
            setTimeout(() => setError(null), 5000)
          }}
        />
      )}

      {/* Recurring Templates Modal */}
      {showRecurringModal && (
        <RecurringTemplatesModal
          templates={recurringTemplates}
          onClose={() => {
            setShowRecurringModal(false)
            loadRecurringTemplates()
          }}
          onSuccess={async () => {
            await loadRecurringTemplates()
            setSuccess('Template updated successfully')
            setTimeout(() => setSuccess(null), 3000)
          }}
          onError={(err) => {
            setError(err)
            setTimeout(() => setError(null), 5000)
          }}
        />
      )}
    </div>
  )
}

// Add Bill Modal Component
function AddBillModal({
  monthYear,
  onClose,
  onSuccess,
  onError,
}: {
  monthYear: string
  onClose: () => void
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const [billName, setBillName] = useState('')
  const [dueDate, setDueDate] = useState(getTodayLocalDate())
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createMonthlyBill({
      monthYear,
      billName,
      dueDate,
      amount: amount ? parseFloat(amount) : undefined,
    })

    setLoading(false)

    if (result.success) {
      onSuccess()
    } else {
      onError(result.error || 'Failed to create bill')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Bill</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Bill Modal Component
function EditBillModal({
  bill,
  onClose,
  onSuccess,
  onError,
}: {
  bill: MonthlyBill
  onClose: () => void
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const [billName, setBillName] = useState(bill.bill_name)
  // Format date from database (handle ISO strings with time component)
  const formatDateForInput = (dateStr: string) => {
    return dateStr.split('T')[0]
  }
  const [dueDate, setDueDate] = useState(formatDateForInput(bill.due_date))
  const [amount, setAmount] = useState(bill.amount?.toString() || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateMonthlyBill({
      id: bill.id,
      billName,
      dueDate,
      amount: amount ? parseFloat(amount) : undefined,
    })

    setLoading(false)

    if (result.success) {
      onSuccess()
    } else {
      onError(result.error || 'Failed to update bill')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Bill</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Copy Bills Modal Component
function CopyBillsModal({
  targetMonthYear,
  onClose,
  onSuccess,
  onError,
}: {
  targetMonthYear: string
  onClose: () => void
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const [sourceMonthYear, setSourceMonthYear] = useState('')
  const [loading, setLoading] = useState(false)

  // Generate month options
  const generateMonthOptions = () => {
    const options = []
    const current = new Date()
    for (let i = -24; i <= 0; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    return options.reverse()
  }

  const monthOptions = generateMonthOptions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await copyBillsFromMonth(sourceMonthYear, targetMonthYear)
    setLoading(false)

    if (result.success) {
      onSuccess()
    } else {
      onError(result.error || 'Failed to copy bills')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Copy Bills from Month</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Copy From Month <span className="text-red-500">*</span>
            </label>
            <select
              value={sourceMonthYear}
              onChange={(e) => setSourceMonthYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a month...</option>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p>This will copy all bills from the selected month to the current month ({targetMonthYear}).</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !sourceMonthYear}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Copying...' : 'Copy Bills'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Recurring Templates Modal Component
function RecurringTemplatesModal({
  templates,
  onClose,
  onSuccess,
  onError,
}: {
  templates: RecurringTemplate[]
  onClose: () => void
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [billName, setBillName] = useState('')
  const [dueDateDay, setDueDateDay] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createRecurringTemplate({
      billName,
      dueDateDay: parseInt(dueDateDay),
      amount: amount ? parseFloat(amount) : undefined,
    })

    setLoading(false)

    if (result.success) {
      setBillName('')
      setDueDateDay('')
      setAmount('')
      setShowAddTemplate(false)
      onSuccess()
    } else {
      onError(result.error || 'Failed to create template')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recurring Bill Templates</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showAddTemplate ? (
          <>
            <div className="mb-4">
              <button
                onClick={() => setShowAddTemplate(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                + Add Template
              </button>
            </div>
            {templates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recurring templates found. Create one to auto-generate bills each month.</p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{template.bill_name}</h3>
                        <p className="text-sm text-gray-600">
                          Due on day {template.due_date_day} of each month
                          {template.amount && ` • ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(template.amount)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleAddTemplate} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Recurring Template</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date Day (1-31) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDateDay}
                onChange={(e) => setDueDateDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddTemplate(false)
                  setBillName('')
                  setDueDateDay('')
                  setAmount('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
