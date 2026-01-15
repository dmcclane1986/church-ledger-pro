'use client'

import { logout } from '@/app/login/actions'
import { useFormStatus } from 'react-dom'

function LogoutButtonContent() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition disabled:opacity-50"
    >
      {pending ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}

export default function LogoutButton() {
  return (
    <form action={logout}>
      <LogoutButtonContent />
    </form>
  )
}
