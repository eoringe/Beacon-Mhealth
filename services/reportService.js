import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MILESTONE_CATEGORIES, getMilestonesForAge } from '@/constants/milestones';
import { getVaccinationStatus } from '@/constants/vaccinationSchedule';
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
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
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

        <div class="summary-card" style="background: linear-gradient(135deg, #5813f9 0%, #3f0bb2 100%);">
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
    
    const QUESTIONS = [
      { id: 1, text: "Does your child look at you when you call their name?", type: 'reverse' },
      { id: 2, text: "Does your child make eye contact during interaction? (brief eye contact counts)", type: 'reverse' },
      { id: 3, text: "Does your child point to show you something interesting?", type: 'reverse' },
      { id: 4, text: "Does your child try to share enjoyment with you? (e.g., brings or shows objects)", type: 'reverse' },
      { id: 5, text: "Does your child copy your actions? (e.g., clapping, waving, high-5)", type: 'reverse' },
      { id: 6, text: "Does your child use words, sounds, or gestures to communicate needs?", type: 'reverse' },
      { id: 7, text: "Does your child respond when spoken to (even if not using words)?", type: 'reverse' },
      { id: 8, text: "Does your child engage in simple back-and-forth interaction? (e.g., taking turns in play or sounds)", type: 'reverse' },
      { id: 9, text: "Does your child understand simple instructions? (e.g., “bring the cup”)", type: 'reverse' },
      { id: 10, text: "Does your child repeat the same sounds, actions, or movements over and over? (e.g., humming, hand flapping, lining objects)", type: 'normal' },
      { id: 11, text: "Does your child play with toys or objects unusually? (e.g., spinning wheels repeatedly)", type: 'normal' },
      { id: 12, text: "Does your child become very upset by small changes in routine or environment?", type: 'normal' },
      { id: 13, text: "Does your child show unusual reactions to sounds, textures, or touch? (e.g., covering ears, avoiding certain clothes/foods)", type: 'normal' },
    ];

    const responses = screening.responses || {};
    const riskColors = { Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' };
    const currentRiskColor = riskColors[screening.risk_level] || '#555';

    const questionsHTML = QUESTIONS.map(q => {
      const ans = responses[q.id];
      const isAtRisk = q.type === 'reverse' ? ans === false : ans === true;
      const displayAnswer = ans === true ? 'Yes' : (ans === false ? 'No' : 'Unanswered');
      const ansStyle = isAtRisk ? 'color: #C62828; font-weight: bold;' : 'color: #2E7D32;';
      const riskText = isAtRisk ? '<span style="color: #C62828; font-weight: bold;">⚠️ Risk Factor</span>' : 'Typical';
      
      return `
        <tr>
          <td>${q.id}</td>
          <td>${q.text}</td>
          <td style="${ansStyle}">${displayAnswer}</td>
          <td>${riskText}</td>
        </tr>
      `;
    }).join('');

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

        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Rapid ASD Screening Report</h2>

        ${getChildInfoTableHTML(child, '18–60 Months')}

        <div class="summary-card" style="background: linear-gradient(135deg, ${currentRiskColor} 0%, #333 100%);">
          <h3>Screening Date: ${formatDate(screening.created_at || new Date())}</h3>
          <div class="summary-score">Score: ${screening.score} / 13</div>
          <div class="summary-desc" style="font-size: 16px; margin-top: 10px;">
            Risk Level: <span class="risk-badge risk-${screening.risk_level}">${screening.risk_level} Risk</span>
          </div>
        </div>

        <h2 class="section-title">Questionnaire Responses</h2>
        <table class="question-table">
          <thead>
            <tr>
              <th style="width: 5%;">No.</th>
              <th style="width: 65%;">Question</th>
              <th style="width: 15%;">Response</th>
              <th style="width: 15%;">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            ${questionsHTML}
          </tbody>
        </table>

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

    // ASD Section (if exists)
    let asdHTML = '';
    if (asdScreening) {
      const QUESTIONS = [
        { id: 1, text: "Does your child look at you when you call their name?", type: 'reverse' },
        { id: 2, text: "Does your child make eye contact during interaction? (brief eye contact counts)", type: 'reverse' },
        { id: 3, text: "Does your child point to show you something interesting?", type: 'reverse' },
        { id: 4, text: "Does your child try to share enjoyment with you? (e.g., brings or shows objects)", type: 'reverse' },
        { id: 5, text: "Does your child copy your actions? (e.g., clapping, waving, high-5)", type: 'reverse' },
        { id: 6, text: "Does your child use words, sounds, or gestures to communicate needs?", type: 'reverse' },
        { id: 7, text: "Does your child respond when spoken to (even if not using words)?", type: 'reverse' },
        { id: 8, text: "Does your child engage in simple back-and-forth interaction? (e.g., taking turns in play or sounds)", type: 'reverse' },
        { id: 9, text: "Does your child understand simple instructions? (e.g., “bring the cup”)", type: 'reverse' },
        { id: 10, text: "Does your child repeat the same sounds, actions, or movements over and over? (e.g., humming, hand flapping, lining objects)", type: 'normal' },
        { id: 11, text: "Does your child play with toys or objects unusually? (e.g., spinning wheels repeatedly)", type: 'normal' },
        { id: 12, text: "Does your child become very upset by small changes in routine or environment?", type: 'normal' },
        { id: 13, text: "Does your child show unusual reactions to sounds, textures, or touch? (e.g., covering ears, avoiding certain clothes/foods)", type: 'normal' },
      ];

      const responses = asdScreening.responses || {};
      const riskColors = { Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' };
      const currentRiskColor = riskColors[asdScreening.risk_level] || '#555';

      const questionsHTML = QUESTIONS.map(q => {
        const ans = responses[q.id];
        const isAtRisk = q.type === 'reverse' ? ans === false : ans === true;
        const displayAnswer = ans === true ? 'Yes' : (ans === false ? 'No' : 'Unanswered');
        const ansStyle = isAtRisk ? 'color: #C62828; font-weight: bold;' : 'color: #2E7D32;';
        const riskText = isAtRisk ? '<span style="color: #C62828; font-weight: bold;">⚠️ Risk Factor</span>' : 'Typical';

        return `
          <tr>
            <td>${q.id}</td>
            <td>${q.text}</td>
            <td style="${ansStyle}">${displayAnswer}</td>
            <td>${riskText}</td>
          </tr>
        `;
      }).join('');

      asdHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 2: Rapid ASD Screening Summary</h2>
        <div class="summary-card" style="background: linear-gradient(135deg, ${currentRiskColor} 0%, #333 100%);">
          <h3>Screening Date: ${formatDate(asdScreening.created_at || new Date())}</h3>
          <div class="summary-score">Score: ${asdScreening.score} / 13</div>
          <div class="summary-desc" style="font-size: 16px; margin-top: 10px;">
            Risk Level: <span class="risk-badge risk-${asdScreening.risk_level}">${asdScreening.risk_level} Risk</span>
          </div>
        </div>

        <h2 class="section-title">Questionnaire Responses</h2>
        <table class="question-table">
          <thead>
            <tr>
              <th style="width: 5%;">No.</th>
              <th style="width: 65%;">Question</th>
              <th style="width: 15%;">Response</th>
              <th style="width: 15%;">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            ${questionsHTML}
          </tbody>
        </table>
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

    // --- RENDER SECTIONS ---

    // Part 3: Growth HTML
    let growthHTML = '';
    if (growthEntries && growthEntries.length > 0) {
      const sortedGrowth = [...growthEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
      const rows = sortedGrowth.map(entry => `
        <tr>
          <td>${formatDate(entry.date)}</td>
          <td>${entry.height ? `${entry.height} cm` : 'N/A'}</td>
          <td>${entry.weight ? `${entry.weight} kg` : 'N/A'}</td>
          <td>${entry.head_circumference ? `${entry.head_circumference} cm` : 'N/A'}</td>
        </tr>
      `).join('');

      growthHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 3: Growth Measurements History</h2>
        <table class="question-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Height / Length</th>
              <th>Weight</th>
              <th>Head Circumference</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    } else {
      growthHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 3: Growth Measurements History</h2>
        <p style="text-align: center; color: #666; font-style: italic;">No growth measurements logged yet.</p>
      `;
    }

    // Part 4: Sleep HTML
    let sleepHTML = '';
    if (sleepLogs && sleepLogs.length > 0) {
      const totalHours = sleepLogs.reduce((acc, log) => acc + (parseFloat(log.duration) || 0), 0);
      const avgHours = (totalHours / sleepLogs.length).toFixed(1);
      
      const rows = sleepLogs.slice(0, 10).map(log => `
        <tr>
          <td>${formatDate(log.timestamp || log.date)}</td>
          <td>${log.duration} hours</td>
          <td><span style="font-weight: bold; color: ${log.status === 'Recommended' ? '#2E7D32' : '#EF6C00'}">${log.status || 'N/A'}</span></td>
          <td>${log.notes || 'N/A'}</td>
        </tr>
      `).join('');

      sleepHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 4: Sleep Tracker Summary</h2>
        <div class="summary-card" style="background: linear-gradient(135deg, #3F51B5 0%, #1A237E 100%); margin-bottom: 20px;">
          <h3>Sleep Analysis</h3>
          <div class="summary-score">${avgHours} Hours</div>
          <div class="summary-desc">Average recorded sleep duration across ${sleepLogs.length} entries.</div>
        </div>
        <h4 style="margin-top: 20px; color: #333;">Recent Sleep Logs</h4>
        <table class="question-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    } else {
      sleepHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 4: Sleep Tracker Summary</h2>
        <p style="text-align: center; color: #666; font-style: italic;">No sleep logs recorded yet.</p>
      `;
    }

    // Part 5: Feeding HTML
    let feedingHTML = '';
    if (feedingLogs && feedingLogs.length > 0) {
      const rows = feedingLogs.slice(0, 10).map(log => {
        const groupsText = log.selectedGroups && log.selectedGroups.length > 0 
          ? log.selectedGroups.join(', ')
          : 'None / Liquids';
        return `
          <tr>
            <td>${formatDate(log.timestamp || log.date)}</td>
            <td>${log.mealType || 'Meal'}</td>
            <td>${groupsText}</td>
            <td>${log.notes || 'N/A'}</td>
          </tr>
        `;
      }).join('');

      feedingHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 5: Feeding Tracker Summary</h2>
        <h4 style="margin-top: 20px; color: #333;">Recent Feeding Logs</h4>
        <table class="question-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Meal Type</th>
              <th>WHO Food Groups Logged</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    } else {
      feedingHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 5: Feeding Tracker Summary</h2>
        <p style="text-align: center; color: #666; font-style: italic;">No feeding logs recorded yet.</p>
      `;
    }

    // Part 6: Immunization HTML
    let immunizationHTML = '';
    const compIds = completedVaccines.map(v => v.id);
    const skipIds = skippedVaccines.map(v => v.id);
    const vacStatus = child.date_of_birth 
      ? getVaccinationStatus(child.date_of_birth, compIds, skipIds)
      : null;

    const completedCount = completedVaccines.length;
    const skippedCount = skippedVaccines.length;
    const missedCount = vacStatus ? vacStatus.overdueVaccines.length : 0;
    const statusLabelText = missedCount > 0 ? 'Missed Vaccines' : (vacStatus && vacStatus.dueVaccines.length > 0 ? 'Pending Review' : 'Up-to-date');
    const statusLabelColor = missedCount > 0 ? '#EF4444' : (vacStatus && vacStatus.dueVaccines.length > 0 ? '#F59E0B' : '#10B981');

    const completedAdditionalList = Object.entries(additionalVaccines)
      .filter(([id, data]) => data?.completed)
      .map(([id, data]) => {
        const item = ADDITIONAL_VACCINES.find(v => v.id === id) || { name: id };
        return `
          <tr>
            <td>${item.name}</td>
            <td>Given on: ${formatDate(data.date)}</td>
            <td>Completed</td>
          </tr>
        `;
      }).join('');

    immunizationHTML = `
      <div class="page-break"></div>
      <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 6: Immunization & Vaccination History</h2>
      
      <div class="summary-card" style="background: linear-gradient(135deg, ${statusLabelColor} 0%, #333 100%); margin-bottom: 20px;">
        <h3>Immunization Status: ${statusLabelText}</h3>
        <div class="summary-score">${completedCount} Standard Vaccines Received</div>
        <div class="summary-desc">
          ${skippedCount} vaccine(s) marked as skipped. ${missedCount} vaccine(s) currently overdue.
        </div>
      </div>

      <h4 style="margin-top: 20px; color: #333;">Additional / Recommended Vaccines</h4>
      ${completedAdditionalList.length > 0 ? `
        <table class="question-table">
          <thead>
            <tr>
              <th>Vaccine Name</th>
              <th>Date Administered</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${completedAdditionalList}
          </tbody>
        </table>
      ` : `<p style="color: #666; font-style: italic;">No additional vaccines recorded yet.</p>`}
    `;

    // Part 7: Teething HTML
    let teethingHTML = '';
    const teethEntries = Object.entries(teethingData);
    if (teethEntries.length > 0) {
      const sortedTeeth = teethEntries
        .map(([id, item]) => ({ id, ...item }))
        .sort((a, b) => new Date(a.eruptionDate) - new Date(b.eruptionDate));

      const rows = sortedTeeth.map(tooth => `
        <tr>
          <td>${tooth.name || tooth.id}</td>
          <td>${formatDate(tooth.eruptionDate)}</td>
          <td>${tooth.eruptionAgeMonths ? `${tooth.eruptionAgeMonths} months` : 'N/A'}</td>
        </tr>
      `).join('');

      teethingHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 7: Teething Tracker Timeline</h2>
        <table class="question-table">
          <thead>
            <tr>
              <th>Tooth Name</th>
              <th>Eruption Date</th>
              <th>Age at Eruption</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    } else {
      teethingHTML = `
        <div class="page-break"></div>
        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Part 7: Teething Tracker Timeline</h2>
        <p style="text-align: center; color: #666; font-style: italic;">No erupted teeth recorded yet.</p>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprehensive Developmental Report</title>
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

        <h2 style="color: #5813f9; text-align: center; margin-bottom: 25px;">Comprehensive Child Developmental Report</h2>

        ${getChildInfoTableHTML(child, ageStr)}

        <h2 style="color: #5813f9; margin-top: 30px;">Part 1: Developmental Milestones Summary</h2>
        <div class="summary-card" style="background: linear-gradient(135deg, #5813f9 0%, #3f0bb2 100%); margin-bottom: 25px;">
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

        ${growthHTML}

        ${sleepHTML}

        ${feedingHTML}

        ${immunizationHTML}

        ${teethingHTML}

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
