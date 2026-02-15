'use client'

import { useState, useEffect } from 'react'
import { getTodayLocalDate } from '@/lib/utils/date'
import { getChurchSettings } from '@/app/actions/settings'

export default function CheckWriterPage() {
  const [payee, setPayee] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getTodayLocalDate())
  const [memo, setMemo] = useState('')
  const [churchName, setChurchName] = useState('Church Ledger Pro')
  // Add print styles to hide browser headers/footers and navigation
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        @page {
          margin: 0;
          size: letter;
        }
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 8.5in !important;
          height: 11in !important;
          overflow: hidden !important;
        }
        nav,
        header,
        footer,
        aside {
          display: none !important;
        }
        /* Hide all elements with print:hidden class */
        [class*="print:hidden"],
        [class*="print\\:hidden"] {
          display: none !important;
        }
        /* Hide all children of print-reset except print-only */
        .print-reset > *:not(.print-only) {
          display: none !important;
        }
        .print-only {
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 8.5in !important;
          height: 11in !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 9999 !important;
        }
      }
    `
    style.setAttribute('data-check-print', 'true')
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.head.querySelector('style[data-check-print]')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  // Fetch church name
  useEffect(() => {
    const loadChurchName = async () => {
      try {
        const settings = await getChurchSettings()
        if (settings.success && settings.data?.organization_name) {
          setChurchName(settings.data.organization_name)
        }
      } catch (error) {
        console.error('Failed to load church name:', error)
      }
    }
    loadChurchName()
  }, [])

  // Convert number to words
  const numberToWords = (num: number): string => {
    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ]
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    if (num === 0) return 'Zero'

    if (num < 20) {
      return ones[num]
    }

    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ones[num % 10] : '')
    }

    if (num < 1000) {
      return (
        ones[Math.floor(num / 100)] +
        ' Hundred' +
        (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '')
      )
    }

    if (num < 1000000) {
      return (
        numberToWords(Math.floor(num / 1000)) +
        ' Thousand' +
        (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '')
      )
    }

    if (num < 1000000000) {
      return (
        numberToWords(Math.floor(num / 1000000)) +
        ' Million' +
        (num % 1000000 !== 0 ? ' ' + numberToWords(num % 1000000) : '')
      )
    }

    return 'Amount too large'
  }

  // Format amount in words (e.g., "One Hundred and 00/100")
  const formatAmountInWords = (amountStr: string): string => {
    if (!amountStr || amountStr === '') return ''
    
    const num = parseFloat(amountStr)
    if (isNaN(num) || num < 0) return ''

    const dollars = Math.floor(num)
    const cents = Math.round((num - dollars) * 100)

    let result = numberToWords(dollars)
    if (dollars === 1) {
      result += ' Dollar'
    } else {
      result += ' Dollars'
    }

    // Add cents as fraction
    const centsStr = cents.toString().padStart(2, '0')
    result += ` and ${centsStr}/100`

    return result
  }

  const amountInWords = formatAmountInWords(amount)
  const numericAmount = amount ? parseFloat(amount).toFixed(2) : '0.00'
  const formattedDate = date ? (() => {
    const d = new Date(date + 'T00:00:00')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${month}/${day}/${year}`
  })() : ''

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="print-reset">
      {/* Section A: Input Form (Hidden when printing) */}
      <div className="print:hidden max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Check Writer</h1>

          <div className="space-y-4">
            <div>
              <label htmlFor="payee" className="block text-sm font-medium text-gray-700 mb-1">
                Payee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="payee"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Enter payee name"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="0.00"
              />
              {amountInWords && (
                <p className="mt-2 text-sm text-gray-600 font-mono">
                  <strong>Amount in words:</strong> {amountInWords}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
                Memo
              </label>
              <input
                type="text"
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Optional memo/description"
              />
            </div>

            <button
              onClick={handlePrint}
              disabled={!payee || !amount || !date}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              Print Check
            </button>
          </div>
        </div>
      </div>

      {/* Section B: Print Layout (Hidden on screen, visible when printing) */}
      <div className="hidden print:block print:absolute print:top-0 print:left-0 w-[8.5in] h-[11in] print-only">
        {/* Check (Top 3.5 inches) */}
        <div className="absolute top-0 left-0 w-[8.5in] h-[3.5in] border border-gray-400">
          {/* Church Name: top-[0.3in] left-[0.5in] */}
          <div className="absolute top-[0.3in] left-[0.5in] font-mono text-lg font-bold">
            {churchName}
          </div>

          {/* Date: top-[0.5in] left-[6.5in] */}
          <div className="absolute top-[0.5in] left-[6.5in] font-mono text-sm">
            {formattedDate}
          </div>

          {/* Payee: top-[1.1in] left-[1in] */}
          <div className="absolute top-[1.1in] left-[1in] font-mono text-base font-bold">
            {payee || '_________________________'}
          </div>

          {/* Amount (Numeric): top-[1.1in] left-[6.5in] */}
          <div className="absolute top-[1.1in] left-[6.5in] font-mono text-base font-bold">
            ${numericAmount}
          </div>

          {/* Amount (Words): top-[1.5in] left-[1in] */}
          <div className="absolute top-[1.5in] left-[1in] font-mono text-sm">
            {amountInWords || '________________________________________________'}
          </div>

          {/* Memo (without label): top-[2.8in] left-[1in] */}
          {memo && (
            <div className="absolute top-[2.8in] left-[1in] font-mono text-sm">
              {memo}
            </div>
          )}
        </div>

        {/* Voucher 1 (Middle) - top-[3.5in] */}
        <div className="absolute top-[3.5in] left-0 w-[8.5in] h-[3.5in] border border-gray-400">
          {/* Church Name: top-[0.3in] left-[0.5in] */}
          <div className="absolute top-[0.3in] left-[0.5in] font-mono text-lg font-bold">
            {churchName}
          </div>

          {/* Date: top-[0.5in] left-[6.5in] */}
          <div className="absolute top-[0.5in] left-[6.5in] font-mono text-sm">
            {formattedDate}
          </div>

          {/* Payee: top-[1.1in] left-[1in] */}
          <div className="absolute top-[1.1in] left-[1in] font-mono text-base font-bold">
            {payee || '_________________________'}
          </div>

          {/* Amount (Numeric): top-[1.1in] left-[6.5in] */}
          <div className="absolute top-[1.1in] left-[6.5in] font-mono text-base font-bold">
            ${numericAmount}
          </div>

          {/* Amount (Words): top-[1.5in] left-[1in] */}
          <div className="absolute top-[1.5in] left-[1in] font-mono text-sm">
            {amountInWords || '________________________________________________'}
          </div>

          {/* Memo (without label): top-[2.8in] left-[1in] */}
          {memo && (
            <div className="absolute top-[2.8in] left-[1in] font-mono text-sm">
              {memo}
            </div>
          )}

          {/* FOR YOUR RECORDS Box - bottom-right */}
          <div className="absolute bottom-[0.2in] right-[0.5in] border border-black px-6 py-3 font-mono text-base font-bold">
            FOR YOUR RECORDS
          </div>
        </div>

        {/* Voucher 2 (Bottom) - top-[7in] */}
        <div className="absolute top-[7in] left-0 w-[8.5in] h-[3.5in] border border-gray-400">
          {/* Church Name: top-[0.3in] left-[0.5in] */}
          <div className="absolute top-[0.3in] left-[0.5in] font-mono text-lg font-bold">
            {churchName}
          </div>

          {/* Date: top-[0.5in] left-[6.5in] */}
          <div className="absolute top-[0.5in] left-[6.5in] font-mono text-sm">
            {formattedDate}
          </div>

          {/* Payee: top-[1.1in] left-[1in] */}
          <div className="absolute top-[1.1in] left-[1in] font-mono text-base font-bold">
            {payee || '_________________________'}
          </div>

          {/* Amount (Numeric): top-[1.1in] left-[6.5in] */}
          <div className="absolute top-[1.1in] left-[6.5in] font-mono text-base font-bold">
            ${numericAmount}
          </div>

          {/* Amount (Words): top-[1.5in] left-[1in] */}
          <div className="absolute top-[1.5in] left-[1in] font-mono text-sm">
            {amountInWords || '________________________________________________'}
          </div>

          {/* Memo (without label): top-[2.8in] left-[1in] */}
          {memo && (
            <div className="absolute top-[2.8in] left-[1in] font-mono text-sm">
              {memo}
            </div>
          )}

          {/* FOR CHURCH RECORDS Box - bottom-right */}
          <div className="absolute bottom-[0.2in] right-[0.5in] border border-black px-6 py-3 font-mono text-base font-bold">
            FOR CHURCH RECORDS
          </div>
        </div>
      </div>
    </div>
  )
}
