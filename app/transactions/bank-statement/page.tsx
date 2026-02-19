import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import BankStatementImporter from '@/components/BankStatementImporter'

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
    .gte('account_number', 5000)
    .lt('account_number', 6000)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching expense accounts:', error)
    return []
  }
  
  return data || []
}

async function getCheckingAccounts() {
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

export default async function BankStatementImportPage() {
  const [funds, expenseAccounts, checkingAccounts] = await Promise.all([
    getFunds(),
    getExpenseAccounts(),
    getCheckingAccounts(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import Bank Statement</h1>
        <p className="mt-2 text-sm text-gray-600">
          Import expenses from your bank CSV file
        </p>
      </div>

      {/* Setup Check */}
      {funds.length === 0 || expenseAccounts.length === 0 || checkingAccounts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Setup Required
          </h3>
          <p className="text-sm text-yellow-700">
            Please set up your funds and chart of accounts before importing bank statements.
          </p>
          <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
            {funds.length === 0 && <li>Add at least one fund</li>}
            {expenseAccounts.length === 0 && <li>Add expense accounts (5000s) to your chart of accounts</li>}
            {checkingAccounts.length === 0 && <li>Add a checking account (Asset type) to your chart of accounts</li>}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <BankStatementImporter
            funds={funds}
            expenseAccounts={expenseAccounts}
            checkingAccounts={checkingAccounts}
          />
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          How to Import Bank Statements
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900">Step 1: Download CSV from Your Bank</p>
            <p>Export your checking account transactions as a CSV file from your bank's website.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Step 2: Upload CSV</p>
            <p>Drag and drop or click to upload your CSV file.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Step 3: Map Columns</p>
            <p>Match your bank's CSV columns to the required fields (date, description, amount, etc.).</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Step 4: Review & Process</p>
            <p>Review each expense, assign to the correct fund and expense account, then process.</p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="font-medium text-blue-900 text-xs">Note:</p>
            <ul className="text-xs text-blue-800 mt-1 space-y-1">
              <li>• Only DEBIT transactions (expenses) are imported</li>
              <li>• Credit transactions are automatically filtered out</li>
              <li>• Duplicate detection helps prevent double-entry</li>
              <li>• Process transactions one at a time or in batches</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
