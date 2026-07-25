# Clinic Management System — MVP Data Dictionary
**Context:** Multi-tenant SaaS for Egyptian clinics
**Conventions used below:**
- All tables include `clinic_id` (FK) for tenant isolation, except `Role` where noted (its `clinic_id` is nullable for system-level roles).
- All tables include `created_at`, `updated_at` (timestamps). Soft-delete tables also get `deleted_at`.
- All primary keys are UUIDs (safer than auto-increment ints in multi-tenant systems — avoids ID collision/enumeration).
- Money fields: `DECIMAL(10,2)`, currency default `EGP`.
- Egypt-specific fields are flagged with 🇪🇬.

---

## 1. Core & System Administration

### Clinic
| Attribute | Type | Notes |
|---|---|---|
| clinic_id | UUID (PK) | |
| name_en | VARCHAR | |
| name_ar | VARCHAR | 🇪🇬 most patients/staff will expect Arabic UI |
| slug/subdomain | VARCHAR, unique | for tenant routing (e.g. `nile-clinic.yourapp.com`) |
| commercial_registration_no | VARCHAR | nullable — 🇪🇬 السجل التجاري |
| tax_registration_no | VARCHAR | 🇪🇬 الرقم الضريبي — required for e-invoicing |
| phone_primary | VARCHAR | store as +20 E.164 |
| phone_secondary | VARCHAR | nullable |
| email | VARCHAR | |
| address_line | VARCHAR | |
| city | VARCHAR | |
| governorate | ENUM/VARCHAR | 🇪🇬 use Egypt's 27 governorates as a lookup table, not free text |
| postal_code | VARCHAR | nullable, often unused in Egypt |
| logo_url | VARCHAR | nullable |
| timezone | VARCHAR | default `Africa/Cairo` |
| default_currency | VARCHAR(3) | default `EGP` |
| business_hours | JSON | nullable — clinic-wide operating hours per day (UC-3.2), distinct from individual doctor `Schedule` rows; e.g. `{"sunday": {"open":"09:00","close":"21:00"}, "friday": {"closed": true}, ...}` |
| is_active | BOOLEAN | |
| created_at / updated_at | TIMESTAMP | |

### User
| Attribute | Type | Notes |
|---|---|---|
| user_id | UUID (PK) | |
| clinic_id | UUID (FK) | **nullable** — null = platform-level SaaS Admin who operates across all tenants, not scoped to one clinic |
| role_id | UUID (FK) | nullable when `is_platform_admin` is true (platform admins bypass clinic-scoped roles) |
| is_platform_admin | BOOLEAN | default false — flags SaaS Admins (UC-2.1–2.3); app logic + RLS must treat these specially since they aren't clinic-isolated |
| full_name_en | VARCHAR | |
| full_name_ar | VARCHAR | |
| national_id | VARCHAR(14) | 🇪🇬 Egyptian National ID — validate checksum + extract DOB/gender from it |
| email | VARCHAR, unique | |
| phone | VARCHAR | |
| password_hash | VARCHAR | never store plaintext |
| profile_photo_url | VARCHAR | nullable |
| specialty | VARCHAR | nullable — only for doctors (e.g. "Cardiology") |
| medical_syndicate_license_no | VARCHAR | 🇪🇬 نقابة الأطباء — required to legally practice/prescribe; also needed on printed prescriptions |
| syndicate_license_expiry | DATE | nullable |
| is_active | BOOLEAN | |
| last_login_at | TIMESTAMP | nullable |
| mfa_enabled | BOOLEAN | recommended given health data sensitivity |
| created_at / updated_at / deleted_at | TIMESTAMP | |

### Role
| Attribute | Type | Notes |
|---|---|---|
| role_id | UUID (PK) | |
| clinic_id | UUID (FK) | nullable — null = system/global role template (e.g. "Admin", "Doctor", "Receptionist") that clinics can clone/customize |
| name | VARCHAR | |
| description | TEXT | nullable |
| permissions | JSON | e.g. `{"patients.read": true, "invoices.void": false}` |
| is_system_role | BOOLEAN | prevents deletion of built-in roles |
| created_at / updated_at | TIMESTAMP | |

