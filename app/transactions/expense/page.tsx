import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import RecordExpenseForm from '@/components/RecordExpenseForm'

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

async function getExpenseAccounts() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Expense')
    .eq('is_active', true)
    .gte('account_number', 5000) // Filter for 5000s (expense accounts)
    .lt('account_number', 6000)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching expense accounts:', error)
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

async function getLiabilityAccounts() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_type', 'Liability')
    .eq('is_active', true)
    .gte('account_number', 2000)
    .lt('account_number', 3000)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching liability accounts:', error)
    return []
  }
  
  return data || []
}

export default async function RecordExpensePage() {
  const [funds, expenseAccounts, checkingAccount, liabilityAccounts] = await Promise.all([
    getFunds(),
    getExpenseAccounts(),
    getCheckingAccount(),
    getLiabilityAccounts(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Record Expense</h1>
        <p className="mt-2 text-sm text-gray-600">
          Record church expenses and payments
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {funds.length === 0 || expenseAccounts.length === 0 || !checkingAccount ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Setup Required
            </h3>
            <p className="text-sm text-yellow-700">
              Please set up your funds and chart of accounts before recording expenses.
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {funds.length === 0 && <li>Add at least one fund</li>}
              {expenseAccounts.length === 0 && <li>Add expense accounts (5000s) to your chart of accounts</li>}
              {!checkingAccount && <li>Add a checking account (Asset type) to your chart of accounts</li>}
            </ul>
          </div>
        ) : (
          <RecordExpenseForm
            funds={funds}
            expenseAccounts={expenseAccounts}
            checkingAccount={checkingAccount}
            liabilityAccounts={liabilityAccounts}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Expense Recording Tips</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• All expenses decrease your cash account and increase the expense category</li>
          <li>• Choose the appropriate fund to track where the money came from</li>
          <li>• Use reference numbers to track check numbers or invoice numbers</li>
          <li>• Be descriptive in the vendor/description field for better tracking</li>
        </ul>
      </div>
    </div>
  )
}
