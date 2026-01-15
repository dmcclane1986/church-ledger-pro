'use client'

import { useState, FormEvent } from 'react'
import { createDonor } from '@/app/actions/donors'
import { useRouter } from 'next/navigation'

export default function AddDonorForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [envelopeNumber, setEnvelopeNumber] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate required fields
    if (!name.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    try {
      const result = await createDonor({
        name: name.trim(),
        envelope_number: envelopeNumber.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      })

      if (result.success && result.data) {
        setSuccess(`✓ ${result.data.name} has been added successfully!`)
        // Clear form for next entry
        setName('')
        setEnvelopeNumber('')
        setEmail('')
        setAddress('')
        // Scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError(result.error || 'Failed to add donor')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✓</span>
              <div>
                <p className="text-sm font-medium text-green-800">{success}</p>
                <p className="text-xs text-green-700 mt-1">
                  You can now add another donor or return to transactions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Full Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Enter the donor's full legal name</p>
        </div>

        {/* Envelope Number Field */}
        <div>
          <label htmlFor="envelopeNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Envelope Number
          </label>
          <input
            type="text"
            id="envelopeNumber"
            value={envelopeNumber}
            onChange={(e) => setEnvelopeNumber(e.target.value)}
            placeholder="123"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional - Unique identifier for giving envelopes
          </p>
        </div>

        {/* Email Address Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional - For sending donor statements and receipts
          </p>
        </div>

        {/* Mailing Address Field */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Mailing Address
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="123 Main Street&#10;Anytown, ST 12345"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional - For mailing year-end tax statements
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Adding Donor...' : 'Add Donor'}
          </button>
          <button
            type="button"
            onClick={() => {
              setName('')
              setEnvelopeNumber('')
              setEmail('')
              setAddress('')
              setError(null)
              setSuccess(null)
            }}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition font-medium"
          >
            Clear
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
          <p className="font-medium text-blue-900 mb-2">📋 Donor Privacy Notice</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• All donor information is confidential and secure</li>
            <li>• Only authorized personnel can access donor records</li>
            <li>• Envelope numbers must be unique (system will check for duplicates)</li>
            <li>• Email addresses will only be used for official church communications</li>
          </ul>
        </div>
      </form>
    </div>
  )
}
