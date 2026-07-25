# Use Cases

## Overview

This document defines the functional use cases for the Clinical Management System, organized by actor. Each use case describes the intent, the actor responsible, and the expected system behavior.

---

## 1. Universal Functions (All Actors)

These use cases apply to every authenticated user in the system regardless of role.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-1.1 | Authenticate Account | Log in securely via email/password or SSO. |
| UC-1.2 | Manage Session | Log out and invalidate the active session token. |
| UC-1.3 | Reset Credentials | Request and complete a secure password reset workflow. |

---

## 2. SaaS Admin (Platform Owner)

The platform owner operates across all tenants and manages the infrastructure layer.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-2.1 | Provision Tenant | Provision a new tenant record and apply default configuration for a newly registered clinic. All tenants share a single PostgreSQL database with row-level `clinic_id` isolation. |
| UC-2.2 | Manage Tenant Status | Suspend, activate, or terminate a clinic's access based on subscription or policy violations. |
| UC-2.3 | View Platform Analytics | Monitor overarching system health, total active clinics, and global error logs. |

---

## 3. Clinic Admin (Tenant Owner)

The clinic administrator manages day-to-day operations, staff, and billing for a single tenant.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-3.1 | Manage Staff & Roles | Add user accounts for doctors and receptionists, assign access permissions, and soft-delete (archive) departed staff. Supports create, read, update, and archive operations. |
| UC-3.2 | Configure Clinic Settings | Update localized business details, operational hours, timezone, and currency. |
| UC-3.3 | Manage Service Catalog | Add, update, or archive billable medical procedures and baseline prices. |
| UC-3.4 | Manage Staff Schedules | Define available working days and block out hours for individual doctors to control booking slots. |
| UC-3.5 | Review Audit Logs | Access read-only, immutable ledgers of who viewed, created, or modified sensitive patient records. |
| UC-3.6 | Manage Subscription | View the clinic's current SaaS billing tier and update the payment method on file. |
| UC-3.7 | View Daily Summaries | Generate end-of-day reports showing total revenue collected (split by cash/card) and the consolidated daily patient roster. |

---

## 4. Receptionist (Front Desk)

The receptionist handles patient intake, scheduling, and point-of-sale workflows.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-4.1 | Manage Patient Profiles | Register new patients, update demographics, and soft-delete duplicate or inactive profiles. Supports create, read, update, and archive operations. |
| UC-4.2 | Manage Appointments | Schedule new visits, reschedule conflicts, or cancel bookings. |
| UC-4.3 | Track Appointment Pipeline | Update statuses in real-time: Scheduled → Arrived/Waiting → In-Session → Completed → No-Show. |
| UC-4.4 | Generate Invoices | Compile an itemized bill based on a completed appointment and the defined service catalog. |
| UC-4.5 | Process Payments | Record and log partial or full payments (cash, card) against an open invoice to close the patient's balance. |

---

## 5. Doctor (Clinical Staff)

The doctor interacts with clinical data and produces medical documentation.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-5.1 | View Patient Chart | Access a consolidated dashboard of a patient's demographics, past visit history, and current medications. |
| UC-5.2 | Manage Conditions | Tag and update a patient's known chronic conditions or active allergies for instant visibility. |
| UC-5.3 | Manage Clinical Notes | Draft, revise, and finalize structured SOAP notes for a specific patient encounter. Supports create, read, and update operations. |
| UC-5.4 | Generate Prescriptions | Select medications, define dosages, and create a digital prescription record. |
| UC-5.5 | Manage Documents | Upload, view, and securely link external medical files (X-rays, lab reports, intake forms) to a patient's chart. |
| UC-5.6 | Request Reservations | Flag a patient's chart with a follow-up requirement so the receptionist is alerted to schedule it. |

---

## 6. Patient (End User)

The patient interacts with the system through a self-service portal.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-6.1 | Manage Appointments | Request a new booking slot or view upcoming confirmed visits. |
| UC-6.2 | View Clinical History | Access read-only summaries of past consultations and active prescriptions. |
| UC-6.3 | Update Personal Details | Modify their own contact information and emergency contact numbers. |

---

## 7. System (Automated Processes)

Background processes that run without direct user interaction.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-7.1 | Dispatch Reminders | Automatically queue and send SMS or email notifications to patients 24 hours prior to their scheduled appointment. |

---

## Use Case Index

| ID | Use Case | Actor |
|----|----------|-------|
| UC-1.1 | Authenticate Account | All |
| UC-1.2 | Manage Session | All |
| UC-1.3 | Reset Credentials | All |
| UC-2.1 | Provision Tenant | SaaS Admin |
| UC-2.2 | Manage Tenant Status | SaaS Admin |
| UC-2.3 | View Platform Analytics | SaaS Admin |
| UC-3.1 | Manage Staff & Roles | Clinic Admin |
| UC-3.2 | Configure Clinic Settings | Clinic Admin |
| UC-3.3 | Manage Service Catalog | Clinic Admin |
| UC-3.4 | Manage Staff Schedules | Clinic Admin |
| UC-3.5 | Review Audit Logs | Clinic Admin |
| UC-3.6 | Manage Subscription | Clinic Admin |
| UC-3.7 | View Daily Summaries | Clinic Admin |
| UC-4.1 | Manage Patient Profiles | Receptionist |
| UC-4.2 | Manage Appointments | Receptionist |
| UC-4.3 | Track Appointment Pipeline | Receptionist |
| UC-4.4 | Generate Invoices | Receptionist |
| UC-4.5 | Process Payments | Receptionist |
| UC-5.1 | View Patient Chart | Doctor |
| UC-5.2 | Manage Conditions | Doctor |
| UC-5.3 | Manage Clinical Notes | Doctor |
| UC-5.4 | Generate Prescriptions | Doctor |
| UC-5.5 | Manage Documents | Doctor |
| UC-5.6 | Request Reservations | Doctor |
| UC-6.1 | Manage Appointments | Patient |
| UC-6.2 | View Clinical History | Patient |
| UC-6.3 | Update Personal Details | Patient |
| UC-7.1 | Dispatch Reminders | System |
