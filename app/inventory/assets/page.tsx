'use client'

import { useState, useEffect } from 'react'
import {
  getAssets,
  getAssetSummary,
  processAllDepreciation,
  recordDepreciation,
  disposeAsset,
  createAsset,
} from '@/app/actions/assets'
import { getAccounts, getFunds } from '@/app/actions/recurring'
import { getTodayLocalDate } from '@/lib/utils/date'

interface Asset {
  id: string
  asset_name: string
  description: string | null
  category: string | null
  purchase_date: string
  purchase_price: number
  estimated_life_years: number
  salvage_value: number
  accumulated_depreciation_amount: number
  status: string
  location: string | null
  assigned_to: string | null
  depreciation_start_date: string
  last_depreciation_date: string | null
  funds: {
    name: string
  }
}

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDisposed, setShowDisposed] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [funds, setFunds] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [showDisposed])

  useEffect(() => {
    loadAccountsAndFunds()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [assetsResult, summaryResult] = await Promise.all([
        getAssets(showDisposed),
        getAssetSummary(),
      ])

      if (assetsResult.success && assetsResult.data) {
        setAssets(assetsResult.data as any)
      } else {
        setError(assetsResult.error || 'Failed to load assets')
      }

      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data)
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

  const handleProcessAll = async () => {
    if (!confirm('Process depreciation for all active assets for this month?')) {
      return
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)

    const result = await processAllDepreciation()

    setProcessing(false)

    if (result.success) {
      setSuccess(result.message || 'Depreciation processed successfully!')
      await loadData()
      setTimeout(() => setSuccess(null), 5000)
    } else {
      setError(result.error || 'Failed to process depreciation')
      setTimeout(() => setError(null), 5000)
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

  const calculateBookValue = (asset: Asset) => {
    return asset.purchase_price - asset.accumulated_depreciation_amount
  }

  const calculateDepreciationPercentage = (asset: Asset) => {
    const depreciableAmount = asset.purchase_price - asset.salvage_value
    if (depreciableAmount === 0) return 100
    return (asset.accumulated_depreciation_amount / depreciableAmount) * 100
  }

  const calculateRemainingLife = (asset: Asset) => {
    const startDate = new Date(asset.depreciation_start_date)
    const now = new Date()
    const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth())
    const totalMonths = asset.estimated_life_years * 12
    const remainingMonths = Math.max(0, totalMonths - monthsElapsed)
    return {
      months: remainingMonths,
      years: Math.floor(remainingMonths / 12),
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>,
      disposed: <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Disposed</span>,
      fully_depreciated: <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Fully Depreciated</span>,
      under_construction: <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Under Construction</span>,
    }
    return badges[status as keyof typeof badges] || status
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fixed Assets
          </h1>
          <p className="text-gray-600">
            Track assets and manage automatic depreciation
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Asset Value</p>
                  <p className="text-3xl font-bold">{formatCurrency(summary.totalPurchaseValue)}</p>
                  <p className="text-blue-100 text-sm mt-2">Original Cost</p>
                </div>
                <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Current Book Value</p>
                  <p className="text-3xl font-bold">{formatCurrency(summary.totalBookValue)}</p>
                  <p className="text-green-100 text-sm mt-2">After Depreciation</p>
                </div>
                <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Accumulated Depreciation</p>
                  <p className="text-3xl font-bold">{formatCurrency(summary.totalAccumulatedDepreciation)}</p>
                  <p className="text-orange-100 text-sm mt-2">Total Depreciated</p>
                </div>
                <svg className="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Active Assets</p>
                  <p className="text-3xl font-bold">{summary.activeAssets}</p>
                  <p className="text-purple-100 text-sm mt-2">of {summary.totalAssets} total</p>
                </div>
                <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </div>
        )}

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

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showDisposed}
                onChange={(e) => setShowDisposed(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show disposed assets</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleProcessAll}
              disabled={processing}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Process All Depreciation'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + New Asset
            </button>
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Assets ({assets.length})
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-600 text-lg">No assets found</p>
              <p className="text-gray-500 text-sm mt-2">
                Add your first asset to start tracking depreciation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map((asset) => {
                const bookValue = calculateBookValue(asset)
                const depreciationPct = calculateDepreciationPercentage(asset)
                const remaining = calculateRemainingLife(asset)

                return (
                  <div
                    key={asset.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {asset.asset_name}
                            </h3>
                            {asset.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {asset.description}
                              </p>
                            )}
                            {asset.category && (
                              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {asset.category}
                              </span>
                            )}
                          </div>
                          {getStatusBadge(asset.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Purchase Price</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(asset.purchase_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Book Value</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(bookValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Purchase Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(asset.purchase_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Fund</p>
                            <p className="text-sm font-medium text-gray-900">
                              {asset.funds.name}
                            </p>
                          </div>
                        </div>

                        {/* Depreciation Progress Bar */}
                        {asset.status !== 'disposed' && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Depreciation Progress</span>
                              <span>{depreciationPct.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  depreciationPct >= 100
                                    ? 'bg-blue-600'
                                    : depreciationPct >= 75
                                    ? 'bg-orange-600'
                                    : depreciationPct >= 50
                                    ? 'bg-yellow-600'
                                    : 'bg-green-600'
                                }`}
                                style={{ width: `${Math.min(depreciationPct, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>
                                Accumulated: {formatCurrency(asset.accumulated_depreciation_amount)}
                              </span>
                              <span>
                                {remaining.years > 0 ? `${remaining.years} years remaining` : 'Fully depreciated'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Additional Info */}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                          {asset.location && (
                            <span>📍 {asset.location}</span>
                          )}
                          {asset.assigned_to && (
                            <span>👤 {asset.assigned_to}</span>
                          )}
                          {asset.last_depreciation_date && (
                            <span>Last Depreciation: {formatDate(asset.last_depreciation_date)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Create Asset Modal */}
        {showCreateModal && (
          <CreateAssetModal
            accounts={accounts}
            funds={funds}
            onClose={() => setShowCreateModal(false)}
            onCreate={async (assetData) => {
              setLoading(true)
              setError(null)
              setSuccess(null)

              const result = await createAsset(assetData)

              setLoading(false)

              if (result.success) {
                setSuccess('Asset created successfully!')
                setShowCreateModal(false)
                await loadData()
                setTimeout(() => setSuccess(null), 5000)
              } else {
                setError(result.error || 'Failed to create asset')
                setTimeout(() => setError(null), 5000)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

// Create Asset Modal Component
interface CreateAssetModalProps {
  accounts: any[]
  funds: any[]
  onClose: () => void
  onCreate: (data: any) => Promise<void>
}

function CreateAssetModal({ accounts, funds, onClose, onCreate }: CreateAssetModalProps) {
  const [assetName, setAssetName] = useState('')
  const [description, setDescription] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [assetTag, setAssetTag] = useState('')
  const [category, setCategory] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(getTodayLocalDate())
  const [purchasePrice, setPurchasePrice] = useState('')
  const [estimatedLifeYears, setEstimatedLifeYears] = useState('')
  const [salvageValue, setSalvageValue] = useState('')
  const [depreciationStartDate, setDepreciationStartDate] = useState(getTodayLocalDate())
  const [fundId, setFundId] = useState('')
  const [assetAccountId, setAssetAccountId] = useState('')
  const [accumDeprecAccountId, setAccumDeprecAccountId] = useState('')
  const [deprecExpenseAccountId, setDeprecExpenseAccountId] = useState('')
  const [location, setLocation] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)

  // Filter accounts by type
  const assetAccounts = accounts.filter(a => a.account_type === 'Asset')
  const expenseAccounts = accounts.filter(a => a.account_type === 'Expense')

  // Common categories
  const categories = [
    'Buildings',
    'Vehicles',
    'Equipment',
    'Furniture',
    'Computers',
    'Musical Instruments',
    'Audio/Visual Equipment',
    'Other',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const price = parseFloat(purchasePrice)
    const salvage = parseFloat(salvageValue || '0')
    const lifeYears = parseInt(estimatedLifeYears)

    // Validation
    if (price <= 0) {
      alert('Purchase price must be greater than zero')
      return
    }

    if (lifeYears <= 0) {
      alert('Estimated life must be greater than zero')
      return
    }

    if (salvage >= price) {
      alert('Salvage value must be less than purchase price')
      return
    }

    setCreating(true)

    await onCreate({
      assetName,
      description: description || undefined,
      serialNumber: serialNumber || undefined,
      assetTag: assetTag || undefined,
      category: category || undefined,
      purchaseDate,
      purchasePrice: price,
      estimatedLifeYears: lifeYears,
      salvageValue: salvage,
      depreciationStartDate,
      fundId,
      assetAccountId,
      accumulatedDepreciationAccountId: accumDeprecAccountId,
      depreciationExpenseAccountId: deprecExpenseAccountId,
      location: location || undefined,
      assignedTo: assignedTo || undefined,
      notes: notes || undefined,
    })

    setCreating(false)
  }

  const calculateAnnualDepreciation = () => {
    const price = parseFloat(purchasePrice || '0')
    const salvage = parseFloat(salvageValue || '0')
    const years = parseInt(estimatedLifeYears || '1')
    
    if (price > 0 && years > 0 && salvage < price) {
      return ((price - salvage) / years).toFixed(2)
    }
    return '0.00'
  }

  const calculateMonthlyDepreciation = () => {
    const annual = parseFloat(calculateAnnualDepreciation())
    return (annual / 12).toFixed(2)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">New Fixed Asset</h2>
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
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Church Building, Delivery Van"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed description of the asset"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Tag
                </label>
                <input
                  type="text"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Internal tracking number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Manufacturer serial number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Main Building, Office"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Department or person"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Life (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={estimatedLifeYears}
                  onChange={(e) => setEstimatedLifeYears(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salvage Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salvageValue}
                  onChange={(e) => setSalvageValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depreciation Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={depreciationStartDate}
                  onChange={(e) => setDepreciationStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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

            {/* Depreciation Preview */}
            {purchasePrice && estimatedLifeYears && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Depreciation Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Annual Depreciation:</span>
                    <span className="ml-2 font-semibold text-blue-900">${calculateAnnualDepreciation()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Monthly Depreciation:</span>
                    <span className="ml-2 font-semibold text-blue-900">${calculateMonthlyDepreciation()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Assignments */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Assignments</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={assetAccountId}
                  onChange={(e) => setAssetAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Asset Account</option>
                  {assetAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_number} - {account.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">The balance sheet account for this asset</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accumulated Depreciation Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={accumDeprecAccountId}
                  onChange={(e) => setAccumDeprecAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Accumulated Depreciation Account</option>
                  {assetAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_number} - {account.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Contra-asset account to track depreciation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depreciation Expense Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={deprecExpenseAccountId}
                  onChange={(e) => setDeprecExpenseAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Depreciation Expense Account</option>
                  {expenseAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_number} - {account.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Income statement account for depreciation expense</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or information"
              rows={3}
            />
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
              disabled={creating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
