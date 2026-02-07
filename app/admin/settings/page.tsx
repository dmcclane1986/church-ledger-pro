'use client'

import { useState, useEffect } from 'react'
import { getChurchSettings, updateChurchSettings, uploadChurchLogo, deleteChurchLogo } from '@/app/actions/settings'
import Image from 'next/image'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const result = await getChurchSettings()
    if (result.success && result.data) {
      setSettings(result.data)
      setLogoPreview(result.data.logo_url)
    }
    setLoading(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('Starting upload for:', file.name, file.type, file.size, 'bytes')

    setUploading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('logo', file)

    try {
      const result = await uploadChurchLogo(formData)

      console.log('Upload result:', result)

      setUploading(false)

      if (result.success && result.url) {
        setSuccess('Logo uploaded successfully!')
        setLogoPreview(result.url)
        await loadSettings()
        setTimeout(() => setSuccess(null), 5000)
      } else {
        console.error('Upload failed:', result.error)
        setError(result.error || 'Failed to upload logo')
        setTimeout(() => setError(null), 5000)
      }
    } catch (err) {
      console.error('Unexpected error during upload:', err)
      setUploading(false)
      setError('An unexpected error occurred. Check console for details.')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleLogoDelete = async () => {
    if (!confirm('Are you sure you want to delete the church logo?')) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    const result = await deleteChurchLogo()

    setUploading(false)

    if (result.success) {
      setSuccess('Logo deleted successfully!')
      setLogoPreview(null)
      await loadSettings()
      setTimeout(() => setSuccess(null), 5000)
    } else {
      setError(result.error || 'Failed to delete logo')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const updates: any = {}

    // Collect all form fields
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (value && value.toString().trim() !== '') {
        updates[key] = value.toString()
      } else {
        updates[key] = null
      }
    })

    const result = await updateChurchSettings(updates)

    setSaving(false)

    if (result.success) {
      setSuccess('Settings updated successfully!')
      await loadSettings()
      setTimeout(() => setSuccess(null), 5000)
    } else {
      setError(result.error || 'Failed to update settings')
      setTimeout(() => setError(null), 5000)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!settings) {
    return <div className="p-6">Error loading settings</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Church Settings</h1>
        <p className="text-gray-600 mb-8">Manage your organization information and display settings</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          {/* Organization Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="organization_name"
                  defaultValue={settings.organization_name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This name appears in the header and on reports</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Name
                </label>
                <input
                  type="text"
                  name="legal_name"
                  defaultValue={settings.legal_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="If different from organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EIN (Tax ID)
                </label>
                <input
                  type="text"
                  name="ein"
                  defaultValue={settings.ein || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mailing Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="address_line1"
                  defaultValue={settings.address_line1 || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Street address, P.O. box"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address_line2"
                  defaultValue={settings.address_line2 || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Suite, unit, building, floor, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  defaultValue={settings.city || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  defaultValue={settings.state || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., TX, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="zip_code"
                  defaultValue={settings.zip_code || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  defaultValue={settings.country || 'United States'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={settings.phone || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={settings.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="info@church.org"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  defaultValue={settings.website || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.church.org"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                <input
                  type="tel"
                  name="fax"
                  defaultValue={settings.fax || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4568"
                />
              </div>
            </div>
          </div>

          {/* Pastor Information */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pastor Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pastor Name</label>
                <input
                  type="text"
                  name="pastor_name"
                  defaultValue={settings.pastor_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Pastor John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pastor Email</label>
                <input
                  type="email"
                  name="pastor_email"
                  defaultValue={settings.pastor_email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="pastor@church.org"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pastor Phone</label>
                <input
                  type="tel"
                  name="pastor_phone"
                  defaultValue={settings.pastor_phone || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Church Logo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Logo
                </label>
                {logoPreview ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <Image
                        src={logoPreview}
                        alt="Church Logo"
                        width={200}
                        height={200}
                        className="rounded-lg border border-gray-300 object-contain bg-white"
                        style={{ maxHeight: '200px', width: 'auto' }}
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleLogoDelete}
                        disabled={uploading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? 'Deleting...' : 'Delete Logo'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No logo uploaded</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Logo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: Square image (e.g., 300x300px). Max size: 5MB. Formats: JPEG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Fiscal Year */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fiscal Year Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Year Start Month
              </label>
              <select
                name="fiscal_year_start_month"
                defaultValue={settings.fiscal_year_start_month?.toString() || '1'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">The month your fiscal year begins</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <a
              href="/"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
