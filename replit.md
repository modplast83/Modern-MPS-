# AI-Powered Order Management System for Plastic Bag Manufacturing

## Overview

This project is an advanced AI-powered order management system specifically designed for plastic bag manufacturing. Its primary purpose is to enhance operational efficiency through intelligent data processing, real-time tracking, and multilingual interfaces. Key capabilities include comprehensive order and production management, AI-powered analytics and predictions, quality control, maintenance tracking, and HR management. The system aims to streamline manufacturing processes, improve decision-making, and provide a robust, user-friendly platform for the industry.

## Recent Completed Features (January 2025)

- ✅ Complete roles and permissions management with direct editing from roles table
- ✅ Comprehensive work hours calculation system with detailed display (8-hour workday including 1-hour break, overtime calculation, Friday special handling)
- ✅ Enhanced user dashboard with comprehensive daily work summary and time calculations
- ✅ Fixed maintenance action form validation issue with executor field ("المنفذ")
- ✅ Automatic user assignment for maintenance actions with proper form validation
- ✅ WhatsApp Business integration via Twilio with webhook endpoints configured for bi-directional messaging
- ✅ Meta WhatsApp Business API implementation with direct integration support
- ✅ Twilio Content Template setup guide for resolving template approval issues
- ✅ Automatic API selection (Meta vs Twilio) based on environment configuration
- ✅ Complete Twilio Content Template integration with ContentSid (HXc4485f514cb7d4536026fc56250f75e7)
- ✅ Final resolution of error 63016 - WhatsApp messages now use approved Meta templates via Twilio
- ✅ Production-ready WhatsApp Business API with full template support
- ✅ Enhanced production orders table with comprehensive Arabic column formatting
- ✅ Implemented proper order number display format (ORD005JO01)
- ✅ Added size descriptions without decimal points and colored circles for master batch column
- ✅ Integrated product names from items table for accurate display
- ✅ Added separate quantity column and improved packaging weight display
- ✅ Complete pagination system for definitions page with 25 records per page across all 8 tabs
- ✅ Enhanced search functionality with proper field mapping for all entity types
- ✅ Advanced search for customer products including related customer and item names
- ✅ Independent pagination state management for each tab (customers, categories, sections, items, customer products, locations, machines, users)
- ✅ **Critical SelectItem Validation Fix (January 2025)**: Completely resolved data import crashes caused by empty/null values in SelectItem components
- ✅ Comprehensive filtering system for all SelectItem components to prevent empty value props
- ✅ Enhanced data import reliability across all definition tables (customers, categories, items, etc.)
- ✅ **Security Hardening (October 2025)**: Removed all hardcoded user ID fallbacks preventing privilege escalation
  - Phase 1: Eliminated `|| 1` fallbacks across AI assistant, warehouse receipts, and maintenance report creation
  - Phase 2 (October 7, 2025): Fixed remaining hardcoded user IDs discovered during bug audit:
    - Fixed maintenance.tsx request_created_by hardcoded to "1"
    - Fixed orders.tsx created_by fallback to "1" (now requires authentication)
    - Fixed FieldTrainingPrograms.tsx evaluator_id hardcoded to "1"
    - Fixed server/storage.ts created_by fallback to "8" in import function (now requires field in imported data)
  - System now requires authenticated user context with proper error messages when not logged in
  - Import operations now validate required user attribution fields for data integrity
- ✅ **Batch Production Order Processing (October 2025)**: Optimized production order creation for high-volume operations
  - Implemented `/api/production-orders/batch` endpoint for creating multiple orders in single transaction
  - Uses PostgreSQL advisory locks (`pg_advisory_xact_lock`) for concurrency-safe order number generation
  - Prevents race conditions in empty tables and concurrent batch processing scenarios
  - Maintains per-order success/failure reporting without losing partial batches

## Critical Bug Fixes (October 2025)

- ✅ **Production Analytics SQL Query Fixes**: Resolved critical SQL errors in analytics functions
  - Fixed getUserPerformanceStats orderBy clause that referenced non-existent alias columns
  - Corrected getRolePerformanceStats join logic to properly relate rolls→users→roles
  - Fixed getMachineUtilizationStats orderBy issues with Drizzle ORM
  - Removed complex orderBy clauses that were incompatible with Drizzle's SQL generation
  - All production analytics endpoints now return HTTP 200 with valid data
  - Architect review confirmed proper implementation and no security issues
- ✅ **HR Reports Database Query Fixes (October 22, 2025)**: Resolved critical SQL errors in HR reports
  - Fixed missing FROM-clause error for attendance table in performance stats query
  - Corrected timestamp comparison logic for late arrival calculation
  - Separated date filters for attendance and production data to prevent table reference errors
