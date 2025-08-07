# Overview

MPBF Next is a modern Arabic-first ERP system designed for plastic bag manufacturing operations. The system provides comprehensive production management, quality control, inventory tracking, and human resources management with an intelligent AI assistant. It features a mobile-first design with RTL (right-to-left) language support and voice/text command capabilities.

## Recent Changes (January 2025)
- Enhanced database schema with comprehensive HR, maintenance, and administrative modules
- Added realistic sample data for immediate testing and demonstration
- Fixed authentication system with simple password access for testing
- Resolved CSS circular dependencies and JavaScript module errors
- Successfully migrated from in-memory to PostgreSQL database storage
- **Latest Update (Jan 31, 2025)**: Added complete definitions management system with 9 tabs:
  - Customers, Products, Sections, Material Groups, Items, Customer Products, Locations, Machines, and Users
  - All tabs now display real data from PostgreSQL database with proper Arabic interface
  - Added sample data for all definition categories
  - Implemented consistent table layouts with add/edit/delete buttons across all tabs
- **Latest Update (Feb 1, 2025)**: 
  - Successfully implemented voice commands system for AI assistant with Arabic/English support
  - Fixed all database foreign key relationships and data integrity issues
  - Removed products table and updated system to use customer_products instead
  - All database tables now properly linked with correct foreign key constraints
  - Ready for production data entry with validated table relationships
- **Latest Update (Feb 2, 2025)**: Deployment Readiness & Platform Issue Resolution
  - Generated proper SQL migration files for production deployment
  - Added automatic database migration on server startup for production
  - Created health check endpoint (/api/health) for deployment monitoring
  - Validated database connection and environment variables compatibility
  - Created deployment configuration (.replitdeploy) and validation scripts
  - Fixed deprecated product routes that were causing storage errors
  - **CRITICAL FIX**: Resolved schema migration conflicts for production deployment
  - Created production-safe migration scripts that handle data preservation
  - Added comprehensive deployment validation and troubleshooting tools
  - **PLATFORM ISSUE RESOLUTION**: Implemented workarounds for Replit deployment infrastructure migration issues
  - Enhanced server startup with graceful migration failure handling and alternative database initialization
  - Created deployment workaround scripts and updated configuration to handle platform-level issues
  - System now resilient to platform migration failures with comprehensive error handling and recovery options
- **Latest Update (Aug 3, 2025)**: Comprehensive Definitions Page Fix
  - **MAJOR FIX**: Completely rebuilt material groups management system
  - Fixed API endpoint inconsistencies (changed from /api/categories to /api/material-groups)
  - Added complete CRUD operations with proper DELETE routes for all definition entities
  - Implemented robust error handling and type-safe database operations
  - Added comprehensive delete functionality for customers, sections, material groups, items, locations, machines, and users
  - Fixed form state management and validation for all definition types
  - Cleaned up sample data and resolved fake record display issues
  - Enhanced material group form with description field and proper parent group selection
  - All definition tables now fully functional with add, edit, delete, and validation
- **Latest Update (Aug 6, 2025)**: Complete Warehouse Management System & Regional Settings
  - **WAREHOUSE SYSTEM**: Developed comprehensive warehouse management with three main tabs:
    - Inventory tab with real-time stock tracking and automated calculations
    - Locations tab with full CRUD operations for warehouse locations
    - Inventory Movements tab with complete tracking of in/out/transfer/adjustment operations
  - **DATABASE ENHANCEMENT**: Added inventory_movements table with proper foreign key relationships
  - **REGIONAL SETTINGS**: Configured system for Saudi Arabia operations only:
    - Currency locked to Saudi Riyal (SAR) only - removed all other currencies
    - Calendar system set to Gregorian only - removed Hijri calendar references
    - Country locked to Kingdom of Saudi Arabia with regional city selections
    - Phone number format updated to Saudi (+966) format
    - Timezone set to Riyadh (UTC+3) with read-only configuration
- **Bug Fix & Stability Update (Aug 6, 2025)**: Comprehensive Error Handling & Code Quality Improvements
  - **CRITICAL FIX**: Resolved ArrowUpDown import error in ERP Integration page that was causing app crashes
  - Enhanced error handling in OpenAI service with specific error messages for different failure types (401, 429, network errors)
  - Improved auth validation with structured user data validation and proper localStorage cleanup
  - Enhanced API response error handling with better JSON error message parsing
  - Added memory leak prevention in speech synthesis hook with proper cleanup on unmount
  - Improved speech synthesis error handling with recovery for common errors
  - Fixed setTimeout cleanup in AI assistant to prevent memory leaks
  - All critical functionality now working properly, app stability significantly improved
- **Warehouse Inventory Improvements (Aug 6, 2025)**: Enhanced Movement Form & Date Localization
  - **FORM SIMPLIFICATION**: Removed unit cost field from inventory movement form for streamlined data entry
  - **DATE LOCALIZATION**: Changed movement date display to Gregorian calendar format (DD/MM/YYYY) for Arabic users
  - Updated form validation schema to reflect simplified movement tracking requirements
  - Improved user experience with cleaner, more focused inventory movement interface
- **Inventory Form Streamlining (Aug 6, 2025)**: Simplified Add New Inventory Item Form
  - **MAJOR SIMPLIFICATION**: Removed minimum stock, maximum stock, and cost per unit fields from inventory creation form
  - **STREAMLINED UI**: Updated table display to show only essential columns: Item, Category, Current Stock, Location, Actions
  - **REDUCED COMPLEXITY**: Simplified form validation and data entry process for faster inventory management
  - **IMPROVED USER EXPERIENCE**: Focus on core inventory tracking without unnecessary complexity
  - Updated form schema and UI components to reflect streamlined inventory management approach
