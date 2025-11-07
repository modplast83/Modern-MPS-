# AI-Powered Order Management System for Plastic Bag Manufacturing

## Overview

This project is an advanced AI-powered order management system designed to enhance operational efficiency in plastic bag manufacturing. Its primary purpose is to streamline manufacturing processes, improve decision-making, and provide a robust, user-friendly platform. Key capabilities include comprehensive order and production management, AI-powered analytics and predictions, quality control, maintenance tracking, and HR management. The system aims to provide real-time tracking, multilingual interfaces, and intelligent data processing to improve overall operational efficiency and decision-making in the manufacturing process.

## User Preferences

- Language: Arabic (RTL) with English fallback
- Error handling: User-friendly messages in Arabic
- Logging: Comprehensive server-side logging for debugging
- Code style: Consistent TypeScript with proper type safety

## System Architecture

The system is built with a modern stack emphasizing efficiency and scalability, with a strong focus on Arabic RTL design principles.

-   **Frontend**: React, TypeScript, Vite, TanStack Query, Tailwind CSS, and shadcn/ui components for a responsive and intuitive user interface.
-   **Backend**: Node.js and Express, providing robust API endpoints.
-   **Database**: PostgreSQL (Neon Serverless) managed with Drizzle ORM.
-   **UI/UX Decisions**: Prioritizes Arabic RTL design, features a centralized toast notification system, IconWithTooltip for accessibility, and enhanced loading states with skeleton loaders across dashboards.
-   **Technical Implementations**: Includes a comprehensive number formatting system (Arabic numerals, 2 decimal places for weight, 1-2 decimal precision for percentages), sequential ID generation, and integrated attendance and notification systems. Query optimization is achieved through indexed foreign keys, aggregate functions, and grouping for various queues. Real-time updates are managed via TanStack Query with 30-second refetch intervals, cache invalidation on mutations, and optimistic updates.
-   **Feature Specifications**:
    -   Multilingual support (Arabic/English).
    -   Real-time order tracking and management.
    -   Voice recognition and synthesis.
    -   Advanced production order management, including detailed product specifications and notes.
    -   **Three-Machine Roll Tracking**: Tracks each roll through film/extruder, printing, and cutting stages, replacing a single-machine system. Roll labels display comprehensive information for all three stages.
    -   **Material Mixing System** (Film Section Only): Formula-based mixing system using size ranges (width in cm), thickness ranges (micron per layer), and master batch colors. Film machines categorized by screw type ('A' or 'ABA'), with ABA-type machines requiring separate A/B mixing recipes. All mixing ingredients sourced from items table (category CAT10 - raw materials only).
    -   Quality control systems.
    -   Maintenance tracking, including spare parts management.
    -   HR management with attendance tracking and training programs.
    -   **Geolocation-Based Attendance**: Attendance check-in system with GPS verification ensuring employees are within factory premises (500m radius) before allowing check-in. Uses Haversine formula for distance calculation.
    -   Role-based access control (Admin, Production Manager, Film Operator, Printing Operator, Cutting Operator).
    -   AI Assistant with context-aware intelligence, improved intent analysis, enhanced UI, and performance optimizations for smart query handling and data processing.
    -   **Replit Auth Integration**: Dual authentication support - traditional username/password and Replit Auth for seamless integration with Replit platform.
-   **System Design Choices**: Features role-based access control, comprehensive order and production management, real-time inventory and warehouse tracking, and integrated quality/maintenance monitoring.
-   **Error Handling Strategy**: Implemented with global error boundaries on the frontend, comprehensive error logging and graceful responses on the API, transaction safety and connection resilience for the database, and intelligent retry with exponential backoff for network operations. Detailed Arabic error messages are provided for specific scenarios like weight validation, printing, cutting, and queue management.

## System Integration

The system features comprehensive integration between four main sections:

1. **Warehouse (المستودع)**
   - `inventory`: Current stock levels
   - `inventory_movements`: Transaction history
   - `items`: Master data for all materials

2. **Orders (الطلبات)**
   - `orders` → `production_orders` (via `order_id`)
   - One order can have multiple production orders
   - Status tracking and validation through the entire lifecycle

3. **Production (الإنتاج)**
   - `production_orders` → `rolls` (via `production_order_id`)
   - `rolls` → `warehouse_receipts` (via `production_order_id`)
   - Three-stage workflow: Film → Printing → Cutting → Warehouse

4. **Material Mixing (خلط المواد)**
   - `mixing_formulas` → `formula_ingredients`: Recipe definitions
   - `mixing_batches` → `batch_ingredients`: Actual production batches
   - **Inventory Consumption API** (`/api/inventory/consumption`): Links mixing batches to inventory movements
   - Automatic stock deduction with full transaction logging

**Integration Points:**
- All sections share referential integrity via foreign keys
- Real-time cache invalidation ensures data consistency
- Transaction-safe operations prevent data corruption
- Comprehensive error handling with Arabic messaging

## Recent Changes (November 2025)

### Latest Updates
- ✅ **Moved User Profile to User Dashboard** (November 7, 2025):
  - **Change**: Moved user profile tab from main Dashboard to User Dashboard
  - **New Component**: UserProfile is now a tab in `/user-dashboard` instead of being on main dashboard
  - **Impact**: User settings (name, email, phone, theme, notifications) now accessible from personal dashboard
  - **UI Improvement**: User Dashboard now has 6 tabs: Overview, Profile, Attendance, Violations, Requests, Location
  - **Benefits**: Better organization and cleaner main dashboard interface

