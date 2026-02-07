import type { Metadata } from "next";
import "./globals.css";
import { createServerClient } from '@/lib/supabase/server'
import { isAdmin, canEditTransactions } from '@/lib/auth/roles'
import LogoutButton from '@/components/LogoutButton'

export const metadata: Metadata = {
  title: "Church Ledger Pro",
  description: "Professional fund accounting for churches",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  const adminAccess = user ? await isAdmin() : false
  const canEdit = user ? await canEditTransactions() : false

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {user && (
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                    ⛪ Church Ledger Pro
                  </a>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="/"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </a>
                  
                  {/* Transactions Dropdown - Only show for Admin and Bookkeeper */}
                  {canEdit && (
                    <div className="relative group">
                    <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                      Transactions
                      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1" role="menu">
                        <a
                          href="/transactions"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Weekly Giving
                        </a>
                        <a
                          href="/transactions/expense"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Expenses
                        </a>
                        <a
                          href="/transactions/in-kind"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          In-Kind Donation
                        </a>
                        <a
                          href="/transactions/bank-statement"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Import Bank Statement
                        </a>
                        <a
                          href="/transactions/import"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Online Giving
                        </a>
                        <div className="border-t border-gray-100 my-1"></div>
                        <a
                          href="/transactions/account-transfer"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Account Transfer
                        </a>
                        <a
                          href="/transactions/fund-transfer"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Fund Transfer
                        </a>
                        <div className="border-t border-gray-100 my-1"></div>
                        <a
                          href="/reconciliation"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Bank Reconciliation
                        </a>
                      </div>
                    </div>
                  </div>
                  )}

                  <a
                    href="/reports"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Reports
                  </a>
                  
                  {/* Admin Dropdown */}
                  {adminAccess && (
                    <div className="relative group">
                      <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                        Admin
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="absolute left-0 mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-1" role="menu">
                          <a
                            href="/admin/transactions"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Manage Transactions
                          </a>
                          <a
                            href="/admin/accounts"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Chart of Accounts
                          </a>
                          <a
                            href="/admin/funds"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Manage Funds
                          </a>
                          <a
                            href="/admin/budget-planner"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Budget Planner
                          </a>
                          <div className="border-t border-gray-100 my-1"></div>
                          <a
                            href="/admin/settings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Accounting Settings
                          </a>
                          <a
                            href="/admin/diagnostics"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            System Diagnostics
                          </a>
                          <a
                            href="/admin/users"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            User Management
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="border-l border-gray-300 h-8"></div>
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <LogoutButton />
                </div>
              </div>
            </div>
          </nav>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
