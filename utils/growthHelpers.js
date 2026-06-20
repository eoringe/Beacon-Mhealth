import { WHO_STANDARDS } from '../constants/whoGrowthStandards';

/**
 * Calculates the valid validation range (min/max) for a child based on age in months and gender.
 * Returns a boundary range derived from WHO Z-score standards.
 */
export function getGrowthRange(gender, metricType, ageMonths) {
    const genderKey = gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'girl' ? 'girls' : 'boys';
    const typeKey = metricType === 'head' || metricType === 'headCircumference' ? 'head_circumference' : metricType;
    const standardData = WHO_STANDARDS[genderKey][typeKey];
    if (!standardData || standardData.length === 0) return null;

    // Find bounding checkpoints
    let lowerPoint = standardData[0];
    let upperPoint = standardData[standardData.length - 1];

    if (ageMonths <= lowerPoint.month) {
        const z3 = lowerPoint.p97 + (lowerPoint.p97 - lowerPoint.p85);
        const z_3 = lowerPoint.p3 - (lowerPoint.p15 - lowerPoint.p3);
        return { 
            min: Math.max(1.0, parseFloat((z_3 * 0.75).toFixed(1))), 
            max: parseFloat((z3 * 1.25).toFixed(1)) 
        };
    }
    if (ageMonths >= upperPoint.month) {
        const z3 = upperPoint.p97 + (upperPoint.p97 - upperPoint.p85);
        const z_3 = upperPoint.p3 - (upperPoint.p15 - upperPoint.p3);
        return { 
            min: Math.max(1.0, parseFloat((z_3 * 0.75).toFixed(1))), 
            max: parseFloat((z3 * 1.25).toFixed(1)) 
        };
    }

    for (let i = 0; i < standardData.length - 1; i++) {
        if (ageMonths >= standardData[i].month && ageMonths <= standardData[i+1].month) {
            lowerPoint = standardData[i];
            upperPoint = standardData[i+1];
            break;
        }
    }

    const interpolate = (prop) => {
        const x0 = lowerPoint.month;
        const x1 = upperPoint.month;
        let val0 = lowerPoint[prop];
        let val1 = upperPoint[prop];

        if (prop === 'z3') {
            val0 = lowerPoint.p97 + (lowerPoint.p97 - lowerPoint.p85);
            val1 = upperPoint.p97 + (upperPoint.p97 - upperPoint.p85);
        } else if (prop === 'z_3') {
            val0 = lowerPoint.p3 - (lowerPoint.p15 - lowerPoint.p3);
            val1 = upperPoint.p3 - (upperPoint.p15 - upperPoint.p3);
        }

        if (x1 === x0) return val0;
        return val0 + ((ageMonths - x0) / (x1 - x0)) * (val1 - val0);
    };

    const minZ3 = interpolate('z_3');
    const maxZ3 = interpolate('z3');

    // Return wide limits for validation: 75% of Z-3 to 125% of Z3
    return {
        min: Math.max(1.0, parseFloat((minZ3 * 0.75).toFixed(1))),
        max: parseFloat((maxZ3 * 1.25).toFixed(1))
    };
}

/**
 * Interprets a child's measurement (value) relative to standard Z-scores at their current age.
 */
