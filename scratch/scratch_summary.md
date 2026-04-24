# Scratch Archive Log

This file contains a summary of the temporary scripts and utilities previously stored in the `scratch` directory. These files were deleted to clean up the workspace, but their functionality is documented here for reference.

## Database Schema & Migrations
- `add_stripe_columns.sql`: SQL script to add Stripe-related columns (customer_id, payment_intent_id, etc.) to the database.
- `check_columns.ts` / `list_columns.mjs`: Utility to inspect columns of specific database tables.
- `check_schema.ts` / `check_orders_schema.ts` / `check_users_schema.ts`: Scripts to verify table structures against expected schemas.
- `fix_order_items_schema.ts` / `fix_users_schema.ts`: Scripts used to modify table structures (adding missing columns, changing types).
- `list_tables.mjs`: Simple script to list all tables in the current database.
- `migrate_orders_fields.ts`: Script to migrate data between order fields during schema changes.
- `migrate_stripe.ts`: Specific migration script for Stripe integration data.

## Loyalty & User Management
- `recalc_one_user.ts`: Recalculates loyalty points, rank, and discount for a specific hardcoded user ID.
- `recalc_ranks.ts`: Iterates through all users and recalculates their loyalty status based on total spent.
- `debug_loyalty.ts` / `test_loyalty.ts`: Development tests for loyalty point calculation and rank progression logic.

## Data Sync & Cleanup
- `check_blob_sync.mjs`: Verifies consistency between Vercel Blob storage and the database image URLs.
- `sync_db_images.mjs`: Ensures product image galleries (`images` array) and primary `image_url` are synchronized.
- `check_sync.mjs`: General purpose sync verification script.
- `deduplicate_i18n.js`: Utility to find and remove duplicate keys in JSON translation files.
- `fix_glock.mjs`: One-off script to fix data issues for a specific product category (Glock series).

## Diagnostics & Debugging
- `check_consistency.ts`: Checks for orphaned records or inconsistent data across related tables.
- `check_display_names.ts`: Diagnostic for product naming conventions.
- `check_order_items.ts` / `check_orders.ts` / `debug_items.ts` / `view_items.ts`: Scripts to inspect raw JSON data of orders and their items.
- `debug_status_update.ts`: Tests the logic for changing order statuses and side effects.
- `diag_db.mjs`: General database connection and health diagnostic.
- `get_settings.mjs` / `migrate_settings.mjs` / `migrate_settings.ts`: Utilities for managing and migrating site-wide configuration settings.

---
*Created on 2026-04-24*
