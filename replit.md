# AI-Powered Order Management System for Plastic Bag Manufacturing

## Overview
This project is an advanced AI-powered order management system specifically designed for plastic bag manufacturing. Its primary purpose is to enhance operational efficiency through intelligent data processing, real-time tracking, and multilingual interfaces. Key capabilities include comprehensive order and production management, AI-powered analytics and predictions, quality control, maintenance tracking, and HR management. The system aims to streamline manufacturing processes, improve decision-making, and provide a robust, user-friendly platform for the industry.

## Recent Completed Features (August 2025)
- ✅ Complete roles and permissions management with direct editing from roles table
- ✅ Comprehensive work hours calculation system with detailed display (8-hour workday including 1-hour break, overtime calculation, Friday special handling)
- ✅ Enhanced user dashboard with comprehensive daily work summary and time calculations
- ✅ Fixed maintenance action form validation issue with executor field ("المنفذ")
- ✅ Automatic user assignment for maintenance actions with proper form validation
- ✅ WhatsApp Business integration via Twilio with webhook endpoints configured for bi-directional messaging
- ✅ Meta WhatsApp Business API implementation with direct integration support
- ✅ Twilio Content Template setup guide for resolving template approval issues
- ✅ Automatic API selection (Meta vs Twilio) based on environment configuration

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