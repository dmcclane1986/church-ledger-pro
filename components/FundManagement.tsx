'use client'

import { useState, useEffect } from 'react'
import { 
  getAllFunds, 
  createFund, 
  updateFund, 
  deleteFund,
  type FundWithUsage 
} from '@/app/actions/funds'

export default function FundManagement() {
  const [funds, setFunds] = useState<FundWithUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingFund, setEditingFund] = useState<FundWithUsage | null>(null)
  const [filterRestricted, setFilterRestricted] = useState<'all' | 'restricted' | 'unrestricted'>('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_restricted: false
  })

  useEffect(() => {
    loadFunds()
  }, [])

  const loadFunds = async () => {
    setLoading(true)
    setError(null)
    
    const result = await getAllFunds()
    
    if (result.success && result.data) {
      setFunds(result.data)
    } else {
      setError(result.error || 'Failed to load funds')
    }
    
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_restricted: false
    })
    setShowAddForm(false)
    setEditingFund(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const fundData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      is_restricted: formData.is_restricted
    }

    let result
    if (editingFund) {
      result = await updateFund(editingFund.id, fundData)
    } else {
      result = await createFund(fundData)
    }

    if (result.success) {
      setSuccessMessage(editingFund ? 'Fund updated successfully' : 'Fund created successfully')
      resetForm()
      await loadFunds()
    } else {
      setError(result.error || 'Failed to save fund')
    }
  }

  const handleEdit = (fund: FundWithUsage) => {
    setEditingFund(fund)
    setFormData({
      name: fund.name,
      description: fund.description || '',
      is_restricted: fund.is_restricted
    })
    setShowAddForm(true)
    // Scroll to top to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (fund: FundWithUsage) => {
    if (!fund.can_delete) {
      setError('Cannot delete fund that has been used in transactions')
      return
    }

    if (!confirm(`Are you sure you want to delete fund "${fund.name}"? This action cannot be undone.`)) {
      return
    }

    setError(null)
    setSuccessMessage(null)

    const result = await deleteFund(fund.id)

    if (result.success) {
      setSuccessMessage('Fund deleted successfully')
      await loadFunds()
    } else {
      setError(result.error || 'Failed to delete fund')
    }
  }

  const filteredFunds = funds.filter(fund => {
    if (filterRestricted === 'restricted' && !fund.is_restricted) return false
    if (filterRestricted === 'unrestricted' && fund.is_restricted) return false
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
          <h2 className="text-2xl font-bold text-gray-900">Fund Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage funds for tracking restricted and unrestricted donations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadFunds}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : '+ Add Fund'}
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
            {editingFund ? 'Edit Fund' : 'Add New Fund'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fund Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="General Fund"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description of the fund's purpose"
              />
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="is_restricted"
                  checked={formData.is_restricted}
                  onChange={(e) => setFormData({ ...formData, is_restricted: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="is_restricted" className="block text-sm font-medium text-gray-900">
                  Restricted Fund
                </label>
                <p className="text-xs text-gray-500">
                  Check this if donations to this fund have specific restrictions on how they can be used
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingFund ? 'Update Fund' : 'Create Fund'}
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

      {/* Fund Accounting Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Fund Accounting:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Restricted Funds:</strong> Donations with specific donor-imposed restrictions on how they can be used (e.g., Building Fund, Missions Fund)</p>
          <p><strong>Unrestricted Funds:</strong> General donations that can be used for any church purpose as determined by leadership</p>
          <p className="mt-2 text-xs">All transactions must specify which fund they belong to for proper tracking and reporting.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              value={filterRestricted}
              onChange={(e) => setFilterRestricted(e.target.value as 'all' | 'restricted' | 'unrestricted')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Funds</option>
              <option value="restricted">Restricted Only</option>
              <option value="unrestricted">Unrestricted Only</option>
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredFunds.length} of {funds.length} funds
          </div>
        </div>
      </div>

      {/* Funds Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fund Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
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
            {filteredFunds.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No funds found
                </td>
              </tr>
            ) : (
              filteredFunds.map((fund) => (
                <tr key={fund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fund.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                    {fund.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      fund.is_restricted 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : 'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {fund.is_restricted ? 'Restricted' : 'Unrestricted'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fund.transaction_count} transactions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button
                      onClick={() => handleEdit(fund)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Edit
                    </button>
                    {fund.can_delete && (
                      <button
                        onClick={() => handleDelete(fund)}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Funds</div>
          <div className="text-2xl font-bold text-gray-900">{funds.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Restricted Funds</div>
          <div className="text-2xl font-bold text-purple-600">
            {funds.filter(f => f.is_restricted).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Unrestricted Funds</div>
          <div className="text-2xl font-bold text-green-600">
            {funds.filter(f => !f.is_restricted).length}
          </div>
        </div>
      </div>
    </div>
  )
}
