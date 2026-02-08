import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { createServerClient } from '@/lib/supabase/server'
import { fetchHistoricalActuals, fetchBudgets } from '@/app/actions/budgets'
import BudgetPlanner from '@/components/BudgetPlanner'

export const metadata = {
  title: 'Budget Planner | Church Ledger Pro',
  description: 'Plan next year\'s budget based on historical data',
}

export default async function BudgetPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const supabase = await createServerClient()
  
  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const adminAccess = await isAdmin()
  
  if (!adminAccess) {
    redirect('/unauthorized')
  }

  // Get fiscal year from query params or default to next year
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const planningYear = params.year ? parseInt(params.year) : currentYear + 1
  const previousYear = planningYear - 1

  // Fetch historical actuals for previous year
  const historicalResult = await fetchHistoricalActuals(previousYear)
  
  // Fetch existing budgets for planning year (if any)
  const existingBudgetsResult = await fetchBudgets(planningYear)
  const existingBudgets = existingBudgetsResult.data || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BudgetPlanner
        planningYear={planningYear}
        previousYear={previousYear}
        historicalData={historicalResult.data}
        existingBudgets={existingBudgets}
        historicalError={historicalResult.error}
      />
    </div>
  )
}
