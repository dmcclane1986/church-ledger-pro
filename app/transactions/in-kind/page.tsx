import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import InKindDonationForm from '@/components/InKindDonationForm'

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
    .gte('account_number', 1000)
    .lt('account_number', 2000)
    .order('account_number')
  
  if (error) {
    console.error('Error fetching asset accounts:', error)
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
    .order('account_number')
  
  if (error) {
    console.error('Error fetching expense accounts:', error)
    return []
  }
  
  return data || []
}

async function getInKindIncomeAccount() {
  const supabase = await createServerClient()
  
  // First, try to find the 4050 - Non-Cash Contributions account
  let { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_number', 4050)
    .eq('is_active', true)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching in-kind income account:', error)
  }
  
  // If 4050 doesn't exist, create it
  if (!data) {
    console.log('Creating 4050 - Non-Cash Contributions account...')
    const { data: newAccount, error: createError } = await supabase
      .from('chart_of_accounts')
      .insert({
        account_number: 4050,
        name: 'Non-Cash Contributions',
        account_type: 'Income',
        is_active: true,
        description: 'In-kind donations (equipment, supplies, services) - non-cash contributions per IRS guidelines',
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating in-kind income account:', createError)
      return null
    }
    
    data = newAccount
  }
  
  return data
}

export default async function InKindDonationPage() {
  const [funds, assetAccounts, expenseAccounts, inKindIncomeAccount] = await Promise.all([
    getFunds(),
    getAssetAccounts(),
    getExpenseAccounts(),
    getInKindIncomeAccount(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Record In-Kind Donation</h1>
        <p className="mt-2 text-sm text-gray-600">
          Record non-cash donations such as equipment, tools, supplies, or services
        </p>
        
        {/* Navigation Links */}
        <div className="mt-4 flex gap-4 flex-wrap">
          <Link href="/transactions" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            ← Back to Transactions
          </Link>
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Dashboard
          </Link>
          <Link href="/reports/donor-statements" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Donor Statements
          </Link>
        </div>
      </div>
      
      {/* Form Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎁 In-Kind Donation Form
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <p className="font-medium mb-1">IRS Guidelines for In-Kind Donations:</p>
            <ul className="text-xs space-y-1">
              <li>• Church cannot assign a value - donor must provide fair market value</li>
              <li>• Items over $5,000 may require independent appraisal</li>
              <li>• Donor is responsible for determining and documenting fair market value</li>
              <li>• Church provides acknowledgment of donation but not valuation</li>
            </ul>
          </div>
        </div>
        
        {funds.length === 0 || assetAccounts.length === 0 || !inKindIncomeAccount ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Setup Required
            </h3>
            <p className="text-sm text-yellow-700">
              Please complete the required setup before recording in-kind donations.
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {funds.length === 0 && <li>Add at least one fund</li>}
              {assetAccounts.length === 0 && <li>Add asset accounts (1000s) to your chart of accounts</li>}
              {!inKindIncomeAccount && <li>Income account 4050 - Non-Cash Contributions is required</li>}
            </ul>
          </div>
        ) : (
          <InKindDonationForm
            funds={funds}
            assetAccounts={assetAccounts}
            expenseAccounts={expenseAccounts}
            inKindIncomeAccount={inKindIncomeAccount}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          When to Use This Form
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900">Fixed Assets (1000s):</p>
            <p>Equipment that will be used long-term: lawn mowers, computers, furniture, vehicles</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Donated Supplies/Expenses (5000s):</p>
            <p>Items that will be consumed or used immediately: office supplies, food for events, materials</p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="font-medium text-blue-900">Example:</p>
            <p className="text-blue-800 text-xs mt-1">
              John Smith donates a John Deere Riding Mower valued at $3,500. Select "Fixed Asset (1000s)" 
              category and choose the appropriate equipment account. The donation will appear on John's 
              annual statement as an in-kind contribution.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
