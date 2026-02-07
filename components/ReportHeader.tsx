'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'

interface ReportHeaderProps {
  title?: string
  subtitle?: string
  showLogo?: boolean
  showAddress?: boolean
  centered?: boolean
  className?: string
}

/**
 * Reusable Report Header Component
 * Use this on all financial reports for consistent branding
 * Works in both web views and PDF exports
 */
export default function ReportHeader({
  title,
  subtitle,
  showLogo = true,
  showAddress = true,
  centered = false,
  className = ''
}: ReportHeaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string>('Church Ledger Pro')
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getChurchSettings(),
      getFormattedChurchAddress()
    ]).then(([settingsResult, addressResult]) => {
      if (settingsResult.success && settingsResult.data) {
        setLogoUrl(settingsResult.data.logo_url)
        setOrgName(settingsResult.data.organization_name)
      }
      setAddress(addressResult)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-200 rounded mb-4"></div>
      </div>
    )
  }

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

/**
 * Server-side version for use in Server Components
 * Import from '@/components/ReportHeaderServer' instead
 */
