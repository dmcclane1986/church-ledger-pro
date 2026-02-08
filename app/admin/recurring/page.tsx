'use client'

import { useState, useEffect } from 'react'
import {
  getRecurringTemplates,
  processRecurringTransactions,
  toggleTemplateActive,
  deleteRecurringTemplate,
  getDueRecurringCount,
  getRecurringHistory,
  createRecurringTemplate,
  getAccounts,
  getFunds,
} from '@/app/actions/recurring'
import { getTodayLocalDate } from '@/lib/utils/date'

interface Template {
  id: string
  template_name: string
  description: string
  frequency: string
  start_date: string
  end_date: string | null
  last_run_date: string | null
  next_run_date: string
  amount: number
  is_active: boolean
  funds: {
    name: string
  }
  recurring_template_lines: Array<{
    id: string
    debit: number
    credit: number
    memo: string | null
    chart_of_accounts: {
      account_number: number
      name: string
    }
  }>
}

export default function RecurringTransactionsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [dueCount, setDueCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  
  // Create template modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [funds, setFunds] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [showInactive])

  useEffect(() => {
    loadAccountsAndFunds()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load templates
      const templatesResult = await getRecurringTemplates(showInactive)
      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data as any)
      } else {
        setError(templatesResult.error || 'Failed to load templates')
      }

      // Load due count
      const countResult = await getDueRecurringCount()
      if (countResult.success) {
        setDueCount(countResult.count)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadAccountsAndFunds = async () => {
    const [accountsResult, fundsResult] = await Promise.all([
      getAccounts(),
      getFunds(),
    ])

    if (accountsResult.success && accountsResult.data) {
      setAccounts(accountsResult.data)
    }

    if (fundsResult.success && fundsResult.data) {
      setFunds(fundsResult.data)
    }
  }

  const loadHistory = async () => {
    const historyResult = await getRecurringHistory(undefined, 100)
    if (historyResult.success && historyResult.data) {
      setHistory(historyResult.data)
    }
  }

  const handleProcessNow = async () => {
    if (!confirm(`Process ${dueCount} due recurring transaction(s) now?`)) {
      return
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)

    const result = await processRecurringTransactions()

    setProcessing(false)

    if (result.success) {
      setSuccess(result.message || 'Recurring transactions processed successfully!')
      await loadData()
      setTimeout(() => setSuccess(null), 5000)
    } else {
      setError(result.error || 'Failed to process recurring transactions')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleToggleActive = async (templateId: string, currentStatus: boolean) => {
    const result = await toggleTemplateActive(templateId, !currentStatus)

    if (result.success) {
      setSuccess(`Template ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
      await loadData()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to update template')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Delete template "${templateName}"? This cannot be undone.`)) {
      return
    }

    const result = await deleteRecurringTemplate(templateId)

    if (result.success) {
      setSuccess('Template deleted successfully!')
      await loadData()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to delete template')
      setTimeout(() => setError(null), 3000)
    }
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

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      semiannually: 'Semi-annually',
      yearly: 'Yearly',
    }
    return labels[freq] || freq
  }

  const getDaysUntilNext = (nextDate: string) => {
    const today = new Date()
    const next = new Date(nextDate)
    const diffTime = next.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (template: Template) => {
    if (!template.is_active) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
    }

    const daysUntil = getDaysUntilNext(template.next_run_date)
    
    if (daysUntil < 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>
    }
    if (daysUntil === 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Due Today</span>
    }
    if (daysUntil <= 7) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Due Soon</span>
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recurring Transactions
          </h1>
          <p className="text-gray-600">
            Automate regular transactions with scheduled templates
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Due Transactions Card */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm mb-1">Due Now</p>
                <p className="text-4xl font-bold">{dueCount}</p>
                <p className="text-orange-100 text-sm mt-2">
                  {dueCount === 1 ? 'transaction' : 'transactions'}
                </p>
              </div>
              <svg className="w-16 h-16 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <button
              onClick={handleProcessNow}
              disabled={processing || dueCount === 0}
              className="mt-4 w-full bg-white text-orange-700 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : 'Process Now'}
            </button>
          </div>

          {/* Active Templates Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Active Templates</p>
                <p className="text-4xl font-bold">
                  {templates.filter(t => t.is_active).length}
                </p>
                <p className="text-blue-100 text-sm mt-2">
                  scheduled
                </p>
              </div>
              <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          {/* Total Templates Card */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Total Templates</p>
                <p className="text-4xl font-bold">{templates.length}</p>
                <p className="text-green-100 text-sm mt-2">
                  configured
                </p>
              </div>
              <svg className="w-16 h-16 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
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

        {/* Filter Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show inactive templates</span>
            </label>
          </div>
          <button
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory) loadHistory()
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Execution History
            </h2>
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No execution history yet</p>
            ) : (
              <div className="space-y-2">
                {history.map((record: any) => (
                  <div key={record.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{record.recurring_templates?.template_name}</p>
                      <p className="text-sm text-gray-600">{formatDate(record.executed_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(record.amount)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.status === 'success' ? 'bg-green-100 text-green-800' :
                        record.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Templates List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Templates ({templates.length})
            </h2>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Template
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-600 text-lg">No recurring templates found</p>
              <p className="text-gray-500 text-sm mt-2">
                Create your first template to automate regular transactions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => {
                const daysUntil = getDaysUntilNext(template.next_run_date)
                return (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {template.template_name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(template)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Frequency</p>
                            <p className="text-sm font-medium text-gray-900">
                              {getFrequencyLabel(template.frequency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Amount</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(template.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Next Run</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(template.next_run_date)}
                            </p>
                            {template.is_active && (
                              <p className="text-xs text-gray-500">
                                {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                                 daysUntil === 0 ? 'Today' :
                                 `in ${daysUntil} days`}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Fund</p>
                            <p className="text-sm font-medium text-gray-900">
                              {template.funds.name}
                            </p>
                          </div>
                        </div>

                        {/* Ledger Lines Preview */}
                        <div className="mt-4 bg-gray-50 rounded p-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">Ledger Lines:</p>
                          <div className="space-y-1">
                            {template.recurring_template_lines.map((line: any) => (
                              <div key={line.id} className="flex justify-between text-xs">
                                <span className="text-gray-600">
                                  {line.chart_of_accounts.account_number} - {line.chart_of_accounts.name}
                                </span>
                                <span className="font-mono">
                                  {line.debit > 0 ? `Dr ${formatCurrency(line.debit)}` : `Cr ${formatCurrency(line.credit)}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => handleToggleActive(template.id, template.is_active)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                            template.is_active
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {template.is_active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(template.id, template.template_name)}
                          className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Create Template Modal */}
        {showCreateModal && (
          <CreateTemplateModal
            accounts={accounts}
            funds={funds}
            onClose={() => setShowCreateModal(false)}
            onCreate={async (templateData) => {
              setCreating(true)
              setError(null)
              setSuccess(null)

              const result = await createRecurringTemplate(templateData)

              setCreating(false)

              if (result.success) {
                setSuccess('Template created successfully!')
                setShowCreateModal(false)
                await loadData()
                setTimeout(() => setSuccess(null), 5000)
              } else {
                setError(result.error || 'Failed to create template')
                setTimeout(() => setError(null), 5000)
              }
            }}
            creating={creating}
          />
        )}
      </div>
    </div>
  )
}

// Create Template Modal Component
interface CreateTemplateModalProps {
  accounts: any[]
  funds: any[]
  onClose: () => void
  onCreate: (data: any) => Promise<void>
  creating: boolean
}

function CreateTemplateModal({ accounts, funds, onClose, onCreate, creating }: CreateTemplateModalProps) {
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(getTodayLocalDate())
  const [endDate, setEndDate] = useState('')
  const [fundId, setFundId] = useState('')
  const [referencePrefix, setReferencePrefix] = useState('')
  const [notes, setNotes] = useState('')
  const [ledgerLines, setLedgerLines] = useState<Array<{
    accountId: string
    debit: number
    credit: number
    memo: string
  }>>([
    { accountId: '', debit: 0, credit: 0, memo: '' },
    { accountId: '', debit: 0, credit: 0, memo: '' },
  ])

  const addLedgerLine = () => {
    setLedgerLines([...ledgerLines, { accountId: '', debit: 0, credit: 0, memo: '' }])
  }

  const removeLedgerLine = (index: number) => {
    if (ledgerLines.length > 2) {
      setLedgerLines(ledgerLines.filter((_, i) => i !== index))
    }
  }

  const updateLedgerLine = (index: number, field: string, value: any) => {
    const updated = [...ledgerLines]
    updated[index] = { ...updated[index], [field]: value }
    setLedgerLines(updated)
  }

  const calculateTotals = () => {
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    return { totalDebits, totalCredits, isBalanced: Math.abs(totalDebits - totalCredits) < 0.01 }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { totalDebits, totalCredits, isBalanced } = calculateTotals()

    if (!isBalanced) {
      alert(`Ledger lines must be balanced!\nTotal Debits: $${totalDebits.toFixed(2)}\nTotal Credits: $${totalCredits.toFixed(2)}`)
      return
    }

    const amount = totalDebits

    await onCreate({
      templateName,
      description,
      frequency,
      startDate,
      endDate: endDate || undefined,
      fundId,
      amount,
      referenceNumberPrefix: referencePrefix || undefined,
      notes: notes || undefined,
      ledgerLines: ledgerLines.map(line => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        memo: line.memo || undefined,
      })),
    })
  }

  const { totalDebits, totalCredits, isBalanced } = calculateTotals()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Recurring Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={creating}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Monthly Rent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semiannually">Semi-annually</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Office rent payment to ABC Properties"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fund <span className="text-red-500">*</span>
              </label>
              <select
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Fund</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name} {fund.is_restricted && '(Restricted)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number Prefix (Optional)
              </label>
              <input
                type="text"
                value={referencePrefix}
                onChange={(e) => setReferencePrefix(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., RENT-"
              />
              <p className="text-xs text-gray-500 mt-1">Will generate: RENT-2026-02</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Internal notes"
              />
            </div>
          </div>

          {/* Ledger Lines */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ledger Lines</h3>
              <button
                type="button"
                onClick={addLedgerLine}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                + Add Line
              </button>
            </div>

            <div className="space-y-3">
              {ledgerLines.map((line, index) => (
                <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={line.accountId}
                      onChange={(e) => updateLedgerLine(index, 'accountId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_number} - {account.name} ({account.account_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit || ''}
                      onChange={(e) => updateLedgerLine(index, 'debit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Debit"
                    />
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit || ''}
                      onChange={(e) => updateLedgerLine(index, 'credit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Credit"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={line.memo}
                      onChange={(e) => updateLedgerLine(index, 'memo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Memo (optional)"
                    />
                  </div>

                  {ledgerLines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeLedgerLine(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Balance Summary */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Total Debits:</span> ${totalDebits.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Total Credits:</span> ${totalCredits.toFixed(2)}
                  </p>
                </div>
                <div>
                  {isBalanced ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      ✓ Balanced
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      ✗ Not Balanced (Difference: ${Math.abs(totalDebits - totalCredits).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !isBalanced}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
