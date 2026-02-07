import Image from 'next/image'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'

interface ReportHeaderServerProps {
  title?: string
  subtitle?: string
  showLogo?: boolean
  showAddress?: boolean
  centered?: boolean
  className?: string
}

/**
 * Server-side Report Header Component
 * Use this in Server Components for financial reports
 * Automatically fetches church settings and address
 */
export default async function ReportHeaderServer({
  title,
  subtitle,
  showLogo = true,
  showAddress = true,
  centered = false,
  className = ''
}: ReportHeaderServerProps) {
  const [settingsResult, addressResult] = await Promise.all([
    getChurchSettings(),
    getFormattedChurchAddress()
  ])

  const logoUrl = settingsResult.data?.logo_url
  const orgName = settingsResult.data?.organization_name || 'Church Ledger Pro'
  const address = addressResult

  if (centered) {
    return (
      <div className={`text-center border-b-2 border-gray-300 pb-6 mb-6 ${className}`}>
        {showLogo && logoUrl && (
          <div className="flex justify-center mb-4">
            <Image
              src={logoUrl}
              alt={orgName}
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{orgName}</h1>
        {showAddress && (
          <div className="text-sm text-gray-600 whitespace-pre-line mb-3">
            {address}
          </div>
        )}
        {title && (
          <h2 className="text-xl font-semibold text-gray-800 mt-4">{title}</h2>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
    )
  }

  return (
    <div className={`border-b-2 border-gray-300 pb-6 mb-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {showLogo && logoUrl && (
            <Image
              src={logoUrl}
              alt={orgName}
              width={64}
              height={64}
              className="object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{orgName}</h1>
            {showAddress && (
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {address}
              </div>
            )}
          </div>
        </div>
        {title && (
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
