'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type ChurchSettings = Database['public']['Tables']['church_settings']['Row']

const LOGO_BUCKET = 'church-logos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Get church settings
 */
export async function getChurchSettings() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase
      .from('church_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (error) {
      console.error('Error fetching settings:', error)
      // Return defaults if not found
      return {
        success: true,
        data: {
          id: '00000000-0000-0000-0000-000000000001',
          organization_name: 'Church Ledger Pro',
          legal_name: null,
          ein: null,
          address_line1: null,
          address_line2: null,
          city: null,
          state: null,
          zip_code: null,
          country: 'United States',
          phone: null,
          fax: null,
          email: null,
          website: null,
          pastor_name: null,
          pastor_email: null,
          pastor_phone: null,
          logo_url: null,
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          fiscal_year_start_month: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as ChurchSettings,
      }
    }

    return { success: true, data: data as ChurchSettings }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch settings' }
  }
}

/**
 * Update church settings (admin only)
 */
export async function updateChurchSettings(settings: Partial<ChurchSettings>) {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase
      .from('church_settings')
      .update(settings)
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      return { success: false, error: 'Failed to update settings' }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/') // Revalidate all pages that use settings
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get formatted church address
 */
export async function getFormattedChurchAddress() {
  const settings = await getChurchSettings()
  
  if (!settings.success || !settings.data) {
    return 'Address not configured'
  }

  const s = settings.data
  const parts: string[] = []

  if (s.address_line1) parts.push(s.address_line1)
  if (s.address_line2) parts.push(s.address_line2)
  if (s.city && s.state && s.zip_code) {
    parts.push(`${s.city}, ${s.state} ${s.zip_code}`)
  }
  if (s.phone) parts.push(`Phone: ${s.phone}`)
  if (s.email) parts.push(`Email: ${s.email}`)

  return parts.join('\n') || 'Address not configured'
}

/**
 * Upload church logo (admin only)
 */
export async function uploadChurchLogo(formData: FormData) {
  const supabase = await createServerClient()

  try {
    const file = formData.get('logo') as File
    if (!file) {
      console.error('No file provided in form data')
      return { success: false, error: 'No file provided' }
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      bucket: LOGO_BUCKET
    })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return { success: false, error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size)
      return { success: false, error: 'File too large. Maximum size is 5MB.' }
    }

    // Delete old logo if exists
    const currentSettings = await getChurchSettings()
    if (currentSettings.success && currentSettings.data?.logo_url) {
      const oldPath = currentSettings.data.logo_url.split('/').pop()
      if (oldPath) {
        console.log('Deleting old logo:', oldPath)
        const { error: deleteError } = await supabase.storage.from(LOGO_BUCKET).remove([oldPath])
        if (deleteError) {
          console.warn('Could not delete old logo:', deleteError)
        }
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `logo-${timestamp}.${extension}`
    
    console.log('Uploading file:', filename)

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError
      })
      return { 
        success: false, 
        error: `Failed to upload logo: ${uploadError.message}` 
      }
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(filename)

    console.log('Public URL generated:', publicUrl)

    // Update settings with new logo URL
    const { error: updateError } = await supabase
      .from('church_settings')
      .update({ logo_url: publicUrl })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    if (updateError) {
      console.error('Update error details:', {
        message: updateError.message,
        code: updateError.code,
        error: updateError
      })
      // Try to clean up uploaded file
      await supabase.storage.from(LOGO_BUCKET).remove([filename])
      return { success: false, error: `Failed to update settings: ${updateError.message}` }
    }

    console.log('Settings updated successfully with logo URL')

    revalidatePath('/admin/settings')
    revalidatePath('/')
    
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete church logo (admin only)
 */
export async function deleteChurchLogo() {
  const supabase = await createServerClient()

  try {
    const currentSettings = await getChurchSettings()
    if (!currentSettings.success || !currentSettings.data?.logo_url) {
      return { success: false, error: 'No logo to delete' }
    }

    const logoUrl = currentSettings.data.logo_url
    const filename = logoUrl.split('/').pop()

    if (filename) {
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from(LOGO_BUCKET)
        .remove([filename])

      if (deleteError) {
        console.error('Delete error:', deleteError)
      }
    }

    // Update settings to remove logo URL
    const { error: updateError } = await supabase
      .from('church_settings')
      .update({ logo_url: null })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    if (updateError) {
      console.error('Update error:', updateError)
      return { success: false, error: 'Failed to update settings' }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
