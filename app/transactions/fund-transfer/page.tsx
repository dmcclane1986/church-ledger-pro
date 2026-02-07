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

async function getCheckingAccount() {
  // Try to find Operating Checking account (commonly numbered 1100)
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Asset')
    .eq('is_active', true)
    .order('account_number')
    .limit(1)
  
  if (error) {
    console.error('Error fetching checking account:', error)
    return null
  }
  
  return data?.[0] || null
}

export default async function FundTransferPage() {
  const [funds, checkingAccount] = await Promise.all([
    getFunds(),
    getCheckingAccount(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fund Transfer</h1>
        <p className="mt-2 text-sm text-gray-600">
          Transfer money between funds without affecting overall bank balance
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {funds.length < 2 || !checkingAccount ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Setup Required
            </h3>
            <p className="text-sm text-yellow-700">
              Please set up your funds and chart of accounts before transferring between funds.
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {funds.length < 2 && <li>Add at least two funds to enable transfers</li>}
              {!checkingAccount && <li>Add a checking account (Asset type) to your chart of accounts</li>}
            </ul>
          </div>
        ) : (
          <FundTransferForm
            funds={funds}
            checkingAccount={checkingAccount}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Fund Transfer Tips</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Fund transfers move money between funds without changing the total bank balance</li>
          <li>• Both ledger lines use the same checking account but different funds</li>
          <li>• The source fund balance decreases, destination fund balance increases</li>
          <li>• This is useful for reallocating resources between ministry areas or projects</li>
          <li>• Be mindful of restricted vs unrestricted funds when transferring</li>
        </ul>
      </div>

      {/* Example Section */}
      <div className="mt-6 bg-indigo-50 rounded-lg border border-indigo-200 p-4">
        <h3 className="text-sm font-semibold text-indigo-900 mb-2">📖 Example</h3>
        <p className="text-sm text-indigo-800 mb-2">
          If you transfer $500 from General Fund to Building Fund:
        </p>
        <ul className="text-xs text-indigo-700 space-y-1 ml-4">
          <li>• General Fund checking balance: -$500</li>
          <li>• Building Fund checking balance: +$500</li>
          <li>• Total checking account: $0 change (balanced)</li>
        </ul>
      </div>
    </div>
  )
}
