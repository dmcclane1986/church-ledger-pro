'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getChurchSettings } from '@/app/actions/settings'

interface ChurchLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  className?: string
  showOrgName?: boolean
  priority?: boolean
}

const sizeMap = {
  small: { width: 32, height: 32, className: 'w-8 h-8' },
  medium: { width: 40, height: 40, className: 'w-10 h-10' },
  large: { width: 128, height: 128, className: 'w-32 h-32' },
  xlarge: { width: 192, height: 192, className: 'w-48 h-48' },
}

/**
 * Reusable Church Logo Component
 * Automatically fetches logo from church settings
 * Falls back to emoji icon if no logo is configured
 */
export default function ChurchLogo({ 
  size = 'medium', 
  className = '',
  showOrgName = false,
  priority = false 
}: ChurchLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string>('Church Ledger Pro')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChurchSettings().then(result => {
      if (result.success && result.data) {
        setLogoUrl(result.data.logo_url)
        setOrgName(result.data.organization_name)
      }
      setLoading(false)
    })
  }, [])

  const sizeConfig = sizeMap[size]

  if (loading) {
    return (
      <div className={`${sizeConfig.className} ${className} animate-pulse bg-gray-200 rounded-lg`} />
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={orgName}
          width={sizeConfig.width}
          height={sizeConfig.height}
          className={`${sizeConfig.className} object-contain rounded-lg`}
          priority={priority}
        />
      ) : (
        <span className={`${sizeConfig.className} flex items-center justify-center text-blue-600`}>
          ⛪
        </span>
      )}
      {showOrgName && (
        <span className="font-bold text-gray-900">{orgName}</span>
      )}
    </div>
  )
}

/**
 * Server-side version for use in Server Components
 * Import from '@/components/ChurchLogoServer' instead
 */
