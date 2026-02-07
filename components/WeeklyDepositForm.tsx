'use client'

import { useState, FormEvent, useEffect, useMemo } from 'react'
import { recordWeeklyDeposit } from '@/app/actions/transactions'
import { fetchDonors, createDonor, type Donor } from '@/app/actions/donors'
import type { Database } from '@/types/database.types'
import { generateDepositReceiptPDF } from '@/lib/pdf/depositReceipt'

type Fund = Database['public']['Tables']['funds']['Row']
type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface WeeklyDepositFormProps {
  funds: Fund[]
  incomeAccounts: Account[]
  checkingAccount: Account
}

interface CheckEntry {
  id: string
  referenceNumber: string
  amount: string
  donorId: string
}

interface EnvelopeEntry {
  id: string
  donorId: string
  donorName: string
  envelopeNumber: string
  amount: string
}

interface DesignatedEntry {
  id: string
  accountId: string
  fundId: string
  amount: string
  description: string
}

export default function WeeklyDepositForm({
  funds,
  incomeAccounts,
  checkingAccount,
}: WeeklyDepositFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Donor state
  const [donors, setDonors] = useState<Donor[]>([])

  // Form state
  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [description, setDescription] = useState('Weekly deposit')

  // Cash & Coin Counter (value-based, not count-based)
  const [hundreds, setHundreds] = useState('')
  const [fifties, setFifties] = useState('')
  const [twenties, setTwenties] = useState('')
  const [tens, setTens] = useState('')
  const [fives, setFives] = useState('')
  const [twos, setTwos] = useState('')
  const [ones, setOnes] = useState('')
  const [dollarCoins, setDollarCoins] = useState('')
  const [halfDollars, setHalfDollars] = useState('')
  const [quarters, setQuarters] = useState('')
  const [dimes, setDimes] = useState('')
  const [nickels, setNickels] = useState('')
  const [pennies, setPennies] = useState('')

  // Check entries
  const [checks, setChecks] = useState<CheckEntry[]>([])
  
  // Manual check total for verification
  const [manualCheckTotal, setManualCheckTotal] = useState('')

  // Envelope entries
  const [envelopes, setEnvelopes] = useState<EnvelopeEntry[]>([])

  // Loose cash
  const [looseCash, setLooseCash] = useState('')

  // Missions giving
  const [missionsAmount, setMissionsAmount] = useState('')
  const [missionsFundId, setMissionsFundId] = useState('')

  // Designated items
  const [designatedItems, setDesignatedItems] = useState<DesignatedEntry[]>([])

  // General fund (for the main deposit)
  const [generalFundId, setGeneralFundId] = useState(funds[0]?.id || '')
  const [generalIncomeAccountId, setGeneralIncomeAccountId] = useState(incomeAccounts[0]?.id || '')

  // Load donors on mount
  useEffect(() => {
    loadDonors()
  }, [])

  // Auto-select Missions fund on mount and when funds change
  useEffect(() => {
    if (funds.length > 0) {
      // Find Missions fund by name (case-insensitive, looks for "mission" or "missions")
      const missionsFund = funds.find(
        (fund) => fund.name.toLowerCase().includes('mission')
      )
      if (missionsFund && missionsFundId !== missionsFund.id) {
        setMissionsFundId(missionsFund.id)
      }

      // Find General fund by name (case-insensitive, looks for "general")
      const generalFund = funds.find(
        (fund) => fund.name.toLowerCase().includes('general')
      )
      if (generalFund && generalFundId !== generalFund.id) {
        setGeneralFundId(generalFund.id)
      }
    }
  }, [funds, missionsFundId, generalFundId])

  // Auto-select Tithes and Offerings income account on mount and when accounts change
  useEffect(() => {
    if (incomeAccounts.length > 0) {
      // Find Tithes and Offerings account by name (case-insensitive)
      const tithesAccount = incomeAccounts.find(
        (account) => 
          account.name.toLowerCase().includes('tithes') || 
          account.name.toLowerCase().includes('offerings') ||
          account.name.toLowerCase().includes('tithe') ||
          account.name.toLowerCase().includes('offering')
      )
      if (tithesAccount && generalIncomeAccountId !== tithesAccount.id) {
        setGeneralIncomeAccountId(tithesAccount.id)
      }
    }
  }, [incomeAccounts, generalIncomeAccountId])

  const loadDonors = async () => {
    const result = await fetchDonors()
    if (result.success && result.data) {
      setDonors(result.data)
    }
  }

  // Validation function for denomination values
  const validateDenomination = (value: string, denomination: number): boolean => {
    if (!value || value === '') return true // Empty is valid
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) return false
    
    // Check if the value is a valid multiple of the denomination
    // Use a small epsilon for floating point comparison
    const remainder = (numValue % denomination)
    return Math.abs(remainder) < 0.001 || Math.abs(remainder - denomination) < 0.001
  }

  // Validation state for each denomination
  const validations = useMemo(() => ({
    hundreds: validateDenomination(hundreds, 100),
    fifties: validateDenomination(fifties, 50),
    twenties: validateDenomination(twenties, 20),
    tens: validateDenomination(tens, 10),
    fives: validateDenomination(fives, 5),
    twos: validateDenomination(twos, 2),
    ones: validateDenomination(ones, 1),
    dollarCoins: validateDenomination(dollarCoins, 1),
    halfDollars: validateDenomination(halfDollars, 0.5),
    quarters: validateDenomination(quarters, 0.25),
    dimes: validateDenomination(dimes, 0.10),
    nickels: validateDenomination(nickels, 0.05),
    pennies: validateDenomination(pennies, 0.01),
  }), [hundreds, fifties, twenties, tens, fives, twos, ones, dollarCoins, halfDollars, quarters, dimes, nickels, pennies])

  // Check if all denominations are valid
  const allDenominationsValid = useMemo(() => {
    return Object.values(validations).every(v => v === true)
  }, [validations])

  // Calculate total cash from value inputs (not count-based)
  const totalCash = useMemo(() => {
    const h = parseFloat(hundreds) || 0
    const f = parseFloat(fifties) || 0
    const tw = parseFloat(twenties) || 0
    const te = parseFloat(tens) || 0
    const fi = parseFloat(fives) || 0
    const two = parseFloat(twos) || 0
    const o = parseFloat(ones) || 0
    const dc = parseFloat(dollarCoins) || 0
    const hd = parseFloat(halfDollars) || 0
    const q = parseFloat(quarters) || 0
    const d = parseFloat(dimes) || 0
    const n = parseFloat(nickels) || 0
    const p = parseFloat(pennies) || 0

    return h + f + tw + te + fi + two + o + dc + hd + q + d + n + p
  }, [hundreds, fifties, twenties, tens, fives, twos, ones, dollarCoins, halfDollars, quarters, dimes, nickels, pennies])

  // Calculate total checks
  const totalChecks = useMemo(() => {
    return checks.reduce((sum, check) => sum + (parseFloat(check.amount) || 0), 0)
  }, [checks])

  // Validate manual check total against calculated total
  const checkTotalMatches = useMemo(() => {
    if (!manualCheckTotal || manualCheckTotal === '') return null // No validation if empty
    const manualTotal = parseFloat(manualCheckTotal)
    if (isNaN(manualTotal)) return false
    // Allow small floating point differences (within 0.01)
    return Math.abs(manualTotal - totalChecks) < 0.01
  }, [manualCheckTotal, totalChecks])

  // Calculate total envelopes
  const totalEnvelopes = useMemo(() => {
    return envelopes.reduce((sum, env) => sum + (parseFloat(env.amount) || 0), 0)
  }, [envelopes])

  // Calculate loose cash amount
  const looseCashAmount = useMemo(() => {
    return parseFloat(looseCash) || 0
  }, [looseCash])

  // Calculate total from envelopes + loose cash
  const totalEnvelopeAndLooseCash = useMemo(() => {
    return totalEnvelopes + looseCashAmount
  }, [totalEnvelopes, looseCashAmount])

  // Validate calculated cash total (envelope + loose) against counted cash
  const cashTotalMatches = useMemo(() => {
    // Only validate if there's actual cash entered (envelope or loose cash)
    if (totalEnvelopeAndLooseCash === 0 && totalCash === 0) return null // Both zero, no validation needed
    if (totalEnvelopeAndLooseCash === 0) return null // No envelope/loose cash entered yet
    // Allow small floating point differences (within 0.01)
    return Math.abs(totalEnvelopeAndLooseCash - totalCash) < 0.01
  }, [totalEnvelopeAndLooseCash, totalCash])

  // Calculate missions amount
  const missionsTotal = useMemo(() => {
    return parseFloat(missionsAmount) || 0
  }, [missionsAmount])

  // Calculate designated total
  const designatedTotal = useMemo(() => {
    return designatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  }, [designatedItems])

  // Calculate deposit summary
  const generalFundDeposit = useMemo(() => {
    return totalChecks + totalEnvelopes + looseCashAmount - missionsTotal - designatedTotal
  }, [totalChecks, totalEnvelopes, looseCashAmount, missionsTotal, designatedTotal])

  const finalTotalDeposit = useMemo(() => {
    // Final deposit = sum of all fund allocations
    return generalFundDeposit + missionsTotal + designatedTotal
  }, [generalFundDeposit, missionsTotal, designatedTotal])

  // Check entry handlers
  const addCheck = () => {
    setChecks([...checks, { id: Date.now().toString(), referenceNumber: '', amount: '', donorId: '' }])
  }

  const removeCheck = (id: string) => {
    setChecks(checks.filter((c) => c.id !== id))
  }

  const updateCheck = (id: string, field: 'referenceNumber' | 'amount' | 'donorId', value: string) => {
    setChecks(checks.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  // Envelope entry handlers
  const addEnvelope = () => {
    setEnvelopes([
      ...envelopes,
      { id: Date.now().toString(), donorId: '', donorName: '', envelopeNumber: '', amount: '' },
    ])
  }

  const removeEnvelope = (id: string) => {
    setEnvelopes(envelopes.filter((e) => e.id !== id))
  }

  const updateEnvelope = (
    id: string,
    field: 'donorId' | 'donorName' | 'envelopeNumber' | 'amount',
    value: string
  ) => {
    setEnvelopes(envelopes.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  // Designated entry handlers
  const addDesignatedItem = () => {
    setDesignatedItems([
      ...designatedItems,
      {
        id: Date.now().toString(),
        accountId: incomeAccounts[0]?.id || '',
        fundId: funds[0]?.id || '',
        amount: '',
        description: '',
      },
    ])
  }

  const removeDesignatedItem = (id: string) => {
    setDesignatedItems(designatedItems.filter((i) => i.id !== id))
  }

  const updateDesignatedItem = (
    id: string,
    field: 'accountId' | 'fundId' | 'amount' | 'description',
    value: string
  ) => {
    setDesignatedItems(designatedItems.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validation
    if (!allDenominationsValid) {
      setError('Invalid denomination values entered. Please ensure each value is a valid multiple of its denomination.')
      setLoading(false)
      return
    }

    // Validate check total if entered
    if (manualCheckTotal && manualCheckTotal !== '') {
      const manualTotal = parseFloat(manualCheckTotal)
      if (isNaN(manualTotal)) {
        setError('Please enter a valid check total amount')
        setLoading(false)
        return
      }
      if (Math.abs(manualTotal - totalChecks) >= 0.01) {
        setError(`Check total mismatch! You entered $${manualTotal.toFixed(2)} but the sum of check entries is $${totalChecks.toFixed(2)}. Please verify your check entries.`)
        setLoading(false)
        return
      }
    }

    // Validate cash total (envelope + loose cash vs counted cash)
    if (totalEnvelopeAndLooseCash > 0 && Math.abs(totalEnvelopeAndLooseCash - totalCash) >= 0.01) {
      setError(`Cash total mismatch! Envelope + loose cash total is $${totalEnvelopeAndLooseCash.toFixed(2)} but the counted cash total is $${totalCash.toFixed(2)}. Please verify your amounts.`)
      setLoading(false)
      return
    }

    if (finalTotalDeposit <= 0) {
      setError('Total deposit must be greater than zero')
      setLoading(false)
      return
    }

    if (!date || !generalFundId || !generalIncomeAccountId) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Validate that general fund deposit is not negative
    if (generalFundDeposit < 0) {
      setError('General fund deposit cannot be negative. Check your missions and designated amounts.')
      setLoading(false)
      return
    }

    try {
      const result = await recordWeeklyDeposit({
        date,
        description: description || 'Weekly deposit',
        checkingAccountId: checkingAccount.id,
        generalFundId,
        generalIncomeAccountId,
        generalFundAmount: generalFundDeposit,
        missionsAmount: missionsTotal,
        missionsFundId: missionsFundId || undefined,
        designatedItems: designatedItems
          .filter((item) => parseFloat(item.amount) > 0)
          .map((item) => ({
            accountId: item.accountId,
            fundId: item.fundId,
            amount: parseFloat(item.amount),
            description: item.description,
          })),
        checks: checks
          .filter((check) => parseFloat(check.amount) > 0)
          .map((check) => ({
            referenceNumber: check.referenceNumber,
            amount: parseFloat(check.amount),
            donorId: check.donorId || undefined,
          })),
        envelopes: envelopes
          .filter((env) => parseFloat(env.amount) > 0)
          .map((env) => ({
            donorId: env.donorId || undefined,
            amount: parseFloat(env.amount),
          })),
      })

      if (result.success) {
        setSuccess(`Deposit recorded successfully! Entry ID: ${result.journalEntryId}`)
        
        // Generate PDF report
        try {
          // Find fund names for allocations
          const fundAllocations = []
          
          // Add general fund allocation
          const generalFund = funds.find(f => f.id === generalFundId)
          if (generalFund && generalFundDeposit > 0) {
            fundAllocations.push({
              fundName: generalFund.name,
              amount: generalFundDeposit,
              isRestricted: generalFund.is_restricted,
            })
          }
          
          // Add missions fund allocation
          if (missionsTotal > 0 && missionsFundId) {
            const missionsFund = funds.find(f => f.id === missionsFundId)
            if (missionsFund) {
              fundAllocations.push({
                fundName: missionsFund.name,
                amount: missionsTotal,
                isRestricted: missionsFund.is_restricted,
              })
            }
          }
          
          // Add designated items allocations
          designatedItems
            .filter(item => parseFloat(item.amount) > 0)
            .forEach(item => {
              const fund = funds.find(f => f.id === item.fundId)
              if (fund) {
                fundAllocations.push({
                  fundName: `${item.description} (${fund.name})`,
                  amount: parseFloat(item.amount),
                  isRestricted: fund.is_restricted,
                })
              }
            })
          
          generateDepositReceiptPDF(
            {
              depositId: result.journalEntryId || 'N/A',
              date,
              description: description || 'Weekly deposit',
              cashBreakdown: {
                hundreds: parseFloat(hundreds) || 0,
                fifties: parseFloat(fifties) || 0,
                twenties: parseFloat(twenties) || 0,
                tens: parseFloat(tens) || 0,
                fives: parseFloat(fives) || 0,
                twos: parseFloat(twos) || 0,
                ones: parseFloat(ones) || 0,
                dollarCoins: parseFloat(dollarCoins) || 0,
                halfDollars: parseFloat(halfDollars) || 0,
                quarters: parseFloat(quarters) || 0,
                dimes: parseFloat(dimes) || 0,
                nickels: parseFloat(nickels) || 0,
                pennies: parseFloat(pennies) || 0,
              },
              checks: checks
                .filter(check => parseFloat(check.amount) > 0)
                .map(check => ({
                  referenceNumber: check.referenceNumber,
                  amount: parseFloat(check.amount),
                })),
              totalCash,
              totalChecks,
              totalEnvelopes,
              looseCash: looseCashAmount,
              fundAllocations,
              finalTotal: finalTotalDeposit,
            },
            'Church Ledger Pro' // You can make this configurable later
          )
          
          setSuccess(`Deposit Saved & Report Generated! Entry ID: ${result.journalEntryId}`)
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError)
          setSuccess(`Deposit recorded successfully! Entry ID: ${result.journalEntryId} (PDF generation failed)`)
        }
        
        // Reset form
        resetForm()
      } else {
        setError(result.error || 'Failed to record deposit')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setHundreds('')
    setFifties('')
    setTwenties('')
    setTens('')
    setFives('')
    setTwos('')
    setOnes('')
    setDollarCoins('')
    setHalfDollars('')
    setQuarters('')
    setDimes('')
    setNickels('')
    setPennies('')
    setChecks([])
    setManualCheckTotal('')
    setEnvelopes([])
    setLooseCash('')
    setMissionsAmount('')
    setDesignatedItems([])
    setDescription('Weekly deposit')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date and Description */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Weekly deposit"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Total Check Amount Input for Verification */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 Total Check Amount (Verification)</h3>
        <p className="text-xs text-gray-600 mb-3">Enter the total check amount to verify against check entries below</p>
        <div className="relative mb-3">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            placeholder="0.00"
            value={manualCheckTotal}
            onChange={(e) => setManualCheckTotal(e.target.value)}
            step="0.01"
            min="0"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {checkTotalMatches === true && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm text-green-800">Check total matches! (${totalChecks.toFixed(2)})</span>
            </div>
          </div>
        )}
        {checkTotalMatches === true && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm text-green-800">Check total matches!</span>
            </div>
          </div>
        )}
      </div>

      {/* Donor & Envelope Tracking */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">✉️ Envelope Cash</h3>
          <div className="flex gap-2">
            <a
              href="/donors/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              + New Donor
            </a>
            <button
              type="button"
              onClick={addEnvelope}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Add Envelope
            </button>
          </div>
        </div>

        {envelopes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No envelopes added yet</p>
        ) : (
          <div className="space-y-2">
            {envelopes.map((envelope) => (
              <div key={envelope.id} className="flex gap-2">
                <select
                  value={envelope.donorId}
                  onChange={(e) => updateEnvelope(envelope.id, 'donorId', e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Donor --</option>
                  {donors.map((donor) => (
                    <option key={donor.id} value={donor.id}>
                      {donor.name} {donor.envelope_number && `(#${donor.envelope_number})`}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={envelope.amount}
                    onChange={(e) => updateEnvelope(envelope.id, 'amount', e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEnvelope(envelope.id)}
                  className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Envelopes:</span>
            <span className="text-lg font-bold text-green-600">${totalEnvelopes.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Loose Cash */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💸 Loose Cash</h3>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            placeholder="0.00"
            value={looseCash}
            onChange={(e) => setLooseCash(e.target.value)}
            step="0.01"
            min="0"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>


      {/* Cash & Coin Counter */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💵 Cash & Coin Counter</h3>
        <p className="text-xs text-gray-600 mb-3">Enter the total value for each denomination</p>
        
        {/* Currency */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Currency</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">$100 Bills</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={hundreds}
                  onChange={(e) => setHundreds(e.target.value)}
                  min="0"
                  step="100"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.hundreds ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.hundreds && hundreds && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $100</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">$50 Bills</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={fifties}
                  onChange={(e) => setFifties(e.target.value)}
                  min="0"
                  step="50"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.fifties ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.fifties && fifties && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $50</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">$20 Bills</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={twenties}
                  onChange={(e) => setTwenties(e.target.value)}
                  min="0"
                  step="20"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.twenties ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.twenties && twenties && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $20</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">$10 Bills</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={tens}
                  onChange={(e) => setTens(e.target.value)}
                  min="0"
                  step="10"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.tens ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.tens && tens && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $10</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">$5 Bills</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={fives}
                  onChange={(e) => setFives(e.target.value)}
                  min="0"
                  step="5"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.fives ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.fives && fives && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $5</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">$2 Bills</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={twos}
                  onChange={(e) => setTwos(e.target.value)}
                  min="0"
                  step="2"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.twos ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.twos && twos && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $2</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">$1 Bills</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={ones}
                  onChange={(e) => setOnes(e.target.value)}
                  min="0"
                  step="1"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.ones ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.ones && ones && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $1</p>
              )}
            </div>
          </div>
        </div>

        {/* Coins */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Coins</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dollar Coins</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={dollarCoins}
                  onChange={(e) => setDollarCoins(e.target.value)}
                  min="0"
                  step="1"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.dollarCoins ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.dollarCoins && dollarCoins && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $1</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Half Dollars</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={halfDollars}
                  onChange={(e) => setHalfDollars(e.target.value)}
                  min="0"
                  step="0.50"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.halfDollars ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.halfDollars && halfDollars && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $0.50</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Quarters</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={quarters}
                  onChange={(e) => setQuarters(e.target.value)}
                  min="0"
                  step="0.25"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.quarters ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.quarters && quarters && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $0.25</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dimes</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={dimes}
                  onChange={(e) => setDimes(e.target.value)}
                  min="0"
                  step="0.10"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.dimes ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.dimes && dimes && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $0.10</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nickels</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={nickels}
                  onChange={(e) => setNickels(e.target.value)}
                  min="0"
                  step="0.05"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.nickels ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.nickels && nickels && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $0.05</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pennies</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  value={pennies}
                  onChange={(e) => setPennies(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    validations.pennies ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>
              {!validations.pennies && pennies && (
                <p className="text-xs text-red-600 mt-0.5">Must be multiple of $0.01</p>
              )}
            </div>
          </div>
        </div>

        {/* Total Cash Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Cash:</span>
            <span className="text-xl font-bold text-blue-600">
              ${totalCash.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Check Entry Table */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">📝 Check Entries</h3>
          <button
            type="button"
            onClick={addCheck}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Check
          </button>
        </div>

        {checks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No checks added yet</p>
        ) : (
          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check.id} className="bg-white p-3 rounded border border-gray-200">
                <div className="grid grid-cols-12 gap-2 items-start">
                  {/* Check Number */}
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Check #</label>
                    <input
                      type="text"
                      placeholder="Check #"
                      value={check.referenceNumber}
                      onChange={(e) => updateCheck(check.id, 'referenceNumber', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Amount */}
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={check.amount}
                        onChange={(e) => updateCheck(check.id, 'amount', e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Donor */}
                  <div className="col-span-5">
                    <label className="block text-xs text-gray-600 mb-1">Donor (Optional - For Records Only)</label>
                    <select
                      value={check.donorId}
                      onChange={(e) => updateCheck(check.id, 'donorId', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Select Donor --</option>
                      {donors.map((donor) => (
                        <option key={donor.id} value={donor.id}>
                          {donor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Remove Button */}
                  <div className="col-span-1 flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => removeCheck(check.id)}
                      className="px-2 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Checks:</span>
            <span className="text-lg font-bold text-green-600">${totalChecks.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Missions Giving */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🌍 Missions Giving</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Missions Fund</label>
            {(() => {
              const missionsFund = funds.find(
                (fund) => fund.name.toLowerCase().includes('mission')
              )
              if (missionsFund) {
                return (
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700">
                    {missionsFund.name} {missionsFund.is_restricted && '(Restricted)'}
                  </div>
                )
              }
              return (
                <div className="w-full px-3 py-2 bg-yellow-50 border border-yellow-300 rounded text-yellow-800 text-sm">
                  No Missions fund found. Please create a fund with "Mission" in the name.
                </div>
              )
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={missionsAmount}
                onChange={(e) => setMissionsAmount(e.target.value)}
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Designated Items */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">🎯 Designated Items</h3>
          <button
            type="button"
            onClick={addDesignatedItem}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Item
          </button>
        </div>

        {designatedItems.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No designated items added yet</p>
        ) : (
          <div className="space-y-3">
            {designatedItems.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded border border-gray-200">
                <div className="grid md:grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Account</label>
                    <select
                      value={item.accountId}
                      onChange={(e) =>
                        updateDesignatedItem(item.id, 'accountId', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {incomeAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_number} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fund</label>
                    <select
                      value={item.fundId}
                      onChange={(e) => updateDesignatedItem(item.id, 'fundId', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {funds.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                          {fund.name} {fund.is_restricted && '(Restricted)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g., Building Fund"
                      value={item.description}
                      onChange={(e) =>
                        updateDesignatedItem(item.id, 'description', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Amount</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => updateDesignatedItem(item.id, 'amount', e.target.value)}
                          step="0.01"
                          min="0"
                          className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeDesignatedItem(item.id)}
                        className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-purple-50 border border-purple-200 rounded-md p-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Designated:</span>
            <span className="text-lg font-bold text-purple-600">
              ${designatedTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* General Fund Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🏦 General Fund Settings</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              General Fund <span className="text-red-500">*</span>
            </label>
            {(() => {
              const generalFund = funds.find(
                (fund) => fund.name.toLowerCase().includes('general')
              )
              if (generalFund) {
                return (
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700">
                    {generalFund.name} {generalFund.is_restricted && '(Restricted)'}
                  </div>
                )
              }
              return (
                <div className="w-full px-3 py-2 bg-yellow-50 border border-yellow-300 rounded text-yellow-800 text-sm">
                  No General fund found. Please create a fund with "General" in the name.
                </div>
              )
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Income Account <span className="text-red-500">*</span>
            </label>
            <select
              value={generalIncomeAccountId}
              onChange={(e) => setGeneralIncomeAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {incomeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} - {account.name}
                </option>
              ))}
            </select>
            {(() => {
              const tithesAccount = incomeAccounts.find(
                (account) => 
                  account.name.toLowerCase().includes('tithes') || 
                  account.name.toLowerCase().includes('offerings') ||
                  account.name.toLowerCase().includes('tithe') ||
                  account.name.toLowerCase().includes('offering')
              )
              if (!tithesAccount) {
                return (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ No Tithes and Offerings account found. Defaulting to first available account.
                  </p>
                )
              }
              return null
            })()}
          </div>
        </div>
      </div>

      {/* Check Total Discrepancy Warning - Only shown if there's a mismatch */}
      {checkTotalMatches === false && manualCheckTotal && manualCheckTotal !== '' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-900 mb-2">Check Total Discrepancy Detected</h4>
              <div className="space-y-1 text-sm text-red-800">
                <p>You entered: <span className="font-semibold">${(parseFloat(manualCheckTotal) || 0).toFixed(2)}</span></p>
                <p>Calculated total from check entries: <span className="font-semibold">${totalChecks.toFixed(2)}</span></p>
                <p className="text-xs mt-2">Please verify your check entries match the total you entered.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Total Discrepancy Warning - Only shown if there's a mismatch */}
      {cashTotalMatches === false && totalEnvelopeAndLooseCash > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-900 mb-2">Cash Total Discrepancy Detected</h4>
              <div className="space-y-1 text-sm text-red-800">
                <p>Envelope + loose cash total: <span className="font-semibold">${totalEnvelopeAndLooseCash.toFixed(2)}</span></p>
                <p>Counted cash total: <span className="font-semibold">${totalCash.toFixed(2)}</span></p>
                <p className="text-xs mt-2">Please verify your envelope and loose cash amounts match the counted cash total.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Deposit Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-300">
            <span className="text-sm font-medium text-gray-700">Total Checks:</span>
            <span className="text-lg font-semibold text-gray-900">${totalChecks.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-300">
            <span className="text-sm font-medium text-gray-700">Total Envelopes:</span>
            <span className="text-lg font-semibold text-gray-900">
              ${totalEnvelopes.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-300">
            <span className="text-sm font-medium text-gray-700">Loose Cash:</span>
            <span className="text-lg font-semibold text-gray-900">
              ${looseCashAmount.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-300">
            <span className="text-sm font-medium text-gray-700">Less: Missions:</span>
            <span className="text-lg font-semibold text-red-600">
              -${missionsTotal.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-300">
            <span className="text-sm font-medium text-gray-700">Less: Designated:</span>
            <span className="text-lg font-semibold text-red-600">
              -${designatedTotal.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3 bg-green-100 px-3 rounded-lg">
            <span className="text-base font-bold text-gray-900">General Fund Deposit:</span>
            <span className="text-2xl font-bold text-green-700">
              ${generalFundDeposit.toFixed(2)}
            </span>
          </div>
          
          {missionsTotal > 0 && (
            <div className="flex justify-between items-center py-3 bg-blue-100 px-3 rounded-lg">
              <span className="text-base font-bold text-gray-900">Missions Deposit:</span>
              <span className="text-2xl font-bold text-blue-700">
                ${missionsTotal.toFixed(2)}
              </span>
            </div>
          )}
          
          {designatedTotal > 0 && (
            <div className="flex justify-between items-center py-3 bg-purple-100 px-3 rounded-lg">
              <span className="text-base font-bold text-gray-900">Designated Deposit:</span>
              <span className="text-2xl font-bold text-purple-700">
                ${designatedTotal.toFixed(2)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-4 bg-gradient-to-r from-yellow-100 to-yellow-200 px-4 rounded-lg border-2 border-yellow-400 mt-4">
            <span className="text-lg font-bold text-gray-900">FINAL TOTAL DEPOSIT:</span>
            <span className="text-3xl font-bold text-yellow-900">
              ${finalTotalDeposit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg font-semibold"
      >
        {loading ? 'Recording Deposit...' : 'Record Weekly Deposit'}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">📘 Double-Entry Logic:</p>
        <ul className="text-xs space-y-1">
          <li>• Debit: {checkingAccount.name} (Total Deposit)</li>
          <li>• Credit: General Fund Income (General portion)</li>
          {missionsTotal > 0 && <li>• Credit: Missions Fund (Missions portion)</li>}
          {designatedTotal > 0 && <li>• Credit: Designated Accounts (Designated portions)</li>}
        </ul>
      </div>
    </form>
  )
}
