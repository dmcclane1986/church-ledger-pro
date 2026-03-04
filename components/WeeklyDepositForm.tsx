'use client'

import { useState, FormEvent, useEffect, useMemo } from 'react'
import { recordWeeklyDeposit } from '@/app/actions/transactions'
import { fetchDonors, createDonor, type Donor } from '@/app/actions/donors'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'
import type { Database } from '@/types/database.types'
import { generateDepositReceiptPDF } from '@/lib/pdf/depositReceipt'
import { getTodayLocalDate } from '@/lib/utils/date'

type Fund = Database['public']['Tables']['funds']['Row']
type Account = Database['public']['Tables']['chart_of_accounts']['Row']

interface WeeklyDepositFormProps {
  funds: Fund[]
  incomeAccounts: Account[]
  checkingAccounts: Account[]
}

interface CheckEntry {
  id: string
  referenceNumber: string
  amount: string
  donorId: string
  fundType: 'general' | 'missions' | 'designated'
  fundId?: string
  accountId?: string
}

interface EnvelopeEntry {
  id: string
  donorId: string
  donorName: string
  envelopeNumber: string
  amount: string
  fundType: 'general' | 'missions' | 'designated'
  fundId?: string
  accountId?: string
}

interface DesignatedEntry {
  id: string
  accountId: string
  fundId: string
  amount: string
  cashAmount: string
  checkAmount: string
  description: string
}

