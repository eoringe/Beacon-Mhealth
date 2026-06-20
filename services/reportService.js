import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MILESTONE_CATEGORIES, getMilestonesForAge } from '@/constants/milestones';
import { getVaccinationStatus } from '@/constants/vaccinationSchedule';
import { PRIMARY_TEETH } from '@/constants/teethData';
import { WHO_STANDARDS } from '@/constants/whoGrowthStandards';
import growthService from './growthService';
import cacheService from './cacheService';
import { getGrowthInterpretation } from '../utils/growthHelpers';

// Helper to calculate age in months between DOB and record date
const calculateAgeInMonths = (birthDate, recordDate) => {
  if (!birthDate || !recordDate) return 0;
  const dob = new Date(birthDate);
  const record = new Date(recordDate);
  const yearsDiff = record.getFullYear() - dob.getFullYear();
  const monthsDiff = record.getMonth() - dob.getMonth();
  const months = yearsDiff * 12 + monthsDiff;
  return Math.max(0, months);
};

// Helper to calculate Z-score based on WHO percentiles using linear interpolation
const getZScore = (gender, metricType, ageMonths, value) => {
  if (!gender || !metricType || ageMonths === undefined || ageMonths === null || isNaN(value)) {
    return null;
  }
  const genderKey = gender.toLowerCase() === 'female' || gender.toLowerCase() === 'girl' ? 'girls' : 'boys';
  const typeKey = metricType === 'head' ? 'head_circumference' : metricType;
  const standards = WHO_STANDARDS[genderKey]?.[typeKey];
  if (!standards || standards.length === 0) return null;

  let lower = null;
  let upper = null;

  for (let i = 0; i < standards.length; i++) {
    const s = standards[i];
    if (s.month === ageMonths) {
      lower = s;
      upper = s;
      break;
    }
    if (s.month < ageMonths) {
      lower = s;
    }
    if (s.month > ageMonths && upper === null) {
      upper = s;
    }
  }

  if (lower === null) {
    lower = standards[0];
    upper = standards[0];
  } else if (upper === null) {
    upper = standards[standards.length - 1];
    lower = standards[standards.length - 1];
  }

  let p3, p50, p97;
  if (lower.month === upper.month) {
    p3 = lower.p3;
    p50 = lower.p50;
    p97 = lower.p97;
  } else {
    const fraction = (ageMonths - lower.month) / (upper.month - lower.month);
    p3 = lower.p3 + fraction * (upper.p3 - lower.p3);
    p50 = lower.p50 + fraction * (upper.p50 - lower.p50);
    p97 = lower.p97 + fraction * (upper.p97 - lower.p97);
  }

  let zScore;
  if (value >= p50) {
    if (p97 === p50) return 0;
    zScore = ((value - p50) / (p97 - p50)) * 2;
  } else {
    if (p50 === p3) return 0;
    zScore = ((value - p50) / (p50 - p3)) * 2;
  }

  return zScore;
};

// Helper to format Z-score string
const formatZScore = (z) => {
  if (z === null || z === undefined || isNaN(z)) return '--';
  const sign = z >= 0 ? '+' : '';
  return `${sign}${z.toFixed(2)}`;
};


// Helper to get formatted date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

// CSS styles for PDF
const pdfStyles = `
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333;
      padding: 15px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #5813f9;
      padding-bottom: 10px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-container h1 {
      color: #5813f9;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .logo-container p {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #666;
    }
    .metadata {
      font-size: 12px;
      text-align: right;
      color: #666;
    }
    .section-title {
      color: #3F51B5;
      font-size: 18px;
      margin-top: 25px;
      margin-bottom: 15px;
      border-bottom: 1px solid #E0E0E0;
      padding-bottom: 5px;
    }
    .child-info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      background-color: #F8F9FA;
      border-radius: 8px;
      overflow: hidden;
    }
    .child-info-table td {
      padding: 6px 12px;
      border: 1px solid #EAEAEA;
      font-size: 12px;
    }
    .child-info-table td.label {
      font-weight: bold;
      color: #555;
      width: 20%;
    }
    .child-info-table td.value {
      color: #222;
      width: 30%;
    }
    .summary-card {
      background-color: #5813f9;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .summary-card h3 {
      margin-top: 0;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .summary-score {
      font-size: 24px;
      font-weight: bold;
      margin: 3px 0;
    }
    .summary-desc {
      font-size: 13px;
      opacity: 0.9;
    }
    .category-section {
      margin-bottom: 10px;
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      margin-bottom: 4px;
      color: white;
    }
    .milestone-item {
      display: flex;
      align-items: flex-start;
      padding: 3px 8px;
      border-bottom: 1px solid #F0F0F0;
      font-size: 11px;
      line-height: 1.3;
    }
    .milestone-item:last-child {
      border-bottom: none;
    }
    .status-badge {
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: bold;
      margin-right: 8px;
      text-transform: uppercase;
      min-width: 50px;
      text-align: center;
    }
    .status-yes {
      background-color: #E8F5E9;
      color: #2E7D32;
    }
    .status-no {
      background-color: #FFEBEE;
      color: #C62828;
    }
    .status-unsure {
      background-color: #FFF3E0;
      color: #EF6C00;
    }
    .status-unanswered {
      background-color: #ECEFF1;
      color: #37474F;
    }
    .risk-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .risk-Low { background-color: #10B981; }
    .risk-Moderate { background-color: #F59E0B; }
    .risk-High { background-color: #EF4444; }
    
    .question-table {
      width: 100%;
      border-collapse: collapse;
    }
    .question-table th, .question-table td {
      padding: 10px;
      border-bottom: 1px solid #E0E0E0;
      font-size: 12px;
      text-align: left;
    }
    .question-table th {
      background-color: #F5F5F5;
      font-weight: bold;
    }
    .page-break {
      page-break-before: always;
    }
    .disclaimer {
      font-size: 11px;
      color: #777;
      text-align: center;
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px dashed #CCC;
      font-style: italic;
    }
  </style>
`;

const getChildInfoTableHTML = (child, ageStr) => `
  <table class="child-info-table">
    <tr>
      <td class="label">Child Name</td>
      <td class="value">${child.first_name} ${child.last_name || ''}</td>
      <td class="label">Date of Birth</td>
      <td class="value">${formatDate(child.date_of_birth)}</td>
    </tr>
    <tr>
      <td class="label">Gender</td>
      <td class="value">${child.gender || 'N/A'}</td>
      <td class="label">Age</td>
      <td class="value">${ageStr || 'N/A'}</td>
    </tr>
    ${child.registration_number ? `
    <tr>
      <td class="label">Reg Number</td>
      <td class="value">${child.registration_number}</td>
      <td class="label">Clinic Status</td>
      <td class="value">Verified</td>
    </tr>` : ''}
  </table>
`;