### Subscription
| Attribute | Type | Notes |
|---|---|---|
| subscription_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| plan_tier | ENUM | basic / pro / enterprise |
| billing_cycle | ENUM | monthly / annual |
| price | DECIMAL | |
| currency | VARCHAR(3) | |
| payment_gateway | VARCHAR | 🇪🇬 likely `Paymob`, `Fawry`, or `Stripe` if billing internationally |
| payment_gateway_customer_id | VARCHAR | |
| payment_gateway_subscription_id | VARCHAR | |
| payment_method_brand | VARCHAR | nullable — e.g. "Visa", "Mastercard", for display only (UC-3.6) |
| payment_method_last4 | VARCHAR(4) | nullable — last 4 digits of the card on file, for display only; never store full card numbers |
| payment_method_exp_month | INT | nullable |
| payment_method_exp_year | INT | nullable |
| status | ENUM | trialing / active / past_due / cancelled / suspended |
| trial_ends_at | TIMESTAMP | nullable |
| current_period_start | TIMESTAMP | |
| current_period_end | TIMESTAMP | |
| max_users | INT | plan-based seat limit, useful for enforcement |
| created_at / updated_at | TIMESTAMP | |

### AuditLog
| Attribute | Type | Notes |
|---|---|---|
| audit_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| user_id | UUID (FK) | who performed the action (nullable for system actions) |
| action | ENUM | create / read / update / delete / login / export |
| entity_type | VARCHAR | e.g. "Patient", "Prescription" |
| entity_id | UUID | |
| old_values | JSON | nullable |
| new_values | JSON | nullable |
| ip_address | VARCHAR | |
| user_agent | VARCHAR | |
| created_at | TIMESTAMP | **no updated_at/deleted_at — must be append-only/immutable** |

---

## 2. Scheduling & Operations

### Patient
| Attribute | Type | Notes |
|---|---|---|
| patient_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| mrn | VARCHAR | clinic-scoped medical record number, human-friendly (e.g. `P-2026-0001`) |
| full_name_en | VARCHAR | |
| full_name_ar | VARCHAR | |
| national_id | VARCHAR(14) | 🇪🇬 nullable — not all patients are Egyptian (tourists, refugees); add `passport_no` as fallback |
| passport_no | VARCHAR | nullable, for non-Egyptian patients |
| date_of_birth | DATE | |
| gender | ENUM | male / female |
| phone_primary | VARCHAR | |
| phone_secondary | VARCHAR | nullable |
| email | VARCHAR | nullable |
| address_line | VARCHAR | nullable |
| city | VARCHAR | nullable |
| governorate | VARCHAR | nullable |
| blood_type | ENUM | A+/A-/B+/B-/O+/O-/AB+/AB-, nullable |
| emergency_contact_name | VARCHAR | nullable |
| emergency_contact_phone | VARCHAR | nullable |
| insurance_provider | VARCHAR | nullable — 🇪🇬 e.g. GIG, Allianz, or Egyptian national health insurance |
| insurance_policy_no | VARCHAR | nullable |
| password_hash | VARCHAR | nullable — set only if patient activates self-service portal access (UC-6.1–6.3) |
| portal_access_enabled | BOOLEAN | default false — whether this patient has registered for the portal |
| email_verified_at | TIMESTAMP | nullable |
| created_at / updated_at / deleted_at | TIMESTAMP | |

### Appointment
| Attribute | Type | Notes |
|---|---|---|
| appointment_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| patient_id | UUID (FK) | |
| doctor_id | UUID (FK → User) | |
| scheduled_start | TIMESTAMP | |
| scheduled_end | TIMESTAMP | |
| checked_in_at | TIMESTAMP | nullable |
| status | ENUM | scheduled / confirmed / checked_in / in_progress / completed / cancelled / no_show |
| appointment_type | ENUM | new / follow_up / consultation / procedure |
| reason_for_visit | TEXT | nullable |
| cancellation_reason | TEXT | nullable |
| booked_via | ENUM | walk_in / phone / online / whatsapp — 🇪🇬 WhatsApp booking is common practice |
| created_by | UUID (FK → User) | |
| created_at / updated_at | TIMESTAMP | |

