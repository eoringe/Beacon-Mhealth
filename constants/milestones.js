/**
 * WHO Developmental Milestones
 * Based on World Health Organization child development standards
 * Domains: Motor (Gross & Fine), Language, Cognitive, Social-Emotional
 * Ages: 0-60 months (5 years)
 */

export const MILESTONE_AGES = [
  { label: 'Birth', value: 0, range: '0-1 month' },
  { label: '2 months', value: 2, range: '1-3 months' },
  { label: '4 months', value: 4, range: '3-5 months' },
  { label: '6 months', value: 6, range: '5-7 months' },
  { label: '9 months', value: 9, range: '8-10 months' },
  { label: '12 months', value: 12, range: '11-13 months' },
  { label: '18 months', value: 18, range: '15-20 months' },
  { label: '2 years', value: 24, range: '21-27 months' },
  { label: '3 years', value: 36, range: '30-42 months' },
  { label: '4 years', value: 48, range: '42-54 months' },
  { label: '5 years', value: 60, range: '54-66 months' },
];

export const MILESTONE_CATEGORIES = [
  {
    id: 'grossMotor',
    title: 'Gross Motor',
    icon: 'directions-run',
    description: 'Large muscle movements like crawling, walking, jumping',
    color: '#4CAF50'
  },
  {
    id: 'fineMotor',
    title: 'Fine Motor',
    icon: 'pan-tool',
    description: 'Small muscle movements like grasping, drawing, writing',
    color: '#2196F3'
  },
  {
    id: 'language',
    title: 'Language & Communication',
    icon: 'record-voice-over',
    description: 'Speaking, understanding words, and communication',
    color: '#FF9800'
  },
  {
    id: 'cognitive',
    title: 'Cognitive',
    icon: 'psychology',
    description: 'Thinking, learning, problem-solving, and memory',
    color: '#9C27B0'
  },
  {
    id: 'socialEmotional',
    title: 'Social & Emotional',
    icon: 'people',
    description: 'Relationships, emotions, and social interactions',
    color: '#E91E63'
  },
];