// Additional vaccines list (must match the vaccination screen)
const ADDITIONAL_VACCINES = [
  { id: 'influenza', name: 'Influenza' },
  { id: 'chicken_pox', name: 'Chicken Pox' },
  { id: 'typhoid', name: 'Typhoid' },
  { id: 'hepatitis_a', name: 'Hepatitis A' },
  { id: 'cholera', name: 'Cholera' },
  { id: 'meningococcal', name: 'Meningococcal' },
  { id: 'covid', name: 'COVID-19' },
  { id: 'rabies', name: 'Rabies' },
];

/**
 * Helper: generate PDF, rename to FirstName_LastName_ReportType.pdf, share it.
 */
const generateAndSharePdf = async (htmlContent, child, reportType) => {
  const { uri } = await Print.printToFileAsync({ html: htmlContent });

  // Build sanitised file name: FirstName_LastName_ReportType.pdf
  const sanitise = (s) => (s || '').replace(/[^a-zA-Z0-9]/g, '').trim();
  const firstName = sanitise(child.first_name) || 'Child';
  const lastName = sanitise(child.last_name) || '';
  const typePart = sanitise(reportType) || 'Report';
  const fileName = lastName
    ? `${firstName}_${lastName}_${typePart}.pdf`
    : `${firstName}_${typePart}.pdf`;

  // Copy to cacheDirectory with the correct name (more reliable than in-place rename)
  const newUri = `${FileSystem.cacheDirectory}${fileName}`;

  try {
    // Delete existing file at destination if it exists
    const info = await FileSystem.getInfoAsync(newUri);
    if (info.exists) {
      await FileSystem.deleteAsync(newUri, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: uri, to: newUri });
    console.log(`[ReportService] PDF renamed to: ${fileName}`);
    await Sharing.shareAsync(newUri, { mimeType: 'application/pdf' });
    // Clean up original temp file
    try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch (_) { /* ignore */ }
    return true;
  } catch (moveErr) {
    console.warn('[ReportService] Could not rename PDF, sharing with default name:', moveErr);
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    return true;
  }
};

