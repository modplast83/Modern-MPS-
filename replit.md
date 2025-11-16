# Order Management System for Plastic Bag Manufacturing

## Overview

This project is an advanced order management system for plastic bag manufacturing. Its main purpose is to streamline manufacturing processes, improve decision-making, and provide a robust, user-friendly platform. Key capabilities include comprehensive order and production management, quality control, maintenance tracking, and HR management. The system aims to provide real-time tracking, multilingual interfaces, and efficient data processing to improve overall operational efficiency and decision-making.

## User Preferences

- Language: Arabic (RTL) with English fallback
- Error handling: User-friendly messages in Arabic
- Logging: Comprehensive server-side logging for debugging
- Code style: Consistent TypeScript with proper type safety

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
    - Advanced production order management, including detailed product specifications and notes.
    - **Three-Machine Roll Tracking**: Tracks each roll through film/extruder, printing, and cutting stages.
    - **Material Mixing System**: Formula-based mixing system using size and thickness ranges, and master batch colors. Categorized by machine screw type ('A' or 'ABA'). Ingredients sourced from items table (CAT10 - raw materials).
    - Quality control systems.
    - Maintenance tracking, including spare parts management.
    - HR management with attendance tracking and training programs.
    - **Geolocation-Based Attendance**: Attendance check-in system with GPS verification within factory premises (500m radius) using the Haversine formula. Supports multiple factory locations.
    - Role-based access control (Admin, Production Manager, Film Operator, Printing Operator, Cutting Operator).
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
- **Messaging**: Twilio (for WhatsApp notifications)