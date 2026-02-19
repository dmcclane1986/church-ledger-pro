import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import WeeklyDepositForm from '@/components/WeeklyDepositForm'
import { canEditTransactions } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'

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

async function getCheckingAccounts() {
  // Get all checking/cash accounts
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Asset')
    .eq('is_active', true)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching checking accounts:', error)
    return []
  }
  
  return data || []
}

export default async function TransactionsPage() {
  // Check if user can edit transactions (Admin and Bookkeeper only)
  const canEdit = await canEditTransactions()
  if (!canEdit) {
    redirect('/unauthorized')
  }

  const [funds, incomeAccounts, checkingAccounts] = await Promise.all([
    getFunds(),
    getIncomeAccounts(),
    getCheckingAccounts(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
      </div>
      
      {/* Weekly Deposit Form - Full Width */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          💰 Weekly Deposit & Tally Form
        </h2>
        
        {funds.length === 0 || incomeAccounts.length === 0 || checkingAccounts.length === 0 ? (
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
              {checkingAccounts.length === 0 && <li>Add a checking account (Asset type) to your chart of accounts</li>}
            </ul>
          </div>
        ) : (
          <WeeklyDepositForm
            funds={funds}
            incomeAccounts={incomeAccounts}
            checkingAccounts={checkingAccounts}
          />
        )}
      </div>
    </div>
  )
}
