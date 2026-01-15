'use client'

import { useState, useEffect } from 'react'
import { 
  getAllAccounts, 
  createAccount, 
  updateAccount, 
  deleteAccount,
  toggleAccountStatus,
  type AccountWithUsage 
} from '@/app/actions/accounts'
import { Database } from '@/types/database.types'

type AccountType = Database['public']['Enums']['account_type']

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<AccountWithUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountWithUsage | null>(null)
  const [filterType, setFilterType] = useState<AccountType | 'All'>('All')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  // Form state
  const [formData, setFormData] = useState({
    account_number: '',
    name: '',
    account_type: 'Asset' as AccountType,
    description: '',
    is_active: true
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setLoading(true)
    setError(null)
    
    const result = await getAllAccounts()
    
    if (result.success && result.data) {
      setAccounts(result.data)
    } else {
      setError(result.error || 'Failed to load accounts')
    }
    
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      account_number: '',
      name: '',
      account_type: 'Asset',
      description: '',
      is_active: true
    })
    setShowAddForm(false)
    setEditingAccount(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const accountData = {
      account_number: parseInt(formData.account_number),
      name: formData.name.trim(),
      account_type: formData.account_type,
      description: formData.description.trim() || null,
      is_active: formData.is_active
    }

    let result
    if (editingAccount) {
      result = await updateAccount(editingAccount.id, accountData)
    } else {
      result = await createAccount(accountData)
    }

    if (result.success) {
      setSuccessMessage(editingAccount ? 'Account updated successfully' : 'Account created successfully')
      resetForm()
      await loadAccounts()
    } else {
      setError(result.error || 'Failed to save account')
    }
  }

  const handleEdit = (account: AccountWithUsage) => {
    setEditingAccount(account)
    setFormData({
      account_number: account.account_number.toString(),
      name: account.name,
      account_type: account.account_type,
      description: account.description || '',
      is_active: account.is_active
    })
    setShowAddForm(true)
    // Scroll to top to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (account: AccountWithUsage) => {
    if (!account.can_delete) {
      setError('Cannot delete account that has been used in transactions')
      return
    }

    if (!confirm(`Are you sure you want to delete account "${account.name}"? This action cannot be undone.`)) {
      return
    }

    setError(null)
    setSuccessMessage(null)

    const result = await deleteAccount(account.id)

    if (result.success) {
      setSuccessMessage('Account deleted successfully')
      await loadAccounts()
    } else {
      setError(result.error || 'Failed to delete account')
    }
  }

  const handleToggleStatus = async (account: AccountWithUsage) => {
    const newStatus = !account.is_active
    const result = await toggleAccountStatus(account.id, newStatus)

    if (result.success) {
      setSuccessMessage(`Account ${newStatus ? 'activated' : 'deactivated'} successfully`)
      await loadAccounts()
    } else {
      setError(result.error || 'Failed to update account status')
    }
  }

  const getAccountTypeBadgeColor = (type: AccountType) => {
    switch (type) {
      case 'Asset':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Liability':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Equity':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Income':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Expense':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredAccounts = accounts.filter(account => {
    if (filterType !== 'All' && account.account_type !== filterType) return false
    if (filterActive === 'active' && !account.is_active) return false
    if (filterActive === 'inactive' && account.is_active) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your chart of accounts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAccounts}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : '+ Add Account'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-md bg-green-50 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingAccount ? 'Edit Account' : 'Add New Account'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="number"
                  required
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type *
                </label>
                <select
                  required
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value as AccountType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cash - Checking"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingAccount ? 'Update Account' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account Type Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Account Types:</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm text-blue-800">
          <div><strong>Asset:</strong> Cash, inventory, equipment</div>
          <div><strong>Liability:</strong> Loans, payables</div>
          <div><strong>Equity:</strong> Net assets, retained earnings</div>
          <div><strong>Income:</strong> Tithes, offerings, donations</div>
          <div><strong>Expense:</strong> Utilities, salaries, supplies</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AccountType | 'All')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Types</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No accounts found
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.account_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{account.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAccountTypeBadgeColor(account.account_type)}`}>
                      {account.account_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {account.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(account)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        account.is_active 
                          ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.transaction_count} transactions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button
                      onClick={() => handleEdit(account)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Edit
                    </button>
                    {account.can_delete && (
                      <button
                        onClick={() => handleDelete(account)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Accounts</div>
          <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Assets</div>
          <div className="text-2xl font-bold text-green-600">
            {accounts.filter(a => a.account_type === 'Asset').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Liabilities</div>
          <div className="text-2xl font-bold text-red-600">
            {accounts.filter(a => a.account_type === 'Liability').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Income</div>
          <div className="text-2xl font-bold text-blue-600">
            {accounts.filter(a => a.account_type === 'Income').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Expenses</div>
          <div className="text-2xl font-bold text-orange-600">
            {accounts.filter(a => a.account_type === 'Expense').length}
          </div>
        </div>
      </div>
    </div>
  )
}