export const reportService = {
  /**
   * Generate Milestone summary report
   */
  generateMilestoneReport: async (child, selectedAge, responses) => {
    const ageStr = `${selectedAge} Months`;
    const milestoneDataForAge = getMilestonesForAge(selectedAge) || {};

    let totalMilestones = 0;
    let totalAchieved = 0;
    
    // Group responses by category
    const categoryDetails = MILESTONE_CATEGORIES.map(cat => {
      const milestonesList = milestoneDataForAge[cat.id] || [];
      const catResponses = responses.find(r => r.category === cat.id && r.age_months === selectedAge)?.responses || {};
      
      let catTotal = milestonesList.length;
      let catAchieved = 0;
      
      const milestonesHTML = milestonesList.map((m, idx) => {
        const milestoneText = typeof m === 'string' ? m : m.milestone;
        const responseVal = catResponses[idx];
        let statusClass = 'status-unanswered';
        let statusLabel = 'Not Checked';
        
        if (responseVal === 'yes') {
          statusClass = 'status-yes';
          statusLabel = 'Achieved';
          catAchieved++;
        } else if (responseVal === 'no') {
          statusClass = 'status-no';
          statusLabel = 'Not Yet';
        } else if (responseVal === 'unsure') {
          statusClass = 'status-unsure';
          statusLabel = 'Unsure';
        }
        
        return `
          <div class="milestone-item">
            <span class="status-badge ${statusClass}">${statusLabel}</span>
            <span>${milestoneText}</span>
          </div>
        `;
      }).join('');
      
      totalMilestones += catTotal;
      totalAchieved += catAchieved;

      return {
        ...cat,
        achieved: catAchieved,
        total: catTotal,
        html: milestonesHTML
      };
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Developmental Milestones Summary</title>
        ${pdfStyles}
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <h1>Beacon mHealth</h1>
            <p>Child Development Tracking System</p>
          </div>
          <div class="metadata">
            <p>Generated: ${formatDate(new Date())}</p>
          </div>
        </div>

        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Developmental Milestones Report</h2>

        ${getChildInfoTableHTML(child, ageStr)}

        <div class="summary-card" style="background-color: #5813f9;">
          <h3>Overall Completion Summary</h3>
          <div class="summary-score">${totalAchieved} / ${totalMilestones} Milestones Achieved</div>
          <div class="summary-desc">
            This summary reflects developmental milestones met by ${child.first_name} for the ${selectedAge}-month checklist.
          </div>
        </div>

        <h2 class="section-title">Milestones by Category</h2>

        ${categoryDetails.map(cat => `
          <div class="category-section">
            <div class="category-header" style="background-color: ${cat.color || '#3F51B5'};">
              <span>${cat.title}</span>
              <span>${cat.achieved} / ${cat.total} Achieved</span>
            </div>
            <div style="border: 1px solid #EAEAEA; border-top: none; border-radius: 0 0 6px 6px; overflow: hidden;">
              ${cat.html || '<div class="milestone-item" style="color: #999;">No milestones tracked for this category.</div>'}
            </div>
          </div>
        `).join('')}

        <div class="disclaimer">
          This report is based on the parent feedback. Further assessment by a healthcare professional is needed.
        </div>
      </body>
      </html>
    `;

    try {
      return await generateAndSharePdf(htmlContent, child, 'MilestoneReport');
    } catch (err) {
      console.error('Error generating milestone PDF:', err);
      throw err;
    }
  },

  /**
   * Generate ASD Screening report
   */
  generateAsdReport: async (child, screening) => {
    if (!screening) return false;
    
    const responses = screening.responses || {};
    const riskColors = { Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' };
    const currentRiskColor = riskColors[screening.risk_level] || '#555';

    // Count risk factors from responses
    const QUESTION_TYPES = [
      'reverse','reverse','reverse','reverse','reverse','reverse','reverse','reverse','reverse',
      'normal','normal','normal','normal'
    ];
    let riskFactorCount = 0;
    QUESTION_TYPES.forEach((type, idx) => {
      const ans = responses[idx + 1];
      const isAtRisk = type === 'reverse' ? ans === false : ans === true;
      if (isAtRisk) riskFactorCount++;
    });

    // Generate advice based on risk level
    let adviceHTML = '';
    if (screening.risk_level === 'Low') {
      adviceHTML = `
        <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 14px 18px; border-radius: 6px; margin-top: 15px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #065F46; font-size: 14px;">✅ Low Risk — No Immediate Concerns</p>
          <p style="margin: 0; color: #047857; font-size: 12px; line-height: 1.6;">
            Your child's screening results suggest typical development at this time. Continue monitoring developmental milestones and engage in interactive play, reading, and social activities. 
            Re-screen again in 3–6 months or if any new concerns arise. If you notice changes in social interaction, communication, or behavior patterns, consult your pediatrician.
          </p>
        </div>
      `;
    } else if (screening.risk_level === 'Moderate') {
      adviceHTML = `
        <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 6px; margin-top: 15px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400E; font-size: 14px;">⚠️ Moderate Risk — Follow-Up Recommended</p>
          <p style="margin: 0; color: #B45309; font-size: 12px; line-height: 1.6;">
            Some areas of concern were identified. This does <strong>not</strong> mean your child has autism — it means further evaluation is recommended.
            We advise scheduling a developmental assessment with a pediatrician or child development specialist. Early intervention services can significantly support your child's development.
            Continue engaging your child in social play, eye contact activities, and language-rich interactions while awaiting evaluation.
          </p>
        </div>
      `;
    } else {
      adviceHTML = `
        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px 18px; border-radius: 6px; margin-top: 15px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #991B1B; font-size: 14px;">🔴 High Risk — Professional Evaluation Strongly Recommended</p>
          <p style="margin: 0; color: #B91C1C; font-size: 12px; line-height: 1.6;">
            Multiple areas of concern were identified in this screening. Please schedule a comprehensive diagnostic evaluation with a developmental pediatrician, child psychologist, or autism specialist as soon as possible.
            Early diagnosis and intervention can make a significant positive difference. In the meantime, focus on structured routines, sensory-friendly activities, and responsive communication with your child.
            Your healthcare provider can guide you to appropriate early intervention programs and support services.
          </p>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapid ASD Screening Report</title>
        ${pdfStyles}
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <h1>Beacon mHealth</h1>
            <p>Child Development Tracking System</p>
          </div>
          <div class="metadata">
            <p>Generated: ${formatDate(new Date())}</p>
          </div>
        </div>

        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">ASD Screening Results</h2>

        ${getChildInfoTableHTML(child, '18–60 Months')}

        <div class="summary-card" style="background-color: ${currentRiskColor};">
          <h3>Screening Date: ${formatDate(screening.created_at || new Date())}</h3>
          <div class="summary-score">Score: ${screening.score} / 13</div>
          <div class="summary-desc" style="font-size: 16px; margin-top: 10px;">
            Risk Level: <span class="risk-badge risk-${screening.risk_level}">${screening.risk_level} Risk</span>
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 18px; margin-bottom: 10px;">
          <div style="flex: 1; background: #F8F9FA; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 28px; font-weight: 700; color: ${currentRiskColor};">${riskFactorCount}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Risk Factors Identified</div>
          </div>
          <div style="flex: 1; background: #F8F9FA; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 28px; font-weight: 700; color: #10B981;">${13 - riskFactorCount}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Typical Responses</div>
          </div>
          <div style="flex: 1; background: #F8F9FA; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 28px; font-weight: 700; color: #6366F1;">13</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Questions Assessed</div>
          </div>
        </div>

        <h2 class="section-title">Clinical Guidance</h2>
        ${adviceHTML}

        <div class="disclaimer">
          This report is based on the parent feedback. Further assessment by a healthcare professional is needed.
        </div>
      </body>
      </html>
    `;

    try {
      return await generateAndSharePdf(htmlContent, child, 'ASDScreening');
    } catch (err) {
      console.error('Error generating ASD PDF:', err);
      throw err;
    }
  },

  generateDevelopmentalReport: async (child, selectedAge, milestoneResponses, asdScreening) => {
    const ageStr = `${selectedAge} Months`;
    const milestoneDataForAge = getMilestonesForAge(selectedAge) || {};

    let totalMilestones = 0;
    let totalAchieved = 0;

    // Group responses by category
    const categoryDetails = MILESTONE_CATEGORIES.map(cat => {
      const milestonesList = milestoneDataForAge[cat.id] || [];
      const catResponses = milestoneResponses.find(r => r.category === cat.id && r.age_months === selectedAge)?.responses || {};

      let catTotal = milestonesList.length;
      let catAchieved = 0;

      const milestonesHTML = milestonesList.map((m, idx) => {
        const milestoneText = typeof m === 'string' ? m : m.milestone;
        const responseVal = catResponses[idx];
        let statusClass = 'status-unanswered';
        let statusLabel = 'Not Checked';

        if (responseVal === 'yes') {
          statusClass = 'status-yes';
          statusLabel = 'Achieved';
          catAchieved++;
        } else if (responseVal === 'no') {
          statusClass = 'status-no';
          statusLabel = 'Not Yet';
        } else if (responseVal === 'unsure') {
          statusClass = 'status-unsure';
          statusLabel = 'Unsure';
        }

        return `
          <div class="milestone-item">
            <span class="status-badge ${statusClass}">${statusLabel}</span>
            <span>${milestoneText}</span>
          </div>
        `;
      }).join('');

      totalMilestones += catTotal;
      totalAchieved += catAchieved;

      return {
        ...cat,
        achieved: catAchieved,
        total: catTotal,
        html: milestonesHTML
      };
    });

    // ASD Section — Results, Questions & Advice
    let asdHTML = '';
    if (asdScreening) {
      const riskColors = { Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' };
      const currentRiskColor = riskColors[asdScreening.risk_level] || '#555';

      // ASD Questions list
      const ASD_QUESTIONS = [
        { id: 1, text: 'Does your child look at you when you call their name?', type: 'reverse' },
        { id: 2, text: 'Does your child make eye contact during interaction?', type: 'reverse' },
        { id: 3, text: 'Does your child point to show you something interesting?', type: 'reverse' },
        { id: 4, text: 'Does your child try to share enjoyment with you?', type: 'reverse' },
        { id: 5, text: 'Does your child copy your actions? (e.g., clapping, waving)', type: 'reverse' },
        { id: 6, text: 'Does your child use words, sounds, or gestures to communicate?', type: 'reverse' },
        { id: 7, text: 'Does your child respond when spoken to?', type: 'reverse' },
        { id: 8, text: 'Does your child engage in simple back-and-forth interaction?', type: 'reverse' },
        { id: 9, text: 'Does your child understand simple instructions?', type: 'reverse' },
        { id: 10, text: 'Does your child repeat the same sounds, actions, or movements over and over?', type: 'normal' },
        { id: 11, text: 'Does your child play with toys or objects unusually?', type: 'normal' },
        { id: 12, text: 'Does your child become very upset by small changes in routine?', type: 'normal' },
        { id: 13, text: 'Does your child show unusual reactions to sounds, textures, or touch?', type: 'normal' },
      ];

      const responses = asdScreening.responses || {};
      let riskFactorCount = 0;

      // Build question rows and count risk factors
      const questionRows = ASD_QUESTIONS.map(q => {
        const ans = responses[q.id];
        const isAtRisk = q.type === 'reverse' ? ans === false : ans === true;
        if (isAtRisk) riskFactorCount++;
        const answerText = ans === true ? 'Yes' : ans === false ? 'No' : '—';
        const interpretation = ans === undefined || ans === null
          ? '<span style="color:#9CA3AF;">—</span>'
          : isAtRisk
            ? '<span style="color:#EF4444; font-weight:600;">At Risk</span>'
            : '<span style="color:#10B981; font-weight:600;">Typical</span>';
        return `<tr>
          <td style="padding:5px 8px; border-bottom:1px solid #E5E7EB; font-size:11px; color:#555; width:5%;">${q.id}</td>
          <td style="padding:5px 8px; border-bottom:1px solid #E5E7EB; font-size:11px; color:#333;">${q.text}</td>
          <td style="padding:5px 8px; border-bottom:1px solid #E5E7EB; font-size:11px; text-align:center; width:10%;">${answerText}</td>
          <td style="padding:5px 8px; border-bottom:1px solid #E5E7EB; font-size:11px; text-align:center; width:12%;">${interpretation}</td>
        </tr>`;
      }).join('');

      // Generate advice based on risk level
      let adviceHTML = '';
      if (asdScreening.risk_level === 'Low') {
        adviceHTML = `
          <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 10px 14px; border-radius: 6px; margin-top: 10px;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #065F46; font-size: 12px;">✅ Low Risk — No Immediate Concerns</p>
            <p style="margin: 0; color: #047857; font-size: 11px; line-height: 1.5;">
              Your child's screening results suggest typical development. Continue monitoring milestones and engage in interactive play. Re-screen in 3–6 months or if concerns arise.
            </p>
          </div>
        `;
      } else if (asdScreening.risk_level === 'Moderate') {
        adviceHTML = `
          <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 10px 14px; border-radius: 6px; margin-top: 10px;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #92400E; font-size: 12px;">⚠️ Moderate Risk — Follow-Up Recommended</p>
            <p style="margin: 0; color: #B45309; font-size: 11px; line-height: 1.5;">
              Some areas of concern were identified. This does <strong>not</strong> mean your child has autism — further evaluation is recommended. Schedule a developmental assessment with a specialist.
            </p>
          </div>
        `;
      } else {
        adviceHTML = `
          <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 10px 14px; border-radius: 6px; margin-top: 10px;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #991B1B; font-size: 12px;">🔴 High Risk — Professional Evaluation Strongly Recommended</p>
            <p style="margin: 0; color: #B91C1C; font-size: 11px; line-height: 1.5;">
              Multiple areas of concern were identified. Please schedule a comprehensive diagnostic evaluation with a developmental pediatrician or autism specialist as soon as possible.
            </p>
          </div>
        `;
      }

      asdHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 12px; font-size: 16px;">Part 2: ASD Screening Results</h2>
        <div class="summary-card" style="background-color: ${currentRiskColor}; padding: 10px 14px;">
          <h3 style="font-size:12px; margin-bottom:4px;">Screening Date: ${formatDate(asdScreening.created_at || new Date())}</h3>
          <div class="summary-score" style="font-size:20px;">Score: ${asdScreening.score} / 13</div>
          <div class="summary-desc" style="font-size: 13px; margin-top: 4px;">
            Risk Level: <span class="risk-badge risk-${asdScreening.risk_level}">${asdScreening.risk_level} Risk</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 10px; margin-bottom: 10px;">
          <div style="flex: 1; background: #F8F9FA; border-radius: 6px; padding: 8px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 20px; font-weight: 700; color: ${currentRiskColor};">${riskFactorCount}</div>
            <div style="font-size: 9px; color: #6B7280; margin-top: 2px;">Risk Factors</div>
          </div>
          <div style="flex: 1; background: #F8F9FA; border-radius: 6px; padding: 8px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 20px; font-weight: 700; color: #10B981;">${13 - riskFactorCount}</div>
            <div style="font-size: 9px; color: #6B7280; margin-top: 2px;">Typical Responses</div>
          </div>
          <div style="flex: 1; background: #F8F9FA; border-radius: 6px; padding: 8px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 20px; font-weight: 700; color: #6366F1;">13</div>
            <div style="font-size: 9px; color: #6B7280; margin-top: 2px;">Questions Assessed</div>
          </div>
        </div>

        <h3 style="color: #3F51B5; font-size: 13px; margin: 12px 0 6px 0; border-bottom: 1px solid #E0E0E0; padding-bottom: 3px;">Question-by-Question Responses</h3>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#F5F5F5;">
              <th style="padding:5px 8px; text-align:left; font-size:10px; font-weight:bold; border-bottom:2px solid #E0E0E0;">#</th>
              <th style="padding:5px 8px; text-align:left; font-size:10px; font-weight:bold; border-bottom:2px solid #E0E0E0;">Question</th>
              <th style="padding:5px 8px; text-align:center; font-size:10px; font-weight:bold; border-bottom:2px solid #E0E0E0;">Answer</th>
              <th style="padding:5px 8px; text-align:center; font-size:10px; font-weight:bold; border-bottom:2px solid #E0E0E0;">Result</th>
            </tr>
          </thead>
          <tbody>
            ${questionRows}
          </tbody>
        </table>

        <h3 style="color: #3F51B5; font-size: 13px; margin: 14px 0 6px 0; border-bottom: 1px solid #E0E0E0; padding-bottom: 3px;">Clinical Guidance</h3>
        ${adviceHTML}

        <p style="font-size: 10px; color: #9CA3AF; margin-top: 10px; text-align: center; font-style: italic;">
          This screening tool assesses social communication, behavioral patterns, and sensory responses. It is a screening aid — not a clinical diagnosis.
        </p>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Developmental Report</title>
        ${pdfStyles}
        <style>
          @page { margin: 12mm 12mm; }
          body { font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <h1>Beacon mHealth</h1>
            <p>Child Development Tracking System</p>
          </div>
          <div class="metadata">
            <p>Generated: ${formatDate(new Date())}</p>
          </div>
        </div>

        <h2 style="color: #5813f9; text-align: center; margin-bottom: 10px; font-size: 16px;">Child Developmental Report</h2>

        ${getChildInfoTableHTML(child, ageStr)}

        <h2 style="color: #5813f9; margin-top: 10px; font-size: 14px; margin-bottom: 8px;">Part 1: Developmental Milestones Summary</h2>
        <div class="summary-card" style="background-color: #5813f9; padding: 10px 14px; margin-bottom: 10px;">
          <h3 style="font-size:12px; margin-bottom:3px;">Overall Milestone Summary</h3>
          <div class="summary-score" style="font-size:20px;">${totalAchieved} / ${totalMilestones} Milestones Achieved</div>
          <div class="summary-desc" style="font-size:11px;">
            Developmental milestones achieved for the ${selectedAge}-month checklist.
          </div>
        </div>

        ${categoryDetails.map(cat => `
          <div class="category-section">
            <div class="category-header" style="background-color: ${cat.color || '#3F51B5'};">
              <span>${cat.title}</span>
              <span>${cat.achieved} / ${cat.total} Achieved</span>
            </div>
            <div style="border: 1px solid #EAEAEA; border-top: none; border-radius: 0 0 6px 6px; overflow: hidden;">
              ${cat.html || '<div class="milestone-item" style="color: #999;">No milestones tracked for this category.</div>'}
            </div>
          </div>
        `).join('')}

        ${asdHTML}

        <div class="disclaimer">
          This report is based on the parent feedback. Further assessment by a healthcare professional is needed.
        </div>
      </body>
      </html>
    `;

    try {
      return await generateAndSharePdf(htmlContent, child, 'DevelopmentalReport');
    } catch (err) {
      console.error('Error generating developmental report PDF:', err);
      throw err;
    }
  },

  generateHealthReport: async (child, selectedAge) => {
    const ageStr = selectedAge != null ? `${selectedAge} Months` : 'N/A';

    // --- HEALTH TRACKERS DATA FETCH ---
    let growthEntries = [];
    try {
      growthEntries = await growthService.getMeasurements(child.id);
    } catch (e) {
      console.log('Error fetching growth data from service, trying cache fallback:', e);
      // Fallback: read directly from cache
      try {
        const cached = await cacheService.get(`growth_${child.id}`);
        growthEntries = cached || [];
      } catch (cacheErr) {
        console.log('Cache fallback also failed:', cacheErr);
        growthEntries = [];
      }
    }

    let sleepLogs = [];
    try {
      const sleepRaw = await AsyncStorage.getItem(`sleep_logs_${child.id}`);
      sleepLogs = sleepRaw ? JSON.parse(sleepRaw) : [];
    } catch (e) {
      console.log('Error reading sleep logs:', e);
    }

    let feedingLogs = [];
    try {
      const feedingRaw = await AsyncStorage.getItem(`feeding_logs_${child.id}`);
      feedingLogs = feedingRaw ? JSON.parse(feedingRaw) : [];
    } catch (e) {
      console.log('Error reading feeding logs:', e);
    }

    let completedVaccines = [];
    let skippedVaccines = [];
    let additionalVaccinesData = {};
    try {
      const completedKey = `completed_vaccines_${child.id}`;
      const skippedKey = `skipped_vaccines_${child.id}`;
      const additionalKey = `additional_vaccines_${child.id}`;
      
      const [completedStored, skippedStored, additionalStored] = await Promise.all([
        AsyncStorage.getItem(completedKey),
        AsyncStorage.getItem(skippedKey),
        AsyncStorage.getItem(additionalKey)
      ]);
      completedVaccines = completedStored ? JSON.parse(completedStored) : [];
      skippedVaccines = skippedStored ? JSON.parse(skippedStored) : [];
      additionalVaccinesData = additionalStored ? JSON.parse(additionalStored) : {};
      console.log('[ReportService] Additional vaccines data:', JSON.stringify(additionalVaccinesData));
    } catch (e) {
      console.log('Error reading vaccination logs:', e);
    }

    let teethingData = {};
    try {
      const teethingRaw = await AsyncStorage.getItem(`teething_data_${child.id}`);
      teethingData = teethingRaw ? JSON.parse(teethingRaw) : {};
    } catch (e) {
      console.log('Error reading teething data:', e);
    }

    // Vaccination summary
    const compIds = completedVaccines.map(v => v.id);
    const skipIds = skippedVaccines.map(v => v.id);
    const vacStatus = child.date_of_birth 
      ? getVaccinationStatus(child.date_of_birth, compIds, skipIds)
      : null;
    const completedCount = completedVaccines.length;
    const skippedCount = skippedVaccines.length;
    const missedCount = vacStatus ? vacStatus.overdueVaccines.length : 0;

    // --- 1. GROWTH TRACKER ---
    let latestWeightStr = '--';
    let latestHeightStr = '--';
    let latestHeadCircStr = '--';
    let growthConclusion = 'Suboptimal';
    let growthEntriesCount = 0;
    let latestMeasurementDateStr = 'N/A';
    let weightInterpretation = null;
    let heightInterpretation = null;
    let headInterpretation = null;

    const getInterpretationHTML = (interp) => {
      if (!interp) return `<div style="font-size: 7.5px; color: #777; margin-top: 1px; font-style: italic;">No entry recorded yet.</div>`;
      return `
        <div style="margin-top: 2px; padding: 2px 4px; border-radius: 3px; font-size: 7.5px; line-height: 1.15;
          background-color: ${interp.lightBg}; color: ${interp.color}; border: 1px solid ${interp.color}30;">
          <strong>${interp.status}</strong>: ${interp.description}
        </div>
      `;
    };

    if (growthEntries && growthEntries.length > 0) {
      const sorted = [...growthEntries].sort((a, b) => new Date(b.recorded_date || b.date) - new Date(a.recorded_date || a.date));
      growthEntriesCount = sorted.length;
      latestMeasurementDateStr = formatDate(sorted[0].recorded_date || sorted[0].date);

      const birthDate = child.date_of_birth;
      let allMetricsOptimal = true;
      let metricsCount = 0;

      // Find the most recent non-null value for EACH metric across all entries
      // (a user may record weight on one date and height on another)
      const findLatestMetric = (entries, key) => {
        for (const entry of entries) {
          let val = entry[key];
          if (val === undefined || val === null || val === '') {
            if (key === 'head_circumference') {
              val = entry['headCircumference'] !== undefined ? entry['headCircumference'] : entry['head_circ'];
            }
          }
          if (val !== undefined && val !== null && val !== '') {
            return { ...entry, [key]: val };
          }
        }
        return null;
      };

      const latestWeightEntry = findLatestMetric(sorted, 'weight');
      const latestHeightEntry = findLatestMetric(sorted, 'height');
      const latestHeadEntry = findLatestMetric(sorted, 'head_circumference');

      if (latestWeightEntry) {
        const val = parseFloat(latestWeightEntry.weight);
        const recordDate = latestWeightEntry.recorded_date || latestWeightEntry.date || latestWeightEntry.created_at;
        const ageAtRecordMonths = calculateAgeInMonths(birthDate, recordDate);
        const weightZ = getZScore(child.gender || 'boy', 'weight', ageAtRecordMonths, val);
        latestWeightStr = `${val} kg`;
        if (weightZ !== null) {
          latestWeightStr += ` (${formatZScore(weightZ)} Z)`;
          if (weightZ < -2 || weightZ > 2) allMetricsOptimal = false;
          metricsCount++;
        }
        weightInterpretation = getGrowthInterpretation(child.gender || 'boy', 'weight', ageAtRecordMonths, val);
      }
      if (latestHeightEntry) {
        const val = parseFloat(latestHeightEntry.height);
        const recordDate = latestHeightEntry.recorded_date || latestHeightEntry.date || latestHeightEntry.created_at;
        const ageAtRecordMonths = calculateAgeInMonths(birthDate, recordDate);
        const heightZ = getZScore(child.gender || 'boy', 'height', ageAtRecordMonths, val);
        latestHeightStr = `${val} cm`;
        if (heightZ !== null) {
          latestHeightStr += ` (${formatZScore(heightZ)} Z)`;
          if (heightZ < -2 || heightZ > 2) allMetricsOptimal = false;
          metricsCount++;
        }
        heightInterpretation = getGrowthInterpretation(child.gender || 'boy', 'height', ageAtRecordMonths, val);
      }
      if (latestHeadEntry) {
        const val = parseFloat(latestHeadEntry.head_circumference);
        const recordDate = latestHeadEntry.recorded_date || latestHeadEntry.date || latestHeadEntry.created_at;
        const ageAtRecordMonths = calculateAgeInMonths(birthDate, recordDate);
        const headZ = getZScore(child.gender || 'boy', 'head_circumference', ageAtRecordMonths, val);
        latestHeadCircStr = `${val} cm`;
        if (headZ !== null) {
          latestHeadCircStr += ` (${formatZScore(headZ)} Z)`;
          if (headZ < -2 || headZ > 2) allMetricsOptimal = false;
          metricsCount++;
        }
        headInterpretation = getGrowthInterpretation(child.gender || 'boy', 'head_circumference', ageAtRecordMonths, val);
      }

      if (metricsCount > 0 && allMetricsOptimal) {
        growthConclusion = 'Optimal';
      } else {
        growthConclusion = 'Suboptimal';
      }
    }

    // --- 2. SLEEP TRACKER ---
    let sleepHighlight = '';
    let recPct = 0;
    let sleepConclusion = 'Suboptimal';

    if (sleepLogs && sleepLogs.length > 0) {
      const totalMinutes = sleepLogs.reduce((acc, log) => {
        const mins = log.totalMinutes !== undefined ? log.totalMinutes : ((parseFloat(log.hours) || 0) * 60 + (parseFloat(log.minutes) || 0));
        return acc + mins;
      }, 0);
      const avgHours = ((totalMinutes / sleepLogs.length) / 60).toFixed(1);

      // AASM sleep recommendations by child's age in months
      const RECOMMENDED_SLEEP = [
        { maxMonths: 3, minHours: 14, maxHours: 17 },
        { maxMonths: 11, minHours: 12, maxHours: 16 }, // 4-11 months
        { maxMonths: 24, minHours: 11, maxHours: 14 }, // 12-24 months
        { maxMonths: 60, minHours: 10, maxHours: 13 }, // 3-5 years
      ];
      const childAgeMonths = child.date_of_birth
        ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : selectedAge;
      const recommendedRange = RECOMMENDED_SLEEP.find(r => childAgeMonths <= r.maxMonths) || RECOMMENDED_SLEEP[RECOMMENDED_SLEEP.length - 1];

      // Group by date to find daily sleep totals
      const dailySleep = {};
      sleepLogs.forEach(log => {
        const dateStr = new Date(log.timestamp).toDateString();
        const mins = log.totalMinutes !== undefined ? log.totalMinutes : ((parseFloat(log.hours) || 0) * 60 + (parseFloat(log.minutes) || 0));
        dailySleep[dateStr] = (dailySleep[dateStr] || 0) + mins;
      });

      const totalDays = Object.keys(dailySleep).length;
      let recommendedDaysCount = 0;
      Object.values(dailySleep).forEach(mins => {
        const hrs = mins / 60;
        if (hrs >= recommendedRange.minHours && hrs <= recommendedRange.maxHours) {
          recommendedDaysCount++;
        }
      });
      recPct = totalDays > 0 ? Math.round((recommendedDaysCount / totalDays) * 100) : 0;

      if (recPct >= 50) {
        sleepConclusion = 'Optimal';
      } else {
        sleepConclusion = 'Suboptimal';
      }

      sleepHighlight = `
        <div style="padding: 2px 0;">
          <div style="display: flex; gap: 6px; margin-bottom: 4px;">
            <div style="flex: 1; background: #EEF2FF; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #4338CA;">${avgHours} hr</div>
              <div style="font-size: 8.5px; color: #6B7280;">Avg. Duration</div>
            </div>
            <div style="flex: 1; background: #F0FDF4; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #15803D;">${recPct}%</div>
              <div style="font-size: 8.5px; color: #6B7280;">Within Range</div>
            </div>
            <div style="flex: 1; background: #F8FAFC; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #334155;">${sleepLogs.length}</div>
              <div style="font-size: 8.5px; color: #6B7280;">Entries</div>
            </div>
          </div>
          <p style="font-size: 8px; color: #6B7280; margin: 3px 0 0 0; line-height: 1.2;">
            * <strong>Avg. Duration</strong>: average length of each sleep session.<br/>
            * <strong>Within Range</strong>: % of days meeting recommended ${recommendedRange.minHours}–${recommendedRange.maxHours} hrs/day.
          </p>
        </div>
      `;
    } else {
      sleepHighlight = `<p style="color: #9CA3AF; font-style: italic; font-size: 10px; margin: 4px 0;">No sleep logs recorded yet.</p>`;
      sleepConclusion = 'No logs';
    }

    // --- 3. NUTRITION (FEEDING) ---
    let feedingHighlight = '';
    const allGroups = new Set();
    let nutritionConclusion = 'Suboptimal';
    let isNutritionOptimal = false;

    if (feedingLogs && feedingLogs.length > 0) {
      const mealTypes = {};
      feedingLogs.forEach(log => {
        const mt = log.type === 'breast' ? 'Breast' : (log.type === 'bottle' ? 'Bottle' : 'Solid');
        mealTypes[mt] = (mealTypes[mt] || 0) + 1;
        if (log.type === 'solid' && log.foodCategory) {
          allGroups.add(log.foodCategory);
        }
      });

      const hasSolids = feedingLogs.some(log => log.type === 'solid');
      const hasSuboptimalFrequency = feedingLogs.some(log => log.frequency === '1hr' || log.frequency === '2hr');

      if (hasSolids) {
        if (allGroups.size >= 4 && !hasSuboptimalFrequency) {
          nutritionConclusion = 'Optimal Diversity';
          isNutritionOptimal = true;
        } else if (hasSuboptimalFrequency) {
          nutritionConclusion = 'Suboptimal (Freq < 3hr)';
          isNutritionOptimal = false;
        } else {
          nutritionConclusion = 'Suboptimal (Low diversity)';
          isNutritionOptimal = false;
        }
      } else {
        nutritionConclusion = 'Liquids after every meal';
        isNutritionOptimal = true;
      }

      const topMeals = Object.entries(mealTypes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ');
      feedingHighlight = `
        <div style="padding: 2px 0;">
          <div style="display: flex; gap: 6px; margin-bottom: 4px;">
            <div style="flex: 1; background: #FFF7ED; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #C2410C;">${feedingLogs.length}</div>
              <div style="font-size: 8.5px; color: #6B7280;">Meals Logged</div>
            </div>
            <div style="flex: 1; background: #F0FDF4; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #15803D;">${allGroups.size}</div>
              <div style="font-size: 8.5px; color: #6B7280;">Food Groups</div>
            </div>
          </div>
          <p style="font-size: 8px; color: #6B7280; margin: 2px 0 0 0; line-height: 1.2;">Top: ${topMeals}${allGroups.size > 0 ? ' • Groups: ' + Array.from(allGroups).slice(0, 3).join(', ') : ''}</p>
        </div>
      `;
    } else {
      feedingHighlight = `<p style="color: #9CA3AF; font-style: italic; font-size: 10px; margin: 4px 0;">No feeding logs recorded yet.</p>`;
      nutritionConclusion = 'No logs';
    }

    // --- 4. TEETHING TRACKER ---
    let teethingHighlight = '';
    const teethEntries = Object.entries(teethingData);
    let teethingConclusion = 'Optimal';

    if (teethEntries.length > 0) {
      const sortedTeeth = teethEntries
        .map(([id, item]) => ({ id, ...item }))
        .sort((a, b) => new Date(a.eruptionDate) - new Date(b.eruptionDate));
      const toothNames = sortedTeeth.map(t => {
        const toothDef = PRIMARY_TEETH.find(pt => pt.id === t.id);
        return toothDef ? toothDef.name : t.id;
      }).join(', ');
      teethingHighlight = `
        <div style="padding: 2px 0;">
          <div style="display: flex; gap: 6px; margin-bottom: 4px;">
            <div style="flex: 1; background: #FFFBEB; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #B45309;">${teethEntries.length} / 20</div>
              <div style="font-size: 8.5px; color: #6B7280;">Teeth Erupted</div>
            </div>
            <div style="flex: 1; background: #FFF7ED; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #C2410C;">${Math.max(0, 20 - teethEntries.length)}</div>
              <div style="font-size: 8.5px; color: #6B7280;">Remaining</div>
            </div>
          </div>
          <p style="font-size: 8px; color: #6B7280; margin: 2px 0 0 0; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" title="${toothNames}"><strong>Teeth:</strong> ${toothNames}</p>
        </div>
      `;
    } else {
      teethingHighlight = `<p style="color: #9CA3AF; font-style: italic; font-size: 10px; margin: 4px 0;">No erupted teeth recorded yet.</p>`;
      teethingConclusion = 'No teeth erupted';
    }

    // Build growth tracker component HTML
    const growthTrackerHTML = `
      <div style="border: 1px solid #E5E7EB; border-radius: 6px; margin-bottom: 8px; overflow: hidden; background-color: #FFF;">
        <div style="background: #F8FAFC; padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; font-size: 11px; color: #1E293B;">Part 1: Growth Tracker</div>
        <div style="padding: 8px 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #F0F0F0; padding-bottom: 4px;">
              <td style="padding: 4px 0 3px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                  <span style="font-weight: 600; color: #555; font-size: 9.5px;">Weight-for-age</span>
                  <span style="color: #222; font-size: 9.5px; font-weight: bold;">${latestWeightStr}</span>
                </div>
                ${getInterpretationHTML(weightInterpretation)}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0; padding-bottom: 4px;">
              <td style="padding: 4px 0 3px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                  <span style="font-weight: 600; color: #555; font-size: 9.5px;">Height-for-age</span>
                  <span style="color: #222; font-size: 9.5px; font-weight: bold;">${latestHeightStr}</span>
                </div>
                ${getInterpretationHTML(heightInterpretation)}
              </td>
            </tr>
            <tr style="padding-bottom: 4px;">
              <td style="padding: 4px 0 3px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                  <span style="font-weight: 600; color: #555; font-size: 9.5px;">Head circumference</span>
                  <span style="color: #222; font-size: 9.5px; font-weight: bold;">${latestHeadCircStr}</span>
                </div>
                ${getInterpretationHTML(headInterpretation)}
              </td>
            </tr>
          </table>
          ${growthEntriesCount > 0 ? `<p style="font-size: 8px; color: #6B7280; margin: 4px 0 0 0;">${growthEntriesCount} measurements • Latest: ${latestMeasurementDateStr}</p>` : ''}
          <div style="margin-top: 6px; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9.5px; display: flex; align-items: center; justify-content: space-between; 
            ${growthConclusion.startsWith('Optimal') 
              ? 'background-color: #ECFDF5; color: #065F46; border: 1px solid #10B981;' 
              : 'background-color: #FEF2F2; color: #991B1B; border: 1px solid #EF4444;'
            }">
            <span>Conclusion:</span>
            <span>${growthConclusion}</span>
          </div>
        </div>
      </div>
    `;

    // Build additional vaccines section HTML
    const completedAdditional = ADDITIONAL_VACCINES.filter(v => additionalVaccinesData[v.id]?.completed);
    const additionalVaccinesHTML = completedAdditional.length > 0
      ? `
          <div style="margin-top: 6px; border-top: 1px solid #E5E7EB; padding-top: 6px;">
            <div style="font-size: 9px; font-weight: 600; color: #555; margin-bottom: 4px;">Additional Vaccines Received:</div>
            ${completedAdditional.map(v => {
              const dateStr = additionalVaccinesData[v.id]?.date ? new Date(additionalVaccinesData[v.id].date).toLocaleDateString() : 'N/A';
              return `<div style="font-size: 8.5px; color: #222; padding: 1px 0;">✅ ${v.name} — ${dateStr}</div>`;
            }).join('')}
          </div>
        `
      : '';

    // Build immunization tracker component HTML
    const immunizationTrackerHTML = `
      <div style="border: 1px solid #E5E7EB; border-radius: 6px; margin-bottom: 8px; overflow: hidden; background-color: #FFF;">
        <div style="background: #F8FAFC; padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; font-size: 11px; color: #1E293B;">Part 2: Immunization Tracker</div>
        <div style="padding: 8px 10px;">
          <div style="display: flex; gap: 6px; margin-bottom: 6px;">
            <div style="flex: 1; background: #F0FDF4; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #15803D;">${completedCount}</div>
              <div style="font-size: 8.5px; color: #6B7280;">Given</div>
            </div>
            <div style="flex: 1; background: #F8FAFC; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #475569;">${skippedCount}</div>
              <div style="font-size: 8.5px; color: #6B7280;">Skipped</div>
            </div>
            <div style="flex: 1; background: #FEF2F2; padding: 5px 4px; border-radius: 4px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #991B1B;">${missedCount}</div>
              <div style="font-size: 8.5px; color: #6B7280;">Overdue</div>
            </div>
          </div>
          ${additionalVaccinesHTML}
          <div style="padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9.5px; display: flex; align-items: center; justify-content: space-between; margin-top: 6px;
            ${missedCount === 0 
              ? 'background-color: #ECFDF5; color: #065F46; border: 1px solid #10B981;' 
              : 'background-color: #FEF2F2; color: #991B1B; border: 1px solid #EF4444;'
            }">
            <span>Status:</span>
            <span>${missedCount === 0 ? 'Up-to-date' : 'Not up-to-date'}</span>
          </div>
        </div>
      </div>
    `;

    // Build nutrition component HTML
    const nutritionTrackerHTML = `
      <div style="border: 1px solid #E5E7EB; border-radius: 6px; margin-bottom: 8px; overflow: hidden; background-color: #FFF;">
        <div style="background: #F8FAFC; padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; font-size: 11px; color: #1E293B;">Part 3: Nutrition</div>
        <div style="padding: 8px 10px;">
          ${feedingHighlight}
          <div style="margin-top: 4px; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9.5px; display: flex; align-items: center; justify-content: space-between; 
            ${isNutritionOptimal 
              ? 'background-color: #ECFDF5; color: #065F46; border: 1px solid #10B981;' 
              : 'background-color: #FEF2F2; color: #991B1B; border: 1px solid #EF4444;'
            }">
            <span>Conclusion:</span>
            <span>${nutritionConclusion}</span>
          </div>
        </div>
      </div>
    `;

    // Build sleep component HTML
    const sleepTrackerHTML = `
      <div style="border: 1px solid #E5E7EB; border-radius: 6px; margin-bottom: 8px; overflow: hidden; background-color: #FFF;">
        <div style="background: #F8FAFC; padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; font-size: 11px; color: #1E293B;">Part 4: Sleep Tracker</div>
        <div style="padding: 8px 10px;">
          ${sleepHighlight}
          <div style="margin-top: 4px; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9.5px; display: flex; align-items: center; justify-content: space-between; 
            ${recPct >= 50 
              ? 'background-color: #ECFDF5; color: #065F46; border: 1px solid #10B981;' 
              : 'background-color: #FEF2F2; color: #991B1B; border: 1px solid #EF4444;'
            }">
            <span>Conclusion:</span>
            <span>${sleepConclusion}</span>
          </div>
        </div>
      </div>
    `;

    // Build teething component HTML
    const teethingTrackerHTML = `
      <div style="border: 1px solid #E5E7EB; border-radius: 6px; margin-bottom: 8px; overflow: hidden; background-color: #FFF;">
        <div style="background: #F8FAFC; padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; font-size: 11px; color: #1E293B;">Part 5: Teething Tracker</div>
        <div style="padding: 8px 10px;">
          ${teethingHighlight}
          <div style="margin-top: 4px; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9.5px; display: flex; align-items: center; justify-content: space-between; background-color: #ECFDF5; color: #065F46; border: 1px solid #10B981;">
            <span>Conclusion:</span>
            <span>${teethingConclusion}</span>
          </div>
        </div>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Health Report</title>
        ${pdfStyles}
        <style>
          @page { margin: 8mm 10mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 10px; line-height: 1.3; padding: 0 !important; }
          .child-info-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; background-color: #F8F9FA; border-radius: 6px; overflow: hidden; border: 1px solid #EAEAEA; }
          .child-info-table td { padding: 4px 8px !important; border: 1px solid #EAEAEA; font-size: 9.5px !important; }
          .child-info-table td.label { font-weight: bold; color: #555; width: 20%; }
          .child-info-table td.value { color: #222; width: 30%; }
          .disclaimer { font-size: 8px; color: #777; text-align: center; margin-top: 8px; padding-top: 4px; border-top: 1px dashed #CCC; font-style: italic; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #5813f9; padding-bottom: 4px; margin-bottom: 8px;">
          <div>
            <h1 style="color: #5813f9; margin: 0; font-size: 16px; font-weight: 700;">Beacon mHealth</h1>
            <p style="margin: 0; font-size: 9px; color: #666;">Child Development Tracking System</p>
          </div>
          <div style="text-align: right;">
            <h2 style="color: #5813f9; margin: 0; font-size: 14px; font-weight: 700;">Child Health Report</h2>
            <p style="margin: 0; font-size: 9px; color: #666;">Generated: ${formatDate(new Date())}</p>
          </div>
        </div>

        ${getChildInfoTableHTML(child, ageStr)}

        <div style="display: flex; gap: 12px; margin-top: 4px;">
          <div style="flex: 1; min-width: 0;">
            ${growthTrackerHTML}
            ${immunizationTrackerHTML}
          </div>
          <div style="flex: 1; min-width: 0;">
            ${nutritionTrackerHTML}
            ${sleepTrackerHTML}
            ${teethingTrackerHTML}
          </div>
        </div>

        <div class="disclaimer">
          This report is based on the parent feedback. Further assessment by a healthcare professional is needed.
        </div>
      </body>
      </html>
    `;

    try {
      return await generateAndSharePdf(htmlContent, child, 'HealthReport');
    } catch (err) {
      console.error('Error generating health report PDF:', err);
      throw err;
    }
  }
};