- **Latest Update (Aug 7, 2025)**: Complete Orders Management System & Customer Products Duplication
  - **ORDERS MANAGEMENT**: Developed comprehensive orders and production orders management system
    - Orders page with dual tabs for orders and production orders management
    - Complete CRUD operations for both orders and production orders
    - Order fields: order number, customer, delivery days, notes, created by user, creation date
    - Production order fields: production order number, customer product, quantity in kilos, status
    - One-to-many relationship: each order can contain multiple production orders
  - **DATABASE ENHANCEMENT**: Added orders and production_orders tables with proper foreign key relationships
  - **NAVIGATION UPDATE**: Added orders page to sidebar navigation between home and production
  - **API ENDPOINTS**: Complete REST API with error handling for orders and production orders management
  - **ARABIC UI**: Fully localized Arabic interface with proper RTL support
  - **CUSTOMER PRODUCTS DUPLICATION**: Added one-click duplication functionality for customer products
    - Blue duplicate button in operations column for instant product copying
    - Automatically creates exact duplicate with new ID in database
    - Adds "نسخة مكررة" notation in notes field for tracking
    - Preserves all product specifications, measurements, and configurations
    - Real-time table refresh after duplication completion
- **MAJOR ACHIEVEMENT (Aug 6, 2025)**: Advanced AI Assistant System Complete
  - **COMPREHENSIVE DATABASE MANAGEMENT**: Full CRUD operations with intelligent data extraction from natural language
    - Smart customer creation with AI-powered data parsing
    - Intelligent order management and job order creation
    - Machine status updates and maintenance alerts
    - Advanced data query capabilities with safety measures
  - **INTELLIGENT REPORTING SYSTEM**: AI-powered report generation with deep insights
    - Production reports with performance analysis and recommendations
    - Quality control reports with trend analysis
    - Maintenance reports with predictive insights
    - Sales and customer analytics with growth strategies
    - Custom report generation for any data type
  - **SMART NOTIFICATION SYSTEM**: Proactive monitoring and alerting
    - Automated system health monitoring every 15 minutes
    - Intelligent threshold-based alerts for production, quality, and inventory
    - Contextual notifications with actionable recommendations
    - Priority-based notification delivery system
  - **CONTINUOUS LEARNING ENGINE**: Self-improving AI that adapts to user patterns
    - User behavior analysis and pattern recognition
    - Personalized recommendations based on usage history
    - Success rate tracking and performance optimization
    - Automatic system improvement through usage analytics
  - **ENHANCED USER INTERFACE**: Modern, intuitive AI assistant with quick actions
    - Welcome message showcasing all advanced capabilities
    - Interactive quick action buttons for common tasks
    - Improved visual feedback with animations and status indicators
    - Seamless integration with voice commands and text input
  - **PRODUCTION-READY APIs**: Complete backend infrastructure for AI features
    - /api/ai/generate-report - Intelligent report generation
    - /api/ai/notifications - Real-time notification management
    - /api/ai/monitor - Proactive system monitoring
    - /api/ai/learning-stats - Learning analytics dashboard
    - /api/ai/recommendations - Personalized user recommendations
    - /api/ai/feedback - User feedback collection for continuous improvement

## Test Accounts
- admin/admin123 (System Administrator)
- demo/demo123 (Demo User)  
- test/test123 (Test User)
- production_mgr/prod123 (Production Manager)
- operator1/op123 (Machine Operator)
- quality1/qa123 (Quality Inspector)
- maintenance1/maint123 (Maintenance Technician)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: Built-in Arabic RTL support with fallback to English
- **Mobile-First Design**: Responsive layouts optimized for mobile devices with dedicated mobile navigation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful APIs with consistent error handling and logging middleware
- **Authentication**: Simple username/password authentication with session storage
- **File Structure**: Modular separation between server, client, and shared code

## Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM migrations
- **Development Database**: SQLite support for local development
- **Schema Structure**: Comprehensive factory management schema including:
  - User management with roles and permissions
  - Production workflow (orders, job orders, rolls, machines)
  - Quality control and maintenance tracking
  - Human resources (attendance, training, performance)
  - Customer and product management

## Authentication & Authorization
- **Authentication Method**: Username/password with server-side validation
- **Session Management**: Local storage for client-side session persistence
- **Role-Based Access Control**: Hierarchical permission system with role-based restrictions
- **Security**: Password hashing and secure session handling

## AI Integration
- **AI Service**: OpenAI GPT-4o integration for intelligent assistance
- **Capabilities**: Natural language processing for Arabic and English commands
- **Features**: Voice/text command processing, production insights, and automated responses
- **Context Awareness**: Integration with production data for informed responses

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service with serverless connection pooling
- **Connection Management**: WebSocket-based connections for real-time data access

## AI Services
- **OpenAI API**: GPT-4o model for natural language processing and intelligent responses
- **Configuration**: Environment-based API key management

## Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **TypeScript**: Type checking and compilation across the entire stack
- **Tailwind CSS**: Utility-first CSS framework with RTL support
- **ESBuild**: Fast JavaScript bundling for production builds

## UI Components
- **Radix UI**: Headless component primitives for accessibility
- **Lucide Icons**: Consistent icon library throughout the application
- **Framer Motion**: Animation library for smooth user interactions

## Production Infrastructure
- **Build Process**: Vite for frontend, ESBuild for backend bundling
- **Environment Management**: Environment variable configuration for different deployment stages
- **Asset Management**: Static file serving with proper caching headers