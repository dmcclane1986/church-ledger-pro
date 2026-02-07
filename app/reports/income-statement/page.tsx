import Link from 'next/link'
import IncomeStatementReport from '@/components/IncomeStatementReport'
import ReportHeaderServer from '@/components/ReportHeaderServer'

export default function IncomeStatementPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Report Header with Logo */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <ReportHeaderServer 
          title="Income Statement"
          subtitle="Statement of Activities"
          showLogo={true}
          showAddress={true}
          centered={false}
        />
      </div>
      
      <IncomeStatementReport />
    </div>
  )
}
