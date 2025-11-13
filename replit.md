# AI-Powered Order Management System for Plastic Bag Manufacturing

## Overview

This project is an advanced AI-powered order management system for plastic bag manufacturing. Its main purpose is to streamline manufacturing processes, improve decision-making, and provide a robust, user-friendly platform. Key capabilities include comprehensive order and production management, AI-powered analytics and predictions, quality control, maintenance tracking, and HR management. The system aims to provide real-time tracking, multilingual interfaces, and intelligent data processing to improve overall operational efficiency and decision-making.

## User Preferences

- Language: Arabic (RTL) as primary development language with multilingual support
- Error handling: User-friendly messages in Arabic
- Logging: Comprehensive server-side logging for debugging
- Code style: Consistent TypeScript with proper type safety

## Internationalization (i18n)

The system implements a **comprehensive multilingual interface** using **react-i18next** with full Arabic and English support:

### Core Configuration
- **Default Language**: Arabic (RTL) with automatic fallback
- **Supported Languages**: Arabic (ar), English (en) - easily extensible to additional languages
- **Translation Files**: 
  - `client/src/i18n/locales/ar.json` (~2,400+ translation keys)
  - `client/src/i18n/locales/en.json` (~2,400+ translation keys)
- **Configuration**: `client/src/i18n/config.ts` with i18next setup
- **Language Switcher**: `client/src/components/LanguageSwitcher.tsx` in Header component

### Key Features
- ✅ **Automatic RTL/LTR Switching**: Layout direction changes based on selected language
- ✅ **Persistent Preferences**: Language selection saved in localStorage
- ✅ **Browser Detection**: Automatic language detection with regional code normalization (e.g., "en-US" → "en")
- ✅ **Fallback System**: Graceful fallback to Arabic if translation key missing
- ✅ **Type-Safe**: Full TypeScript integration with useTranslation() hook

### Translation Coverage (95-98% Complete)
**Core System** (100%):
- ✅ Sidebar navigation and Header
- ✅ Dashboard (statistics, charts, recent activity)
- ✅ Login page and authentication flow
- ✅ Error boundaries and notifications

**Main Features** (90-95%):
- ✅ **Orders Management**: Orders table, forms, dialogs, production progress, print templates (9 components)
- ✅ **Production Operations**: Film/Printing/Cutting operator dashboards, production queues, rolls management
- ✅ **Warehouse**: Inventory, movements, receipts, production hall (265+ t() calls)
- ✅ **HR Management**: Attendance, leave management, training programs, performance reviews (4 components, 2,308 lines)
- ✅ **Quality Control**: Quality inspections and defect tracking
- ✅ **Maintenance**: Equipment maintenance, spare parts, consumable parts
- ✅ **Reports**: Production reports, filters, exports (partial)
- ✅ **Definitions**: Master data management for customers, products, suppliers, etc.
- ✅ **Settings**: User preferences, system settings, notifications, database management

**Critical Components** (100%):
- ✅ Production Modals: RollCreationModalEnhanced, PrintingCreationModal, CuttingCreationModal, SmartDistributionModal (4 files, 1,459 lines)
- ✅ Production Tables: RollsTable, FilmMaterialMixingTab, GroupedPrintingQueue, HierarchicalOrdersView (4 files)
- ✅ Dashboard Components: UserProfile, MachineStatus, RecentRolls, MachineCard, OrdersStats (8 components)
- ✅ Shared Components: NotificationCenter, ErrorBoundary, QueryErrorBoundary
- ✅ Mobile Navigation and Interactive Charts

**Utility Pages** (100%):
- ✅ **System Health Monitoring**: SystemHealth.tsx (621 lines - comprehensive system diagnostics)
- ✅ **Alerts Center**: AlertsCenter.tsx (652 lines - intelligent alert management)
- ✅ **Roll Search**: RollSearch.tsx (advanced roll tracking and search)
- ✅ **User Dashboard**: user-dashboard.tsx (1821 lines - attendance tracking with GPS verification)
- ✅ **ML Analytics**: ml-analytics.tsx (machine learning analytics and predictions)
- ✅ **Production Monitoring**: production-monitoring.tsx (real-time production monitoring)
- ✅ **Not Found Page**: not-found.tsx (404 error page)
- ⏳ VoiceAssistant, WhatsApp setup pages (low priority - deferred for future implementation)

### Translation Key Organization
Translation keys are hierarchically organized by feature area (35+ categories):
- `sidebar.*` - Navigation menu items
- `header.*` - Header components and user menu
- `common.*` - Shared UI elements (buttons, actions, status, units)
- `dashboard.*` - Dashboard widgets and statistics
- `orders.*` - Order management system
- `production.*` - Production workflows and operations
- `warehouse.*` - Inventory and warehouse management
- `hr.*` - Human resources features
- `quality.*` - Quality control system
- `maintenance.*` - Maintenance management
- `reports.*` - Reporting and analytics
- `definitions.*` - Master data definitions
- `settings.*` - System settings and preferences
- `forms.*` - Form labels and validation messages
- `toast.*` - Notification messages
- `errors.*` - Error messages
- `modals.*` - Dialog and modal content
- `status.*` - Status labels and badges
- `units.*` - Measurement units (kg, cm, %, etc.)
- `systemHealth.*` - System monitoring and diagnostics
- `alertsCenter.*` - Alert management and notifications
- `rollSearch.*` - Roll search and tracking
- `userDashboard.*` - User dashboard and attendance
- `mlAnalytics.*` - Machine learning analytics
- `productionMonitoring.*` - Production monitoring dashboard
- `notFound.*` - 404 error page

