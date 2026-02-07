import Link from 'next/link'
import { getFundsWithEquityMappings, getEquityAccounts } from '@/app/actions/settings'
import FundEquityMappingManager from '@/components/FundEquityMappingManager'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const [fundsResult, equityAccountsResult] = await Promise.all([
    getFundsWithEquityMappings(),
    getEquityAccounts(),
  ])

  const funds = fundsResult.success ? fundsResult.data : []
  const equityAccounts = equityAccountsResult.success ? equityAccountsResult.data : []
  
  const error = !fundsResult.success ? fundsResult.error : !equityAccountsResult.success ? equityAccountsResult.error : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Accounting Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure fund-to-equity mappings and accounting preferences
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <h3 className="text-sm font-medium text-red-800 mb-2">Database Migration Required</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <div className="bg-white border border-red-300 rounded p-4 text-xs">
            <p className="font-semibold mb-2">Run this SQL in your Supabase SQL Editor:</p>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`-- Add columns for equity and liability mappings
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS net_asset_account_id UUID 
REFERENCES chart_of_accounts(id) ON DELETE SET NULL;

ALTER TABLE chart_of_accounts 
ADD COLUMN IF NOT EXISTS default_liability_account_id UUID 
REFERENCES chart_of_accounts(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_funds_net_asset_account_id 
ON funds(net_asset_account_id);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_default_liability_account_id 
ON chart_of_accounts(default_liability_account_id);`}
            </pre>
            <p className="mt-3 text-gray-700">After running the migration, refresh this page.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Fund to Equity Mappings */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Fund to Net Assets Mapping</h2>
              <p className="mt-1 text-sm text-gray-600">
                Link each fund to its corresponding equity/net assets account (3000-series)
              </p>
            </div>
            <div className="p-6">
              {equityAccounts.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    No Equity Accounts Found
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    You need to create equity accounts (3000-series) before mapping funds.
                  </p>
                  <Link 
                    href="/admin/accounts" 
                    className="text-sm text-yellow-800 underline font-medium"
                  >
                    Go to Chart of Accounts →
                  </Link>
                </div>
              ) : (
                <FundEquityMappingManager 
                  initialFunds={funds} 
                  equityAccounts={equityAccounts}
                />
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 About Fund-to-Equity Mappings</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                <strong>Purpose:</strong> Links each fund to a specific Net Assets account for proper balance sheet reporting
              </li>
              <li>
                <strong>Typical Mappings:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• General Fund → 3100 - Unrestricted Net Assets</li>
                  <li>• Building Fund → 3200 - Temporarily Restricted Net Assets</li>
                  <li>• Mission Fund → 3300 - Mission Net Assets</li>
                </ul>
              </li>
              <li>
                <strong>Balance Sheet:</strong> These mappings ensure your balance sheet equation (Assets = Liabilities + Net Assets) remains balanced
              </li>
              <li>
                <strong>Income & Expenses:</strong> At year-end, net income/loss flows into these equity accounts automatically
              </li>
            </ul>
          </div>

          {/* Example Equity Accounts */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 Recommended Equity Account Structure</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>3000-3999: Net Assets / Equity</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• 3100 - Unrestricted Net Assets (General Fund)</li>
                <li>• 3200 - Temporarily Restricted Net Assets (Building, Special Projects)</li>
                <li>• 3300 - Permanently Restricted Net Assets (Endowments)</li>
                <li>• 3900 - Current Year Net Income (automatic year-end closing)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
