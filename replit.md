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