### Schedule
| Attribute | Type | Notes |
|---|---|---|
| schedule_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| user_id | UUID (FK) | doctor/staff whose availability this defines |
| day_of_week | ENUM/INT | 0–6, note 🇪🇬 weekend is Friday–Saturday, not Sat–Sun — don't hardcode Western week assumptions in UI |
| start_time | TIME | |
| end_time | TIME | |
| slot_duration_minutes | INT | default appointment length |
| is_recurring | BOOLEAN | |
| effective_from | DATE | nullable |
| effective_to | DATE | nullable — for temporary schedule overrides/vacations |
| is_active | BOOLEAN | |
| created_at / updated_at | TIMESTAMP | |

### ScheduleException
One-off deviations from a doctor's recurring `Schedule` — vacations, sick days, or ad-hoc blocked hours (UC-3.4). Booking logic must check this table in addition to `Schedule` before offering a slot.

| Attribute | Type | Notes |
|---|---|---|
| exception_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| user_id | UUID (FK) | doctor/staff this exception applies to |
| exception_date | DATE | the specific date affected |
| start_time | TIME | nullable — if null alongside `is_full_day_off`, the entire day is blocked |
| end_time | TIME | nullable |
| is_full_day_off | BOOLEAN | default false |
| reason | VARCHAR | nullable, e.g. "Annual leave", "Conference" |
| created_by | UUID (FK → User) | |
| created_at / updated_at | TIMESTAMP | |

---

## 3. Clinical & EMR

### Note
| Attribute | Type | Notes |
|---|---|---|
| note_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| appointment_id | UUID (FK) | |
| patient_id | UUID (FK) | |
| doctor_id | UUID (FK → User) | |
| chief_complaint | TEXT | |
| subjective | TEXT | S in SOAP |
| objective | TEXT | O in SOAP |
| assessment | TEXT | A in SOAP |
| plan | TEXT | P in SOAP |
| vitals_blood_pressure | VARCHAR | e.g. "120/80" |
| vitals_heart_rate | INT | nullable |
| vitals_temperature | DECIMAL | nullable |
| vitals_weight_kg | DECIMAL | nullable |
| vitals_height_cm | DECIMAL | nullable |
| vitals_spo2 | INT | nullable |
| is_finalized | BOOLEAN | locks record from edits once signed |
| signed_at | TIMESTAMP | nullable |
| needs_follow_up | BOOLEAN | default false — flags the receptionist queue for a follow-up booking (UC-5.6) |
| follow_up_date | DATE | nullable — suggested target date for the follow-up |
| follow_up_reason | TEXT | nullable |
| created_at / updated_at | TIMESTAMP | |

### PatientCondition
| Attribute | Type | Notes |
|---|---|---|
| condition_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| patient_id | UUID (FK) | |
| type | ENUM | chronic_condition / allergy |
| name | VARCHAR | e.g. "Penicillin allergy", "Type 2 Diabetes" |
| icd10_code | VARCHAR | nullable, for standardization |
| severity | ENUM | mild / moderate / severe — most relevant for allergies |
| status | ENUM | active / resolved |
| diagnosed_date | DATE | nullable |
| notes | TEXT | nullable |
| recorded_by | UUID (FK → User) | |
| created_at / updated_at | TIMESTAMP | |

### Prescription
Header record for the prescribing event — one per encounter. Individual medications live on `PrescriptionItem` (1—N below).

| Attribute | Type | Notes |
|---|---|---|
| prescription_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| patient_id | UUID (FK) | |
| appointment_id | UUID (FK) | nullable |
| note_id | UUID (FK) | nullable |
| doctor_id | UUID (FK → User) | |
| status | ENUM | active / completed / cancelled |
| created_at / updated_at | TIMESTAMP | |

### PrescriptionItem
One row per medication on a `Prescription` (1—N relationship: a single prescription can list multiple drugs).

| Attribute | Type | Notes |
|---|---|---|
| prescription_item_id | UUID (PK) | |
| prescription_id | UUID (FK) | |
| medication_name | VARCHAR | consider linking to an Egyptian drug database (EDA-registered drugs) later |
| dosage | VARCHAR | e.g. "500mg" |
| frequency | VARCHAR | e.g. "twice daily" |
| duration | VARCHAR | e.g. "7 days" |
| route | ENUM | oral / topical / IV / IM / other |
| instructions | TEXT | nullable, e.g. "after meals" |
| is_refillable | BOOLEAN | |
| created_at / updated_at | TIMESTAMP | |

