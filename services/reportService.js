import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MILESTONE_CATEGORIES, getMilestonesForAge } from '@/constants/milestones';
import { getVaccinationStatus } from '@/constants/vaccinationSchedule';
import { PRIMARY_TEETH } from '@/constants/teethData';
import growthService from './growthService';

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
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #5813f9;
      padding-bottom: 15px;
      margin-bottom: 30px;
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
      margin-bottom: 25px;
      background-color: #F8F9FA;
      border-radius: 8px;
      overflow: hidden;
    }
    .child-info-table td {
      padding: 10px 15px;
      border: 1px solid #EAEAEA;
      font-size: 14px;
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
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    .summary-card h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .summary-score {
      font-size: 32px;
      font-weight: bold;
      margin: 5px 0;
    }
    .summary-desc {
      font-size: 13px;
      opacity: 0.9;
    }
    .category-section {
      margin-bottom: 25px;
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: bold;
      margin-bottom: 10px;
      color: white;
    }
    .milestone-item {
      display: flex;
      align-items: flex-start;
      padding: 8px 10px;
      border-bottom: 1px solid #F0F0F0;
      font-size: 13px;
    }
    .milestone-item:last-child {
      border-bottom: none;
    }
    .status-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      margin-right: 12px;
      text-transform: uppercase;
      min-width: 60px;
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
      <td class="label">Developmental Age</td>
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
          This report is based on developmental checklist information completed by the caregiver. It is a screening aid, not a diagnostic clinical evaluation. Consult a pediatrician or specialist for professional developmental assessment.
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
      return true;
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
          This rapid ASD screener is designed to identify potential indicators of autism. It is a screening questionnaire, NOT a medical diagnosis. A high or moderate score warrants referrals for standard comprehensive diagnostic testing. Always discuss results with a clinician.
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
      return true;
    } catch (err) {
      console.error('Error generating ASD PDF:', err);
      throw err;
    }
  },

  generateComprehensiveReport: async (child, selectedAge, milestoneResponses, asdScreening) => {
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

    // ASD Section — Results & Advice ONLY (no questions/responses)
    let asdHTML = '';
    if (asdScreening) {
      const riskColors = { Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' };
      const currentRiskColor = riskColors[asdScreening.risk_level] || '#555';

      // Count risk factors from responses
      const QUESTION_TYPES = [
        'reverse','reverse','reverse','reverse','reverse','reverse','reverse','reverse','reverse',
        'normal','normal','normal','normal'
      ];
      const responses = asdScreening.responses || {};
      let riskFactorCount = 0;
      QUESTION_TYPES.forEach((type, idx) => {
        const ans = responses[idx + 1];
        const isAtRisk = type === 'reverse' ? ans === false : ans === true;
        if (isAtRisk) riskFactorCount++;
      });

      // Generate advice based on risk level
      let adviceHTML = '';
      if (asdScreening.risk_level === 'Low') {
        adviceHTML = `
          <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 14px 18px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #065F46; font-size: 14px;">✅ Low Risk — No Immediate Concerns</p>
            <p style="margin: 0; color: #047857; font-size: 12px; line-height: 1.6;">
              Your child's screening results suggest typical development at this time. Continue monitoring developmental milestones and engage in interactive play, reading, and social activities. 
              Re-screen again in 3–6 months or if any new concerns arise. If you notice changes in social interaction, communication, or behavior patterns, consult your pediatrician.
            </p>
          </div>
        `;
      } else if (asdScreening.risk_level === 'Moderate') {
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

      asdHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 20px;">Part 2: ASD Screening Results</h2>
        <div class="summary-card" style="background-color: ${currentRiskColor};">
          <h3>Screening Date: ${formatDate(asdScreening.created_at || new Date())}</h3>
          <div class="summary-score">Score: ${asdScreening.score} / 13</div>
          <div class="summary-desc" style="font-size: 16px; margin-top: 10px;">
            Risk Level: <span class="risk-badge risk-${asdScreening.risk_level}">${asdScreening.risk_level} Risk</span>
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

        ${adviceHTML}

        <p style="font-size: 11px; color: #9CA3AF; margin-top: 12px; text-align: center; font-style: italic;">
          This screening tool assesses social communication, behavioral patterns, and sensory responses. It is a screening aid — not a clinical diagnosis.
        </p>
      `;
    }

    // --- OTHER TRACKERS DATA FETCH ---
    let growthEntries = [];
    try {
      growthEntries = await growthService.getMeasurements(child.id).catch(() => []);
    } catch (e) {
      console.log('Error fetching growth data for report:', e);
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
    let additionalVaccines = {};
    try {
      const completedKey = `completed_vaccines_${child.id}`;
      const skippedKey = `skipped_vaccines_${child.id}`;
      const addKey = `additional_vaccines_${child.id}`;
      
      const [completedStored, skippedStored, addStored] = await Promise.all([
        AsyncStorage.getItem(completedKey),
        AsyncStorage.getItem(skippedKey),
        AsyncStorage.getItem(addKey)
      ]);
      completedVaccines = completedStored ? JSON.parse(completedStored) : [];
      skippedVaccines = skippedStored ? JSON.parse(skippedStored) : [];
      additionalVaccines = addStored ? JSON.parse(addStored) : {};
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

    // --- CONSOLIDATED DAILY TRACKERS PAGE (Growth + Sleep + Feeding + Teething) ---

    // Vaccination summary
    const compIds = completedVaccines.map(v => v.id);
    const skipIds = skippedVaccines.map(v => v.id);
    const vacStatus = child.date_of_birth 
      ? getVaccinationStatus(child.date_of_birth, compIds, skipIds)
      : null;
    const completedCount = completedVaccines.length;
    const skippedCount = skippedVaccines.length;
    const missedCount = vacStatus ? vacStatus.overdueVaccines.length : 0;
    const vacStatusText = missedCount > 0 ? 'Overdue' : (vacStatus && vacStatus.dueVaccines.length > 0 ? 'Due' : 'Up-to-date');
    const vacStatusColor = missedCount > 0 ? '#EF4444' : (vacStatus && vacStatus.dueVaccines.length > 0 ? '#F59E0B' : '#10B981');

    // Growth highlights
    let growthHighlight = '';
    if (growthEntries && growthEntries.length > 0) {
      const sorted = [...growthEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = sorted[0];
      const earliest = sorted[sorted.length - 1];
      growthHighlight = `
        <div style="padding: 12px 0;">
          <div style="display: flex; gap: 10px; margin-bottom: 8px;">
            <div style="flex: 1; background: #F0F9FF; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #0369A1;">${latest.weight ? latest.weight + ' kg' : '—'}</div>
              <div style="font-size: 10px; color: #6B7280;">Latest Weight</div>
            </div>
            <div style="flex: 1; background: #F0FDF4; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #15803D;">${latest.height ? latest.height + ' cm' : '—'}</div>
              <div style="font-size: 10px; color: #6B7280;">Latest Height</div>
            </div>
            <div style="flex: 1; background: #FDF4FF; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #7E22CE;">${latest.head_circumference ? latest.head_circumference + ' cm' : '—'}</div>
              <div style="font-size: 10px; color: #6B7280;">Head Circ.</div>
            </div>
          </div>
          <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0 0;">${sorted.length} measurement(s) recorded • Latest: ${formatDate(latest.date)}${sorted.length > 1 ? ' • First: ' + formatDate(earliest.date) : ''}</p>
        </div>
      `;
    } else {
      growthHighlight = `<p style="color: #9CA3AF; font-style: italic; font-size: 12px; margin: 8px 0;">No growth measurements recorded yet.</p>`;
    }

    // Sleep highlights
    let sleepHighlight = '';
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
      const recPct = totalDays > 0 ? Math.round((recommendedDaysCount / totalDays) * 100) : 0;

      sleepHighlight = `
        <div style="padding: 12px 0;">
          <div style="display: flex; gap: 10px; margin-bottom: 8px;">
            <div style="flex: 1; background: #EEF2FF; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #4338CA;">${avgHours} hrs</div>
              <div style="font-size: 10px; color: #6B7280;">Avg. Duration</div>
            </div>
            <div style="flex: 1; background: #F0FDF4; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #15803D;">${recPct}%</div>
              <div style="font-size: 10px; color: #6B7280;">Within Range</div>
            </div>
            <div style="flex: 1; background: #F8FAFC; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #334155;">${sleepLogs.length}</div>
              <div style="font-size: 10px; color: #6B7280;">Total Entries</div>
            </div>
          </div>
          <p style="font-size: 11px; color: #6B7280; margin: 6px 0 0 0; line-height: 1.4;">
            * <strong>Avg. Duration</strong> is the average length of each individual sleep session (naps and night sleep).<br/>
            * <strong>Within Range</strong> is the percentage of days where the child's total sleep met the AASM recommended daily range for their age (${recommendedRange.minHours}–${recommendedRange.maxHours} hours/day).
          </p>
        </div>
      `;
    } else {
      sleepHighlight = `<p style="color: #9CA3AF; font-style: italic; font-size: 12px; margin: 8px 0;">No sleep logs recorded yet.</p>`;
    }

    // Feeding highlights
    let feedingHighlight = '';
    if (feedingLogs && feedingLogs.length > 0) {
      const mealTypes = {};
      const allGroups = new Set();
      feedingLogs.forEach(log => {
        const mt = log.type === 'breast' ? 'Breast' : (log.type === 'bottle' ? 'Bottle' : 'Solid');
        mealTypes[mt] = (mealTypes[mt] || 0) + 1;
        if (log.type === 'solid' && log.foodCategory) {
          allGroups.add(log.foodCategory);
        }
      });
      const topMeals = Object.entries(mealTypes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ');
      feedingHighlight = `
        <div style="padding: 12px 0;">
          <div style="display: flex; gap: 10px; margin-bottom: 8px;">
            <div style="flex: 1; background: #FFF7ED; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #C2410C;">${feedingLogs.length}</div>
              <div style="font-size: 10px; color: #6B7280;">Meals Logged</div>
            </div>
            <div style="flex: 1; background: #F0FDF4; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #15803D;">${allGroups.size}</div>
              <div style="font-size: 10px; color: #6B7280;">Food Groups</div>
            </div>
          </div>
          <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0 0;">Top meals: ${topMeals}${allGroups.size > 0 ? ' • Groups: ' + Array.from(allGroups).slice(0, 4).join(', ') : ''}</p>
        </div>
      `;
    } else {
      feedingHighlight = `<p style="color: #9CA3AF; font-style: italic; font-size: 12px; margin: 8px 0;">No feeding logs recorded yet.</p>`;
    }

    // Teething highlights
    let teethingHighlight = '';
    const teethEntries = Object.entries(teethingData);
    if (teethEntries.length > 0) {
      const sortedTeeth = teethEntries
        .map(([id, item]) => ({ id, ...item }))
        .sort((a, b) => new Date(a.eruptionDate) - new Date(b.eruptionDate));
      const toothNames = sortedTeeth.map(t => {
        const toothDef = PRIMARY_TEETH.find(pt => pt.id === t.id);
        return toothDef ? toothDef.name : t.id;
      }).join(', ');
      teethingHighlight = `
        <div style="padding: 12px 0;">
          <div style="display: flex; gap: 10px; margin-bottom: 8px;">
            <div style="flex: 1; background: #FFFBEB; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #B45309;">${teethEntries.length} / 20</div>
              <div style="font-size: 10px; color: #6B7280;">Teeth Erupted</div>
            </div>
            <div style="flex: 1; background: #FFF7ED; padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #C2410C;">${Math.max(0, 20 - teethEntries.length)}</div>
              <div style="font-size: 10px; color: #6B7280;">Remaining Teeth</div>
            </div>
          </div>
          <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0 0;"><strong>Teeth Erupted:</strong> ${toothNames}</p>
        </div>
      `;
    } else {
      teethingHighlight = `<p style="color: #9CA3AF; font-style: italic; font-size: 12px; margin: 8px 0;">No erupted teeth recorded yet.</p>`;
    }

    // Build consolidated daily trackers page
    const trackersHTML = `
      <div class="page-break"></div>
      <h2 style="color: #5813f9; text-align: center; margin-bottom: 6px;">Part 3: Daily Trackers & Health Overview</h2>
      <p style="text-align: center; color: #6B7280; font-size: 12px; margin-bottom: 18px;">Summary of growth, sleep, nutrition, immunization, and teething data for ${child.first_name}.</p>

      <!-- Immunization Status Banner -->
      <div style="background-color: ${vacStatusColor}15; border: 1px solid ${vacStatusColor}40; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-weight: 600; color: #333; font-size: 13px;">🛡️ Immunization Status</span>
          <span style="margin-left: 8px; background: ${vacStatusColor}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">${vacStatusText}</span>
        </div>
        <div style="font-size: 12px; color: #555;">${completedCount} given · ${skippedCount} skipped · ${missedCount} overdue</div>
      </div>

      <!-- Growth -->
      <div style="border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 12px; overflow: hidden;">
        <div style="background: #F8FAFC; padding: 10px 14px; border-bottom: 1px solid #E5E7EB; font-weight: 600; font-size: 13px; color: #1E293B;">📏 Growth Measurements</div>
        <div style="padding: 2px 14px;">${growthHighlight}</div>
      </div>

      <!-- Sleep -->
      <div style="border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 12px; overflow: hidden;">
        <div style="background: #F8FAFC; padding: 10px 14px; border-bottom: 1px solid #E5E7EB; font-weight: 600; font-size: 13px; color: #1E293B;">😴 Sleep Tracker</div>
        <div style="padding: 2px 14px;">${sleepHighlight}</div>
      </div>

      <!-- Feeding -->
      <div style="border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 12px; overflow: hidden;">
        <div style="background: #F8FAFC; padding: 10px 14px; border-bottom: 1px solid #E5E7EB; font-weight: 600; font-size: 13px; color: #1E293B;">🍽️ Feeding & Nutrition</div>
        <div style="padding: 2px 14px;">${feedingHighlight}</div>
      </div>

      <!-- Teething -->
      <div style="border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 12px; overflow: hidden;">
        <div style="background: #F8FAFC; padding: 10px 14px; border-bottom: 1px solid #E5E7EB; font-weight: 600; font-size: 13px; color: #1E293B;">🦷 Teething Progress</div>
        <div style="padding: 2px 14px;">${teethingHighlight}</div>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprehensive Developmental Report</title>
        ${pdfStyles}
        <style>
          @page { margin: 18mm 15mm; }
          body { font-size: 13px; }
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

        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Comprehensive Child Developmental Report</h2>

        ${getChildInfoTableHTML(child, ageStr)}

        <h2 style="color: #5813f9; margin-top: 30px;">Part 1: Developmental Milestones Summary</h2>
        <div class="summary-card" style="background-color: #5813f9; margin-bottom: 25px;">
          <h3>Overall Milestone Summary</h3>
          <div class="summary-score">${totalAchieved} / ${totalMilestones} Milestones Achieved</div>
          <div class="summary-desc">
            This section reviews developmental milestones achieved for the ${selectedAge}-month checklist.
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

        ${trackersHTML}

        <div class="disclaimer">
          This comprehensive developmental report is a compilation of caregiver screenings. It is intended for informational purposes and clinical review. It is not a clinical diagnosis. Please consult a pediatrician or pediatric development specialist for professional diagnostic evaluation.
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
      return true;
    } catch (err) {
      console.error('Error generating comprehensive PDF:', err);
      throw err;
    }
  }
};
