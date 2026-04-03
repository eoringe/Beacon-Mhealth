/**
 * Kenya Ministry of Health Vaccination Schedule - 2023
 * Based on the Kenya National Immunization Policy Guidelines 2023 (KEPI/NVIP)
 * Source: http://guidelines.health.go.ke:8000/media/Kenya_National_Immunization_Policy_Guidelines_Version_signed.pdf
 *
 * highRiskCountiesOnly: true = vaccine is only administered in high-risk counties
 */
import { calculateAgeInMonths } from './milestones';

export const VACCINATION_SCHEDULE = [
    // ── CONTACT 1: At birth or at first contact ──────────────────────────────
    {
        id: 'bcg',
        name: 'BCG',
        fullName: 'Bacille Calmette-Guérin',
        diseases: ['Tuberculosis'],
        ageWeeks: 0,
        ageLabel: 'At Birth',
        contact: 1,
        dose: 1,
        totalDoses: 1,
        dosage: '0.05ml (0.1ml if > 1 year)',
        administrationMethod: 'Intradermal',
    },
    {
        id: 'opv_0',
        name: 'OPV Birth Dose',
        fullName: 'Oral Polio Vaccine – Birth Dose (Bivalent)',
        diseases: ['Poliomyelitis'],
        ageWeeks: 0,
        ageLabel: 'At Birth',
        contact: 1,
        dose: 0,
        totalDoses: 4,
        dosage: '2 drops',
        administrationMethod: 'Oral',
        note: 'Given within the first two weeks of life',
    },

    // ── CONTACT 2: At 6 weeks ─────────────────────────────────────────────────
    {
        id: 'opv_1',
        name: 'OPV 1',
        fullName: 'Oral Polio Vaccine – Dose 1',
        diseases: ['Poliomyelitis'],
        ageWeeks: 6,
        ageLabel: '6 Weeks',
        contact: 2,
        dose: 1,
        totalDoses: 4,
        dosage: '2 drops',
        administrationMethod: 'Oral',
    },
    {
        id: 'dpt_hepb_hib_1',
        name: 'DPT-HepB+Hib 1',
        fullName: 'Diphtheria-Pertussis-Tetanus-Hepatitis B-Hib – Dose 1',
        diseases: ['Diphtheria', 'Pertussis', 'Tetanus', 'Hepatitis B', 'Haemophilus influenzae type b'],
        ageWeeks: 6,
        ageLabel: '6 Weeks',
        contact: 2,
        dose: 1,
        totalDoses: 3,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – upper outer aspect of left thigh',
    },
    {
        id: 'pcv10_1',
        name: 'PCV10 – 1',
        fullName: 'Pneumococcal Conjugate Vaccine 10-valent – Dose 1',
        diseases: ['Pneumonia', 'Meningitis', 'Septicaemia'],
        ageWeeks: 6,
        ageLabel: '6 Weeks',
        contact: 2,
        dose: 1,
        totalDoses: 3,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – upper outer aspect of right thigh',
    },
    {
        id: 'rota_1',
        name: 'Rotavirus 1',
        fullName: 'Rotavirus Vaccine – Dose 1',
        diseases: ['Severe rotavirus diarrhoea'],
        ageWeeks: 6,
        ageLabel: '6 Weeks',
        contact: 2,
        dose: 1,
        totalDoses: 3,
        dosage: '0.5ml (5 drops)',
        administrationMethod: 'Oral',
    },

    // ── CONTACT 3: At 10 weeks ────────────────────────────────────────────────
    {
        id: 'opv_2',
        name: 'OPV II',
        fullName: 'Oral Polio Vaccine – Dose 2',
        diseases: ['Poliomyelitis'],
        ageWeeks: 10,
        ageLabel: '10 Weeks',
        contact: 3,
        dose: 2,
        totalDoses: 4,
        dosage: '2 drops',
        administrationMethod: 'Oral',
    },
    {
        id: 'dpt_hepb_hib_2',
        name: 'DPT-HepB+Hib 2',
        fullName: 'Diphtheria-Pertussis-Tetanus-Hepatitis B-Hib – Dose 2',
        diseases: ['Diphtheria', 'Pertussis', 'Tetanus', 'Hepatitis B', 'Haemophilus influenzae type b'],
        ageWeeks: 10,
        ageLabel: '10 Weeks',
        contact: 3,
        dose: 2,
        totalDoses: 3,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – upper outer aspect of left thigh',
    },
    {
        id: 'pcv10_2',
        name: 'PCV10 – 2',
        fullName: 'Pneumococcal Conjugate Vaccine 10-valent – Dose 2',
        diseases: ['Pneumonia', 'Meningitis', 'Septicaemia'],
        ageWeeks: 10,
        ageLabel: '10 Weeks',
        contact: 3,
        dose: 2,
        totalDoses: 3,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – upper outer aspect of right thigh',
    },
    {
        id: 'rota_2',
        name: 'Rotavirus 2',
        fullName: 'Rotavirus Vaccine – Dose 2',
        diseases: ['Severe rotavirus diarrhoea'],
        ageWeeks: 10,
        ageLabel: '10 Weeks',
        contact: 3,
        dose: 2,
        totalDoses: 3,
        dosage: '0.5ml (5 drops)',
        administrationMethod: 'Oral',
    },

    // ── CONTACT 4: At 14 weeks ────────────────────────────────────────────────
    {
        id: 'opv_3',
        name: 'OPV III',
        fullName: 'Oral Polio Vaccine – Dose 3',
        diseases: ['Poliomyelitis'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        contact: 4,
        dose: 3,
        totalDoses: 4,
        dosage: '2 drops',
        administrationMethod: 'Oral',
    },
    {
        id: 'dpt_hepb_hib_3',
        name: 'DPT-HepB+Hib 3',
        fullName: 'Diphtheria-Pertussis-Tetanus-Hepatitis B-Hib – Dose 3',
        diseases: ['Diphtheria', 'Pertussis', 'Tetanus', 'Hepatitis B', 'Haemophilus influenzae type b'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        contact: 4,
        dose: 3,
        totalDoses: 3,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – upper outer aspect of left thigh',
    },
    {
        id: 'pcv10_3',
        name: 'PCV10 – 3',
        fullName: 'Pneumococcal Conjugate Vaccine 10-valent – Dose 3',
        diseases: ['Pneumonia', 'Meningitis', 'Septicaemia'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        contact: 4,
        dose: 3,
        totalDoses: 3,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – upper outer aspect of right thigh',
    },
    {
        id: 'ipv',
        name: 'IPV',
        fullName: 'Inactivated Polio Vaccine',
        diseases: ['Poliomyelitis'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        contact: 4,
        dose: 1,
        totalDoses: 1,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – upper outer aspect of right thigh, 2.5cm from PCV-3 site',
    },
    {
        id: 'rota_3',
        name: 'Rotavirus 3',
        fullName: 'Rotavirus Vaccine – Dose 3',
        diseases: ['Severe rotavirus diarrhoea'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        contact: 4,
        dose: 3,
        totalDoses: 3,
        dosage: '0.5ml (5 drops)',
        administrationMethod: 'Oral',
    },

    // ── CONTACT 5: At 6 months ────────────────────────────────────────────────
    {
        id: 'vita_6m',
        name: 'Vitamin A (6 months)',
        fullName: 'Vitamin A Supplementation – 6 months',
        diseases: ['Vitamin A deficiency', 'Blindness prevention'],
        ageWeeks: 26,
        ageLabel: '6 Months',
        contact: 5,
        dose: 1,
        totalDoses: 1,
        dosage: '100,000 IU',
        administrationMethod: 'Oral',
    },
    {
        id: 'mr_outbreak',
        name: 'Measles-Rubella (Outbreak)',
        fullName: 'Measles-Rubella Vaccine – Outbreak / HIV-exposed dose',
        diseases: ['Measles', 'Rubella'],
        ageWeeks: 26,
        ageLabel: '6 Months',
        contact: 5,
        dose: 1,
        totalDoses: 1,
        dosage: '0.5ml',
        administrationMethod: 'Subcutaneous – right upper arm (deltoid muscle)',
        note: 'During measles-rubella outbreak or for HIV-infected infants not severely immunosuppressed',
    },
    {
        id: 'rtss_1',
        name: 'RTS,S/AS01 – Malaria 1',
        fullName: 'RTS,S/AS01 Malaria Vaccine – Dose 1',
        diseases: ['Malaria'],
        ageWeeks: 26,
        ageLabel: '6 Months',
        contact: 5,
        dose: 1,
        totalDoses: 4,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – left deltoid muscle',
        highRiskCountiesOnly: true,
        note: 'High-risk counties only',
    },

    // ── CONTACT 6: At 7 months ────────────────────────────────────────────────
    {
        id: 'rtss_2',
        name: 'RTS,S/AS01 – Malaria 2',
        fullName: 'RTS,S/AS01 Malaria Vaccine – Dose 2',
        diseases: ['Malaria'],
        ageWeeks: 30,
        ageLabel: '7 Months',
        contact: 6,
        dose: 2,
        totalDoses: 4,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – left deltoid muscle',
        highRiskCountiesOnly: true,
        note: 'High-risk counties only',
    },

    // ── CONTACT 7: At 9 months ────────────────────────────────────────────────
    {
        id: 'mr_1',
        name: 'Measles-Rubella 1',
        fullName: 'Measles-Rubella Vaccine – 1st Dose',
        diseases: ['Measles', 'Rubella'],
        ageWeeks: 39,
        ageLabel: '9 Months',
        contact: 7,
        dose: 1,
        totalDoses: 2,
        dosage: '0.5ml',
        administrationMethod: 'Subcutaneous – right upper arm (deltoid muscle)',
    },
    {
        id: 'yf',
        name: 'Yellow Fever',
        fullName: 'Yellow Fever Vaccine',
        diseases: ['Yellow Fever'],
        ageWeeks: 39,
        ageLabel: '9 Months',
        contact: 7,
        dose: 1,
        totalDoses: 1,
        dosage: '0.5ml',
        administrationMethod: 'Subcutaneous – left upper arm (deltoid muscle)',
        highRiskCountiesOnly: true,
        note: 'High-risk counties only',
    },
    {
        id: 'rtss_3',
        name: 'RTS,S/AS01 – Malaria 3',
        fullName: 'RTS,S/AS01 Malaria Vaccine – Dose 3',
        diseases: ['Malaria'],
        ageWeeks: 39,
        ageLabel: '9 Months',
        contact: 7,
        dose: 3,
        totalDoses: 4,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – left deltoid muscle',
        highRiskCountiesOnly: true,
        note: 'High-risk counties only',
    },

    // ── CONTACT 8: At 12 months ───────────────────────────────────────────────
    {
        id: 'vita_12m',
        name: 'Vitamin A (12 months)',
        fullName: 'Vitamin A Supplementation – 12 months',
        diseases: ['Vitamin A deficiency', 'Blindness prevention'],
        ageWeeks: 52,
        ageLabel: '12 Months',
        contact: 8,
        dose: 1,
        totalDoses: 1,
        dosage: '200,000 IU',
        administrationMethod: 'Oral',
    },

    // ── CONTACT 9: At 18 months ───────────────────────────────────────────────
    {
        id: 'mr_2',
        name: 'Measles-Rubella 2',
        fullName: 'Measles-Rubella Vaccine – 2nd Dose',
        diseases: ['Measles', 'Rubella'],
        ageWeeks: 78,
        ageLabel: '18 Months',
        contact: 9,
        dose: 2,
        totalDoses: 2,
        dosage: '0.5mls',
        administrationMethod: 'Subcutaneous – right upper arm (deltoid muscle)',
    },
    {
        id: 'vita_18m',
        name: 'Vitamin A (18 months)',
        fullName: 'Vitamin A Supplementation – 18 months',
        diseases: ['Vitamin A deficiency', 'Blindness prevention'],
        ageWeeks: 78,
        ageLabel: '18 Months',
        contact: 9,
        dose: 1,
        totalDoses: 1,
        dosage: '200,000 IU (one capsule)',
        administrationMethod: 'Oral',
    },

    // ── CONTACT 10: At 24 months ──────────────────────────────────────────────
    {
        id: 'rtss_4',
        name: 'RTS,S/AS01 – Malaria 4',
        fullName: 'RTS,S/AS01 Malaria Vaccine – Dose 4',
        diseases: ['Malaria'],
        ageWeeks: 104,
        ageLabel: '24 Months',
        contact: 10,
        dose: 4,
        totalDoses: 4,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – left deltoid muscle',
        highRiskCountiesOnly: true,
        note: 'High-risk counties only',
    },

    // ── CONTACT 11: At 10 years – girls only (extend to 14 years for catch-up)
    {
        id: 'hpv_1',
        name: 'HPV Vaccine 1',
        fullName: 'Human Papillomavirus Vaccine – Dose 1',
        diseases: ['Cervical cancer', 'HPV-related diseases'],
        ageWeeks: 520,
        ageLabel: '10 Years (Girls)',
        contact: 11,
        dose: 1,
        totalDoses: 2,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – left deltoid muscle',
        note: 'Girls only. Catch-up up to 14 years',
    },

    // ── CONTACT 12: 6 months after HPV 1 ─────────────────────────────────────
    {
        id: 'hpv_2',
        name: 'HPV Vaccine 2',
        fullName: 'Human Papillomavirus Vaccine – Dose 2',
        diseases: ['Cervical cancer', 'HPV-related diseases'],
        ageWeeks: 546,
        ageLabel: '10 Years, 6 Months (Girls)',
        contact: 12,
        dose: 2,
        totalDoses: 2,
        dosage: '0.5ml',
        administrationMethod: 'Intramuscular – left deltoid muscle',
        note: '6 months after HPV Vaccine 1',
    },
];

/**
 * Calculate child's age in weeks from date of birth
 */
export function calculateAgeInWeeks(dateOfBirth) {
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const diffTime = Math.abs(today - dob);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
}

/**
 * Get vaccines due for a child based on their age
 * @param {string} dateOfBirth - Child's date of birth
 * @param {string[]} completedVaccineIds - Array of vaccine IDs already administered
 * @returns {Object} Object with dueVaccines, upcomingVaccines, overdueVaccines, and completedVaccines
 */
export function getVaccinationStatus(dateOfBirth, completedVaccineIds = [], skippedVaccineIds = []) {
    const ageInWeeks = calculateAgeInWeeks(dateOfBirth);

    const dueVaccines = [];
    const upcomingVaccines = [];
    const completedVaccines = [];
    const overdueVaccines = [];

    // Grace period: 2 weeks before and after scheduled age
    const gracePeriodWeeks = 2;

    VACCINATION_SCHEDULE.forEach(vaccine => {
        if (completedVaccineIds.includes(vaccine.id)) {
            completedVaccines.push(vaccine);
        } else if (skippedVaccineIds.includes(vaccine.id)) {
            // Treat as completed but don't add to visible lists if logic requires
            // For now, just exclude from due/overdue
            completedVaccines.push({ ...vaccine, status: 'skipped' });
        } else if (ageInWeeks >= vaccine.ageWeeks - gracePeriodWeeks &&
            ageInWeeks <= vaccine.ageWeeks + gracePeriodWeeks) {
            // Due now (within grace period)
            dueVaccines.push(vaccine);
        } else if (ageInWeeks > vaccine.ageWeeks + gracePeriodWeeks) {
            // Overdue
            overdueVaccines.push(vaccine);
        } else {
            // Upcoming
            upcomingVaccines.push(vaccine);
        }
    });

    return {
        ageInWeeks,
        ageInMonths: calculateAgeInMonths(dateOfBirth),
        dueVaccines,
        overdueVaccines,
        upcomingVaccines,
        completedVaccines,
        totalVaccines: VACCINATION_SCHEDULE.length,
    };
}

/**
 * Format age in weeks to human-readable string
 */
export function formatAge(ageInWeeks, dateOfBirth = null) {
    if (dateOfBirth) {
        const months = calculateAgeInMonths(dateOfBirth);
        if (months === 0) {
            return `${ageInWeeks} week${ageInWeeks !== 1 ? 's' : ''}`;
        }
        if (months < 12) {
            return `${months} month${months !== 1 ? 's' : ''}`;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths > 0) {
            return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        }
        return `${years} year${years !== 1 ? 's' : ''}`;
    }

    // Fallback to week-based if no DOB provided
    if (ageInWeeks < 4) {
        return `${ageInWeeks} week${ageInWeeks !== 1 ? 's' : ''}`;
    } else if (ageInWeeks < 52) {
        const months = Math.floor(ageInWeeks / 4.33);
        return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
        const years = Math.floor(ageInWeeks / 52);
        const remainingMonths = Math.floor((ageInWeeks % 52) / 4.33);
        if (remainingMonths > 0) {
            return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        }
        return `${years} year${years !== 1 ? 's' : ''}`;
    }
}

export default {
    VACCINATION_SCHEDULE,
    calculateAgeInWeeks,
    getVaccinationStatus,
    formatAge,
};