export const WHO_MILESTONES = {
  0: {
    ageLabel: 'Birth (0-1 month)',
    grossMotor: [
      { milestone: 'Lifts head briefly when on tummy', key: true },
      { milestone: 'Moves arms and legs equally', key: true },
      { milestone: 'Reflexive grasping when palm touched', key: false },
      { milestone: 'Turns head from side to side', key: false },
    ],
    fineMotor: [
      { milestone: 'Hands mostly fisted', key: true },
      { milestone: 'Reflexive grasp of objects placed in hand', key: false },
      { milestone: 'Brings hands toward face', key: false },
    ],
    language: [
      { milestone: 'Cries to communicate needs', key: true },
      { milestone: 'Startles to loud sounds', key: true },
      { milestone: 'Quiets when spoken to softly', key: false },
      { milestone: 'Recognizes caregiver voice', key: false },
    ],
    cognitive: [
      { milestone: 'Focuses on faces 8-12 inches away', key: true },
      { milestone: 'Follows moving objects briefly', key: false },
      { milestone: 'Prefers human faces to objects', key: false },
      { milestone: 'Shows early signs of memory', key: false },
    ],
    socialEmotional: [
      { milestone: 'Shows preference for human faces', key: true },
      { milestone: 'Calms when held and comforted', key: true },
      { milestone: 'Begins to develop attachment to caregiver', key: false },
      { milestone: 'May smile briefly', key: false },
    ],
  },
  2: {
    ageLabel: '2 months',
    grossMotor: [
      { milestone: 'Lifts head 45° when on tummy', key: true },
      { milestone: 'Holds head steady when supported', key: true },
      { milestone: 'Kicks both legs and moves arms', key: false },
      { milestone: 'Pushes up on forearms when on tummy', key: false },
    ],
    fineMotor: [
      { milestone: 'Opens and closes hands', key: true },
      { milestone: 'Brings hands to mouth', key: true },
      { milestone: 'Holds a rattle briefly', key: false },
      { milestone: 'Swipes at dangling objects', key: false },
    ],
    language: [
      { milestone: 'Coos and gurgles', key: true },
      { milestone: 'Makes vowel sounds (ah, oh)', key: true },
      { milestone: 'Turns head toward sounds', key: false },
      { milestone: 'Smiles in response to voice', key: false },
    ],
    cognitive: [
      { milestone: 'Follows moving objects with eyes', key: true },
      { milestone: 'Recognizes familiar people at distance', key: true },
      { milestone: 'Begins to act bored if activity unchanged', key: false },
      { milestone: 'Pays attention to faces', key: false },
    ],
    socialEmotional: [
      { milestone: 'Begins social smile', key: true },
      { milestone: 'Enjoys playing with people', key: true },
      { milestone: 'May cry when play stops', key: false },
      { milestone: 'Shows excitement when interacting', key: false },
    ],
  },
  4: {
    ageLabel: '4 months',
    grossMotor: [
      { milestone: 'Holds head steady without support', key: true },
      { milestone: 'Pushes up on elbows when on tummy', key: true },
      { milestone: 'May roll from tummy to back', key: false },
      { milestone: 'Supports weight on legs when held standing', key: false },
    ],
    fineMotor: [
      { milestone: 'Reaches for toys with one hand', key: true },
      { milestone: 'Grasps and shakes toys', key: true },
      { milestone: 'Brings hands together', key: false },
      { milestone: 'Follows objects with eyes in all directions', key: false },
    ],
    language: [
      { milestone: 'Babbles with expression', key: true },
      { milestone: 'Copies sounds heard', key: true },
      { milestone: 'Laughs out loud', key: false },
      { milestone: 'Cries differently for different needs', key: false },
    ],
    cognitive: [
      { milestone: 'Lets you know if happy or sad', key: true },
      { milestone: 'Responds to affection', key: true },
      { milestone: 'Uses hands and eyes together', key: false },
      { milestone: 'Watches faces intently', key: false },
    ],
    socialEmotional: [
      { milestone: 'Smiles spontaneously at people', key: true },
      { milestone: 'Likes to play with people', key: true },
      { milestone: 'Copies facial expressions', key: false },
      { milestone: 'Enjoys playing peek-a-boo', key: false },
    ],
  },
  6: {
    ageLabel: '6 months',
    grossMotor: [
      { milestone: 'Sits with support', key: true },
      { milestone: 'Rolls in both directions', key: true },
      { milestone: 'Rocks back and forth on hands and knees', key: false },
      { milestone: 'May begin to crawl', key: false },
      { milestone: 'Supports weight on legs when held', key: false },
    ],
    fineMotor: [
      { milestone: 'Passes objects from hand to hand', key: true },
      { milestone: 'Uses raking grasp', key: true },
      { milestone: 'Holds bottle', key: false },
      { milestone: 'Explores objects with mouth', key: false },
    ],
    language: [
      { milestone: 'Babbles chains of consonants (mama, dada)', key: true },
      { milestone: 'Responds to own name', key: true },
      { milestone: 'Makes sounds when happy or upset', key: false },
      { milestone: 'Responds to sounds with sounds', key: false },
    ],
    cognitive: [
      { milestone: 'Looks for dropped objects', key: true },
      { milestone: 'Brings things to mouth to explore', key: true },
      { milestone: 'Shows curiosity about things', key: false },
      { milestone: 'Tries to reach objects out of reach', key: false },
    ],
    socialEmotional: [
      { milestone: 'Recognizes familiar faces', key: true },
      { milestone: 'May show stranger anxiety', key: true },
      { milestone: 'Likes to look at self in mirror', key: false },
      { milestone: 'Responds to others emotions', key: false },
    ],
  },
  9: {
    ageLabel: '9 months',
    grossMotor: [
      { milestone: 'Sits without support', key: true },
      { milestone: 'Crawls on hands and knees', key: true },
      { milestone: 'Pulls to stand', key: true },
      { milestone: 'May cruise along furniture', key: false },
    ],
    fineMotor: [
      { milestone: 'Uses pincer grasp (thumb and finger)', key: true },
      { milestone: 'Picks up small objects', key: true },
      { milestone: 'Points with index finger', key: false },
      { milestone: 'Drops objects on purpose', key: false },
    ],
    language: [
      { milestone: 'Understands "no"', key: true },
      { milestone: 'Makes many different sounds', key: true },
      { milestone: 'Copies sounds and gestures', key: false },
      { milestone: 'Uses fingers to point at things', key: false },
    ],
    cognitive: [
      { milestone: 'Watches path of falling objects', key: true },
      { milestone: 'Looks for hidden objects', key: true },
      { milestone: 'Plays peek-a-boo', key: false },
      { milestone: 'Explores objects in different ways', key: false },
    ],
    socialEmotional: [
      { milestone: 'May be clingy with familiar adults', key: true },
      { milestone: 'Has favorite toys', key: true },
      { milestone: 'Understands "no"', key: false },
      { milestone: 'Shows fear with strangers', key: false },
    ],
  },
  12: {
    ageLabel: '12 months (1 year)',
    grossMotor: [
      { milestone: 'Pulls to stand and walks holding furniture', key: true },
      { milestone: 'May stand alone', key: true },
      { milestone: 'May take first steps', key: true },
      { milestone: 'Sits down from standing position', key: false },
    ],
    fineMotor: [
      { milestone: 'Picks up small objects with pincer grasp', key: true },
      { milestone: 'Bangs two objects together', key: true },
      { milestone: 'Puts objects in container', key: false },
      { milestone: 'Releases objects deliberately', key: false },
    ],
    language: [
      { milestone: 'Says 1-3 words (mama, dada, plus one)', key: true },
      { milestone: 'Uses gestures (waves bye, shakes head no)', key: true },
      { milestone: 'Tries to copy words', key: false },
      { milestone: 'Uses simple gestures like shaking head', key: false },
    ],
    cognitive: [
      { milestone: 'Finds hidden objects easily', key: true },
      { milestone: 'Follows simple directions', key: true },
      { milestone: 'Explores objects in many ways', key: false },
      { milestone: 'Copies gestures', key: false },
    ],
    socialEmotional: [
      { milestone: 'Shows fear in some situations', key: true },
      { milestone: 'Hands you a book to read', key: true },
      { milestone: 'Repeats actions that get attention', key: false },
      { milestone: 'Cries when parent leaves', key: false },
    ],
  },
  18: {
    ageLabel: '18 months',
    grossMotor: [
      { milestone: 'Walks alone', key: true },
      { milestone: 'May run stiffly', key: true },
      { milestone: 'Walks up stairs with help', key: false },
      { milestone: 'Pulls toys while walking', key: false },
      { milestone: 'Can help undress self', key: false },
    ],
    fineMotor: [
      { milestone: 'Stacks 2-4 blocks', key: true },
      { milestone: 'Scribbles spontaneously', key: true },
      { milestone: 'Turns pages of book (several at once)', key: false },
      { milestone: 'Drinks from cup', key: false },
    ],
    language: [
      { milestone: 'Says 10-25 words', key: true },
      { milestone: 'Points to show wants', key: true },
      { milestone: 'Points to one body part', key: false },
      { milestone: 'Says "no" and shakes head', key: false },
    ],
    cognitive: [
      { milestone: 'Knows what ordinary objects are for', key: true },
      { milestone: 'Points to get attention', key: true },
      { milestone: 'Shows interest in doll or stuffed animal', key: false },
      { milestone: 'Points to one body part when asked', key: false },
    ],
    socialEmotional: [
      { milestone: 'Plays simple pretend (feeding doll)', key: true },
      { milestone: 'May have tantrums', key: true },
      { milestone: 'Shows affection to familiar people', key: false },
      { milestone: 'Explores alone but with parent nearby', key: false },
    ],
  },
  24: {
    ageLabel: '2 years',
    grossMotor: [
      { milestone: 'Walks and runs well', key: true },
      { milestone: 'Kicks a ball', key: true },
      { milestone: 'Climbs on/off furniture without help', key: true },
      { milestone: 'Walks up and down stairs holding rail', key: false },
      { milestone: 'Jumps in place', key: false },
    ],
    fineMotor: [
      { milestone: 'Stacks 6+ blocks', key: true },
      { milestone: 'Makes vertical/horizontal strokes with crayon', key: true },
      { milestone: 'Turns pages one at a time', key: false },
      { milestone: 'Holds crayon correctly', key: false },
    ],
    language: [
      { milestone: 'Says 50+ words', key: true },
      { milestone: 'Uses 2-word phrases', key: true },
      { milestone: 'Points to things in a book when named', key: false },
      { milestone: 'Knows names of familiar people and body parts', key: false },
    ],
    cognitive: [
      { milestone: 'Finds hidden objects under multiple covers', key: true },
      { milestone: 'Begins to sort shapes and colors', key: true },
      { milestone: 'Completes sentences in familiar books', key: false },
      { milestone: 'Follows 2-step instructions', key: false },
    ],
    socialEmotional: [
      { milestone: 'Copies others, especially adults', key: true },
      { milestone: 'Gets excited when with other children', key: true },
      { milestone: 'Shows increasing independence', key: false },
      { milestone: 'Shows defiant behavior', key: false },
    ],
  },
  36: {
    ageLabel: '3 years',
    grossMotor: [
      { milestone: 'Climbs well', key: true },
      { milestone: 'Runs easily', key: true },
      { milestone: 'Pedals tricycle', key: true },
      { milestone: 'Walks up and down stairs, alternating feet', key: false },
      { milestone: 'Hops on one foot', key: false },
    ],
    fineMotor: [
      { milestone: 'Draws a circle', key: true },
      { milestone: 'Stacks 9+ blocks', key: true },
      { milestone: 'Turns book pages one at a time', key: false },
      { milestone: 'Uses scissors', key: false },
    ],
    language: [
      { milestone: 'Speaks in sentences of 4-5 words', key: true },
      { milestone: 'Strangers can understand most speech', key: true },
      { milestone: 'Answers simple questions', key: false },
      { milestone: 'Tells stories', key: false },
    ],
    cognitive: [
      { milestone: 'Completes puzzles with 3-4 pieces', key: true },
      { milestone: 'Understands "in", "on", "under"', key: true },
      { milestone: 'Knows own name, age, and gender', key: false },
      { milestone: 'Names most familiar things', key: false },
    ],
    socialEmotional: [
      { milestone: 'Shows concern for crying friend', key: true },
      { milestone: 'Takes turns in games', key: true },
      { milestone: 'Shows affection for friends without prompting', key: false },
      { milestone: 'Separates easily from parents', key: false },
    ],
  },
  48: {
    ageLabel: '4 years',
    grossMotor: [
      { milestone: 'Hops and stands on one foot up to 2 seconds', key: true },
      { milestone: 'Catches a bounced ball most of the time', key: true },
      { milestone: 'Moves forward and backward easily', key: false },
      { milestone: 'Throws ball overhand', key: false },
    ],
    fineMotor: [
      { milestone: 'Draws a person with 2-4 body parts', key: true },
      { milestone: 'Uses scissors', key: true },
      { milestone: 'Copies some capital letters', key: false },
      { milestone: 'Draws squares and circles', key: false },
    ],
    language: [
      { milestone: 'Tells stories', key: true },
      { milestone: 'Speaks in sentences of 5-6 words', key: true },
      { milestone: 'Uses future tense', key: false },
      { milestone: 'Says first and last name', key: false },
    ],
    cognitive: [
      { milestone: 'Names some colors and numbers', key: true },
      { milestone: 'Understands counting', key: true },
      { milestone: 'Starts to understand time', key: false },
      { milestone: 'Remembers parts of a story', key: false },
    ],
    socialEmotional: [
      { milestone: 'Would rather play with other children', key: true },
      { milestone: 'Cooperates with other children', key: true },
      { milestone: 'Often can\'t tell real from make-believe', key: false },
      { milestone: 'Talks about likes and interests', key: false },
    ],
  },
  60: {
    ageLabel: '5 years',
    grossMotor: [
      { milestone: 'Stands on one foot for 10+ seconds', key: true },
      { milestone: 'Hops and may skip', key: true },
      { milestone: 'Can somersault', key: false },
      { milestone: 'Uses toilet independently', key: false },
      { milestone: 'Swings and climbs', key: false },
    ],
    fineMotor: [
      { milestone: 'Draws a person with at least 6 body parts', key: true },
      { milestone: 'Prints some letters', key: true },
      { milestone: 'Copies a triangle and other shapes', key: false },
      { milestone: 'Uses fork and spoon', key: false },
    ],
    language: [
      { milestone: 'Speaks very clearly', key: true },
      { milestone: 'Tells a simple story with full sentences', key: true },
      { milestone: 'Uses future tense', key: false },
      { milestone: 'Says name and address', key: false },
    ],
    cognitive: [
      { milestone: 'Counts 10 or more objects', key: true },
      { milestone: 'Knows about everyday items (money, food)', key: true },
      { milestone: 'Draws a person with at least 6 body parts', key: false },
      { milestone: 'Prints some letters or numbers', key: false },
    ],
    socialEmotional: [
      { milestone: 'Wants to please friends', key: true },
      { milestone: 'Wants to be like friends', key: true },
      { milestone: 'More likely to agree to rules', key: false },
      { milestone: 'Aware of gender', key: false },
      { milestone: 'Can tell what\'s real and make-believe', key: false },
    ],
  },
};

