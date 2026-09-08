# 🏥 Beacon HUB — Digital Pediatric & Neurodevelopmental Health Platform

[![Platform: React Native / Expo](https://img.shields.io/badge/Platform-React%20Native%20%7C%20Expo-000?style=for-the-badge&logo=expo)](https://expo.dev)
[![Backend: Node.js / Express](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Payments: Safaricom M--Pesa](https://img.shields.io/badge/Payments-M--Pesa%20Daraja-00B140?style=for-the-badge)](https://developer.safaricom.co.ke)
[![AI Assistant: Beacon AI](https://img.shields.io/badge/AI%20Assistant-Pediatric%20Knowledge-FF6F00?style=for-the-badge)](https://beaconchildrencentre.com)
[![UNICEF Review](https://img.shields.io/badge/Target%20Audience-UNICEF%20%7C%20Global%20Health%20Partners-00ADEF?style=for-the-badge&logo=unicef)](https://www.unicef.org)

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [Project Vision & UNICEF Strategic Alignment](#-project-vision--unicef-strategic-alignment)
- [System Architecture](#-system-architecture)
- [Core Features & Clinical Workflows](#-core-features--clinical-workflows)
  - [1. Comprehensive Child Onboarding & Record Linking (`AddChild`)](#1-comprehensive-child-onboarding--record-linking)
  - [2. Age-Calibrated Developmental Milestones Checker (`MilestoneChecker`)](#2-age-calibrated-developmental-milestones-checker)
  - [3. Early Neurodevelopmental & ASD Screening (`ASDScreener`)](#3-early-neurodevelopmental--asd-screening)
  - [4. 24/7 Virtual Pediatric Guidance (`Beacon AI Assistant`)](#4-247-virtual-pediatric-guidance-beacon-ai-assistant)
  - [5. Pediatric Teleconsultation & Specialist Booking (`DoctorBooking`)](#5-pediatric-teleconsultation--specialist-booking)
  - [6. Digital Vaccination & Immunization Tracker (`Vaccinations`)](#6-digital-vaccination--immunization-tracker)
  - [7. Infant Feeding, Nutrition & Hydration Tracking (`FeedingTracker`)](#7-infant-feeding-nutrition--hydration-tracking)
  - [8. Primary Teething & Oral Health Tracker (`TeethingChart`)](#8-primary-teething--oral-health-tracker)
  - [9. Family Hub, Multi-Child Switching & Clinical Records (`Home & Profile`)](#9-family-hub-multi-child-switching--clinical-records)
- [End-to-End Clinical & User Journey](#-end-to-end-clinical--user-journey)
- [Telehealth & M-Pesa STK Push Payment Pipeline](#-telehealth--m-pesa-stk-push-payment-pipeline)
- [Data Security, Governance & Patient Privacy](#-data-security-governance--patient-privacy)
- [Technology Stack](#-technology-stack)
- [Installation & Developer Setup](#-installation--developer-setup)
- [API Reference Overview](#-api-reference-overview)
- [Strategic Roadmap](#-strategic-roadmap)

---

## 🌟 Executive Summary

**Beacon HUB** (developed in collaboration with **Beacon Children's Centre**) is an integrated, mobile-first pediatric and neurodevelopmental health platform designed to transform early childhood care delivery in Kenya and across East Africa.

In resource-constrained and developing settings, developmental delays, autism spectrum conditions, and missed childhood immunizations often go undetected until later childhood when corrective interventions are significantly less effective. Critical barriers include severe specialist shortages (developmental pediatricians, speech therapists, occupational therapists), geographical remoteness, fragmented paper-based health records, and lack of timely parental guidance.

**Beacon HUB** bridges these systemic gaps by providing:
1. **Longitudinal Developmental Tracking & Screening:** Clinically structured milestone evaluations and standardized Autism Spectrum Disorder (ASD / M-CHAT aligned) digital assessments.
2. **24/7 AI-Powered Pediatric Assistant:** Real-time caregiver education on therapies, assessments, clinic navigation, and general developmental concerns.
3. **EHR Continuity & Onboarding:** Seamless switching between new child registration and existing hospital client record verification.
4. **Frictionless Teleconsultations & Mobile Money:** Integrated virtual specialist consultations powered by **Safaricom M-Pesa STK Push**, democratizing access to scarce clinicians regardless of distance.

---

## 🎯 Project Vision & UNICEF Strategic Alignment

Beacon HUB is purpose-built to accelerate **UNICEF's Strategic Plan for Health & Early Childhood Development (ECD)** and contribute directly to the United Nations Sustainable Development Goals (**SDG 3**):

| UNICEF Global ECD & Health Priority | Beacon HUB Implementation & Direct Impact |
| :--- | :--- |
| **Every Child Survives & Thrives (SDG 3.2)** | Individualized digital vaccination timelines adhering to KEPI protocols; nutritional feeding monitors to safeguard infant health. |
| **Early Identification of Disabilities & Delays** | Validated Milestones Checker and ASD early screening tools enabling timely clinical triage during peak neural plasticity (ages 0–5). |
| **Universal Health Coverage & Specialist Equity (SDG 3.8)** | Remote teleconsultation connecting underserved families to specialized Occupational Therapists, Speech Therapists, and Developmental Pediatricians. |
| **Equitable Financing via Mobile Money** | Integration with Safaricom M-Pesa, the dominant digital financial service in East Africa, enabling accessible, transparent, pay-as-you-go teleconsultation fees. |
| **Digital Health Innovation & System Strengthening** | Centralized, interoperable Electronic Health Records (EHR) preventing duplicate files and providing caregivers with lifetime access to clinical records. |

---

## 🏛 System Architecture

Beacon HUB is built upon a resilient, decoupled client-server architecture optimized for real-world network conditions in sub-Saharan Africa (low-bandwidth resilience, offline state persistence, and high security).

```mermaid
graph TD
    subgraph Client Layer ["📱 Mobile Client (iOS & Android)"]
        A["Beacon HUB App (Expo SDK 52 / React Native)"]
        A --> B1["Firebase Authentication State"]
        A --> B2["Offline Local Storage & Cache"]
        A --> B3["Feature Modules: Milestones, ASD, Telehealth, MCH"]
        A --> B4["Beacon AI Interactive Chat Client"]
    end

    subgraph Gateway ["🌐 API & Gateway Layer"]
        C["Express / Node.js API Gateway (Railway Deployment)"]
        B1 -.->|JWT Bearer Token| C
        B3 -->|RESTful Endpoints| C
        B4 -->|AI Prompt & Stream Handler| C
    end

    subgraph Core Services ["⚙️ Backend Microservices & Controllers"]
        D1["Patient & Child Profile Controller"]
        D2["Milestone & ASD Assessment Engine"]
        D3["Specialist Scheduling & Telehealth Engine"]
        D4["Safaricom Daraja M-Pesa Payment Engine"]
        D5["Medical Records & Media Storage Service"]
        D6["Beacon AI Knowledge Base & RAG Engine"]
    end

    subgraph Data & Integrations ["💾 Persistent Data & Third-Party APIs"]
        E1[("PostgreSQL Database / Supabase")]
        E2["Firebase Auth & Cloud Messaging (FCM)"]
        E3["Safaricom Daraja API (Lipa Na M-Pesa Online STK Push)"]
        E4["Cloud Document & Medical File Storage"]
    end

    C --> D1
    C --> D2
    C --> D3
    C --> D4
    C --> D5
    C --> D6

    D1 & D2 & D3 & D5 --> E1
    D4 -->|STK Push Trigger / Instant Callback| E3
    D6 -.->|Pediatric Knowledge Base| E1
    C -.->|Token Verification| E2
    D5 --> E4
```

---

## 📱 Core Features & Clinical Workflows

### 1. Comprehensive Child Onboarding & Record Linking
- **Clinical Purpose:** Establishes the digital pediatric profile while eliminating fragmented hospital records.
- **Dual Enrollment Pathways:**
  - **New Client:** Fast, self-serve enrollment capturing legal name, gender, and date of birth to initialize age-specific developmental timers.
  - **Existing Client:** Automated lookup and verification against the Beacon Children's Centre hospital database (using registration number or phone), linking existing historical clinic charts to the app account.

| Screen Preview | Capabilities & Workflow |
| :--- | :--- |
| <img src="./ReadMe/AddChild.jpeg" alt="Add Child Screen" width="300" /> | • Prevents duplicate patient health records<br>• Seamless hospital registry synchronization<br>• Date-of-Birth calibrated screening triggers<br>• Instant family profile creation |

---

### 2. Age-Calibrated Developmental Milestones Checker
- **Clinical Purpose:** Provides structured, age-appropriate surveillance across all major developmental domains according to international pediatric benchmarks.
- **Four Core Developmental Domains:**
  1. **Social / Emotional:** Interpersonal interaction, reciprocal smiling, joint attention.
  2. **Language / Communication:** Receptive and expressive language, babbling, gesture usage.
  3. **Cognitive:** Problem solving, curiosity, exploratory behavior, object permanence.
  4. **Movement / Physical Development:** Gross and fine motor capabilities (sitting, crawling, grasping).
- **Intelligent Triage & Transition:** If a child completes the milestone evaluation and is 18 months or older, the platform automatically evaluates whether to trigger the deeper **ASD Screener**.

| Screen Preview | Capabilities & Workflow |
| :--- | :--- |
| <img src="./ReadMe/MilestoneChecker.jpeg" alt="Milestones Checker Screen" width="300" /> | • Domain-specific completion rates (e.g. 13/17 Achieved)<br>• Instant downloadable Milestone PDF Report<br>• Automated recommendation prompt: *"Since your child is over 18 months, proceed to the ASD Screener"*<br>• Direct one-click bridge to ASD assessment |

---

### 3. Early Neurodevelopmental & ASD Screening
- **Clinical Purpose:** Digitalized, user-friendly implementation of standardized Autism Spectrum Disorder screening (M-CHAT aligned) designed for home or community health worker use.
- **Automated Algorithmic Scoring:** Aggregates behavioral responses into standardized risk tiers:
  - **Low Risk (0–2):** Reassures parents and provides age-tailored stimulation tips.
  - **Medium Risk (3–7):** Recommends secondary screening and teleconsultation triage.
  - **High Risk (8+):** Prompts immediate priority booking with a Developmental Paediatrician.

```mermaid
flowchart TD
    Start(["Caregiver completes Milestone Checker"]) --> AgeCheck{Child Age >= 18 Mo?}
    AgeCheck -->|Yes| LaunchASD["Launch ASD Screener (M-CHAT Aligned)"]
    AgeCheck -->|No| FollowMilestone["Continue Standard Pediatric Milestones"]
    LaunchASD --> Answer["Caregiver Answers Behavioral Questions"]
    Answer --> ComputeScore["Automated Clinical Algorithm Scoring"]
    ComputeScore --> Risk{Stratified Risk Level}
    Risk -->|Low (0-2)| LowTier["Low Risk: Educational ECD Guidance"]
    Risk -->|Moderate (3-7)| MedTier["Moderate Risk: Triage & Secondary Screening"]
    Risk -->|High (8+)| HighTier["High Risk: Immediate Priority Specialist Referral"]
    MedTier --> Consult["One-Touch Doctor Booking"]
    HighTier --> Consult
```

| Screen Preview | Capabilities & Workflow |
| :--- | :--- |
| <img src="./ReadMe/ASD_Screener_Page.jpeg" alt="ASD Screener Page" width="300" /> | • Clear, plain-language behavioral indicators<br>• Unbiased, objective algorithmic evaluation<br>• Instant risk stratification without clinical jargon<br>• Actionable next-step guidance for parents |

---

### 4. 24/7 Virtual Pediatric Guidance (Beacon AI Assistant)
- **Clinical Purpose:** Delivers immediate, trusted pediatric guidance to parents, reducing anxiety, debunking developmental myths, and orienting families toward appropriate care pathways.
- **Capabilities & Scope:**
  - Answers questions regarding specialized services (Speech & Language, Occupational Therapy, Physiotherapy, Applied Behavior Analysis [ABA], Psychology, Clinical Nutrition).
  - Clarifies appointment booking, clinic locations, and operational hours.
  - Context-aware thinking animations and suggested quick-query chips.

| Screen Preview | Capabilities & Workflow |
| :--- | :--- |
| <img src="./ReadMe/AIChat.jpeg" alt="Beacon AI Assistant" width="300" /> | • Always online with contextual thinking indicators<br>• Knowledge base trained on clinical service offerings<br>• Suggested prompts for rapid caregiver discovery<br>• Gentle, empathetic triage and guidance |

---

### 5. Pediatric Teleconsultation & Specialist Booking
- **Clinical Purpose:** Overcomes geographical scarcity by connecting families anywhere in Kenya and East Africa to specialized multi-disciplinary child clinicians.
- **Multidisciplinary Clinician Roster:**
  - Developmental Paediatricians
  - Speech & Language Therapists
  - Occupational Therapists (OT)
  - Clinical Child Psychologists
  - Pediatric Physiotherapists
  - Pediatric Nutritionists & Medical Officers
- **Hybrid Delivery Modes:** Teleconsultation (virtual video consultation) or In-Person clinic visits.
- **Transparent Pricing:** Dynamic price breakdown with testing subsidies (e.g. developmental pediatric consult fee preview in KES).

| Screen Preview | Capabilities & Workflow |
| :--- | :--- |
| <img src="./ReadMe/DoctorBookingPage.jpeg" alt="Doctor Booking Screen" width="300" /> | • Specialist specialty filter and doctor selection<br>• Real-time calendar availability slots<br>• Clear fee transparency in Kenyan Shillings (KES)<br>• Choice of Teleconsult or In-Person visit<br>• Native Safaricom M-Pesa STK push trigger |

---

### 6. Digital Vaccination & Immunization Tracker
- **Clinical Purpose:** Eliminates zero-dose and under-immunized occurrences through automated scheduling and digital tracking from Birth to 59 months.
- **Timeline Alignment:** Calibrated to Kenya Expanded Programme on Immunization (KEPI) and WHO recommendations.
- **Status Classification:** Color-coded tracking for *Completed*, *Upcoming*, and *Overdue* doses (BCG, Polio/bOPV, Pentavalent, Rotavirus, Pneumococcal, Measles-Rubella, etc.).

| Screen Preview | Capabilities & Workflow |
| :--- | :--- |
| <img src="./ReadMe/VaccinationsPage.jpeg" alt="Vaccinations Screen" width="300" /> | • Chronological vaccine schedule by age cohort<br>• High-visibility completion badges and date stamps<br>• Clinical notes & provider stamp recording<br>• Timely reminders before due dates |

---

### 7. Infant Feeding, Nutrition & Hydration Tracking
- **Clinical Purpose:** Monitors early infant nutrition, supporting exclusive breastfeeding benchmarks, formula transitions, and introduction of solid foods.
- **Features:** Left/right nursing timer, bottle milk volume logger (ml/oz), and complementary food tolerance log to detect allergies early.

| Screen Preview | Capabilities & Workflow |
| :--- | :--- |
| <img src="./ReadMe/FeedingTrackerPage.jpeg" alt="Feeding Tracker Screen" width="300" /> | • Real-time nursing timers with breast alternation tracking<br>• Expressed breastmilk and formula volume recording<br>• Daily totals and feeding interval history |

---

### 8. Primary Teething & Oral Health Tracker
- **Clinical Purpose:** Anatomical visual tracking of primary (deciduous) tooth eruption patterns, aiding in early pediatric dental care and symptom management.

| Screen Preview | Capabilities & Workflow |
| :--- | :--- |
| <img src="./ReadMe/TeethingChartPage.jpeg" alt="Teething Chart Screen" width="300" /> | • Interactive pediatric upper & lower dental arch<br>• Eruption date recording and symptom diary<br>• Evidence-based teething pain management guidance |

---

### 9. Family Hub, Multi-Child Switching & Clinical Records
- **Clinical Purpose:** Allows parents to manage all their children under a single unified dashboard, with rapid child-switching, upcoming appointments, and downloadable PDF clinical reports.

| Home Dashboard | Profile & Medical Records |
| :---: | :---: |
| <img src="./ReadMe/HomePage.jpeg" alt="Home Dashboard" width="300" /> | <img src="./ReadMe/ProfilePage.jpeg" alt="Profile Screen" width="300" /> |
| *Active child card, quick access to milestones, vaccinations, feeding, and upcoming appointments.* | *Instant sibling switcher, medical records repository, security settings, and emergency contacts.* |

---

## 🔄 End-to-End Clinical & User Journey

```mermaid
journey
    title Comprehensive Parent & Child Health Journey on Beacon HUB
    section 1. Onboarding & Registration
      Download Beacon HUB App: 5: Parent
      Register Account (Email or Google OAuth): 5: Parent
      Add Child (Select New Client or Link Hospital Record): 5: Parent, System
    section 2. Preventive Care & Surveillance
      Log Vaccines according to KEPI Schedule: 5: Parent
      Track Daily Feeding, Sleep & Teething: 4: Parent
      Ask Beacon AI Assistant Developmental Questions: 5: Parent, AI
    section 3. Early Milestone & ASD Screening
      Complete Age-Appropriate Milestones Checklist: 5: Parent
      Trigger Automated Transition to ASD Screener (if >= 18m): 5: System, Parent
      Receive Automated Clinical Evaluation & Risk Report: 5: Parent, System
    section 4. Specialist Teleconsultation & Triage
      Select Specialized Clinician (OT, Speech, Paediatrician): 5: Parent
      Choose Teleconsult Slot & Authorize M-Pesa STK Push: 5: Parent, System
      Join Video Session & Access Formal Clinical PDF Report: 5: Parent, Doctor
```

---

## 💳 Telehealth & M-Pesa STK Push Payment Pipeline

To ensure maximum financial inclusion across Kenya, Beacon HUB integrates directly with **Safaricom's Daraja 2.0 API** for automated mobile money payments:

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Parent (Mobile App)
    participant Backend as Beacon API (Railway)
    participant Daraja as Safaricom Daraja Gateway
    participant DB as PostgreSQL Database
    actor Doctor as Specialist Clinician

    Parent->>Backend: POST /api/public/book-teleconsult (Doctor ID, Slot, M-Pesa Number)
    Backend->>Daraja: Initiate STK Push (Lipa Na M-Pesa Online)
    Daraja-->>Parent: Pop-up Prompt on Phone: Enter M-Pesa PIN
    Parent->>Daraja: Inputs PIN & Confirms Payment
    Daraja->>Backend: Instant Webhook Callback (ResultCode: 0, Receipt Number)
    Backend->>DB: Verify Payment & Confirm Appointment
    Backend-->>Parent: Real-Time Confirmation & Push Notification
    Backend-->>Doctor: Automatic Calendar Sync & Video Teleconsult Link
```

---

## 🔒 Data Security, Governance & Patient Privacy

Given the sensitive nature of pediatric neurodevelopmental and clinical data, Beacon HUB adheres to rigorous data protection principles aligned with Kenya's Data Protection Act (2019) and global health data standards:

1. **Identity & Access Management:**
   - Handled via Firebase Authentication with enforced server-side JWT verification on all protected endpoints.
   - Strict tenant separation ensuring parents can only query their authorized child records.
2. **Encryption:**
   - All data in transit is encrypted using TLS 1.3.
   - Sensitive clinical files, doctor consultation notes, and database backups are encrypted at rest.
3. **Auditability & Integrity:**
   - Every appointment booking, screening submission, and payment callback generates an immutable audit record.
4. **Data Sovereignty & Parental Rights:**
   - Full parental rights to view, export in PDF, or request removal of child developmental data.

---

## 🛠 Technology Stack

### Mobile Frontend
- **Framework:** React Native (v0.76+) with Expo SDK 52
- **Navigation:** Expo Router (File-based routing with tab bar and nested stack navigation)
- **UI & Theming:** Custom accessible design system supporting dynamic light/dark modes
- **State Management:** React Context API + encrypted persistent storage

### Backend Infrastructure
- **Server:** Node.js (v18+) with Express.js REST API
- **Database:** PostgreSQL (with connection pooling via Supabase / Railway)
- **Authentication:** Firebase Admin SDK with Google OAuth 2.0
- **Payments:** Safaricom Daraja API (M-Pesa STK Push)
- **Deployment:** Production cloud deployment on Railway (`beacon-mhealth-production.up.railway.app`)

---

## 🚀 Installation & Developer Setup

### Prerequisites
- Node.js `>= 18.x`
- npm or yarn
- Expo Go application on an Android/iOS device (or local emulator)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/eoringe/Beacon-Mhealth.git
cd Beacon-Mhealth

# Install Mobile dependencies
npm install

# Install Backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration
Create `.env` in the root project directory:
```env
EXPO_PUBLIC_API_URL=https://beacon-mhealth-production.up.railway.app
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgres://user:password@host:5432/beacon_db
MPESA_CONSUMER_KEY=your_daraja_consumer_key
MPESA_CONSUMER_SECRET=your_daraja_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://beacon-mhealth-production.up.railway.app/api/mpesa/callback
```

### 3. Run the Development Server
```bash
# Launch Expo Metro Bundler
npx expo start

# (Optional) Run backend locally
cd backend
npm run dev
```

---

## 📡 API Reference Overview

| HTTP Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/child` | Create child profile (`New Client` or link `Existing Client`) | Authenticated |
| `GET` | `/api/child/:id` | Fetch full longitudinal child record (vaccines, growth, milestones) | Authenticated |
| `POST` | `/api/milestones/evaluate` | Submit developmental milestone responses and generate summary | Authenticated |
| `POST` | `/api/asd/evaluate` | Submit ASD screener responses and obtain clinical risk rating | Authenticated |
| `POST` | `/api/beacon-ai/chat` | Query the Beacon AI Pediatric Assistant | Public / Auth |
| `GET` | `/api/public/specializations` | Fetch list of clinical specialties and teleconsult availability | Public |
| `GET` | `/api/public/availability` | Query live doctor calendar time slots | Public |
| `POST` | `/api/mpesa/stk-push` | Trigger Safaricom M-Pesa STK Push for teleconsultation fee | Authenticated |
| `POST` | `/api/mpesa/callback` | Webhook endpoint receiving Safaricom transaction confirmation | Internal |

---

## 🗺 Strategic Roadmap

- [ ] **Low-Bandwidth WebRTC Video Calls:** Integrated encrypted video rooms directly inside the mobile app, optimized for variable 2G/3G connections.
- [ ] **Community Health Worker (CHW) Mode:** Dedicated dashboard enabling frontline health workers to batch-screen multiple children during rural field campaigns.
- [ ] **Interoperability with National Health Management Information Systems (DHIS2):** Automated de-identified reporting of immunization coverage and developmental screening stats to public health authorities.
- [ ] **Multilingual Support:** Localizing interface and AI dialogs into Kiswahili and regional vernacular languages.

---

<p align="center">
  <b>Beacon HUB</b> — Dedicated to ensuring every child reaches their full developmental potential.<br>
  <i>Built for Beacon Children's Centre • Prepared for UNICEF Stakeholder Review</i>
</p>
