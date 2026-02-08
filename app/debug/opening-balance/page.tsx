import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DebugOpeningBalancePage() {
  const supabase = await createServerClient()

  // Get opening balance transactions
  const { data: openingBalanceEntries, error: jeError } = await (supabase as any)
    .from('journal_entries')
    .select(`
      id,
      entry_date,
      description,
      is_voided,
      reference_number,
      ledger_lines (
        id,
        debit,
        credit,
        fund_id,
        account_id,
        funds (
          id,
          name
        ),
        chart_of_accounts (
          id,
          account_number,
          name,
          account_type
        )
      )
    `)
    .ilike('description', '%opening%balance%')
    .order('entry_date', { ascending: false })

  // Calculate what beginning balance should be for Jan 1, 2026
  const { data: allLedgerLines } = await (supabase as any)
    .from('ledger_lines')
    .select(`
      debit,
      credit,
      fund_id,
      funds (
        id,
        name
      ),
      chart_of_accounts (
        account_type
      ),
      journal_entries!inner (
        entry_date,
        is_voided
      )
    `)
    .eq('journal_entries.is_voided', false)
    .lt('journal_entries.entry_date', '2026-01-01')

  // Calculate beginning balances by fund
  const fundBalances = new Map<string, { name: string; balance: number }>()
  
  for (const line of allLedgerLines || []) {
    const fund = line.funds as any
    const account = line.chart_of_accounts as any
    
    if (!fund || !account) continue
    
    if (!fundBalances.has(fund.id)) {
      fundBalances.set(fund.id, { name: fund.name, balance: 0 })
    }
    
    const fundBalance = fundBalances.get(fund.id)!
    
    // Calculate contribution based on account type (excluding Equity)
    if (account.account_type === 'Asset') {
      fundBalance.balance += line.debit - line.credit
    } else if (account.account_type === 'Liability') {
      fundBalance.balance -= line.credit - line.debit
    } else if (account.account_type === 'Income') {
      fundBalance.balance += line.credit - line.debit
    } else if (account.account_type === 'Expense') {
      fundBalance.balance -= line.debit - line.credit
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Opening Balance Debug</h1>
        <p className="mt-2 text-sm text-gray-600">
          Diagnostic information for opening balance entries
        </p>
      </div>

      {/* Opening Balance Transactions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Opening Balance Transactions Found</h2>
        
        {jeError && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-800">Error: {jeError.message}</p>
          </div>
        )}

        {!openingBalanceEntries || openingBalanceEntries.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800">⚠️ No opening balance entries found!</p>
            <p className="text-sm text-yellow-700 mt-2">
              The system searched for journal entries with "opening balance" in the description but found none.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {openingBalanceEntries.map((entry: any) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Entry Date:</span>
                    <p className="text-lg font-semibold text-gray-900">{entry.entry_date}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <p className="text-lg">
                      {entry.is_voided ? (
                        <span className="text-red-600 font-semibold">❌ VOIDED</span>
                      ) : (
                        <span className="text-green-600 font-semibold">✅ Active</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600">Description:</span>
                  <p className="text-gray-900">{entry.description}</p>
                </div>

                <h3 className="text-sm font-semibold text-gray-700 mb-2">Ledger Lines:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Fund</th>
                        <th className="px-3 py-2 text-left">Account</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-right">Debit</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {entry.ledger_lines.map((line: any) => (
                        <tr key={line.id}>
                          <td className="px-3 py-2">{line.funds?.name || 'Unknown'}</td>
                          <td className="px-3 py-2">
                            {line.chart_of_accounts?.account_number} - {line.chart_of_accounts?.name}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              line.chart_of_accounts?.account_type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                              line.chart_of_accounts?.account_type === 'Equity' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {line.chart_of_accounts?.account_type || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calculated Beginning Balances */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Calculated Beginning Balances (as of Jan 1, 2026)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          These are the beginning balances that should appear in the Fund Summary Report for transactions before 2026-01-01:
        </p>

        {fundBalances.size === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800">⚠️ No transactions found before January 1, 2026</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fund Name</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Beginning Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.from(fundBalances.values()).map((fund) => (
                  <tr key={fund.name}>
                    <td className="px-4 py-3 text-sm text-gray-900">{fund.name}</td>
                    <td className="px-4 py-3 text-right text-lg font-semibold text-gray-900">
                      ${fund.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 What to Check:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. <strong>Entry Date:</strong> Should be 2025-12-31 (before Jan 1, 2026)</li>
          <li>2. <strong>Status:</strong> Should be "Active" not "VOIDED"</li>
          <li>3. <strong>Account Types:</strong> Should have one Asset account (debit) and one Equity account (credit)</li>
          <li>4. <strong>Calculated Balances:</strong> Should match your expected opening balances</li>
        </ul>
      </div>
    </div>
  )
}
