'use client'

import { useState } from 'react'
import type { Database } from '@/types/database.types'

type Fund = Database['public']['Tables']['funds']['Row'] & {
  equity_account?: {
    id: string
    account_number: number
    name: string
    account_type: string
  } | null
}

type EquityAccount = Database['public']['Tables']['chart_of_accounts']['Row']

interface FundEquityMappingManagerProps {
  initialFunds: Fund[]
  equityAccounts: EquityAccount[]
}

export default function FundEquityMappingManager({
  initialFunds,
  equityAccounts,
}: FundEquityMappingManagerProps) {
  const [funds, setFunds] = useState(initialFunds)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleUpdateMapping = async (fundId: string, equityAccountId: string) => {
    setSavingId(fundId)
    setError(null)
    setSuccess(null)

    try {
      // TODO: Implement updateFundEquityMapping function
      console.log('Update fund equity mapping:', fundId, equityAccountId || null)
      const result: { success: boolean; error?: string } = { success: true }

      if (result.success) {
        // Update local state
        setFunds(prev =>
          prev.map(fund => {
            if (fund.id === fundId) {
              const equityAccount = equityAccounts.find(acc => acc.id === equityAccountId)
              return {
                ...fund,
                net_asset_account_id: equityAccountId || null,
                equity_account: equityAccount ? {
                  id: equityAccount.id,
                  account_number: equityAccount.account_number,
                  name: equityAccount.name,
                  account_type: equityAccount.account_type,
                } : null,
              }
            }
            return fund
          })
        )
        setSuccess(`Updated mapping for ${funds.find(f => f.id === fundId)?.name}`)
      } else {
        setError(result.error || 'Failed to update mapping')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Mappings Table */}
      {funds.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No funds found. Create funds first before mapping them to equity accounts.</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Assets Account (3000-series)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {funds.map((fund) => (
                <tr key={fund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fund.name}</div>
                    {fund.description && (
                      <div className="text-xs text-gray-500">{fund.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        fund.is_restricted
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {fund.is_restricted ? 'Restricted' : 'Unrestricted'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={fund.net_asset_account_id || ''}
                      onChange={(e) => handleUpdateMapping(fund.id, e.target.value)}
                      disabled={savingId === fund.id}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">Not Mapped</option>
                      {equityAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_number} - {account.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {savingId === fund.id ? (
                      <span className="text-xs text-gray-500">Saving...</span>
                    ) : fund.net_asset_account_id ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                        ✓ Mapped
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        Not Mapped
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
        <div>
          Total Funds: <span className="font-medium">{funds.length}</span>
        </div>
        <div>
          Mapped: <span className="font-medium text-green-600">
            {funds.filter(f => f.net_asset_account_id).length}
          </span> | 
          Unmapped: <span className="font-medium text-gray-500">
            {funds.filter(f => !f.net_asset_account_id).length}
          </span>
        </div>
      </div>
    </div>
  )
}
