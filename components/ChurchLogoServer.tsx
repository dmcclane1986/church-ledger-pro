import Image from 'next/image'
import { getChurchSettings } from '@/app/actions/settings'

interface ChurchLogoServerProps {
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
 * Server-side Church Logo Component
 * Use this in Server Components (pages, layouts)
 * Automatically fetches logo from church settings
 */
export default async function ChurchLogoServer({ 
  size = 'medium', 
  className = '',
  showOrgName = false,
  priority = false 
}: ChurchLogoServerProps) {
  const result = await getChurchSettings()
  const logoUrl = result.data?.logo_url
  const orgName = result.data?.organization_name || 'Church Ledger Pro'
  
  const sizeConfig = sizeMap[size]

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
