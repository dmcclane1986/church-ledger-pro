import Link from 'next/link'
import BalanceSheetReport from '@/components/BalanceSheetReport'
import ReportHeaderServer from '@/components/ReportHeaderServer'

export default function BalanceSheetPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Report Header with Logo */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <ReportHeaderServer 
          title="Balance Sheet"
          subtitle="Statement of Financial Position"
          showLogo={true}
          showAddress={true}
          centered={false}
        />
      </div>
      
      <BalanceSheetReport />
    </div>
  )
}
