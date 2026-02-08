'use client'

import { useState, useEffect } from 'react'
import { fetchDonors, updateDonor, deleteDonor, type Donor } from '@/app/actions/donors'

export default function DonorManagement() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingDonorId, setUpdatingDonorId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    address: '',
    envelope_number: '',
  })

  useEffect(() => {
    loadDonors()
  }, [])

  const loadDonors = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchDonors()
    
    if (result.success && result.data) {
      setDonors(result.data)
    } else {
      setError(result.error || 'Failed to load donors')
    }
    
    setLoading(false)
  }

  const handleEditClick = (donor: Donor) => {
    setEditingDonor(donor)
    setEditForm({
      name: donor.name,
      email: donor.email || '',
      address: donor.address || '',
      envelope_number: donor.envelope_number || '',
    })
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingDonor(null)
    setEditForm({
      name: '',
      email: '',
      address: '',
      envelope_number: '',
    })
    setError(null)
    setSuccessMessage(null)
  }

  const handleSaveEdit = async () => {
    if (!editingDonor) return

    if (!editForm.name.trim()) {
      setError('Donor name is required')
      return
    }

    setUpdatingDonorId(editingDonor.id)
    setError(null)
    setSuccessMessage(null)

    const result = await updateDonor(editingDonor.id, {
      name: editForm.name,
      email: editForm.email || null,
      address: editForm.address || null,
      envelope_number: editForm.envelope_number || null,
    })

    if (result.success) {
      setSuccessMessage('Donor updated successfully')
      setEditingDonor(null)
      await loadDonors()
    } else {
      setError(result.error || 'Failed to update donor')
    }

    setUpdatingDonorId(null)
  }

  const handleDeleteDonor = async (donorId: string, donorName: string) => {
    if (!confirm(`Are you sure you want to delete donor "${donorName}"? This action cannot be undone.`)) {
      return
    }

    setUpdatingDonorId(donorId)
    setError(null)
    setSuccessMessage(null)

    const result = await deleteDonor(donorId)

    if (result.success) {
      setSuccessMessage('Donor deleted successfully')
      await loadDonors()
    } else {
      setError(result.error || 'Failed to delete donor')
    }

    setUpdatingDonorId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Donor Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage donor information. Only admins can edit or delete donors.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Donors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Donors</h2>
          <p className="text-sm text-gray-600 mt-1">
            {donors.length} {donors.length === 1 ? 'donor' : 'donors'} total
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Envelope #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No donors found
                  </td>
                </tr>
              ) : (
                donors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-gray-50">
                    {editingDonor?.id === donor.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Donor name"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editForm.envelope_number}
                            onChange={(e) => setEditForm({ ...editForm, envelope_number: e.target.value })}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Envelope #"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Email"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Address"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(donor.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={updatingDonorId === donor.id}
                              className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              {updatingDonorId === donor.id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={updatingDonorId === donor.id}
                              className="text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{donor.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {donor.envelope_number ? `#${donor.envelope_number}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{donor.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{donor.address || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(donor.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(donor)}
                              disabled={updatingDonorId !== null}
                              className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDonor(donor.id, donor.name)}
                              disabled={updatingDonorId !== null}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              {updatingDonorId === donor.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