### Usage Pattern
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('orders.title')}</h1>
      <p>{t('orders.description')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Future Development Guidelines
1. **Always add translations to BOTH ar.json and en.json** when creating new features
2. **Use existing translation key patterns** (e.g., `feature.action`, `common.buttonName`)
3. **Test with both languages** before considering a feature complete
4. **Avoid hardcoded Arabic or English strings** - use t() function exclusively
5. **Nested t() calls are FORBIDDEN** - they cause syntax errors (e.g., `t('key', 'value {t(...)}')` is invalid)

## System Architecture

The system is built with a modern stack emphasizing efficiency and scalability, with a strong focus on Arabic RTL design principles.

- **Frontend**: React, TypeScript, Vite, TanStack Query, Tailwind CSS, and shadcn/ui components.
- **Backend**: Node.js and Express.
- **Database**: PostgreSQL (Neon Serverless) managed with Drizzle ORM.
- **UI/UX Decisions**: Prioritizes Arabic RTL design, features a centralized toast notification system, IconWithTooltip for accessibility, and enhanced loading states with skeleton loaders.
- **Technical Implementations**: Includes comprehensive number formatting (Arabic numerals, 2 decimal places for weight, 1-2 decimal precision for percentages), sequential ID generation, and integrated attendance and notification systems. Query optimization utilizes indexed foreign keys, aggregate functions, and grouping. Real-time updates are managed via TanStack Query with 30-second refetch intervals, cache invalidation on mutations, and optimistic updates.
- **Feature Specifications**:
    - Multilingual support (Arabic/English).
    - Real-time order tracking and management.
    - Voice recognition and synthesis.
    - Advanced production order management, including detailed product specifications and notes.
    - **Three-Machine Roll Tracking**: Tracks each roll through film/extruder, printing, and cutting stages.
    - **Material Mixing System**: Formula-based mixing system using size and thickness ranges, and master batch colors. Categorized by machine screw type ('A' or 'ABA'). Ingredients sourced from items table (CAT10 - raw materials).
    - Quality control systems.
    - Maintenance tracking, including spare parts management.
    - HR management with attendance tracking and training programs.
    - **Geolocation-Based Attendance**: Attendance check-in system with GPS verification within factory premises (500m radius) using the Haversine formula. Supports multiple factory locations.
    - Role-based access control (Admin, Production Manager, Film Operator, Printing Operator, Cutting Operator).
    - **Enhanced AI Assistant (v2.0)**: 
      - Database schema understanding with 20+ supported tables
      - Clarification logic - asks for clarification when confidence < 60%
      - Missing information detection - requests required data
      - Confirmation system - requires approval before write operations
      - Error learning system - learns from mistakes and patterns (threshold: 3 errors)
      - Context-aware intelligence with improved intent analysis
      - Confidence scoring (0.0-1.0) for all responses
      - **Security Features**:
        - SQL injection prevention via whitelist validation and parameterized queries
        - Schema tampering prevention with strict table/column validation
        - XSS prevention through input sanitization
        - Read-only operations (SELECT only) for AI queries
        - Suspicious input detection and blocking
    - **Replit Auth Integration**: Dual authentication support (traditional username/password and Replit Auth).
- **System Design Choices**: Features role-based access control, comprehensive order and production management, real-time inventory and warehouse tracking, and integrated quality/maintenance monitoring.
- **Error Handling Strategy**: Implemented with global error boundaries on the frontend, comprehensive error logging and graceful responses on the API, transaction safety and connection resilience for the database, and intelligent retry with exponential backoff for network operations. Detailed Arabic error messages are provided for specific scenarios.
- **System Integration**:
    1.  **Warehouse**: `inventory`, `inventory_movements`, `items` tables.
    2.  **Orders**: `orders` linked to `production_orders`.
    3.  **Production**: `production_orders` linked to `rolls` and `warehouse_receipts`, managing a three-stage workflow (Film → Printing → Cutting → Warehouse).
    4.  **Material Mixing**: `mixing_formulas`, `formula_ingredients`, `mixing_batches`, `batch_ingredients`. Includes an `Inventory Consumption API` for automatic stock deduction.
    All sections maintain referential integrity via foreign keys, real-time cache invalidation, and transaction-safe operations.

## External Dependencies

- **Database**: PostgreSQL (Neon Serverless)
- **AI/ML**: OpenAI
- **Messaging**: Twilio (for WhatsApp notifications)