/**
 * Get milestones for a specific age
 * Returns the closest age group milestones
 */
export const getMilestonesForAge = (ageInMonths) => {
  const ages = Object.keys(WHO_MILESTONES).map(Number).sort((a, b) => a - b);

  // Find the closest age group
  let closestAge = ages[0];
  for (const age of ages) {
    if (ageInMonths >= age) {
      closestAge = age;
    } else {
      break;
    }
  }

  return WHO_MILESTONES[closestAge];
};

/**
 * Get key milestones (most important ones) for an age
 */
export const getKeyMilestones = (ageInMonths) => {
  const milestones = getMilestonesForAge(ageInMonths);
  const keyMilestones = {};

  for (const category of Object.keys(milestones)) {
    if (category === 'ageLabel') continue;
    keyMilestones[category] = milestones[category].filter(m => m.key);
  }

  return keyMilestones;
};

/**
 * Calculate age in months from date of birth
 */
export const calculateAgeInMonths = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let months = (today.getFullYear() - dob.getFullYear()) * 12;
  months += today.getMonth() - dob.getMonth();

  if (today.getDate() < dob.getDate()) {
    months--;
  }

  return Math.max(0, months);
};

/**
 * Format age for display
 */
export const formatAgeMonths = (ageInMonths) => {
  if (ageInMonths < 1) return 'Newborn';
  if (ageInMonths === 1) return '1 month';
  if (ageInMonths < 12) return `${ageInMonths} months`;
  if (ageInMonths === 12) return '1 year';
  if (ageInMonths < 24) return `${ageInMonths} months`;

  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;

  if (months === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
};

// Keep legacy exports for backward compatibility
export const MILESTONE_DATA = Object.entries(WHO_MILESTONES).reduce((acc, [age, data]) => {
  acc[age] = {
    physical: [
      ...(data.grossMotor || []).map(m => m.milestone),
      ...(data.fineMotor || []).map(m => m.milestone),
    ],
    cognitive: (data.cognitive || []).map(m => m.milestone),
    social: (data.socialEmotional || []).map(m => m.milestone),
    language: (data.language || []).map(m => m.milestone),
    selfhelp: [], // Not in WHO standard domains
  };
  return acc;
}, {});
