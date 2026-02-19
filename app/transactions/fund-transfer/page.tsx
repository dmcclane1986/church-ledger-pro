import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import FundTransferForm from '@/components/FundTransferForm'

export const dynamic = 'force-dynamic'

async function getFunds() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('funds')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching funds:', error)
    return []
  }
  
  return data || []
}

async function getAssetAccounts() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Asset')
    .eq('is_active', true)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching asset accounts:', error)
    return []
  }
  
  return data || []
}

export default async function FundTransferPage() {
  const [funds, accounts] = await Promise.all([
    getFunds(),
    getAssetAccounts(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fund Transfer</h1>
        <p className="mt-2 text-sm text-gray-600">
          Transfer money between funds and/or accounts
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {funds.length < 2 || accounts.length < 1 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Setup Required
            </h3>
            <p className="text-sm text-yellow-700">
              Please set up your funds and chart of accounts before transferring between funds.
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {funds.length < 2 && <li>Add at least two funds to enable transfers</li>}
              {accounts.length < 1 && <li>Add at least one asset account (checking, savings, etc.) to your chart of accounts</li>}
            </ul>
          </div>
        ) : (
          <FundTransferForm
            funds={funds}
            accounts={accounts}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Fund Transfer Tips</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• You can transfer between funds, accounts, or both at the same time</li>
          <li>• Same account, different funds: Reallocates money between funds (total balance unchanged)</li>
          <li>• Different accounts, same fund: Moves money between accounts within a fund</li>
          <li>• Different accounts, different funds: Moves money between both accounts and funds</li>
          <li>• The source fund/account balance decreases, destination fund/account balance increases</li>
          <li>• Be mindful of restricted vs unrestricted funds when transferring</li>
        </ul>
      </div>

      {/* Example Section */}
      <div className="mt-6 bg-indigo-50 rounded-lg border border-indigo-200 p-4">
        <h3 className="text-sm font-semibold text-indigo-900 mb-2">📖 Examples</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-indigo-800 font-medium mb-1">
              Example 1: Same Account, Different Funds
            </p>
            <p className="text-xs text-indigo-700 mb-1">
              Transfer $500 from General Fund to Building Fund (both in Checking):
            </p>
            <ul className="text-xs text-indigo-700 space-y-1 ml-4">
              <li>• General Fund checking balance: -$500</li>
              <li>• Building Fund checking balance: +$500</li>
              <li>• Total checking account: $0 change (balanced)</li>
            </ul>
          </div>
          <div>
            <p className="text-sm text-indigo-800 font-medium mb-1">
              Example 2: Different Accounts, Different Funds
            </p>
            <p className="text-xs text-indigo-700 mb-1">
              Transfer $1,000 from Operational Fund (Checking) to Missions Fund (Savings):
            </p>
            <ul className="text-xs text-indigo-700 space-y-1 ml-4">
              <li>• Operational Fund checking balance: -$1,000</li>
              <li>• Missions Fund savings balance: +$1,000</li>
              <li>• Money moves between both accounts and funds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
