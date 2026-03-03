/**
 * Primary (Baby) Teeth Data
 * 20 primary teeth with eruption ages and positions
 */

export const PRIMARY_TEETH = [
    // Upper teeth (right to left when facing)
    { id: 'UR_M2', name: 'Upper Right 2nd Molar', position: 'upper', side: 'right', type: 'molar', eruptionMonths: '23-33', order: 1 },
    { id: 'UR_M1', name: 'Upper Right 1st Molar', position: 'upper', side: 'right', type: 'molar', eruptionMonths: '13-19', order: 2 },
    { id: 'UR_C', name: 'Upper Right Canine', position: 'upper', side: 'right', type: 'canine', eruptionMonths: '16-22', order: 3 },
    { id: 'UR_LI', name: 'Upper Right Central Incisor', position: 'upper', side: 'right', type: 'incisor', eruptionMonths: '9-13', order: 4 },
    { id: 'UR_CI', name: 'Upper Right Lateral Incisor', position: 'upper', side: 'right', type: 'incisor', eruptionMonths: '8-12', order: 5 },
    { id: 'UL_CI', name: 'Upper Left Central Incisor', position: 'upper', side: 'left', type: 'incisor', eruptionMonths: '8-12', order: 6 },
    { id: 'UL_LI', name: 'Upper Left Lateral Incisor', position: 'upper', side: 'left', type: 'incisor', eruptionMonths: '9-13', order: 7 },
    { id: 'UL_C', name: 'Upper Left 1st Molar', position: 'upper', side: 'left', type: 'canine', eruptionMonths: '16-22', order: 8 },
    { id: 'UL_M1', name: 'Upper Left Canine', position: 'upper', side: 'left', type: 'molar', eruptionMonths: '13-19', order: 9 },
    { id: 'UL_M2', name: 'Upper Left 2nd Molar', position: 'upper', side: 'left', type: 'molar', eruptionMonths: '23-33', order: 10 },
    // Lower teeth (right to left when facing)
    { id: 'LR_M2', name: 'Lower Right 2nd Molar', position: 'lower', side: 'right', type: 'molar', eruptionMonths: '23-31', order: 11 },
    { id: 'LR_M1', name: 'Lower Right 1st Molar', position: 'lower', side: 'right', type: 'molar', eruptionMonths: '14-18', order: 12 },
    { id: 'LR_C', name: 'Lower Right Canine', position: 'lower', side: 'right', type: 'canine', eruptionMonths: '17-23', order: 13 },
    { id: 'LR_LI', name: 'Lower Right Central Incisor', position: 'lower', side: 'right', type: 'incisor', eruptionMonths: '10-16', order: 14 },
    { id: 'LR_CI', name: 'Lower Right Lateral Incisor', position: 'lower', side: 'right', type: 'incisor', eruptionMonths: '6-10', order: 15 },
    { id: 'LL_CI', name: 'Lower Left Central Incisor', position: 'lower', side: 'left', type: 'incisor', eruptionMonths: '6-10', order: 16 },
    { id: 'LL_LI', name: 'Lower Left Lateral Incisor', position: 'lower', side: 'left', type: 'incisor', eruptionMonths: '10-16', order: 17 },
    { id: 'LL_C', name: 'Lower Left 1st Molar', position: 'lower', side: 'left', type: 'canine', eruptionMonths: '17-23', order: 18 },
    { id: 'LL_M1', name: 'Lower Left Canine', position: 'lower', side: 'left', type: 'molar', eruptionMonths: '14-18', order: 19 },
    { id: 'LL_M2', name: 'Lower Left 2nd Molar', position: 'lower', side: 'left', type: 'molar', eruptionMonths: '23-31', order: 20 },
];

export const TOOTH_ICONS = {
    incisor: '🦷',
    canine: '🦷',
    molar: '🦷',
};

export const getTeethByPosition = (position) => PRIMARY_TEETH.filter(t => t.position === position);
