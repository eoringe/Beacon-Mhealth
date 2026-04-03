/**
 * Feeding recommendations based on Kenya MOH & WHO Guidelines
 */

export const FEEDING_GUIDELINES = [
    {
        id: '0-6m',
        age: '0-6 Months',
        title: 'Exclusive Breastfeeding',
        icon: 'child-care',
        color: '#E91E63',
        tips: [
            'Initiate breastfeeding within 1 hour of birth.',
            'Give ONLY breastmilk—no water, glucose, or other milks.',
            'Breastfeed on demand, both day and night (8-12 times a day).',
            'Ensure proper positioning and attachment for effective feeding.',
            'Empty one breast before offering the next to ensure your baby gets the fatty hindmilk.'
        ]
    },
    {
        id: '6m',
        age: '6 Months',
        title: 'Starting Solids',
        icon: 'restaurant',
        color: '#FF9800',
        tips: [
            'Introduce complementary foods while continuing to breastfeed on demand.',
            'Start with small amounts: 2-3 spoonfuls of thick porridge or pureed fruits/vegetables.',
            'Foods should be well-mashed, smooth, and easy for the baby to swallow.',
            'Introduce one new food at a time to check for any allergies.',
            'Iron-fortified cereals, mashed avocado, or pumpkin are excellent starters.'
        ]
    },
    {
        id: '6-9m',
        age: '6-9 Months',
        title: 'Exploring Textures',
        icon: 'egg',
        color: '#2196F3',
        tips: [
            'Feed 2 to 3 times a day, plus 1-2 nutritious snacks.',
            'Gradually increase food consistency from pureed to mashed or finely chopped.',
            'Include a variety of foods: grains, vegetables, fruits, and proteins (eggs, pulses).',
            'Offer water in a cup after meals to help with digestion.',
            'Encourage responsive feeding—talk to your baby and follow their hunger cues.'
        ]
    },
    {
        id: '9-12m',
        age: '9-12 Months',
        title: 'Variety & Finger Foods',
        icon: 'bakery-dining',
        color: '#4CAF50',
        tips: [
            'Feed 3 to 4 times a day, plus 1-2 snacks.',
            'Give finely chopped or mashed foods, and foods that the baby can pick up (finger foods).',
            'Increase the variety of proteins: finely minced meat, fish, or chicken.',
            'Do not add salt or sugar to the baby\'s food.',
            'Encourage the baby to start using a spoon and drinking from a cup.'
        ]
    },
    {
        id: '12-24m',
        age: '12-24 Months',
        title: 'Family Meals',
        icon: 'flatware',
        color: '#FF5722',
        tips: [
            'Continue breastfeeding for up to 2 years or beyond.',
            'Feed 3 to 4 times a day with 1-2 nutritious snacks between meals.',
            'The child can now eat most foods the rest of the family eats, chopped if necessary.',
            'Ensure a diverse diet including vitamin A-rich fruits/veg and animal-source foods.',
            'Avoid sugary drinks, sweets, or caffeinated beverages (tea/coffee).'
        ]
    }
];

export const GENERAL_TIPS = [
    {
        title: 'Hygiene First',
        text: 'Always wash your hands with soap and water before preparing food or feeding your child.'
    },
    {
        title: 'Responsive Feeding',
        text: 'Feed slowly and patiently, encourage your child but do not force them to eat.'
    },
    {
        title: 'Clean Utensils',
        text: 'Use clean cups, spoons, and bowls. Avoid using feeding bottles as they are difficult to keep clean.'
    }
];

export const SOURCE_INFO = 'Based on Kenya Ministry of Health MIYCN Guidelines & WHO Infant and Young Child Feeding recommendations.';
