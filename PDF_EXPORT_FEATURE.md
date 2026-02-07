# PDF Export Feature - Complete Guide

## Overview

All financial reports in Church Ledger Pro now include a **"Print Report" button** that generates professional PDF downloads with your church logo and branding.

## Features

✅ **Professional PDF Generation**
- Church logo in header
- Church name and address
- Report title and date
- Properly formatted tables
- Color-coded sections
- Footer with generation date

✅ **Reports with PDF Export**
- Balance Sheet
- Income Statement
- Annual Donor Statements (already had this)

✅ **Automatic Branding**
- Uses church settings (logo, name, address)
- Consistent formatting across all reports
- Professional appearance for printing or sharing

## How to Use

### Generate a PDF Report

1. Navigate to any financial report:
   - **Reports** → **Balance Sheet**
   - **Reports** → **Income Statement**

2. Click the **"Print Report"** button in the top-right corner

3. PDF is automatically generated and downloaded to your computer

4. File names include report type and date:
   - `Balance-Sheet-2026-02-07.pdf`
   - `Income-Statement-February-2026.pdf`

## PDF Contents

### Balance Sheet PDF

**Header:**
- Church logo
- Church name and address
- Report title: "Balance Sheet"
- Subtitle: "Statement of Financial Position"
- Report date

**Sections:**
1. **Fund Balances** - Summary table of all funds
2. **Assets** - All asset accounts with totals
3. **Liabilities** - All liability accounts with totals
4. **Net Assets (Equity)** - All equity accounts with totals

**Footer:**
- Generation date
- "Church Ledger Pro" watermark

### Income Statement PDF

**Header:**
- Church logo
- Church name and address
- Report title: "Income Statement"
- Subtitle: "Statement of Activities"
- Report period (Month Year)

**Sections:**
1. **Revenue** - All income accounts with totals (green)
2. **Expenses** - All expense accounts with totals (red)
3. **Net Income** - Calculated net income/loss (green if positive, red if negative)

**Footer:**
- Generation date
- "Church Ledger Pro" watermark

## Technical Details

### PDF Generation Library
- **jsPDF** - PDF document creation
- **jsPDF-autoTable** - Professional table formatting

### PDF Utility
**File**: `lib/pdf/report-generator.ts`

Provides reusable functions:
- `addPDFHeader()` - Add professional header with logo
- `addPDFFooter()` - Add footer with date
- `formatCurrency()` - Format currency values
- `formatDate()` - Format dates
- `defaultTableStyles` - Consistent table styling

### Adding PDF Export to New Reports

**Example:**

```typescript
'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addPDFHeader, addPDFFooter, formatCurrency, defaultTableStyles } from '@/lib/pdf/report-generator'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'

export default function MyReport() {
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState(null) // Your report data
  
  const exportToPDF = async () => {
    if (!data) return
    
    setExporting(true)
    try {
      const doc = new jsPDF()
      const settings = await getChurchSettings()
      const address = await getFormattedChurchAddress()
      
      // Add header
      const yPosition = await addPDFHeader(doc, {
        logoUrl: settings.data?.logo_url || null,
        churchName: settings.data?.organization_name || 'Church Ledger Pro',
        churchAddress: address,
        reportTitle: 'My Report Title',
        reportSubtitle: 'Report Description',
        reportDate: `As of ${new Date().toLocaleDateString()}`
      })
      
      let currentY = yPosition
      
      // Add your content
      autoTable(doc, {
        startY: currentY,
        head: [['Column 1', 'Column 2', 'Column 3']],
        body: [
          ['Row 1 Data', 'Value 1', formatCurrency(100)],
          ['Row 2 Data', 'Value 2', formatCurrency(200)],
        ],
        ...defaultTableStyles
      })
      
      // Add footer
      addPDFFooter(doc)
      
      // Save PDF
      doc.save(`My-Report-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }
  
  return (
    <div>
      <button
        onClick={exportToPDF}
        disabled={exporting}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        {exporting ? 'Generating PDF...' : 'Print Report'}
      </button>
      {/* Your report content */}
    </div>
  )
}
```

## Color Scheme

The PDFs use consistent color coding:

| Section | Color | RGB |
|---------|-------|-----|
| Default Headers | Blue | [41, 128, 185] |
| Assets | Light Blue | [52, 152, 219] |
| Revenue | Green | [46, 204, 113] |
| Liabilities | Red | [231, 76, 60] |
| Expenses | Red | [231, 76, 60] |
| Fund Balances | Blue | [41, 128, 185] |

## Button Styling

The "Print Report" button includes:
- Printer icon
- "Print Report" text
- Loading state with spinner
- Disabled state while generating
- Blue gradient background
- Shadow effect
- Smooth transitions

## Troubleshooting

### PDF Not Downloading

1. **Check browser pop-up blocker**
   - Allow pop-ups for your site
   - Try again

2. **Check browser console**
   - Press F12 to open DevTools
   - Look for error messages
   - Share error details if needed

3. **Logo not loading in PDF**
   - Logo must be accessible (public URL)
   - CORS must allow image loading
   - Falls back to text-only header if logo fails

### PDF Formatting Issues

**Text cut off:**
- Adjust margins in `lib/pdf/report-generator.ts`
- Default margins are 20mm

**Tables not fitting:**
- Reduce font size in `defaultTableStyles`
- Adjust column widths in autoTable options

**Logo too large/small:**
- Adjust `logoSize` constant in `addPDFHeader()`
- Default is 20mm x 20mm

## Future Enhancements

Potential additions for PDF exports:

### Additional Reports:
- [ ] Quarterly Income Statement PDF
- [ ] Fund Summary Report PDF
- [ ] Transaction History PDF
- [ ] Budget Variance PDF
- [ ] Donor Statements (already implemented)

### PDF Features:
- [ ] Landscape orientation option
- [ ] Page numbers
- [ ] Multi-page reports with repeated headers
- [ ] Summary page
- [ ] Charts and graphs
- [ ] Email PDF directly
- [ ] Batch export all reports
- [ ] Custom date ranges
- [ ] Filter options in PDF

### Advanced Features:
- [ ] PDF templates
- [ ] Custom branding colors
- [ ] Multiple logo positions
- [ ] Digital signatures
- [ ] Password protection
- [ ] Watermarks

## Files Modified

### New Files:
- ✅ `lib/pdf/report-generator.ts` - Reusable PDF utilities

### Modified Files:
- ✅ `components/BalanceSheetReport.tsx` - Added PDF export
- ✅ `components/IncomeStatementReport.tsx` - Added PDF export
- ✅ `components/AnnualStatementGenerator.tsx` - Already had PDF export

### Dependencies:
- ✅ `jspdf` - Already installed
- ✅ `jspdf-autotable` - Already installed

## Usage Statistics

Track PDF generation:
- Balance Sheet PDFs
- Income Statement PDFs
- Annual Donor Statement PDFs

Consider adding analytics to track:
- Number of PDFs generated
- Most popular reports
- Peak usage times
- Error rates

## Support

For issues or questions:
1. Check browser console for errors
2. Verify church settings are configured
3. Ensure logo is uploaded and accessible
4. Test with a different browser

---

## Summary

✅ **Balance Sheet** - Professional PDF with all account details  
✅ **Income Statement** - Detailed revenue and expense breakdown  
✅ **Annual Statements** - Donor contribution summaries (already implemented)

All PDFs include your church logo, name, address, and professional formatting. The "Print Report" button appears on each report page for easy access.

**Last Updated**: February 7, 2026
