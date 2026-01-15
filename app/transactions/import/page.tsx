import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { fetchDonors } from '@/app/actions/donors'
import { getFunds } from '@/app/actions/funds'
import { getExpenseAccounts } from '@/app/actions/accounts'
import BatchOnlineDonationForm from '@/components/BatchOnlineDonationForm'

export const dynamic = 'force-dynamic'

async function getIncomeAccounts() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Income')
    .eq('is_active', true)
    .gte('account_number', 4000)
    .lt('account_number', 5000)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching income accounts:', error)
    return []
  }
  
  return data || []
}

async function getCheckingAccount() {
  // Get the primary checking account (typically 1100)
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

async function getFeesAccount() {
  // Get bank fees expense account (typically in 5000s)
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Expense')
    .eq('is_active', true)
    .gte('account_number', 5000)
    .lt('account_number', 6000)
    .order('account_number')
    .limit(1)
  
  if (error) {
    console.error('Error fetching fees account:', error)
    return null
  }
  
  return data?.[0] || null
}

export default async function BatchOnlineDonationPage() {
  const [donorsResult, fundsResult, incomeAccounts, checkingAccount, feesAccount] = await Promise.all([
    fetchDonors(),
    getFunds(),
    getIncomeAccounts(),
    getCheckingAccount(),
    getFeesAccount(),
  ])

  const donors = donorsResult.data || []
  const funds = fundsResult.data || []

  // Check if setup is complete
  const setupIncomplete = 
    donors.length === 0 || 
    funds.length === 0 || 
    incomeAccounts.length === 0 || 
    !checkingAccount || 
    !feesAccount

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Batch Online Donation Entry</h1>
        <p className="mt-2 text-sm text-gray-600">
          Record multiple online donations from a single bank deposit
        </p>
        {/* Navigation Links */}
        <div className="mt-4 flex gap-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Dashboard
          </Link>
          <Link href="/transactions" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Transactions
          </Link>
          <Link href="/reports" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Reports
          </Link>
        </div>
      </div>

      {setupIncomplete ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Setup Required
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            Please complete the following setup before recording batch donations:
          </p>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-2">
            {donors.length === 0 && (
              <li>
                Add at least one donor. <Link href="/donors/new" className="underline font-medium">Add donor →</Link>
              </li>
            )}
            {funds.length === 0 && (
              <li>
                Add at least one fund. <Link href="/admin/funds" className="underline font-medium">Manage funds →</Link>
              </li>
            )}
            {incomeAccounts.length === 0 && (
              <li>
                Add at least one income account (4000s). <Link href="/admin/accounts" className="underline font-medium">Manage accounts →</Link>
              </li>
            )}
            {!checkingAccount && (
              <li>
                Add a checking account (Asset type). <Link href="/admin/accounts" className="underline font-medium">Manage accounts →</Link>
              </li>
            )}
            {!feesAccount && (
              <li>
                Add a bank fees expense account (5000s). <Link href="/admin/accounts" className="underline font-medium">Manage accounts →</Link>
              </li>
            )}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <BatchOnlineDonationForm
            donors={donors}
            funds={funds}
            incomeAccounts={incomeAccounts}
            checkingAccount={checkingAccount}
            feesAccount={feesAccount}
          />
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 How This Works</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>
            <strong>1. Enter Deposit Info:</strong> Input the net deposit amount (what hit your bank) and the processing fees charged by the platform.
          </li>
          <li>
            <strong>2. Assign Donations:</strong> For each donor, specify which fund their gift goes to and the amount. The sum must equal the gross amount (net + fees).
          </li>
          <li>
            <strong>3. Verify Balance:</strong> The "Remaining to Assign" counter must be exactly $0.00 before you can save.
          </li>
          <li>
            <strong>4. Save & Print:</strong> Once saved, you can print a summary for your records.
          </li>
        </ul>
      </div>

      {/* Example Section */}
      <div className="mt-6 bg-indigo-50 rounded-lg border border-indigo-200 p-4">
        <h3 className="text-sm font-semibold text-indigo-900 mb-2">📖 Example</h3>
        <p className="text-sm text-indigo-800 mb-3">
          Your online giving platform deposited <strong>$970.00</strong> into your bank account after deducting <strong>$30.00</strong> in fees.
          The gross donations were <strong>$1,000.00</strong>.
        </p>
        <div className="text-xs text-indigo-700 space-y-1 ml-4">
          <p><strong>Journal Entry:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Debit: Operating Checking $970.00 (cash received)</li>
            <li>Debit: Bank Fees Expense $30.00 (fees paid)</li>
            <li>Credit: Tithes & Offerings $500.00 (John Smith, General Fund)</li>
            <li>Credit: Tithes & Offerings $300.00 (Jane Doe, General Fund)</li>
            <li>Credit: Tithes & Offerings $200.00 (Bob Johnson, Building Fund)</li>
          </ul>
          <p className="mt-2"><strong>Result:</strong> Total Debits = Total Credits = $1,000.00 ✓</p>
        </div>
      </div>
    </div>
  )
}
