import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import WeeklyDepositForm from '@/components/WeeklyDepositForm'

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

async function getIncomeAccounts() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Income')
    .eq('is_active', true)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching income accounts:', error)
    return []
  }
  
  return data || []
}

async function getCheckingAccount() {
  // Try to find a checking account (commonly numbered 1100)
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

export default async function TransactionsPage() {
  const [funds, incomeAccounts, checkingAccount] = await Promise.all([
    getFunds(),
    getIncomeAccounts(),
    getCheckingAccount(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        {/* Navigation Links */}
        <div className="mt-4 flex gap-4 flex-wrap">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Dashboard
          </Link>
          <Link href="/reports" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Reports
          </Link>
          <Link href="/transactions/expense" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Record Expense
          </Link>
          <Link href="/transactions/in-kind" className="text-purple-600 hover:text-purple-800 font-medium text-sm">
            🎁 In-Kind Donation
          </Link>
          <Link href="/transactions/bank-statement" className="text-orange-600 hover:text-orange-800 font-medium text-sm">
            → Import Bank Statement (Expenses)
          </Link>
          <Link href="/transactions/import" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Import Online Giving
          </Link>
          <Link href="/donors/new" className="text-green-600 hover:text-green-800 font-medium text-sm">
            + Add New Donor
          </Link>
        </div>
      </div>
      
      {/* Weekly Deposit Form - Full Width */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          💰 Weekly Deposit & Tally Form
        </h2>
        
        {funds.length === 0 || incomeAccounts.length === 0 || !checkingAccount ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Setup Required
            </h3>
            <p className="text-sm text-yellow-700">
              Please set up your funds and chart of accounts before recording transactions.
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {funds.length === 0 && <li>Add at least one fund</li>}
              {incomeAccounts.length === 0 && <li>Add income accounts to your chart of accounts</li>}
              {!checkingAccount && <li>Add a checking account (Asset type) to your chart of accounts</li>}
            </ul>
          </div>
        ) : (
          <WeeklyDepositForm
            funds={funds}
            incomeAccounts={incomeAccounts}
            checkingAccount={checkingAccount}
          />
        )}
      </div>
    </div>
  )
}
