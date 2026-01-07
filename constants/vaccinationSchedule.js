/**
 * Kenya Ministry of Health Vaccination Schedule
 * Based on the Kenya Expanded Programme on Immunization (KEPI)
 * Source: health.go.ke
 * 
 * This schedule is used to:
 * 1. Show parents which vaccines their child is due for
 * 2. Track vaccination completion
 * 3. Send notification reminders
 */

export const VACCINATION_SCHEDULE = [
    // At Birth
    {
        id: 'bcg',
        name: 'BCG',
        fullName: 'Bacille Calmette-Guerin',
        diseases: ['Tuberculosis'],
        ageWeeks: 0,
        ageLabel: 'At Birth',
        dose: 1,
        totalDoses: 1,
        administrationMethod: 'Intradermal injection (left forearm)',
    },
    {
        id: 'opv_0',
        name: 'OPV (Birth)',
        fullName: 'Oral Polio Vaccine - Dose 0',
        diseases: ['Poliomyelitis'],
        ageWeeks: 0,
        ageLabel: 'At Birth',
        dose: 0,
        totalDoses: 4,
        administrationMethod: 'Oral (2 drops)',
    },
    {
        id: 'hepb_birth',
        name: 'Hepatitis B (Birth)',
        fullName: 'Hepatitis B Vaccine',
        diseases: ['Hepatitis B'],
        ageWeeks: 0,
        ageLabel: 'At Birth',
        dose: 1,
        totalDoses: 1,
        administrationMethod: 'Intramuscular injection',
    },

    // At 6 Weeks
    {
        id: 'opv_1',
        name: 'OPV 1',
        fullName: 'Oral Polio Vaccine - Dose 1',
        diseases: ['Poliomyelitis'],
        ageWeeks: 6,
        ageLabel: '6 Weeks',
        dose: 1,
        totalDoses: 4,
        administrationMethod: 'Oral (2 drops)',
    },
    {
        id: 'penta_1',
        name: 'Pentavalent 1',
        fullName: 'DTP-HepB-Hib Vaccine - Dose 1',
        diseases: ['Diphtheria', 'Pertussis', 'Tetanus', 'Hepatitis B', 'Haemophilus influenzae'],
        ageWeeks: 6,
        ageLabel: '6 Weeks',
        dose: 1,
        totalDoses: 3,
        administrationMethod: 'Intramuscular injection (left thigh)',
    },
    {
        id: 'pcv_1',
        name: 'PCV 1',
        fullName: 'Pneumococcal Conjugate Vaccine - Dose 1',
        diseases: ['Pneumonia', 'Meningitis'],
        ageWeeks: 6,
        ageLabel: '6 Weeks',
        dose: 1,
        totalDoses: 3,
        administrationMethod: 'Intramuscular injection (right thigh)',
    },
    {
        id: 'rota_1',
        name: 'Rotavirus 1',
        fullName: 'Rotavirus Vaccine - Dose 1',
        diseases: ['Severe diarrhea'],
        ageWeeks: 6,
        ageLabel: '6 Weeks',
        dose: 1,
        totalDoses: 3,
        administrationMethod: 'Oral (1.5ml)',
    },

    // At 10 Weeks
    {
        id: 'opv_2',
        name: 'OPV 2',
        fullName: 'Oral Polio Vaccine - Dose 2',
        diseases: ['Poliomyelitis'],
        ageWeeks: 10,
        ageLabel: '10 Weeks',
        dose: 2,
        totalDoses: 4,
        administrationMethod: 'Oral (2 drops)',
    },
    {
        id: 'penta_2',
        name: 'Pentavalent 2',
        fullName: 'DTP-HepB-Hib Vaccine - Dose 2',
        diseases: ['Diphtheria', 'Pertussis', 'Tetanus', 'Hepatitis B', 'Haemophilus influenzae'],
        ageWeeks: 10,
        ageLabel: '10 Weeks',
        dose: 2,
        totalDoses: 3,
        administrationMethod: 'Intramuscular injection (left thigh)',
    },
    {
        id: 'pcv_2',
        name: 'PCV 2',
        fullName: 'Pneumococcal Conjugate Vaccine - Dose 2',
        diseases: ['Pneumonia', 'Meningitis'],
        ageWeeks: 10,
        ageLabel: '10 Weeks',
        dose: 2,
        totalDoses: 3,
        administrationMethod: 'Intramuscular injection (right thigh)',
    },
    {
        id: 'rota_2',
        name: 'Rotavirus 2',
        fullName: 'Rotavirus Vaccine - Dose 2',
        diseases: ['Severe diarrhea'],
        ageWeeks: 10,
        ageLabel: '10 Weeks',
        dose: 2,
        totalDoses: 3,
        administrationMethod: 'Oral (1.5ml)',
    },

    // At 14 Weeks
    {
        id: 'opv_3',
        name: 'OPV 3',
        fullName: 'Oral Polio Vaccine - Dose 3',
        diseases: ['Poliomyelitis'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        dose: 3,
        totalDoses: 4,
        administrationMethod: 'Oral (2 drops)',
    },
    {
        id: 'penta_3',
        name: 'Pentavalent 3',
        fullName: 'DTP-HepB-Hib Vaccine - Dose 3',
        diseases: ['Diphtheria', 'Pertussis', 'Tetanus', 'Hepatitis B', 'Haemophilus influenzae'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        dose: 3,
        totalDoses: 3,
        administrationMethod: 'Intramuscular injection (left thigh)',
    },
    {
        id: 'pcv_3',
        name: 'PCV 3',
        fullName: 'Pneumococcal Conjugate Vaccine - Dose 3',
        diseases: ['Pneumonia', 'Meningitis'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        dose: 3,
        totalDoses: 3,
        administrationMethod: 'Intramuscular injection (right thigh)',
    },
    {
        id: 'ipv_1',
        name: 'IPV 1',
        fullName: 'Inactivated Polio Vaccine - Dose 1',
        diseases: ['Poliomyelitis'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        dose: 1,
        totalDoses: 1,
        administrationMethod: 'Intramuscular injection',
    },
    {
        id: 'rota_3',
        name: 'Rotavirus 3',
        fullName: 'Rotavirus Vaccine - Dose 3',
        diseases: ['Severe diarrhea'],
        ageWeeks: 14,
        ageLabel: '14 Weeks',
        dose: 3,
        totalDoses: 3,
        administrationMethod: 'Oral (1.5ml)',
    },

    // At 9 Months (39 weeks)
    {
        id: 'mr_1',
        name: 'Measles-Rubella 1',
        fullName: 'Measles-Rubella Vaccine - Dose 1',
        diseases: ['Measles', 'Rubella'],
        ageWeeks: 39,
        ageLabel: '9 Months',
        dose: 1,
        totalDoses: 2,
        administrationMethod: 'Subcutaneous injection (right upper arm)',
    },
    {
        id: 'yf',
        name: 'Yellow Fever',
        fullName: 'Yellow Fever Vaccine',
        diseases: ['Yellow Fever'],
        ageWeeks: 39,
        ageLabel: '9 Months',
        dose: 1,
        totalDoses: 1,
        administrationMethod: 'Subcutaneous injection',
        note: 'For endemic areas',
    },

    // At 18 Months (78 weeks)
    {
        id: 'mr_2',
        name: 'Measles-Rubella 2',
        fullName: 'Measles-Rubella Vaccine - Dose 2',
        diseases: ['Measles', 'Rubella'],
        ageWeeks: 78,
        ageLabel: '18 Months',
        dose: 2,
        totalDoses: 2,
        administrationMethod: 'Subcutaneous injection (right upper arm)',
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
 * @returns {Object} Object with dueVaccines, upcomingVaccines, and completedVaccines
 */
export function getVaccinationStatus(dateOfBirth, completedVaccineIds = []) {
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
export function formatAge(ageInWeeks) {
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
