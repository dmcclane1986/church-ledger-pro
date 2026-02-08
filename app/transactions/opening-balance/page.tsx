import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { canEditTransactions } from '@/lib/auth/roles'
import OpeningBalanceForm from '@/components/OpeningBalanceForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Opening Balance Entry | Church Ledger Pro',
  description: 'Record opening balances for assets and equity accounts',
}

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

async function getEquityAccounts() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Equity')
    .eq('is_active', true)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching equity accounts:', error)
    return []
  }
  
  return data || []
}

export default async function OpeningBalancePage() {
  // Check if user can edit transactions
  const canEdit = await canEditTransactions()
  
  if (!canEdit) {
    redirect('/unauthorized')
  }

  const [funds, assetAccounts, equityAccounts] = await Promise.all([
    getFunds(),
    getAssetAccounts(),
    getEquityAccounts(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Opening Balance Entry</h1>
        <p className="mt-2 text-sm text-gray-600">
          Record opening balances for your asset accounts (bank accounts, cash, etc.)
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {funds.length === 0 || assetAccounts.length === 0 || equityAccounts.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Setup Required
            </h3>
            <p className="text-sm text-yellow-700">
              Please complete the following setup before recording opening balances:
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {funds.length === 0 && <li>Add at least one fund</li>}
              {assetAccounts.length === 0 && <li>Add asset accounts (bank accounts) to your chart of accounts</li>}
              {equityAccounts.length === 0 && (
                <li>Add an equity account (e.g., "Retained Earnings" - Account #3100) to your chart of accounts</li>
              )}
            </ul>
          </div>
        ) : (
          <OpeningBalanceForm
            funds={funds}
            assetAccounts={assetAccounts}
            equityAccounts={equityAccounts}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📘 What is an Opening Balance?</h3>
        <p className="text-sm text-blue-800 mb-3">
          An opening balance records how much money you had in each account at the start of your accounting period.
          This sets the starting point for all your future transactions.
        </p>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Example:</strong> If your checking account had $15,000 on January 1st:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li><strong>Asset Account (Debit):</strong> Checking Account → +$15,000</li>
            <li><strong>Equity Account (Credit):</strong> Retained Earnings → +$15,000</li>
          </ul>
          <p className="mt-2">
            This properly shows that your church <em>has</em> $15,000 in the bank (Asset) and that this money 
            represents the church's accumulated net worth (Equity).
          </p>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Opening Balance Tips</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Record opening balances for each bank account, savings account, petty cash, etc.</li>
          <li>• Use the date you're starting your accounting system (typically January 1st)</li>
          <li>• Get the amounts from your bank statements as of that date</li>
          <li>• Create one entry per account (e.g., one for Operating Checking, one for Missions Checking)</li>
          <li>• After entering all opening balances, verify your Balance Sheet shows the correct totals</li>
          <li>• You only need to do this once when setting up your system</li>
        </ul>
      </div>

      {/* Accounting Note */}
      <div className="mt-6 bg-indigo-50 rounded-lg border border-indigo-200 p-4">
        <h3 className="text-sm font-semibold text-indigo-900 mb-2">🔍 Accounting Details</h3>
        <p className="text-sm text-indigo-800">
          This form follows proper double-entry accounting by:
        </p>
        <ul className="mt-2 text-sm text-indigo-800 space-y-1 ml-4">
          <li>• <strong>Debiting</strong> your Asset account (increases the asset balance)</li>
          <li>• <strong>Crediting</strong> an Equity account (shows this is the church's net worth)</li>
          <li>• Keeping the books balanced (Debits = Credits)</li>
        </ul>
      </div>
    </div>
  )
}
