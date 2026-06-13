/**
 * Feeding & Nutrition Tracker Constants
 * Supports breastfeeding, bottle feeding, and solid food logging
 */

export const FEEDING_TYPES = [
    { id: 'breast', label: 'Breastfeed', icon: 'child-care', color: '#E91E63' },
    { id: 'bottle', label: 'Liquids', icon: 'local-drink', color: '#2196F3' },
    { id: 'solid', label: 'Solid Food', icon: 'restaurant', color: '#4CAF50' },
];

export const BREAST_SIDES = [
    { id: 'left', label: 'Left' },
    { id: 'right', label: 'Right' },
    { id: 'both', label: 'Both' },
];

export const FOOD_CATEGORIES = [
    { id: 'grains', label: 'Grains, roots, tubers', icon: '🌾', examples: 'Rice, Potato, Cassava, Oats, Wheat' },
    { id: 'legumes', label: 'Legumes and nuts', icon: '🥜', examples: 'Beans, Peas, Lentils, Groundnuts, Cashews' },
    { id: 'dairy', label: 'Dairy products', icon: '🥛', examples: 'Yogurt, Cheese, Breast milk, Cow milk' },
    { id: 'flesh', label: 'Flesh foods', icon: '🍗', examples: 'Chicken, Fish, Beef, Mutton, Liver' },
    { id: 'eggs', label: 'Eggs', icon: '🥚', examples: 'Boiled egg, Scrambled egg' },
    { id: 'vitaminA', label: 'Vitamin A-rich fruits/veggies', icon: '🥕', examples: 'Carrots, Pumpkin, Sweet potato (orange), Mango, Papaya' },
    { id: 'other_fruits_veggies', label: 'Other fruits/vegetables', icon: '🍏', examples: 'Banana, Apple, Cabbage, Avocado, Spinach' },
];

export const COMMON_ALLERGENS = [
    'Milk', 'Eggs', 'Peanuts', 'Tree Nuts', 'Wheat',
    'Soy', 'Fish', 'Shellfish', 'Sesame',
];

export const BOTTLE_VOLUMES = [
    30, 60, 90, 120, 150, 180, 210, 240,
];

export const DURATION_OPTIONS = [
    5, 10, 15, 20, 25, 30, 35, 40, 45,
];

export const FEEDING_FREQUENCIES = [
    { id: '1hr', label: '1 hrly' },
    { id: '2hr', label: '2 hrly' },
    { id: '3hr', label: '3 hrly' },
    { id: '4hr', label: '4 hrly' },
    { id: 'demand', label: 'On Demand' },
];