### Document
| Attribute | Type | Notes |
|---|---|---|
| document_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| patient_id | UUID (FK) | |
| appointment_id | UUID (FK) | nullable |
| uploaded_by | UUID (FK → User) | |
| document_type | ENUM | lab_result / xray / intake_form / referral / other |
| file_name | VARCHAR | |
| storage_key | VARCHAR | S3/blob path, not the raw file itself |
| file_size_bytes | BIGINT | |
| mime_type | VARCHAR | |
| is_encrypted | BOOLEAN | recommended for compliance |
| uploaded_at | TIMESTAMP | |

---

## 4. Billing & Financials

### ServiceItem
| Attribute | Type | Notes |
|---|---|---|
| service_item_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| name_en | VARCHAR | |
| name_ar | VARCHAR | |
| code | VARCHAR | internal SKU/procedure code |
| category | VARCHAR | e.g. "Consultation", "Lab", "Procedure" |
| base_price | DECIMAL | |
| currency | VARCHAR(3) | default EGP |
| duration_minutes | INT | nullable |
| is_taxable | BOOLEAN | |
| tax_rate | DECIMAL | 🇪🇬 default 14% (Egyptian VAT), though many medical services are VAT-exempt — make configurable |
| is_active | BOOLEAN | |
| created_at / updated_at | TIMESTAMP | |

### Invoice
| Attribute | Type | Notes |
|---|---|---|
| invoice_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| patient_id | UUID (FK) | |
| appointment_id | UUID (FK) | nullable |
| invoice_number | VARCHAR | human-readable sequential number, unique per clinic |
| issue_date | DATE | |
| due_date | DATE | nullable |
| subtotal | DECIMAL | |
| discount_amount | DECIMAL | default 0 |
| tax_amount | DECIMAL | default 0 |
| total_amount | DECIMAL | |
| amount_paid | DECIMAL | derived/denormalized for quick lookups |
| currency | VARCHAR(3) | default EGP |
| status | ENUM | draft / issued / paid / partially_paid / overdue / void |
| notes | TEXT | nullable |
| created_by | UUID (FK → User) | |
| created_at / updated_at | TIMESTAMP | |