- ✅ **Production Order Completion & Progress Tracking (October 22, 2025)**: Fixed automatic order completion and progress indicators
  - **createRollWithQR**: Now correctly calculates and updates `film_completion_percentage` and `produced_quantity_kg` after each roll creation
  - Re-queries total weight after roll insertion to ensure accurate completion percentages
  - **createCut**: Automatically completes parent order when all production orders finish cutting
  - Checks all sibling production orders and promotes both production order and sales order to completed status
  - Added comprehensive logging for order completion transitions for better observability
  - Completion percentages now update in real-time across all production stages (film, printing, cutting)
  - **Orders Table Progress Calculation**: Fixed completion percentage display to use weighted average based on production order quantities
  - Previous calculation used simple averaging which misrepresented completion when order sizes differed significantly
  - Now multiplies each stage percentage by order quantity and divides by total quantity for accurate representation
- ✅ **Stage Completion Percentage Formula Update (October 22, 2025)**: Revised calculation formulas for printing and cutting stages
  - **Printing Stage**: Changed formula from `printed_quantity / final_quantity_kg` to `printed_quantity / produced_quantity_kg`
  - Now accurately reflects printing progress relative to actual film production output, not final target
  - **Cutting Stage**: Changed formula from `completedRolls / totalRolls` to `(net_quantity + waste_quantity) / produced_quantity_kg`
  - Now measures actual material throughput (cut + waste) relative to film production output
  - Both stages now properly reference film production as the baseline for sequential stage progression
  - Maintains existing safeguards: ratios capped at 100%, zero-division protection in place

## Critical Bug Fixes (January 2025)

- ✅ **Database Integrity Resolution**: Fixed critical foreign key data type mismatches across the entire system
  - Updated 12+ tables with varchar(20) foreign keys to reference users.id (integer) correctly
  - Fixed operator_negligence_reports.operator_id, training_enrollments.employee_id, and multiple other relationships
  - Resolved TypeScript compilation errors in storage layer related to parameter type conflicts
  - Updated interface definitions to match implementation (getTrainingEnrollments, getOperatorNegligenceReportsByOperator)
  - Fixed routes.ts parameter parsing to convert string query parameters to proper integer types
  - Updated system settings methods to use consistent number types for user IDs
- ✅ **Type Safety Improvements**: Resolved all LSP diagnostics errors ensuring complete type consistency
- ✅ **Runtime Stability**: Eliminated potential database constraint violations and query failures
- ✅ **Data Consistency**: Ensured referential integrity across all foreign key relationships
- ✅ **Session Management Enhancement**: Fixed automatic logout issue by improving session persistence
  - Extended session duration from 7 days to 30 days for better user experience
  - Enhanced session configuration with `resave: true` and `rolling: true` for automatic session extension
  - Added middleware to automatically extend sessions on any API activity
  - Improved `/api/me` endpoint to actively maintain and extend sessions
  - Enhanced frontend auth handling to preserve user login state on network errors
  - Added proper session touching and saving mechanisms to prevent premature timeouts
- ✅ **Production Queue SQL Query Fix (October 2025)**: Resolved critical SQL errors in user name retrieval across production queues
  - Fixed "column users.name does not exist" error in `getPrintingQueue`, `getHierarchicalOrdersForProduction`, and `getGroupedCuttingQueue`
  - Replaced problematic SQL subqueries with efficient separate user name lookups using `inArray`
  - Implemented Set/Map pattern to collect unique user IDs and fetch all names in a single query
  - Properly associates created_by, printed_by, and cut_by user names with roll labels for complete operator attribution
  - Improved query performance by reducing redundant database calls

## User Preferences

- Language: Arabic (RTL) with English fallback
- Error handling: User-friendly messages in Arabic
- Logging: Comprehensive server-side logging for debugging
- Code style: Consistent TypeScript with proper type safety

## System Architecture

The system is built with a modern stack emphasizing efficiency and scalability.

- **Frontend**: React, TypeScript, Vite, TanStack Query, utilizing Tailwind CSS and shadcn/ui components for a responsive and intuitive user interface. UI/UX decisions prioritize Arabic RTL design principles.
- **Backend**: Node.js and Express, providing robust API endpoints.
- **Database**: PostgreSQL (Neon Serverless) managed with Drizzle ORM, ensuring efficient data storage and retrieval.
- **AI Features**: Integration with OpenAI for advanced analytics and machine learning capabilities, including predictive analysis.
- **Core Features**:
  - Multilingual support (Arabic/English).
  - Real-time order tracking and management.
  - Voice recognition and synthesis.
  - Advanced production order management, including detailed product specifications and production notes.
  - Quality control systems.
  - Maintenance tracking, including spare parts management.
  - HR management with attendance tracking and training programs.
- **System Design**: Features role-based access control, comprehensive order and production management, real-time inventory and warehouse tracking, and integrated quality/maintenance monitoring.
- **Error Handling Strategy**: Implemented with global error boundaries on the frontend, comprehensive error logging and graceful responses on the API, transaction safety and connection resilience for the database, and intelligent retry with exponential backoff for network operations.
- **Technical Implementations**: Includes a comprehensive number formatting system, sequential ID generation for various entities, and integrated attendance and notification systems.

## External Dependencies

- **Database**: PostgreSQL (Neon Serverless)
- **AI/ML**: OpenAI
- **Messaging**: Twilio (for WhatsApp notifications)
