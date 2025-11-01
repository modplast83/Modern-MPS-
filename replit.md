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
    -   Quality control systems.
    -   Maintenance tracking, including spare parts management.
    -   HR management with attendance tracking and training programs.
    -   Role-based access control (Admin, Production Manager, Film Operator, Printing Operator, Cutting Operator).
    -   AI Assistant with context-aware intelligence, improved intent analysis, enhanced UI, and performance optimizations for smart query handling and data processing.
-   **System Design Choices**: Features role-based access control, comprehensive order and production management, real-time inventory and warehouse tracking, and integrated quality/maintenance monitoring.
-   **Error Handling Strategy**: Implemented with global error boundaries on the frontend, comprehensive error logging and graceful responses on the API, transaction safety and connection resilience for the database, and intelligent retry with exponential backoff for network operations. Detailed Arabic error messages are provided for specific scenarios like weight validation, printing, cutting, and queue management.

## External Dependencies

-   **Database**: PostgreSQL (Neon Serverless)
-   **AI/ML**: OpenAI
-   **Messaging**: Twilio (for WhatsApp notifications)