### InvoiceLineItem
| Attribute | Type | Notes |
|---|---|---|
| line_item_id | UUID (PK) | |
| invoice_id | UUID (FK) | |
| service_item_id | UUID (FK) | |
| description | VARCHAR | snapshot of service name at time of billing (don't rely solely on live join, since prices/names change) |
| quantity | INT | default 1 |
| unit_price | DECIMAL | snapshot, not live reference to ServiceItem.base_price |
| discount_amount | DECIMAL | default 0 |
| tax_amount | DECIMAL | default 0 |
| line_total | DECIMAL | |

### Payment
| Attribute | Type | Notes |
|---|---|---|
| payment_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| invoice_id | UUID (FK) | |
| patient_id | UUID (FK) | |
| amount | DECIMAL | |
| currency | VARCHAR(3) | default EGP |
| payment_method | ENUM | 🇪🇬 `cash`, `visa_mastercard`, `instapay`, `fawry`, `vodafone_cash`, `bank_transfer` — these are the realistic local rails |
| payment_gateway_reference | VARCHAR | nullable, transaction ID from Paymob/Fawry etc. |
| transaction_date | TIMESTAMP | |
| received_by | UUID (FK → User) | |
| status | ENUM | pending / completed / failed / refunded |
| notes | TEXT | nullable |
| created_at | TIMESTAMP | |

---

## 5. Auth & Notifications

### PasswordResetToken
Supports UC-1.3 (secure password reset). Applies to `User` records; extend to `Patient` too if the patient portal ships in this phase.

| Attribute | Type | Notes |
|---|---|---|
| reset_token_id | UUID (PK) | |
| user_id | UUID (FK) | |
| token_hash | VARCHAR | store a hash of the token, never the raw token |
| expires_at | TIMESTAMP | typically 15–60 minutes from creation |
| used_at | TIMESTAMP | nullable — set once the token has been consumed, prevents reuse |
| created_at | TIMESTAMP | |

### RefreshToken
Only needed if you want genuine server-side session invalidation on logout (UC-1.2). If you go with short-lived access tokens only and accept client-side logout as sufficient, this table can be skipped for MVP.

| Attribute | Type | Notes |
|---|---|---|
| refresh_token_id | UUID (PK) | |
| user_id | UUID (FK) | |
| token_hash | VARCHAR | store a hash, never the raw token |
| expires_at | TIMESTAMP | |
| revoked_at | TIMESTAMP | nullable — set on logout or forced invalidation |
| created_at | TIMESTAMP | |

### Notification
Tracks queued/sent/failed patient reminders (UC-7.1) so the background job doesn't double-send and delivery is auditable.

| Attribute | Type | Notes |
|---|---|---|
| notification_id | UUID (PK) | |
| clinic_id | UUID (FK) | |
| patient_id | UUID (FK) | |
| appointment_id | UUID (FK) | nullable — most reminders are appointment-triggered |
| channel | ENUM | sms / email / whatsapp |
| status | ENUM | queued / sent / failed / cancelled |
| scheduled_for | TIMESTAMP | when the reminder should fire (e.g. 24h before appointment) |
| sent_at | TIMESTAMP | nullable |
| failure_reason | TEXT | nullable |
| created_at | TIMESTAMP | |

---

## Key Egypt-specific design decisions to flag for your team

1. **National ID (14-digit)**: encodes birth century, birth date, governorate code, gender, and a checksum digit. Worth writing a validator/parser utility — you can auto-derive `date_of_birth` and `gender` from it and cross-check against user input.
2. **Bilingual fields**: Arabic is required for printed prescriptions/invoices in most clinics; keep `_en`/`_ar` pairs rather than a single localized-string table for MVP simplicity.
3. **Medical Syndicate license**: legally, only syndicate-registered doctors can sign prescriptions — worth validating this exists before allowing `Prescription` creation.
4. **Local payment rails**: cash is still dominant in many clinics; Fawry, InstaPay, and Vodafone Cash are the common digital methods alongside cards — Stripe alone won't cover the market.
5. **Governorates as a lookup table**, not free text — 27 fixed values, avoids messy data entry.
6. **Weekend = Friday/Saturday** — affects `Schedule` and any calendar UI logic.
7. **VAT (14%)** — many core medical/clinical services are VAT-exempt in Egypt, but ancillary items (cosmetic, non-medical retail) may not be — keep `tax_rate` per `ServiceItem` rather than hardcoding.

---

## Suggested relationships (ER summary)
- `Clinic` 1—N `User`, `Patient`, `ServiceItem`, `Subscription` (1—1 or 1—N if plan history matters)
- `User` N—1 `Role` (nullable for platform admins)
- `User` 1—N `Schedule`, `ScheduleException`, `PasswordResetToken`, `RefreshToken`
- `Patient` 1—N `Appointment`, `PatientCondition`, `Document`, `Invoice`, `Notification`
- `Appointment` 1—N `Note`, 1—N `Prescription`
- `Prescription` 1—N `PrescriptionItem`
- `Invoice` 1—N `InvoiceLineItem`, 1—N `Payment`
- `InvoiceLineItem` N—1 `ServiceItem`
- `AuditLog` references any entity polymorphically via `entity_type` + `entity_id`

### Notes on the additions above
These nine changes close the gaps found when cross-referencing against `use-cases.md`:
1. `Patient` gained portal auth fields (UC-6.x)
2. `User.clinic_id`/`role_id` made nullable + `is_platform_admin` flag (UC-2.x)
3. `Note` gained follow-up flagging fields (UC-5.6)
4. New `Notification` table (UC-7.1)
5. New `PasswordResetToken` table (UC-1.3)
6. New `RefreshToken` table (UC-1.2, optional for MVP)
7. New `ScheduleException` table (UC-3.4)
8. `Clinic` gained `business_hours` (UC-3.2)
9. `Subscription` gained displayable payment-method fields (UC-3.6)