export default function WeeklyDepositForm({
  funds,
  incomeAccounts,
  checkingAccounts,
}: WeeklyDepositFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Account allocations for splitting deposit across multiple accounts
  interface AccountAllocation {
    id: string
    accountId: string
    amount: string
  }
  
  // Find default account (1100 Operations Checking)
  const getDefaultAccountId = () => {
    const defaultAccount = checkingAccounts.find(
      account => account.account_number === 1100 || 
                 account.name.toLowerCase().includes('operations checking')
    )
    return defaultAccount?.id || checkingAccounts[0]?.id || ''
  }
  
  const [accountAllocations, setAccountAllocations] = useState<AccountAllocation[]>([
    { id: '1', accountId: getDefaultAccountId(), amount: '' }
  ])

  // Donor state
  const [donors, setDonors] = useState<Donor[]>([])

  // Form state
  const [date, setDate] = useState(getTodayLocalDate())
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
  const [missionsCashAmount, setMissionsCashAmount] = useState('')
  const [missionsCheckAmount, setMissionsCheckAmount] = useState('')
  const [missionsFundId, setMissionsFundId] = useState('')
  
  // General fund cash/check breakdown
  const [generalFundCashAmount, setGeneralFundCashAmount] = useState('')
  const [generalFundCheckAmount, setGeneralFundCheckAmount] = useState('')

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

  // Update check fundIds when missionsFundId or generalFundId changes
  useEffect(() => {
    setChecks(checks.map(check => {
      if (check.fundType === 'missions' && missionsFundId && check.fundId !== missionsFundId) {
        return { ...check, fundId: missionsFundId }
      }
      if (check.fundType === 'general' && generalFundId && check.fundId !== generalFundId) {
        return { ...check, fundId: generalFundId }
      }
      return check
    }))
  }, [missionsFundId, generalFundId]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Calculate checks by fund type
  const generalFundChecks = useMemo(() => {
    return checks
      .filter(check => check.fundType === 'general' || !check.fundType)
      .reduce((sum, check) => sum + (parseFloat(check.amount) || 0), 0)
  }, [checks])

  const missionsChecks = useMemo(() => {
    return checks
      .filter(check => check.fundType === 'missions')
      .reduce((sum, check) => sum + (parseFloat(check.amount) || 0), 0)
  }, [checks])

  const designatedChecks = useMemo(() => {
    return checks
      .filter(check => check.fundType === 'designated')
      .reduce((sum, check) => sum + (parseFloat(check.amount) || 0), 0)
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

  // Calculate envelopes by fund type
  const generalFundEnvelopes = useMemo(() => {
    return envelopes
      .filter(env => env.fundType === 'general' || !env.fundType)
      .reduce((sum, env) => sum + (parseFloat(env.amount) || 0), 0)
  }, [envelopes])

  const missionsEnvelopes = useMemo(() => {
    return envelopes
      .filter(env => env.fundType === 'missions')
      .reduce((sum, env) => sum + (parseFloat(env.amount) || 0), 0)
  }, [envelopes])

  const designatedEnvelopes = useMemo(() => {
    return envelopes
      .filter(env => env.fundType === 'designated')
      .reduce((sum, env) => sum + (parseFloat(env.amount) || 0), 0)
  }, [envelopes])

  // Calculate loose cash amount
  const looseCashAmount = useMemo(() => {
    return parseFloat(looseCash) || 0
  }, [looseCash])

  // Calculate missions loose cash (from missions section input)
  // This is the loose cash portion only (not including envelopes)
  const missionsLooseCashInput = useMemo(() => {
    return parseFloat(missionsCashAmount) || 0
  }, [missionsCashAmount])

  // Missions cash amount = missions envelopes + missions loose cash
  const missionsCashTotal = useMemo(() => {
    return missionsEnvelopes + missionsLooseCashInput
  }, [missionsEnvelopes, missionsLooseCashInput])

  // Calculate general fund loose cash (loose cash minus missions loose cash)
  // General fund loose cash = total loose cash - missions loose cash
  const generalFundLooseCash = useMemo(() => {
    return Math.max(0, looseCashAmount - missionsLooseCashInput)
  }, [looseCashAmount, missionsLooseCashInput])

  // Calculate total cash breakdown: missions(envelope) + missions(loose) + general
  const calculatedTotalCash = useMemo(() => {
    return missionsEnvelopes + missionsLooseCashInput + generalFundEnvelopes + generalFundLooseCash
  }, [missionsEnvelopes, missionsLooseCashInput, generalFundEnvelopes, generalFundLooseCash])

  // Validate calculated cash total against counted cash
  const cashTotalMatches = useMemo(() => {
    // Only validate if there's actual cash entered
    if (calculatedTotalCash === 0 && totalCash === 0) return null // Both zero, no validation needed
    if (calculatedTotalCash === 0) return null // No cash entered yet
    // Allow small floating point differences (within 0.01)
    return Math.abs(calculatedTotalCash - totalCash) < 0.01
  }, [calculatedTotalCash, totalCash])

  // Calculate missions amount (cash = envelopes + loose) + missions checks
  // Note: missionsCheckAmount field is only for reporting/breakdown, not for calculation
  const missionsTotal = useMemo(() => {
    // Missions cash = missions envelopes + missions loose cash
    return missionsCashTotal + missionsChecks
  }, [missionsCashTotal, missionsChecks])

  // Calculate missions amount that affects general fund
  // Missions envelopes don't count toward general fund
  // Missions cash only affects general fund if it's MORE than missions envelopes
  const missionsAmountForGeneralFund = useMemo(() => {
    const missionsCash = parseFloat(missionsCashAmount) || 0
    // Only count missions cash if it exceeds missions envelopes
    const excessMissionsCash = missionsCash > missionsEnvelopes ? missionsCash - missionsEnvelopes : 0
    return missionsChecks + excessMissionsCash
  }, [missionsCashAmount, missionsChecks, missionsEnvelopes])

  // Calculate designated total (designated items + designated checks + designated envelopes)
  const designatedTotal = useMemo(() => {
    const designatedItemsTotal = designatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    return designatedItemsTotal + designatedChecks + designatedEnvelopes
  }, [designatedItems, designatedChecks, designatedEnvelopes])

  // Calculate total deposit (all checks + envelopes + loose cash)
  const totalDeposit = useMemo(() => {
    return totalChecks + totalEnvelopes + looseCashAmount
  }, [totalChecks, totalEnvelopes, looseCashAmount])

  // Calculate General Fund cash and check amounts
  const calculatedGeneralFundCash = useMemo(() => {
    return generalFundEnvelopes + generalFundLooseCash
  }, [generalFundEnvelopes, generalFundLooseCash])

  const calculatedGeneralFundChecks = useMemo(() => {
    return generalFundChecks
  }, [generalFundChecks])

  // Calculate deposit summary (general fund = total deposit - missions - designated)
  // Total deposit includes cash and checks, so we subtract missions and designated totals
  const generalFundDeposit = useMemo(() => {
    // General fund = Total Deposit (cash + checks) - Missions Total - Designated Total
    // This ensures we account for both cash and checks properly
    return totalDeposit - missionsTotal - designatedTotal
  }, [totalDeposit, missionsTotal, designatedTotal])

  // Auto-update General Fund cash/check amounts if they don't match calculated values
  useEffect(() => {
    const enteredCash = parseFloat(generalFundCashAmount) || 0
    const enteredCheck = parseFloat(generalFundCheckAmount) || 0
    
    // Only auto-update if values are significantly different (more than 0.01)
    if (Math.abs(enteredCash - calculatedGeneralFundCash) > 0.01) {
      setGeneralFundCashAmount(calculatedGeneralFundCash.toFixed(2))
    }
    if (Math.abs(enteredCheck - calculatedGeneralFundChecks) > 0.01) {
      setGeneralFundCheckAmount(calculatedGeneralFundChecks.toFixed(2))
    }
  }, [calculatedGeneralFundCash, calculatedGeneralFundChecks])

  const finalTotalDeposit = useMemo(() => {
    // Final deposit = total of all checks, envelopes, and loose cash
    return totalDeposit
  }, [totalDeposit])

  // Calculate total allocated to accounts
  const totalAccountAllocations = useMemo(() => {
    return accountAllocations.reduce((sum, alloc) => sum + (parseFloat(alloc.amount) || 0), 0)
  }, [accountAllocations])

  // Check if account allocations match final deposit
  const accountAllocationsMatch = useMemo(() => {
    if (finalTotalDeposit === 0) return null // No deposit yet
    return Math.abs(totalAccountAllocations - finalTotalDeposit) < 0.01
  }, [totalAccountAllocations, finalTotalDeposit])

  // Account allocation handlers
  const addAccountAllocation = () => {
    setAccountAllocations([
      ...accountAllocations,
      { id: Date.now().toString(), accountId: getDefaultAccountId(), amount: '' }
    ])
  }

  const removeAccountAllocation = (id: string) => {
    if (accountAllocations.length > 1) {
      setAccountAllocations(accountAllocations.filter(a => a.id !== id))
    }
  }

  const updateAccountAllocation = (id: string, field: 'accountId' | 'amount', value: string) => {
    setAccountAllocations(accountAllocations.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ))
  }

  // Auto-fill first allocation with total if only one account
  useEffect(() => {
    if (accountAllocations.length === 1 && finalTotalDeposit > 0 && !accountAllocations[0].amount) {
      setAccountAllocations([{
        ...accountAllocations[0],
        amount: finalTotalDeposit.toFixed(2)
      }])
    }
  }, [finalTotalDeposit])

  // Check entry handlers
  const addCheck = () => {
    setChecks([...checks, { 
      id: Date.now().toString(), 
      referenceNumber: '', 
      amount: '', 
      donorId: '',
      fundType: 'general',
      fundId: generalFundId,
    }])
  }

  const removeCheck = (id: string) => {
    setChecks(checks.filter((c) => c.id !== id))
  }

  const updateCheck = (
    id: string, 
    field: 'referenceNumber' | 'amount' | 'donorId' | 'fundType' | 'fundId' | 'accountId', 
    value: string
  ) => {
    setChecks(checks.map((c) => {
      if (c.id !== id) return c
      
      const updated = { ...c, [field]: value }
      
      // Auto-set fundId based on fundType
      if (field === 'fundType') {
        if (value === 'general') {
          updated.fundId = generalFundId
          updated.accountId = undefined
        } else if (value === 'missions') {
          updated.fundId = missionsFundId || undefined
          updated.accountId = undefined
        } else if (value === 'designated') {
          // Keep existing fundId/accountId or set defaults
          if (!updated.fundId) updated.fundId = funds[0]?.id || undefined
          if (!updated.accountId) updated.accountId = incomeAccounts[0]?.id || undefined
        }
      }
      
      return updated
    }))
  }

  // Envelope entry handlers
  const addEnvelope = () => {
    setEnvelopes([
      ...envelopes,
      { 
        id: Date.now().toString(), 
        donorId: '', 
        donorName: '', 
        envelopeNumber: '', 
        amount: '',
        fundType: 'general',
        fundId: generalFundId,
      },
    ])
  }

  const removeEnvelope = (id: string) => {
    setEnvelopes(envelopes.filter((e) => e.id !== id))
  }

  const updateEnvelope = (
    id: string,
    field: 'donorId' | 'donorName' | 'envelopeNumber' | 'amount' | 'fundType' | 'fundId' | 'accountId',
    value: string
  ) => {
    setEnvelopes(envelopes.map((e) => {
      if (e.id !== id) return e
      
      const updated = { ...e, [field]: value }
      
      // Auto-set fundId based on fundType
      if (field === 'fundType') {
        if (value === 'general') {
          updated.fundId = generalFundId
          updated.accountId = undefined
        } else if (value === 'missions') {
          updated.fundId = missionsFundId || undefined
          updated.accountId = undefined
        } else if (value === 'designated') {
          // Keep existing fundId/accountId or set defaults
          if (!updated.fundId) updated.fundId = funds[0]?.id || undefined
          if (!updated.accountId) updated.accountId = incomeAccounts[0]?.id || undefined
        }
      }
      
      return updated
    }))
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
        cashAmount: '',
        checkAmount: '',
        description: '',
      },
    ])
  }

  const removeDesignatedItem = (id: string) => {
    setDesignatedItems(designatedItems.filter((i) => i.id !== id))
  }

  const updateDesignatedItem = (
    id: string,
    field: 'accountId' | 'fundId' | 'amount' | 'cashAmount' | 'checkAmount' | 'description',
    value: string
  ) => {
    setDesignatedItems(designatedItems.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
    
    // Auto-calculate total amount from cash + check if both are filled
    if (field === 'cashAmount' || field === 'checkAmount') {
      const item = designatedItems.find(i => i.id === id)
      if (item) {
        const cash = field === 'cashAmount' ? parseFloat(value) || 0 : parseFloat(item.cashAmount) || 0
        const check = field === 'checkAmount' ? parseFloat(value) || 0 : parseFloat(item.checkAmount) || 0
        const total = cash + check
        setDesignatedItems(designatedItems.map((i) => 
          i.id === id ? { ...i, [field]: value, amount: total > 0 ? total.toFixed(2) : '' } : i
        ))
      }
    }
  }
  
  // Auto-calculate general fund cash/check totals
  useEffect(() => {
    const cash = parseFloat(generalFundCashAmount) || 0
    const check = parseFloat(generalFundCheckAmount) || 0
    const total = cash + check
    // Don't auto-update if user is manually entering amounts
  }, [generalFundCashAmount, generalFundCheckAmount])
  
  // Auto-calculate missions total (cash = envelopes + loose) + checks
  useEffect(() => {
    const cash = missionsCashTotal
    const check = parseFloat(missionsCheckAmount) || 0
    const total = cash + check
    if (total > 0 && Math.abs(total - (parseFloat(missionsAmount) || 0)) > 0.01) {
      setMissionsAmount(total.toFixed(2))
    }
  }, [missionsCashTotal, missionsCheckAmount, missionsAmount])

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

    // Validate cash total: missions(envelope) + missions(loose) + general = counted cash
    if (calculatedTotalCash > 0 && Math.abs(calculatedTotalCash - totalCash) >= 0.01) {
      setError(`Cash total mismatch! Calculated total (Missions envelopes: $${missionsEnvelopes.toFixed(2)} + Missions loose: $${missionsLooseCashInput.toFixed(2)} + General envelopes: $${generalFundEnvelopes.toFixed(2)} + General loose: $${generalFundLooseCash.toFixed(2)} = $${calculatedTotalCash.toFixed(2)}) does not match counted cash total ($${totalCash.toFixed(2)}). Please verify your amounts.`)
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

    // Validate checks have required fields based on fund type
    for (const check of checks) {
      if (parseFloat(check.amount) > 0) {
        if (check.fundType === 'missions' && (!check.fundId || !missionsFundId)) {
          setError(`Check #${check.referenceNumber || 'unnamed'}: Missions fund must be selected`)
          setLoading(false)
          return
        }
        if (check.fundType === 'designated' && (!check.fundId || !check.accountId)) {
          setError(`Check #${check.referenceNumber || 'unnamed'}: Designated checks must have both fund and account selected`)
          setLoading(false)
          return
        }
      }
    }

    // Validate envelopes have required fields based on fund type
    for (const envelope of envelopes) {
      if (parseFloat(envelope.amount) > 0) {
        if (envelope.fundType === 'missions' && (!envelope.fundId || !missionsFundId)) {
          setError(`Envelope donation: Missions fund must be selected`)
          setLoading(false)
          return
        }
        if (envelope.fundType === 'designated' && (!envelope.fundId || !envelope.accountId)) {
          setError(`Envelope donation: Designated envelopes must have both fund and account selected`)
          setLoading(false)
          return
        }
      }
    }

    // Validate that general fund deposit is not negative (missions + designated cannot exceed total deposit)
    if (generalFundDeposit < 0) {
      setError(`General fund deposit cannot be negative. Missions ($${missionsTotal.toFixed(2)}) + Designated ($${designatedTotal.toFixed(2)}) = $${(missionsTotal + designatedTotal).toFixed(2)}, which exceeds total deposit ($${totalDeposit.toFixed(2)}). Please verify your amounts.`)
      setLoading(false)
      return
    }

    try {
      const result = await recordWeeklyDeposit({
        date,
        description: description || 'Weekly deposit',
        accountAllocations: accountAllocations
          .filter(alloc => parseFloat(alloc.amount) > 0)
          .map(alloc => ({
            accountId: alloc.accountId,
            amount: parseFloat(alloc.amount)
          })),
        generalFundId,
        generalIncomeAccountId,
        generalFundAmount: generalFundDeposit,
        generalFundCashAmount: calculatedGeneralFundCash || undefined,
        generalFundCheckAmount: calculatedGeneralFundChecks || undefined,
        missionsAmount: missionsTotal,
        missionsCashAmount: missionsCashTotal || undefined,
        missionsCheckAmount: parseFloat(missionsCheckAmount) || undefined,
        missionsFundId: missionsFundId || undefined,
        designatedItems: designatedItems
          .filter((item: any) => parseFloat(item.amount) > 0)
          .map((item: any) => ({
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
            fundType: check.fundType,
            fundId: check.fundId || undefined,
            accountId: check.accountId || undefined,
          })),
        envelopes: envelopes
          .filter((env) => parseFloat(env.amount) > 0)
          .map((env) => ({
            donorId: env.donorId || undefined,
            amount: parseFloat(env.amount),
            fundType: env.fundType,
            fundId: env.fundId || undefined,
            accountId: env.accountId || undefined,
          })),
      })

      if (result.success) {
        setSuccess(`Deposit recorded successfully! Entry ID: ${result.journalEntryId}`)
        
        // Generate PDF report
        try {
          // Find fund names for allocations
          const fundAllocations = []
          
          // Helper function to parse amount - returns number if valid (including 0), undefined if empty
          const parseAmount = (value: string): number | undefined => {
            if (!value || value.trim() === '') return undefined
            const parsed = parseFloat(value)
            return isNaN(parsed) ? undefined : parsed
          }
          
          // Add general fund allocation
          const generalFund = funds.find(f => f.id === generalFundId)
          if (generalFund && generalFundDeposit > 0) {
            fundAllocations.push({
              fundName: generalFund.name,
              amount: generalFundDeposit,
              cashAmount: parseAmount(calculatedGeneralFundCash.toString()),
              checkAmount: parseAmount(calculatedGeneralFundChecks.toString()),
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
                cashAmount: parseAmount(missionsCashTotal.toString()),
                checkAmount: parseAmount(missionsCheckAmount),
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
                  cashAmount: parseAmount(item.cashAmount || ''),
                  checkAmount: parseAmount(item.checkAmount || ''),
                  isRestricted: fund.is_restricted,
                })
              }
            })
          
          // Fetch church settings for PDF header
          const settings = await getChurchSettings()
          const address = await getFormattedChurchAddress()
          
          // Prepare account allocations for PDF
          const accountAllocationsForPDF = accountAllocations
            .filter(alloc => parseFloat(alloc.amount) > 0)
            .map(alloc => {
              const account = checkingAccounts.find(a => a.id === alloc.accountId)
              return {
                accountNumber: account?.account_number || 0,
                accountName: account?.name || 'Unknown Account',
                amount: parseFloat(alloc.amount),
              }
            })
          
          generateDepositReceiptPDF({
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
            accountAllocations: accountAllocationsForPDF.length > 1 ? accountAllocationsForPDF : undefined,
            finalTotal: finalTotalDeposit,
            logoUrl: settings.data?.logo_url || null,
            churchName: settings.data?.organization_name || 'Church Ledger Pro',
            churchAddress: address || undefined,
          })
          
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
    // Reset date to today
    setDate(getTodayLocalDate())
    // Reset description
    setDescription('Weekly deposit')
    
    // Reset denomination counters
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
    
    // Reset checks
    setChecks([])
    setManualCheckTotal('')
    
    // Reset envelopes
    setEnvelopes([])
    
    // Reset loose cash
    setLooseCash('')
    
    // Reset missions fields
    setMissionsAmount('')
    setMissionsCashAmount('')
    setMissionsCheckAmount('')
    setMissionsFundId('')
    
    // Reset general fund cash/check amounts (these are auto-calculated but should be cleared)
    setGeneralFundCashAmount('')
    setGeneralFundCheckAmount('')
    
    // Reset designated items
    setDesignatedItems([])
    
    // Reset account allocations to default
    setAccountAllocations([
      { id: '1', accountId: getDefaultAccountId(), amount: '' }
    ])
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

      {/* Section: Checks and Loose Cash - Side by Side */}
      <div className="grid md:grid-cols-2 gap-6 border-t-2 border-gray-300 pt-6">
        {/* Checks Column */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">💳 Checks</h2>
          
          {/* Total Check Amount Input for Verification */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
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
            {checkTotalMatches === false && manualCheckTotal && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2">
                <div className="flex items-center gap-2">
                  <span className="text-red-600">⚠</span>
                  <span className="text-sm text-red-800">Check total doesn't match entries</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loose Cash Column */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">💵 Loose Cash</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">💸 Loose Cash</h3>
            <p className="text-xs text-gray-600 mb-3">Non envelope cash</p>
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
        </div>
      </div>

      {/* Section: Check Entries - Full Width */}
      <div className="border-t-2 border-gray-300 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Check Entries</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Check Entries</h3>
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
                    <div className="col-span-2">
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
                    <div className="col-span-2">
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
                    
                    {/* Fund Type */}
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Fund Type</label>
                      <select
                        value={check.fundType}
                        onChange={(e) => updateCheck(check.id, 'fundType', e.target.value)}
                        className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="general">General Fund</option>
                        <option value="missions">Missions</option>
                        <option value="designated">Designated</option>
                      </select>
                    </div>
                    
                    {/* Designated Fund and Account (only show if designated is selected) */}
                    {check.fundType === 'designated' && (
                      <>
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-600 mb-1">Designated Fund</label>
                          <select
                            value={check.fundId || ''}
                            onChange={(e) => updateCheck(check.id, 'fundId', e.target.value)}
                            className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Select Fund --</option>
                            {funds.map((fund) => (
                              <option key={fund.id} value={fund.id}>
                                {fund.name} {fund.is_restricted && '(Restricted)'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-600 mb-1">Designated Account</label>
                          <select
                            value={check.accountId || ''}
                            onChange={(e) => updateCheck(check.id, 'accountId', e.target.value)}
                            className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Select Account --</option>
                            {incomeAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    
                    {/* Donor */}
                    <div className={check.fundType === 'designated' ? 'col-span-3' : 'col-span-5'}>
                      <label className="block text-xs text-gray-600 mb-1">Donor (For Tax Records)</label>
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
      </div>

      {/* Section: Envelopes */}
      <div className="border-t-2 border-gray-300 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">✉️ Envelopes</h2>
        
        {/* Donor & Envelope Tracking */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Envelope Cash</h3>
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
                <select
                  value={envelope.fundType || 'general'}
                  onChange={(e) => updateEnvelope(envelope.id, 'fundType', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ width: '120px' }}
                >
                  <option value="general">General</option>
                  <option value="missions">Missions</option>
                  <option value="designated">Designated</option>
                </select>
                {envelope.fundType === 'designated' && (
                  <>
                    <select
                      value={envelope.fundId || ''}
                      onChange={(e) => updateEnvelope(envelope.id, 'fundId', e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ width: '120px' }}
                    >
                      <option value="">-- Fund --</option>
                      {funds.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                          {fund.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={envelope.accountId || ''}
                      onChange={(e) => updateEnvelope(envelope.id, 'accountId', e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ width: '120px' }}
                    >
                      <option value="">-- Account --</option>
                      {incomeAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
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
      </div>

      {/* Section: Cash & Coin Counter */}
      <div className="border-t-2 border-gray-300 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">💵 Cash & Coin Counter</h2>
        
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
      {/* Section: Fund Allocations */}
      <div className="border-t-2 border-gray-300 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 Fund Allocations</h2>
        
        {/* Missions Giving */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🌍 Missions Giving</h3>
        
        {/* Cash/Check Breakdown - Moved to top */}
        <div className="bg-white p-3 rounded border border-gray-300 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cash/Check Breakdown</label>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cash Amount (Envelopes + Loose)</label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={missionsCashTotal.toFixed(2)}
                  readOnly
                  className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div className="mt-1 text-xs text-gray-600">
                <span>Envelopes: ${missionsEnvelopes.toFixed(2)}</span>
                <span className="ml-2">+ Loose: ${missionsLooseCashInput.toFixed(2)}</span>
              </div>
              <div className="mt-1">
                <label className="block text-xs text-gray-600 mb-1">Loose Cash Only</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={missionsCashAmount}
                    onChange={(e) => {
                      setMissionsCashAmount(e.target.value)
                      const looseCash = parseFloat(e.target.value) || 0
                      const cash = missionsEnvelopes + looseCash
                      const check = parseFloat(missionsCheckAmount) || 0
                      setMissionsAmount((cash + check).toFixed(2))
                    }}
                    step="0.01"
                    min="0"
                    className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Check Amount</label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={missionsCheckAmount}
                  onChange={(e) => {
                    setMissionsCheckAmount(e.target.value)
                    const cash = parseFloat(missionsCashAmount) || 0
                    const check = parseFloat(e.target.value) || 0
                    setMissionsAmount((cash + check).toFixed(2))
                  }}
                  step="0.01"
                  min="0"
                  className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
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
            {designatedItems.map((item: any) => (
              <div key={item.id} className="bg-white p-3 rounded border border-gray-200">
                {/* Cash/Check Breakdown - Moved to top */}
                <div className="bg-gray-50 p-2 rounded border border-gray-200 mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cash/Check Breakdown</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cash</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={item.cashAmount || ''}
                          onChange={(e) => updateDesignatedItem(item.id, 'cashAmount', e.target.value)}
                          step="0.01"
                          min="0"
                          className="w-full pl-5 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Check</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={item.checkAmount || ''}
                          onChange={(e) => updateDesignatedItem(item.id, 'checkAmount', e.target.value)}
                          step="0.01"
                          min="0"
                          className="w-full pl-5 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
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
                <div className="grid md:grid-cols-2 gap-2 mb-2">
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
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Total Amount</label>
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
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeDesignatedItem(item.id)}
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    ✕ Remove
                  </button>
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
      </div>

      {/* General Fund Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🏦 General Fund Settings</h3>
        
        {/* General Fund Cash/Check Breakdown - Moved to top */}
        <div className="bg-white p-3 rounded border border-gray-300 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">General Fund Cash/Check Breakdown</label>
          <p className="text-xs text-gray-600 mb-2">Specify how much of the General Fund deposit is cash vs checks</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cash Amount (Envelopes + Loose)</label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={calculatedGeneralFundCash.toFixed(2)}
                  readOnly
                  className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div className="mt-1 text-xs text-gray-600">
                <span>Envelopes: ${generalFundEnvelopes.toFixed(2)}</span>
                <span className="ml-2">+ Loose: ${generalFundLooseCash.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Check Amount</label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={calculatedGeneralFundChecks.toFixed(2)}
                  readOnly
                  className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                />
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <p>General Fund Total: <span className="font-semibold">${generalFundDeposit.toFixed(2)}</span></p>
            <p>Cash + Check Calculated: <span className="font-semibold">${(calculatedGeneralFundCash + calculatedGeneralFundChecks).toFixed(2)}</span></p>
            {Math.abs((calculatedGeneralFundCash + calculatedGeneralFundChecks) - generalFundDeposit) > 0.01 && (
              <p className="text-red-600 font-semibold mt-1">
                ⚠️ Cash + Check (${(calculatedGeneralFundCash + calculatedGeneralFundChecks).toFixed(2)}) does not match General Fund Total (${generalFundDeposit.toFixed(2)})
              </p>
            )}
          </div>
        </div>
        
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
      </div>

      {/* Cash Total Discrepancy Warning - Only shown if there's a mismatch */}
      {cashTotalMatches === false && calculatedTotalCash > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-900 mb-2">Cash Total Discrepancy Detected</h4>
              <div className="space-y-1 text-sm text-red-800">
                <p>Missions envelopes: <span className="font-semibold">${missionsEnvelopes.toFixed(2)}</span></p>
                <p>Missions loose cash: <span className="font-semibold">${missionsLooseCashInput.toFixed(2)}</span></p>
                <p>Missions cash total (envelopes + loose): <span className="font-semibold">${missionsCashTotal.toFixed(2)}</span></p>
                <p>General envelopes: <span className="font-semibold">${generalFundEnvelopes.toFixed(2)}</span></p>
                <p>General loose cash: <span className="font-semibold">${generalFundLooseCash.toFixed(2)}</span></p>
                <p className="mt-2">Calculated total: <span className="font-semibold">${calculatedTotalCash.toFixed(2)}</span></p>
                <p>Counted cash total: <span className="font-semibold">${totalCash.toFixed(2)}</span></p>
                <p className="text-xs mt-2">Please verify your amounts match the counted cash total.</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Section: Account Distribution */}
      <div className="border-t-2 border-gray-300 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🏦 Account Distribution</h2>
        
        {/* Account Allocations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Account Allocations</h3>
          <button
            type="button"
            onClick={addAccountAllocation}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Account
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Specify how much of the deposit goes to each account. Total must equal the final deposit amount above.
        </p>

        <div className="space-y-3">
          {accountAllocations.map((alloc, index) => (
            <div key={alloc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account {index + 1}
                </label>
                <select
                  value={alloc.accountId}
                  onChange={(e) => updateAccountAllocation(alloc.id, 'accountId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {checkingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_number} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={alloc.amount}
                    onChange={(e) => updateAccountAllocation(alloc.id, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {accountAllocations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAccountAllocation(alloc.id)}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Allocation Summary */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Allocated:</span>
            <span className={`text-lg font-bold ${
              accountAllocationsMatch === false ? 'text-red-600' : 
              accountAllocationsMatch === true ? 'text-green-600' : 
              'text-gray-900'
            }`}>
              ${totalAccountAllocations.toFixed(2)}
            </span>
          </div>
          {accountAllocationsMatch === false && (
            <p className="text-xs text-red-600 mt-1">
              Must equal ${finalTotalDeposit.toFixed(2)} (difference: ${Math.abs(totalAccountAllocations - finalTotalDeposit).toFixed(2)})
            </p>
          )}
          {accountAllocationsMatch === true && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Allocations match deposit total
            </p>
          )}
        </div>
        </div>
      </div>

      {/* Deposit Summary - At the bottom */}
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
          
          {missionsTotal > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-300">
              <span className="text-sm font-medium text-gray-700">Less: Missions:</span>
              <span className="text-lg font-semibold text-red-600">
                -${missionsTotal.toFixed(2)}
              </span>
            </div>
          )}
          
          {designatedTotal > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-300">
              <span className="text-sm font-medium text-gray-700">Less: Designated:</span>
              <span className="text-lg font-semibold text-red-600">
                -${designatedTotal.toFixed(2)}
              </span>
            </div>
          )}
          
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

          {/* Validation Status */}
          {accountAllocationsMatch === false && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                ⚠️ Account allocations (${totalAccountAllocations.toFixed(2)}) must equal final deposit (${finalTotalDeposit.toFixed(2)})
              </p>
            </div>
          )}
          {accountAllocationsMatch === true && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✓ Account allocations match deposit total
              </p>
            </div>
          )}
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
          <li>• Debit: Selected Account(s) - Deposit split across accounts based on allocations</li>
          <li>• Credit: General Fund Income (General portion)</li>
          {missionsTotal > 0 && <li>• Credit: Missions Fund (Missions portion)</li>}
          {designatedTotal > 0 && <li>• Credit: Designated Accounts (Designated portions)</li>}
        </ul>
      </div>
    </form>
  )
}
