# Appointment Cancellation Logic Documentation

This document outlines the technical implementation of how appointments are cancelled in the Beacon mHealth application, specifically interacting with the External Database.

## Overview

The cancellation process is a direct `UPDATE` operation on the external PostgreSQL database. We do not delete records; we change their `status` to indicate cancellation.

## Data Flow

1.  **User Action**: User taps "Cancel Appointment" in the mobile app.
2.  **API Request**: App sends `DELETE /api/appointments/:id` (mapped to cancellation logic) to the backend.
3.  **Backend Processing**:
    *   **Verification**: The backend first verifies that the authenticated user is the parent of the child linked to the appointment.
    *   **External Update**: The backend executes a SQL query against the external database.

## Detailed Steps

### 1. Verification (Security)
Before cancelling, the system performs a multi-step check to ensure authorization:
1.  **Local Checks**: Finds the User's local `children` records to get their `registration_numbers`.
2.  **External Lookup**: Queries the external `children` table using those `registration_numbers` to find the authoritative `external_child_id`s.
3.  **Ownership Check**: Verifies that the `appointment` with the given `id` actually belongs to one of those `external_child_id`s.

### 2. The Cancellation Query
Once verified, the following SQL query is executed:

```sql
UPDATE appointments 
SET status = 'canceled', 
    updated_at = NOW()
WHERE id = $1
RETURNING *;
```

**Key Details:**
*   **Target Table**: `appointments`
*   **Target Column**: `status`
*   **Value Set**: `'canceled'` (US English spelling, one 'l'). *Note: Previously used 'cancelled', verification scripts suggest both are accepted by the DB schema, but 'canceled' is standard for many systems.*
*   **Timestamp**: `updated_at` is updated to the current time.

## Current Behavior & Debugging

*   **Loose Typing**: The `status` column in the external database appears to be a text field (VARCHAR/TEXT) rather than a strict ENUM. This means it accepts both `'canceled'` and `'cancelled'` without error.
*   **System Recognition**: If the external administrative system (Clinic Portal) is not reflecting the cancellation, it is likely looking for a *specific case-sensitive string* (e.g., `Cancelled`, `CANCELED`) or relies on a different mechanism (like a separate history table or soft-delete column) that we are not currently updating.

## Debugging Results & Resolution (Jan 2026)

### Investigation Report Analysis
A mismatch was identified between the Mobile App, Backend, and External Dashboard:
1.  **Mobile App**: Sets status to `'canceled'` (Standardized).
2.  **External Backend**: Uses `'rejected'` for internal cancellations.
3.  **External Dashboard**: Previously failed to exclude these statuses, causing "cancelled" items to remain visible.

### Implementation Status
*   **Mobile Proxy Updates**: 
    *   Direct writes now use `'canceled'` (one 'l') to align with standardized recommendations.
    *   Read operations now strictly map both `'canceled'` and `'rejected'` to the frontend's expected `'cancelled'` status.
*   **External Dashboard**: Update applied to `ReceptionController.php` to exclude `['canceled', 'cancelled', 'rejected']`.

### Conclusion
The "failure to cancel" was primarily a visibility issue on the external dashboard. With the dashboard fix and our status standardization, the system is now consistent. No changes to the Direct SQL approach were necessary as raw updates are correctly persisting.