export function getGrowthInterpretation(gender, metricType, ageMonths, value) {
    if (value === null || value === undefined || isNaN(value)) return null;

    const genderKey = gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'girl' ? 'girls' : 'boys';
    const typeKey = metricType === 'head' || metricType === 'headCircumference' ? 'head_circumference' : metricType;
    const standardData = WHO_STANDARDS[genderKey][typeKey];
    if (!standardData || standardData.length === 0) return null;

    // Find bounding checkpoints
    let lowerPoint = standardData[0];
    let upperPoint = standardData[standardData.length - 1];

    if (ageMonths <= lowerPoint.month) {
        lowerPoint = standardData[0];
        upperPoint = standardData[0];
    } else if (ageMonths >= upperPoint.month) {
        lowerPoint = standardData[standardData.length - 1];
        upperPoint = standardData[standardData.length - 1];
    } else {
        for (let i = 0; i < standardData.length - 1; i++) {
            if (ageMonths >= standardData[i].month && ageMonths <= standardData[i+1].month) {
                lowerPoint = standardData[i];
                upperPoint = standardData[i+1];
                break;
            }
        }
    }

    const interpolate = (prop) => {
        const x0 = lowerPoint.month;
        const x1 = upperPoint.month;
        let val0 = lowerPoint[prop];
        let val1 = upperPoint[prop];

        if (prop === 'z3') {
            val0 = lowerPoint.p97 + (lowerPoint.p97 - lowerPoint.p85);
            val1 = upperPoint.p97 + (upperPoint.p97 - upperPoint.p85);
        } else if (prop === 'z_3') {
            val0 = lowerPoint.p3 - (lowerPoint.p15 - lowerPoint.p3);
            val1 = upperPoint.p3 - (upperPoint.p15 - upperPoint.p3);
        }

        if (x1 === x0) return val0;
        return val0 + ((ageMonths - x0) / (x1 - x0)) * (val1 - val0);
    };

    const z3 = interpolate('z3');
    const z2 = interpolate('p97');
    const z1 = interpolate('p85');
    const z_1 = interpolate('p15');
    const z_2 = interpolate('p3');
    const z_3 = interpolate('z_3');

    let status = '';
    let description = '';
    let color = '';
    let lightBg = '';

    const labelMap = {
        height: { name: 'Height', unit: 'cm' },
        weight: { name: 'Weight', unit: 'kg' },
        head: { name: 'Head Circumference', unit: 'cm' },
        headCircumference: { name: 'Head Circumference', unit: 'cm' }
    };
    const metricName = labelMap[metricType]?.name || 'Growth';

    if (value >= z3) {
        status = 'Severe (>+3 Z-score)';
        description = `Your child's ${metricName.toLowerCase()} is severely above the median. Please consult a pediatrician for clinical advice.`;
        color = '#EF4444'; // Red
        lightBg = '#FEE2E2';
    } else if (value < z_3) {
        status = 'Severe (<-3 Z-score)';
        description = `Your child's ${metricName.toLowerCase()} is severely below the median. Please consult a pediatrician for clinical advice.`;
        color = '#EF4444'; // Red
        lightBg = '#FEE2E2';
    } else if (value >= z2) {
        status = 'Moderate (+2 to +3 Z-score)';
        description = `Your child's ${metricName.toLowerCase()} is moderately above the median. It is recommended to monitor closely.`;
        color = '#F59E0B'; // Yellow/Amber
        lightBg = '#FEF3C7';
    } else if (value < z_2) {
        status = 'Moderate (-3 to -2 Z-score)';
        description = `Your child's ${metricName.toLowerCase()} is moderately below the median. It is recommended to monitor closely and consult a clinician.`;
        color = '#F59E0B'; // Yellow/Amber
        lightBg = '#FEF3C7';
    } else if (value >= z1) {
        status = 'Mild (+1 to +2 Z-score)';
        description = `Your child's ${metricName.toLowerCase()} is mildly above the median.`;
        color = '#10B981'; // Green
        lightBg = '#D1FAE5';
    } else if (value < z_1) {
        status = 'Mild (-2 to -1 Z-score)';
        description = `Your child's ${metricName.toLowerCase()} is mildly below the median.`;
        color = '#10B981'; // Green
        lightBg = '#D1FAE5';
    } else {
        status = 'Normal (Median)';
        description = `Your child's ${metricName.toLowerCase()} is in the normal, healthy range around the median.`;
        color = '#10B981'; // Green
        lightBg = '#D1FAE5';
    }

    return { status, description, color, lightBg };
}
