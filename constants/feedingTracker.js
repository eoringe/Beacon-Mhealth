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
    { id: 'fruits', label: 'Fruits', icon: '🍎', examples: 'Banana, Avocado, Mango, Apple' },
    { id: 'vegetables', label: 'Vegetables', icon: '🥕', examples: 'Sweet potato, Peas, Carrots, Spinach' },
    { id: 'grains', label: 'Grains', icon: '🌾', examples: 'Rice cereal, Oatmeal, Bread, Pasta' },
    { id: 'protein', label: 'Protein', icon: '🍗', examples: 'Chicken, Fish, Eggs, Beans' },
    { id: 'dairy', label: 'Dairy', icon: '🧀', examples: 'Yogurt, Cheese, Milk' },
    { id: 'other', label: 'Other', icon: '🍽️', examples: 'Mixed meals, Snacks' },
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
