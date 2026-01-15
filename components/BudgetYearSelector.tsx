'use client'

import { useRouter } from 'next/navigation'

interface BudgetYearSelectorProps {
  selectedYear: number
}

export default function BudgetYearSelector({ selectedYear }: BudgetYearSelectorProps) {
  const router = useRouter()

  // Generate year options (current year and 5 years back, plus 2 years forward)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i)

  const handleYearChange = (year: number) => {
    router.push(`/reports/budget-variance?year=${year}`)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="fiscal-year" className="text-sm font-medium text-gray-700">
        Fiscal Year:
      </label>
      <select
        id="fiscal-year"
        value={selectedYear}
        onChange={(e) => handleYearChange(parseInt(e.target.value))}
        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year} {year === currentYear && '(Current)'}
          </option>
        ))}
      </select>
    </div>
  )
}
