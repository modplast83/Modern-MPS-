# Technical Debt and Future Enhancements

This document tracks known technical debt items, TODOs, and planned enhancements for the MPBF Manufacturing System.

## Priority Classification
- 🔴 High Priority - Should be addressed soon
- 🟡 Medium Priority - Nice to have, planned for future
- 🟢 Low Priority - Enhancement or optimization

---

## Active TODO Items

### 🟡 Reports - PDF/Excel Generation
**Location:** 
- `server/routes.ts:2379`
- `client/src/pages/reports.tsx:231`

**Description:** Implement actual PDF and Excel file generation for reports.

**Current State:** Reports are displayed on screen but don't have download functionality.

**Recommended Action:** 
- Implement server-side PDF generation using a library like `pdfkit` or `puppeteer`
- Implement Excel generation using `xlsx` (already installed)
- Add download endpoints: `/api/reports/:type/pdf` and `/api/reports/:type/excel`

**Estimated Effort:** Medium (2-3 days)

---

### 🟢 Modal Component Optimization
**Location:**
- `client/src/components/modals/CuttingCreationModal.tsx:223`
- `client/src/components/modals/PrintingCreationModal.tsx:223`

**Description:** Replace temporary Select components with proper integrated Select when API is ready.

**Current State:** Using basic select elements instead of shadcn Select components.

**Recommended Action:**
- Verify API endpoints are stable
- Replace with proper `@/components/ui/select` components
- Ensure proper integration with form validation

**Estimated Effort:** Low (2-4 hours)

---

## Code Quality Notes

### UUID Generation Pattern
**Location:** `shared/id-generator.ts:15`

**Description:** Uses standard UUID v4 generation pattern with x/y placeholder replacement.

**Status:** ✅ Working as expected - No action needed

**Note:** This is a standard UUID generation implementation, not a TODO item.

---

## Resolved Items

### ✅ Logging System
**Completed:** November 2025

**Description:** Replaced all console.log statements with structured logging system.

**Changes:**
- Created `server/lib/logger.ts` with environment-aware logging
- Implemented sensitive data redaction for production
- Replaced all console statements in:
  - `server/routes.ts`
  - `server/services/notification-manager.ts`
  - `server/services/meta-whatsapp.ts`
  - `server/services/system-health-monitor.ts`
  - `client/src/lib/queryClient.ts`

---

### ✅ Form Auto-calculation Debouncing
**Completed:** November 2025

**Description:** Added debouncing to customer product form auto-calculations to prevent excessive recalculations.

**Changes:**
- Added 300ms debounce to size caption calculation
- Added 300ms debounce to package weight calculation
- Improved UX by reducing form flicker during rapid typing

---

## Non-Issues (False Positives)

The following items were found during code scan but are NOT technical debt:

1. **Package integrity hashes** in `package-lock.json` - Normal npm operation
2. **Placeholder patterns** (`+966xxxxxxxxx`, `ACxxxxx...`) - UI examples for users
3. **Product names** (`XXXL-TSB`, `XXXL-CB`) in `attached_assets/items_*.json` - Actual product codes
4. **Example values** in setup pages - Documentation for users

---

## Recommendations for Future Work

### High Value Enhancements

1. **Comprehensive Report Export**
   - Priority: 🟡 Medium
   - Add PDF/Excel export for all report types
   - Include charts and visualizations in exports
   - Implement batch export functionality

2. **Enhanced Error Tracking**
   - Priority: 🟢 Low
   - Integrate with external error tracking service (e.g., Sentry)
   - Add client-side error boundary reporting
   - Implement automated error alerting for critical failures

3. **Performance Monitoring**
   - Priority: 🟢 Low
   - Add performance metrics collection
   - Implement query performance tracking
   - Set up automated performance regression detection

---

## Notes for Developers

- When adding new TODO comments, please also update this document
- Estimate effort realistically: Small (< 4 hours), Medium (1-3 days), Large (> 3 days)
- Always link TODO comments to issues in your project management system
- Review and update this document quarterly

---

**Last Updated:** November 3, 2025
**Next Review:** February 2026
