import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DiagnosticsPage() {
  const supabase = await createServerClient()

  // Get funds
  const { data: funds } = await supabase
    .from('funds')
    .select('*')
    .order('name')

  // Get recent journal entries
  const { data: journalEntries } = await supabase
    .from('journal_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .limit(10)

  // Get ledger lines count
  const { count: ledgerLinesCount } = await supabase
    .from('ledger_lines')
    .select('*', { count: 'exact', head: true })

  // Get fund balances
  const { data: ledgerLines } = await supabase
    .from('ledger_lines')
    .select(`
      id,
      debit,
      credit,
      fund_id,
      funds (name)
    `)

  // Calculate fund balances
  const fundBalances = new Map<string, { name: string; credits: number; debits: number }>()
  
  if (ledgerLines) {
    for (const line of ledgerLines as any[]) {
      const fundId = line.fund_id
      const fundName = (line.funds as any)?.name || 'Unknown'
      
      if (!fundBalances.has(fundId)) {
        fundBalances.set(fundId, { name: fundName, credits: 0, debits: 0 })
      }
      
      const balance = fundBalances.get(fundId)!
      balance.credits += line.credit
      balance.debits += line.debit
    }
  }

  // Get equity account info
  const { data: equityAccount } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('account_number', 3100)
    .single()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Debug information for balance sheet issues
        </p>
      </div>

      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Funds</h3>
            <p className="text-3xl font-bold text-gray-900">{funds?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Journal Entries</h3>
            <p className="text-3xl font-bold text-gray-900">{journalEntries?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Ledger Lines</h3>
            <p className="text-3xl font-bold text-gray-900">{ledgerLinesCount || 0}</p>
          </div>
        </div>

        {/* Funds List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Funds Configuration</h2>
          </div>
          <div className="p-6">
            {funds && funds.length > 0 ? (
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="pb-2">Fund Name</th>
                    <th className="pb-2">Fund ID (copy this)</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Equity Mapping</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {funds.map((fund: any) => (
                    <tr key={fund.id} className="border-t border-gray-100">
                      <td className="py-2 font-medium">{fund.name}</td>
                      <td className="py-2 font-mono text-xs">{fund.id}</td>
                      <td className="py-2">
                        {fund.is_restricted ? (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Restricted</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Unrestricted</span>
                        )}
                      </td>
                      <td className="py-2">
                        {fund.net_asset_account_id ? (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ Mapped</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Not Mapped</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No funds found</p>
            )}
          </div>
        </div>

        {/* Fund Balances */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Calculated Fund Balances</h2>
            <p className="text-sm text-gray-600 mt-1">Based on actual ledger lines</p>
          </div>
          <div className="p-6">
            {fundBalances.size > 0 ? (
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="pb-2">Fund Name</th>
                    <th className="pb-2 text-right">Total Credits</th>
                    <th className="pb-2 text-right">Total Debits</th>
                    <th className="pb-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {Array.from(fundBalances.entries()).map(([fundId, balance]) => (
                    <tr key={fundId} className="border-t border-gray-100">
                      <td className="py-2 font-medium">{balance.name}</td>
                      <td className="py-2 text-right text-green-700">
                        ${balance.credits.toFixed(2)}
                      </td>
                      <td className="py-2 text-right text-red-700">
                        ${balance.debits.toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-bold">
                        ${(balance.credits - balance.debits).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  <strong>No ledger lines found!</strong> This means no transactions have been recorded yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Equity Account Check */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Equity Account (3100) Status</h2>
          </div>
          <div className="p-6">
            {equityAccount ? (
              <div className="space-y-2 text-sm">
                <p><strong>Account Number:</strong> {(equityAccount as any).account_number}</p>
                <p><strong>Account Name:</strong> {(equityAccount as any).name}</p>
                <p><strong>Account Type:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    (equityAccount as any).account_type === 'Equity' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(equityAccount as any).account_type}
                  </span>
                </p>
                <p><strong>Active:</strong> {(equityAccount as any).is_active ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Account ID:</strong> <code className="text-xs bg-gray-100 px-2 py-1 rounded">{(equityAccount as any).id}</code></p>
                {(equityAccount as any).account_type !== 'Equity' && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-800">
                      <strong>⚠️ Problem Found:</strong> Account 3100 is type "{(equityAccount as any).account_type}" but should be type "Equity"!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Problem Found:</strong> Account 3100 (Unrestricted Net Assets) does not exist!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="p-6">
            {journalEntries && journalEntries.length > 0 ? (
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Reference</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {journalEntries.map((entry: any) => (
                    <tr key={entry.id} className="border-t border-gray-100">
                      <td className="py-2">{entry.entry_date}</td>
                      <td className="py-2">{entry.description}</td>
                      <td className="py-2">{entry.reference_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  <strong>No journal entries found!</strong> No transactions have been recorded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
