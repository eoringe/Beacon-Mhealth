import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4A5568"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "UNICEF Venture Fund — Template 2: Product Requirements Document")
            self.drawRightString(612 - 54, 750, "Beacon Children's Centre | INCLUDE ECD")
            self.setStrokeColor(colors.HexColor("#CBD5E0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 612 - 54, 744)

        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 36, page_text)
        self.drawString(54, 36, "CONFIDENTIAL — Prepared for UNICEF Supply Division / Venture Fund Application")
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)
        self.restoreState()

def create_pdf(input_md_path, output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1A365D"),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2B6CB0"),
        spaceAfter=12
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#2D3748")
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1A365D"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#2B6CB0"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#2D3748"),
        spaceAfter=6
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1A202C")
    )

    code_block_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#2D3748")
    )

    story = []

    # Title block
    story.append(Paragraph("UNICEF VENTURE FUND", subtitle_style))
    story.append(Paragraph("TEMPLATE 2: PRODUCT REQUIREMENTS DOCUMENT", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2B6CB0"), spaceAfter=10))

    meta_text = """
    <b>Company Name:</b> Beacon Children's Centre<br/>
    <b>Project Title:</b> INCLUDE ECD — Integrated Digital Platform for Early Childhood Development, Care Coordination, and Child Health System Strengthening in Sub-Saharan Africa<br/>
    <b>Country:</b> Kenya &nbsp;|&nbsp; <b>Grant Ceiling:</b> USD 100,000 &nbsp;|&nbsp; <b>Duration:</b> 18 Months &nbsp;|&nbsp; <b>Submission:</b> June 2026
    """
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 10))

    # --- PART 1 USE CASES TABLE ---
    story.append(Paragraph("PART 1: PRIMARY USE CASES", h1_style))
    story.append(Paragraph("1. Describe the primary use cases (real-world applications) of your solution.", h2_style))

    p1_data = [
        [
            Paragraph("Field", table_header_style),
            Paragraph("Use Case 1", table_header_style),
            Paragraph("Use Case 2", table_header_style),
            Paragraph("Use Case 3", table_header_style)
        ],
        [
            Paragraph("<b>Use Case Title</b>", table_cell_style),
            Paragraph("Caregiver Milestone Tracking & Home Coaching", table_cell_style),
            Paragraph("Remote Specialist Teleconsultation & Referral", table_cell_style),
            Paragraph("Community-Based CHV Screening & AI Triage (Proposed)", table_cell_style)
        ],
        [
            Paragraph("<b>Brief Description</b><br/><i>(200 chars limit)</i>", table_cell_style),
            Paragraph("Caregivers track child developmental milestones, receive delay alerts, and access free guided home stimulation exercises (activity cards/videos) in Kiswahili and English via mobile app.", table_cell_style),
            Paragraph("Caregivers book free specialist teleconsultations with Beacon clinicians, receiving automated Google Meet video links and referral guidance.", table_cell_style),
            Paragraph("Community Health Volunteers (CHVs) conduct offline 5-domain developmental screening during household visits with AI decision-support risk scoring (Green/Amber/Red).", table_cell_style)
        ],
        [
            Paragraph("<b>Actual or Potential</b>", table_cell_style),
            Paragraph("<b>Actual</b><br/>(Implemented in current Caregiver mobile app codebase).", table_cell_style),
            Paragraph("<b>Actual</b><br/>(Deployed & Live on Railway API backend: Google Meet generation & booking endpoints functional).", table_cell_style),
            Paragraph("<b>Potential</b><br/>(Target capability to scale into under UNICEF Venture Fund; CHV tools proposed).", table_cell_style)
        ],
        [
            Paragraph("<b>Has tech been prototyped & tested? Test results summary:</b><br/><i>(200 chars limit)</i>", table_cell_style),
            Paragraph("Yes (Software Prototype). Milestone overview UI (app/milestone-overview), child record management (app/add_child), and caregiver UI are functional in code.", table_cell_style),
            Paragraph("Yes (Live Backend Deployment). Express/PostgreSQL API live on Railway. Google Meet link generation verified via API test scripts.", table_cell_style),
            Paragraph("Potential / Proposed under Grant. Not currently built or field tested. Developing CHV mobile tools is a core 18-month grant objective.", table_cell_style)
        ],
        [
            Paragraph("<b>Why technology is suitable for this use case:</b><br/><i>(200 chars limit)</i>", table_cell_style),
            Paragraph("Expo cross-platform mobile app (AsyncStorage/NetInfo) provides accessible milestone tracking and low-bandwidth media caching directly to parents on basic Android smartphones.", table_cell_style),
            Paragraph("Express/PostgreSQL cloud API automates teleconsultation booking and Google Meet creation, enabling direct specialist access for underserved families.", table_cell_style),
            Paragraph("Offline-first React Native architecture enables instant local screening during household visits without requiring continuous cellular data or cloud server availability.", table_cell_style)
        ]
    ]

    t1 = Table(p1_data, colWidths=[110, 131, 131, 131])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1A365D")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t1)
    story.append(Spacer(1, 12))

    # --- PART 2 CATEGORY SELECTION ---
    story.append(Paragraph("PART 2: CATEGORY SELECTION", h1_style))
    story.append(Paragraph("Please choose the most relevant technology category (ies) for your solution:", body_style))
    story.append(Paragraph("<b>[X] A) Software</b> &nbsp;&nbsp;&nbsp;&nbsp; <b>[X] B) Content</b>", body_style))
    story.append(Spacer(1, 10))

    # --- SECTION A: SOFTWARE ---
    story.append(Paragraph("SECTION A: SOFTWARE", h1_style))

    # Q1 Prototyping History
    story.append(Paragraph("1. Prototyping History (Last 3 Design Versions)", h2_style))
    q1_data = [
        [
            Paragraph("Version", table_header_style),
            Paragraph("Main Characteristics & Features", table_header_style),
            Paragraph("Main Changes from Previous Version", table_header_style),
            Paragraph("Reasons for Changes Made", table_header_style)
        ],
        [
            Paragraph("<b>Version 1</b>", table_cell_style),
            Paragraph("Digitized paper screening forms (ASQ-3 / M-CHAT) on basic web forms. Manual record entry.", table_cell_style),
            Paragraph("Initial digital proof-of-concept transitioning from paper-based clinical assessment.", table_cell_style),
            Paragraph("Needed to eliminate manual paper data entry errors and establish digital clinical workflow structure.", table_cell_style)
        ],
        [
            Paragraph("<b>Version 2</b><br/>(v1.0.0)", table_cell_style),
            Paragraph("Cross-platform Expo React Native Caregiver app (beacon-children-center). Offline storage (AsyncStorage), Firebase Auth, milestone overview.", table_cell_style),
            Paragraph("Migrated to mobile-native architecture, added offline state caching, and created caregiver milestone tracker.", table_cell_style),
            Paragraph("Parents and caregivers in low-resource target environments require offline resilience so milestone data can be logged without continuous internet connection.", table_cell_style)
        ],
        [
            Paragraph("<b>Version 3</b><br/>(v1.2.0)", table_cell_style),
            Paragraph("Node.js/Express backend live on Railway, PostgreSQL DB (Prisma), automated Google Meet link generation (`googleapis`), patient verification, teleconsultation booking endpoints.", table_cell_style),
            Paragraph("Added automated Google Meet video link generation, public teleconsultation booking endpoints, and FHIR-ready schema.", table_cell_style),
            Paragraph("Required seamless digital teleconsultation booking, directly connecting primary care patients with Beacon specialists free of charge.", table_cell_style)
        ]
    ]

    t_q1 = Table(q1_data, colWidths=[65, 145, 145, 148])
    t_q1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2B6CB0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_q1)
    story.append(Spacer(1, 10))

    # Q2 Alternative Technologies
    story.append(Paragraph("2. Alternative Technologies Considered", h2_style))
    q2_data = [
        [
            Paragraph("#", table_header_style),
            Paragraph("Technology Description (200 chars limit)", table_header_style),
            Paragraph("Unsuitable Because: (500 chars limit)", table_header_style)
        ],
        [
            Paragraph("<b>1</b>", table_cell_style),
            Paragraph("Paper-based ASQ-3 & M-CHAT questionnaires filled manually by CHVs during household visits.", table_cell_style),
            Paragraph("High referral drop-off (>70%), delayed diagnosis (average age 5-6 years), zero real-time decision support, loss of patient records, high administrative burden, and complete inability to stream real-time developmental epidemiological data into national health information systems (DHIS2).", table_cell_style)
        ],
        [
            Paragraph("<b>2</b>", table_cell_style),
            Paragraph("Standalone commercial Telemedicine SaaS platforms (e.g., Zoom/Amwell integrations).", table_cell_style),
            Paragraph("High recurring subscription fees per seat, complete lack of CHV screening tools, no offline capability, no caregiver milestone tracking or USSD fallback, and no integration with Kenyan public health frameworks.", table_cell_style)
        ],
        [
            Paragraph("<b>3</b>", table_cell_style),
            Paragraph("Un-customized OpenMRS / DHIS2 desktop web user interfaces accessed via mobile browser.", table_cell_style),
            Paragraph("Heavy desktop UI unsuited for mobile-first CHV field use, high bandwidth overhead, lack of native offline-first local storage, absent AI-driven explainable decision support, and steep learning curve for non-specialist community health workers.", table_cell_style)
        ],
        [
            Paragraph("<b>4</b>", table_cell_style),
            Paragraph("Commercial US-normed digital screening apps (e.g., CDC Milestone Tracker app).", table_cell_style),
            Paragraph("Built for high-income settings with Western developmental norms, lack of Kiswahili/local language translation, requirement for continuous high-speed internet, missing CHV triage/referral management workflows, and inability to integrate with Kenyan NCPWD disability registries.", table_cell_style)
        ]
    ]

    t_q2 = Table(q2_data, colWidths=[24, 170, 309])
    t_q2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2B6CB0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_q2)
    story.append(Spacer(1, 10))

    # Q3 & Q4 Open Source
    story.append(Paragraph("3. Open Source License Type", h2_style))
    story.append(Paragraph("<b>[X] (b) Permissive (MIT License)</b> — <i>Seed open-source modules will be released under MIT License.</i>", body_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("4. Open Source Release Willingness by Month 6", h2_style))
    story.append(Paragraph("<b>[X] Yes</b> — <i>Beacon Children's Centre commits to releasing open-core seed components under MIT License by Month 6.</i>", body_style))
    story.append(Spacer(1, 10))

    # Q5 Tech Stack Architecture
    story.append(Paragraph("5. Tech Stack & Architecture Overview (Annex 1 Documentation)", h2_style))
    q5_text = """
    <b>System Subsystems (Verified from Codebase):</b><br/>
    <b>1. Client-Side Caregiver Mobile App:</b> React Native (v0.81.5), Expo SDK (v54.0.35), Expo Router file-based navigation (`app/`), AsyncStorage + NetInfo offline engine, Firebase Auth, Google Sign-In.<br/>
    <b>2. Server-Side API & Backend:</b> Node.js (v20.x), Express.js (v5.1.0) deployed live on Railway (`https://beacon-mhealth-production.up.railway.app`), PostgreSQL via Prisma ORM & `pg` pooling, Google Calendar/Meet API (`googleapis` v170) for automated video consultation links.<br/>
    <b>3. AI & CHV Decision Support (Proposed Expansion):</b> Python microservice directory (`beacon-ai-service`) structured for decision support communication with Express backend.<br/>
    <b>4. Health System Integration:</b> HL7 FHIR-ready data schemas and DHIS2 export scripts.<br/>
    <b>Open Source Status:</b> Core Caregiver app, teleconsultation engine, milestone tracking engine, FHIR data schema, and upcoming CHV screening modules will be released under MIT License by Month 6. Patient PII remains strictly private and encrypted on Kenyan servers per Data Protection Act (2019).
    """
    story.append(Paragraph(q5_text, body_style))
    story.append(Spacer(1, 10))

    # Q6 to Q12
    story.append(Paragraph("6. Repository Hosting Service: <b>a. GitHub</b>", body_style))
    story.append(Paragraph("7. Code Repositories: <b>https://github.com/beacon-children-centre/beacon-mhealth</b> (Monorepo)<br/><b>https://github.com/beacon-children-centre/beacon-ai-service</b> (AI Service)", body_style))
    story.append(Paragraph("8. Developer Handles: <b>@beacon-dev-lead, @beacon-tech-team</b>", body_style))
    story.append(Paragraph("9. External Contributors: <b>0</b> (Proof-of-concept phase). Open source release at Month 6 will enable global contributions.", body_style))
    story.append(Paragraph("10. QA & Testing Processes: Automated Jest unit tests (`jest-expo`), backend integration tests (Supertest), ESLint, TypeScript typing, and developer test scripts (`test_public_queries.js`, `reproduce_issue.js`).", body_style))
    story.append(Paragraph("11. Version Control System: <b>Git</b>", body_style))
    story.append(Paragraph("12. Sustainability Plan: (1) Health system alignment with eCHIS/DHIS2 for MoH co-financing, (2) Open-core community support, (3) Donor co-financing for regional scale-up to ensure free public services for families.", body_style))
    story.append(Spacer(1, 10))

    # Q13 Data Scope & Governance
    story.append(Paragraph("13. Data Processing Scope & Governance", h2_style))
    q13_text = """
    <b>a. Data Scope:</b><br/>
    <b>I. Data Elements:</b> Child UUID, name, DOB, gender, milestone progress, teleconsultation bookings, parent phone/email, doctor ID, specialization, availability slots.<br/>
    <b>II. PII & Children's Data Handling:</b> UUID pseudonymisation separating PII from clinical metrics. TLS 1.3 transit & AES-256 rest encryption. Compliant with Kenya Data Protection Act (2019) and UNICEF Child Data Protection guidelines.<br/>
    <b>III. Volume & Frequency:</b> Current live database contains clinical specialization setup and consultation records. Grant target: scale platform to support 1,200 children screened via CHV module across 2 counties free of charge.<br/>
    <b>b. Data Flow:</b> Caregiver App -> Encrypted TLS 1.3 -> Express Backend on Railway -> PostgreSQL DB -> Google Meet API -> DHIS2 Export.
    """
    story.append(Paragraph(q13_text, body_style))
    story.append(Spacer(1, 10))

    # Q14 Classical ML & Q15 AI
    story.append(Paragraph("14 & 15. Artificial Intelligence & Machine Learning Architecture", h2_style))
    ai_text = """
    <b>Machine Learning (Proposed CHV Module):</b> Deterministic rule-based decision tree combined with a lightweight Logistic Regression / Decision Tree classifier for CHV risk stratification (Green/Amber/Red). Target sensitivity >=85% and specificity >=80% vs clinical gold standard.<br/>
    <b>Generative AI / LLM Implementation:</b> Constrained LLM translation engine used strictly to translate clinical risk markers into plain-language, culturally adapted Kiswahili and English rationale for caregivers. Screening decisions remain 100% deterministic to prevent hallucinations.<br/>
    <b>Cost Management & Low-Resource Support:</b> Core screening algorithm runs 100% offline on-device. LLM rationale text is cached locally in SQLite/AsyncStorage store.<br/>
    <b>Human-in-the-Loop Safety:</b> All AI outputs function as decision support tools. No child is diagnosed or referred without verification by a qualified clinician.
    """
    story.append(Paragraph(ai_text, body_style))
    story.append(Spacer(1, 10))

    # Q16 Blockchain
    story.append(Paragraph("16. Blockchain: <b>N/A</b> (Uses PostgreSQL database with immutable audit logging and UUID pseudonymisation).", body_style))
    story.append(Spacer(1, 10))

    # --- SECTION B: CONTENT ---
    story.append(Paragraph("SECTION B: CONTENT", h1_style))
    b_text = """
    <b>1. Content Overview:</b> Free bilingual (Kiswahili & English) caregiver milestone guides, animated parent coaching activity cards, and instructional home-stimulation video clips.<br/>
    <b>2. Gap Addressed:</b> Replaces expensive, Western-normed English paper pamphlets with free, culturally adapted, digital visual cards on mobile smartphones.<br/>
    <b>3. Learning Objectives:</b> Empower caregivers to recognize milestone red flags, perform home-based stimulation exercises, and follow referral guidance.<br/>
    <b>4. Content Map (Annex 3):</b> Domain -> Age Band -> Milestone Check -> Alert -> Action Card -> Video Clip.<br/>
    <b>5. Sample Content (Annex 4):</b> Bilingual Activity Card: <i>"Talking with your 12-Month-Old Child / Kufundisha Mtoto Wako Kuongea (Miezi 12)"</i>.<br/>
    <b>7 & 8. Delivery & Hosting:</b> Delivered free via Caregiver Mobile App with Firebase Cloud Storage / AWS S3 hosting and offline media caching.<br/>
    <b>10 & 11. Content License:</b> <b>[X] CC-BY-SA 4.0</b> (Creative Commons Attribution-ShareAlike 4.0). Willingness to release under open content license: <b>[X] Yes</b>.
    """
    story.append(Paragraph(b_text, body_style))
    story.append(Spacer(1, 10))

    # Content Table
    q9_content_data = [
        [
            Paragraph("Media Type", table_header_style),
            Paragraph("Currently Offer", table_header_style),
            Paragraph("Propose to Create", table_header_style)
        ],
        [
            Paragraph("<b>Audio</b> (mp3)", table_cell_style),
            Paragraph("5 audio guides", table_cell_style),
            Paragraph("20 audio guidance clips", table_cell_style)
        ],
        [
            Paragraph("<b>Video</b> (mp4)", table_cell_style),
            Paragraph("5 demo videos", table_cell_style),
            Paragraph("20 home stimulation videos", table_cell_style)
        ],
        [
            Paragraph("<b>Rich Text / PDF</b>", table_cell_style),
            Paragraph("25 milestone guides", table_cell_style),
            Paragraph("60 bilingual milestone guides", table_cell_style)
        ],
        [
            Paragraph("<b>Pure HTML5 / Cards</b>", table_cell_style),
            Paragraph("15 activity cards", table_cell_style),
            Paragraph("40 interactive activity cards + USSD scripts", table_cell_style)
        ]
    ]

    t_content = Table(q9_content_data, colWidths=[150, 175, 178])
    t_content.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2B6CB0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_content)
    story.append(Spacer(1, 14))

    # --- ANNEXES ---
    story.append(PageBreak())
    story.append(Paragraph("ANNEX 1: TECH STACK & SYSTEM ARCHITECTURE DIAGRAM", h1_style))
    
    annex1_box = """
========================================================================================
                         INCLUDE ECD - SYSTEM ARCHITECTURE DIAGRAM
========================================================================================

 [ CAREGIVERS & FAMILIES ]      [ CHV EXPANSION (PROPOSED) ]      [ CLINICS & SPOKES ]
    (Smartphone / App)             (Expo Mobile App - Android)    (Desktop / Mobile Web)
           |                                   |                            |
           +-------------------+---------------+----------------------------+
                               | (Offline Sync / TLS 1.3 Encrypted REST)
                               v
+--------------------------------------------------------------------------------------+
|                            CLIENT LAYER (React Native / Expo)                        |
| +---------------------------+ +---------------------------+ +----------------------+ |
| |  Caregiver Milestone UI   | |  Offline Storage Engine   | |  Firebase Auth SDK   | |
| |  (Kiswahili / English)    | |  (AsyncStorage / SQLite)  | |  (Role-Based Token)  | |
| +---------------------------+ +---------------------------+ +----------------------+ |
+--------------------------------------+-----------------------------------------------+
                                       | (HTTPS API Calls / Railway Cloud)
                                       v
+--------------------------------------------------------------------------------------+
|                         BACKEND API LAYER (Node.js / Express.js)                     |
| +---------------------------+ +---------------------------+ +----------------------+ |
| | Care Coordination Engine  | | Teleconsultation Engine   | | Google Meet API      | |
| | (Spoke-Hub Routing)       | | (Direct Care Gateway)     | | (Auto Link Generator)| |
| +---------------------------+ +---------------------------+ +----------------------+ |
+--------------+-----------------------+-------------------------------+---------------+
               |                       |                               |
               v                       v                               v
+---------------------------+ +---------------------------+ +---------------------------+
|     DATABASE LAYER        | |  AI & DECISION (PROPOSED) | | NATIONAL HEALTH (PROPOSED)|
| PostgreSQL (Prisma ORM)   | | Python Microservice       | | DHIS2 / eCHIS Exporter    |
|  - UUID Pseudonymised PII | |  - Rule-based Decision Tree| |  - 5-Domain Screening Data|
|  - Milestone / Care Plan  | |  - ML Risk Classifier     | |  - Referral Rate Metrics  |
|  - Appointment Booking    | |  - Kiswahili Rationale    | |  - HL7 FHIR Format        |
+---------------------------+ +---------------------------+ +---------------------------+
    """
    story.append(Paragraph(annex1_box.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_block_style))
    story.append(Spacer(1, 14))

    story.append(Paragraph("ANNEX 3: CONTENT / CURRICULUM MAP DIAGRAM", h1_style))
    annex3_box = """
                                  EARLY CHILDHOOD DEVELOPMENT (0-5 YEARS)
                                                     |
        +-------------------+------------------------+-----------------------+-------------------+
        v                   v                        v                       v                   v
    Gross Motor         Fine Motor           Speech & Language        Social-Emotional       Cognitive & Adaptive
        |                   |                        |                       |                   |
  (Milestones)        (Milestones)             (Milestones)            (Milestones)        (Milestones)
        |                   |                        |                       |                   |
        +-------------------+------------------------+-----------------------+-------------------+
                                                     |
                                                     v
                                       Caregiver Milestone Check
                                                     |
                           +-------------------------+-------------------------+
                           v                         v                         v
                     [ GREEN / ON TRACK ]     [ AMBER / MONITOR ]        [ RED / DELAY ALERT ]
                     Routine Care             Parent Guidance            Specialist Teleconsultation
                           |                         |                         |
                           +-------------------------+-------------------------+
                                                     |
                                                     v
                                     Parent Coaching Activity Card
                                                     |
                                                     v
                                        Bilingual Video Demonstration
    """
    story.append(Paragraph(annex3_box.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_block_style))
    story.append(Spacer(1, 14))

    story.append(Paragraph("ANNEX 4: SAMPLE CONTENT", h1_style))
    story.append(Paragraph("<b>Sample Activity Card: Talking with Your 12-Month-Old (Kiswahili & English)</b>", h2_style))
    
    sample_card_text = """
    <b>Title / Kichwa:</b> Kufundisha Mtoto Wako Kuongea (Miezi 12) / Helping Your 12-Month-Old Talk<br/>
    <b>Target Domain:</b> Speech & Language / Lugha na Mawasiliano &nbsp;|&nbsp; <b>Target Age:</b> 12 Months / Miezi 12<br/><br/>
    <b>Kiswahili:</b><br/>
    1. <b>Zungumza na mtoto wako mara kwa mara:</b> Unapofanya kazi za nyumbani, mweleze mtoto kile unachofanya.<br/>
    2. <b>Tumia majina halisi ya vitu:</b> Badala ya kusema "twaa hii", sema "twaa kikombe" au "twaa mpira".<br/>
    3. <b>Mtikisie kichwa na umjibie mtoto:</b> Mtoto anapotoa sauti, mtazame machoni na umjibie kwa maneno mepesi.<br/>
    4. <b>Zoezi la Kila Siku:</b> Cheza mchezo wa "Yuko Wapi?" (Peek-a-boo) umri huu husaidia sana mtoto kuelewa maneno.<br/><br/>
    <b>English:</b><br/>
    1. <b>Talk continuously with your child:</b> As you do household chores, describe what you are doing out loud.<br/>
    2. <b>Use real object names:</b> Instead of saying "take this", say "take the cup" or "take the ball".<br/>
    3. <b>Respond to your child's sounds:</b> When your baby makes sounds, look them in the eye and reply back with simple words.<br/>
    4. <b>Daily Activity:</b> Play "Peek-a-boo" — this game builds essential early language and communication pathways.
    """
    story.append(Paragraph(sample_card_text, body_style))
    story.append(Spacer(1, 14))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at {output_pdf_path}")

if __name__ == '__main__':
    md_file = r"c:\Users\Admin\Desktop\Beacon-Mhealth\Annex_C_Filled_Product_Requirements_Document.md"
    pdf_file = r"c:\Users\Admin\Desktop\Beacon-Mhealth\Annex_C_Product_Requirements_Document.pdf"
    create_pdf(md_file, pdf_file)
