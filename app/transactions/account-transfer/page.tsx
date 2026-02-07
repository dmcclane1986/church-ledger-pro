import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import AccountTransferForm from '@/components/AccountTransferForm'

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

async function getAccounts() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Asset')
    .eq('is_active', true)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching accounts:', error)
    return []
  }
  
  return data || []
}

export default async function AccountTransferPage() {
  const [funds, accounts] = await Promise.all([
    getFunds(),
    getAccounts(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Account Transfer</h1>
        <p className="mt-2 text-sm text-gray-600">
          Transfer money between different accounts within the same fund
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {accounts.length < 2 || funds.length < 1 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Setup Required
            </h3>
            <p className="text-sm text-yellow-700">
              Please set up your funds and chart of accounts before transferring between accounts.
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {accounts.length < 2 && <li>Add at least two asset accounts to enable transfers</li>}
              {funds.length < 1 && <li>Add at least one fund to your system</li>}
            </ul>
          </div>
        ) : (
          <AccountTransferForm
            funds={funds}
            accounts={accounts}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Account Transfer Tips</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Account transfers move money between different accounts within the same fund</li>
          <li>• Both ledger lines use the same fund but different accounts</li>
          <li>• The source account balance decreases, destination account balance increases</li>
          <li>• This is useful for moving money from checking to savings, or vice versa</li>
          <li>• The total fund balance remains unchanged after the transfer</li>
        </ul>
      </div>

      {/* Example Section */}
      <div className="mt-6 bg-indigo-50 rounded-lg border border-indigo-200 p-4">
        <h3 className="text-sm font-semibold text-indigo-900 mb-2">📖 Example</h3>
        <p className="text-sm text-indigo-800 mb-2">
          If you transfer $1,000 from Checking Account to Savings Account in the General Fund:
        </p>
        <ul className="text-xs text-indigo-700 space-y-1 ml-4">
          <li>• Checking Account in General Fund: -$1,000</li>
          <li>• Savings Account in General Fund: +$1,000</li>
          <li>• General Fund total balance: $0 change (balanced)</li>
          <li>• You've just reallocated where the money is stored</li>
        </ul>
      </div>
    </div>
  )
}
