# Technical Specifications: Hristo Airsoft E-Commerce Platform

## 1. System Overview
The **Hristo** platform is a high-performance, industrial-grade e-commerce solution tailored for the airsoft industry. It integrates advanced 3D visualization, real-time business analytics, and a robust Enterprise Resource Planning (ERP) subsystem. The architecture is designed for extreme scalability and zero-downtime deployments using a modern serverless stack.

## 2. Core Architectural Components
### 2.1. Frontend Architecture
- **Framework**: React 18.x with Vite for high-speed HMR and optimized builds.
- **State Management**: Zustand for lightweight, high-performance global state (Auth, Cart, Settings).
- **Styling Engine**: Vanilla CSS with TailwindCSS utilities, emphasizing a "Tactical Dark" aesthetic with glassmorphism and motion-optimized components (Framer Motion).
- **3D Engine**: Three.js and React Three Fiber (R3F) for real-time GLTF/GLB model rendering and interactive configuration.

### 2.2. Backend & Database
- **Runtime**: Node.js Serverless Functions (Vercel).
- **Database**: PostgreSQL (Neon) with optimized indexing for full-text search and complex relational queries.
- **Persistence Layer**: Custom database service abstraction for seamless interaction between frontend and API.
- **Asset Storage**: Vercel Blob Store (Online-only policy) for dynamic imagery, 3D models, and documents, eliminating local filesystem dependency.

## 3. Unique Functional Systems
### 3.1. Advanced 3D Weapon Configurator
The platform's standout feature is an interactive 3D configurator that allows users to:
- Load high-fidelity 4K textured models.
- Apply real-time modifications (attachments, camos, internal parts).
- Calculate real-time compatibility and pricing based on selected components.
- Save and share unique "builds" via persistent database records.

### 3.2. Real-Time BI Analytics (Business Intelligence)
The administrative dashboard features a proprietary BI engine that provides:
- **Revenue Analytics**: Daily/Weekly/Monthly revenue tracking with trend analysis.
- **Sales Velocity**: Real-time monitoring of order frequency and stock depletion rates.
- **Inventory Health**: Automated low-stock alerts and SKU performance metrics.
- **Aggregation**: Server-side SQL aggregations to minimize frontend overhead and ensure data accuracy.

### 3.3. ERP & Warehouse Management Subsystem
Integrated inventory management including:
- **Multi-Warehouse Support**: Tracking stock across different physical locations.
- **Purchase Order (PO) Management**: Automated workflows for receiving stock from suppliers.
- **Inventory Logging**: Comprehensive audit trail of every stock movement (adjustment, sale, reception).
- **Supplier Relations**: Centralized database for tactical gear providers.

### 3.4. Administrative Audit & Traceability
A high-security audit system captures every administrative action:
- **Event Logging**: Detailed logs of user edits, product deletions, and settings changes.
- **User Accountability**: Association of each event with the specific administrator ID.
- **Real-time Monitoring**: Polling-based live feed of system activities.

### 3.5. Dynamic Site Settings Engine
A centralized configuration system allows administrators to control the entire storefront without code changes:
- **Hero & Promo Management**: Real-time updates to banners, videos, and CTA links.
- **SEO Orchestration**: Dynamic management of meta tags, titles, and social graph descriptions.
- **Asset Swapping**: Online-only logo and branding management via the Site Settings Manager.

## 4. Technical Innovations
- **Online-Only Asset Integrity**: A hardened policy ensuring no local fallbacks exist, forcing the system to rely exclusively on cloud-based, versioned assets.
- **Image Optimization Engine**: Automatic client-side WebP compression and resizing before upload to minimize bandwidth and storage costs.
- **Responsive Modal Framework**: A standardized, CSS-flex based layout system for complex administrative modals, ensuring full accessibility and scrollability on any viewport.
- **Multilingual Integration**: A context-aware translation system supporting deep internationalization across categories, product descriptions, and transactional emails.

## 5. Security & Stability
- **Authentication**: JWT (JSON Web Token) with secure HTTP-only cookie-like behavior in localStorage (Zustand persist).
- **Authorization**: Role-Based Access Control (RBAC) enforced at both the UI and API levels.
- **Payment Integrity**: Stripe integration for PCI-compliant transaction processing.
- **Database Safety**: Connection pooling (via Neon/Postgres) and parameterized queries to prevent SQL injection and connection exhaustion.
