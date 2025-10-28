# AI-Powered Order Management System for Plastic Bag Manufacturing

## Overview

This project is an advanced AI-powered order management system designed to enhance operational efficiency in plastic bag manufacturing through intelligent data processing, real-time tracking, and multilingual interfaces. Its primary purpose is to streamline manufacturing processes, improve decision-making, and provide a robust, user-friendly platform. Key capabilities include comprehensive order and production management, AI-powered analytics and predictions, quality control, maintenance tracking, and HR management.

## User Preferences

- Language: Arabic (RTL) with English fallback
- Error handling: User-friendly messages in Arabic
- Logging: Comprehensive server-side logging for debugging
- Code style: Consistent TypeScript with proper type safety

## System Architecture

The system is built with a modern stack emphasizing efficiency and scalability.

-   **Frontend**: React, TypeScript, Vite, TanStack Query, utilizing Tailwind CSS and shadcn/ui components for a responsive and intuitive user interface. UI/UX decisions prioritize Arabic RTL design principles.
-   **Backend**: Node.js and Express, providing robust API endpoints.
-   **Database**: PostgreSQL (Neon Serverless) managed with Drizzle ORM, ensuring efficient data storage and retrieval.
-   **AI Features**: Integration with OpenAI for advanced analytics and machine learning capabilities, including predictive analysis.
-   **Core Features**:
    -   Multilingual support (Arabic/English).
    -   Real-time order tracking and management.
    -   Voice recognition and synthesis.
    -   Advanced production order management, including detailed product specifications and production notes.
    -   **Three-Machine Roll Tracking**: Each roll is now tracked with three separate machines (film/extruder, printing, cutting) throughout its production lifecycle, replacing the single-machine tracking system.
    -   **Enhanced Roll Labels**: 4x6 inch roll labels now display comprehensive information including machine assignments, raw materials, color, punching type, and operator names for all three production stages.
    -   Quality control systems.
    -   Maintenance tracking, including spare parts management.
    -   HR management with attendance tracking and training programs.
-   **System Design**: Features role-based access control, comprehensive order and production management, real-time inventory and warehouse tracking, and integrated quality/maintenance monitoring.
-   **Error Handling Strategy**: Implemented with global error boundaries on the frontend, comprehensive error logging and graceful responses on the API, transaction safety and connection resilience for the database, and intelligent retry with exponential backoff for network operations.
-   **Technical Implementations**: Includes a comprehensive number formatting system, sequential ID generation for various entities, and integrated attendance and notification systems.

## External Dependencies

-   **Database**: PostgreSQL (Neon Serverless)
-   **AI/ML**: OpenAI
-   **Messaging**: Twilio (for WhatsApp notifications)

## Recent Changes

### Roll Production Workflow Enhancement (October 28, 2025)
- **Database Schema**: Updated `rolls` table to track three separate machines (`film_machine_id`, `printing_machine_id`, `cutting_machine_id`) instead of single `machine_id`
- **Backend**: Enhanced roll creation validation to ensure all three machines are active before allowing roll creation
- **Frontend**: Updated roll creation modal with three separate machine selection dropdowns, filtered by machine section type
- **Labels**: Enhanced 4x6 inch roll labels to display:
  - All three machine assignments
  - Product specifications (color, raw material, punching type)
  - Operator names for all three production stages (film operator, printing operator, cutting operator)
- **Migration**: Successfully migrated 6 existing rolls to new three-machine system with backward compatibility maintained