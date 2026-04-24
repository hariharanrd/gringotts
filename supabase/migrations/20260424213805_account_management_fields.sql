-- ============================================================
-- Migration: Add display_name and profile_picture to app_user
-- Feature: Account Management
-- Date: 2026-04-24
-- ============================================================

ALTER TABLE public.app_user
    ADD COLUMN IF NOT EXISTS display_name    VARCHAR(64),
    ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- display_name  : Optional friendly name shown in the UI (max 64 chars)
-- profile_picture: Base64-encoded JPEG data URL (resized to 256x256 client-side)
-- Both columns are nullable; NULL means "not set" — the app falls back to username / gradient initials.