- ✅ **Added Operator Dashboard Permissions** (November 7, 2025):
  - **New Permissions**: Added three new permissions for operator dashboards
    - `view_film_dashboard` - عرض لوحة عامل الفيلم
    - `view_printing_dashboard` - عرض لوحة عامل الطباعة
    - `view_cutting_dashboard` - عرض لوحة عامل التقطيع
  - **Route Permissions**: Added route mappings for operator dashboards
    - `/film-operator` requires `view_film_dashboard`
    - `/printing-operator` requires `view_printing_dashboard`
    - `/cutting-operator` requires `view_cutting_dashboard`
  - **Category**: All three permissions under "الإنتاج" (Production) category
  - **Total Permissions**: System now has 41 permissions (was 38)
  - **Impact**: Better access control for production floor operators with dedicated dashboard permissions

- ✅ **Sales Representative Selection in Customer Form** (November 7, 2025):
  - **New Feature**: Added sales representative dropdown in customer creation/edit form
  - **Backend Changes**:
    - Created `getSafeUsersBySection()` method in storage.ts to fetch users by section
    - Added `/api/users/sales-reps` endpoint to retrieve sales team members (section_id = 7)
  - **Frontend Changes**:
    - Added sales rep dropdown in customer form (definitions.tsx)
    - Fetches and displays only users from Sales section (SEC07)
    - Dropdown shows display name in Arabic/English or username
  - **Database**: `customers.sales_rep_id` field already existed, now actively used in UI
  - **Impact**: Customers can now be assigned to specific sales representatives for better customer relationship management

- ✅ **User Profile Moved to Dashboard** (November 7, 2025):
  - **Change**: Moved user profile tab from Settings page to main Dashboard
  - **New Component**: Created `UserProfile.tsx` component in `client/src/components/dashboard/`
  - **Impact**: User settings (name, email, phone, theme, notifications) now accessible directly from dashboard
  - **UI Improvement**: Better user experience with profile settings at the main dashboard level

- ✅ **Fixed Customer Products Limit in Orders Form** (November 7, 2025):
  - **Issue**: `getCustomerProducts()` had a limit of 1000 products, preventing display of all customer products in the order form
  - **Fix**: Removed the limit parameter entirely to fetch all customer products
  - **Impact**: Order creation form now displays all customer products when selecting a customer
  - **Technical Details**: Modified `server/storage.ts` to remove `.limit(limit)` from the query

- ✅ **Fixed Roll Sequential Numbering System** (November 6, 2025):
  - **Issue**: Roll sequence numbers (roll_seq) were using COUNT(*) which could cause issues after deletions
  - **Fix**: Changed to use MAX(roll_seq) + 1 for reliable sequential numbering per production order
  - **Impact**: All roll creation functions (createRoll, createRollWithTiming, createFinalRoll) now use consistent logic
  - **Result**: Roll numbers are always sequential and never reuse deleted numbers (e.g., PO001-R01, PO001-R02, PO001-R03)
  - **Technical Details**:
    - Uses PostgreSQL advisory locks to prevent race conditions
    - Each production order has its own independent sequence
    - Format: {production_order_number}-R{seq} (e.g., PO001-R01)

- ✅ **Multiple Factory Locations with Interactive Maps** (November 6, 2025):
  - **New Database Table**: `factory_locations` for managing multiple factory sites
  - **Interactive Map Component**: Using react-leaflet@4.2.1 for visual location selection
  - **Full CRUD API**: Complete REST endpoints for factory locations management
    - GET/POST `/api/factory-locations` - List all/create new location
    - GET `/api/factory-locations/active` - Get active locations only
    - GET/PUT/DELETE `/api/factory-locations/:id` - Single location operations
  - **Settings Interface**: Enhanced admin panel with:
    - Map-based location picker (click to select coordinates)
    - Multiple location cards with active/inactive toggle
    - Real-time preview of allowed radius circles on map
    - Bilingual naming (English + Arabic)
  - **Attendance Verification**: Updated to check against ALL active locations
    - Frontend: Validates user is within range of ANY active factory
    - Backend: Server-side verification against all active locations
    - Distance calculation shows closest factory when out of range
    - Loading guards prevent false rejections during data fetch
  - **Technical Stack**: 
    - Leaflet.js for interactive mapping
    - OpenStreetMap tiles for map visualization
    - Haversine formula for accurate distance calculations

- ✅ **Factory Location Settings Management**: Added admin panel for managing geolocation settings (Deprecated - replaced by multiple locations system)
  - Replaced single-location system with multiple locations support

- ✅ **Geolocation Attendance System**: GPS-based location verification for attendance check-in
  - Upgraded to support multiple factory locations
  - Enhanced validation with nearest-location feedback
  - Loading state handling to prevent race conditions

### Previous Updates
- ✅ Added Rolls Tab in /orders page with advanced filters and Excel export
- ✅ Added user name columns (created_by, printed_by, cut_by) in Rolls table
- ✅ Green badge color for "منتهي" (done) status in rolls
- ✅ Fixed React Key prop error in material-mixing.tsx
- ✅ Added `/api/inventory/consumption` endpoint for material tracking
- ✅ Verified all four-way system integration
- ✅ Confirmed WebSocket issues were Vite HMR related (non-critical)

## External Dependencies

-   **Database**: PostgreSQL (Neon Serverless)
-   **AI/ML**: OpenAI
-   **Messaging**: Twilio (for WhatsApp notifications)