/**
 * CDC Developmental Milestones – "Learn the Signs. Act Early." (2022)
 * Source: https://www.cdc.gov/act-early/milestones/index.html
 *
 * Ages: 2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60 months
 * Categories: Social/Emotional, Language/Communication, Cognitive, Movement/Physical Development
 *
 * All milestone text is reproduced verbatim from the CDC website.
 */

export const CDC_SOURCE_URL = 'https://www.cdc.gov/act-early/milestones/index.html';

export const MILESTONE_AGES = [
  { label: '2 Months',  value: 2,  range: '1–3 months' },
  { label: '4 Months',  value: 4,  range: '3–5 months' },
  { label: '6 Months',  value: 6,  range: '5–7 months' },
  { label: '9 Months',  value: 9,  range: '8–10 months' },
  { label: '12 Months', value: 12, range: '11–13 months' },
  { label: '15 Months', value: 15, range: '13–17 months' },
  { label: '18 Months', value: 18, range: '15–21 months' },
  { label: '2 Years',   value: 24, range: '21–27 months' },
  { label: '30 Months', value: 30, range: '27–33 months' },
  { label: '3 Years',   value: 36, range: '33–42 months' },
  { label: '4 Years',   value: 48, range: '42–54 months' },
  { label: '5 Years',   value: 60, range: '54–66 months' },
];

export const MILESTONE_CATEGORIES = [
  {
    id: 'socialEmotional',
    title: 'Social/Emotional',
    icon: 'people',
    description: 'Relationships, emotions, and social interactions',
    color: '#E91E63',
  },
  {
    id: 'language',
    title: 'Language/Communication',
    icon: 'record-voice-over',
    description: 'Speaking, understanding words, and communication',
    color: '#FF9800',
  },
  {
    id: 'cognitive',
    title: 'Cognitive',
    icon: 'psychology',
    description: 'Learning, thinking, and problem-solving',
    color: '#9C27B0',
  },
  {
    id: 'movement',
    title: 'Movement/Physical Development',
    icon: 'directions-run',
    description: 'Gross and fine motor movements',
    color: '#4CAF50',
  },
];

export const CDC_MILESTONES = {
  // ── 2 Months ────────────────────────────────────────────────────────────────
  2: {
    ageLabel: '2 Months',
    socialEmotional: [
      { milestone: 'Calms down when spoken to or picked up', key: true },
      { milestone: 'Looks at your face', key: true },
      { milestone: 'Seems happy to see you when you walk up to her', key: true },
      { milestone: 'Smiles when you talk to or smile at her', key: true },
    ],
    language: [
      { milestone: 'Makes sounds other than crying', key: true },
      { milestone: 'Reacts to loud sounds', key: true },
    ],
    cognitive: [
      { milestone: 'Watches you as you move', key: true },
      { milestone: 'Looks at a toy for several seconds', key: true },
    ],
    movement: [
      { milestone: 'Holds head up when on tummy', key: true },
      { milestone: 'Moves both arms and both legs', key: true },
      { milestone: 'Opens hands briefly', key: true },
    ],
  },

  // ── 4 Months ────────────────────────────────────────────────────────────────
  4: {
    ageLabel: '4 Months',
    socialEmotional: [
      { milestone: 'Smiles on his own to get your attention', key: true },
      { milestone: 'Chuckles (not yet a full laugh) when you try to make him laugh', key: true },
      { milestone: 'Looks at you, moves, or makes sounds to get or keep your attention', key: true },
    ],
    language: [
      { milestone: 'Makes sounds like "oooo", "aahh" (cooing)', key: true },
      { milestone: 'Makes sounds back when you talk to him', key: true },
      { milestone: 'Turns head towards the sound of your voice', key: true },
    ],
    cognitive: [
      { milestone: 'If hungry, opens mouth when he sees breast or bottle', key: true },
      { milestone: 'Looks at her hands with interest', key: true },
    ],
    movement: [
      { milestone: 'Holds head steady without support when you are holding him', key: true },
      { milestone: 'Holds a toy when you put it in his hand', key: true },
      { milestone: 'Uses his arm to swing at toys', key: true },
      { milestone: 'Brings hands to mouth', key: true },
      { milestone: 'Pushes up onto elbows/forearms when on tummy', key: true },
    ],
  },

  // ── 6 Months ────────────────────────────────────────────────────────────────
  6: {
    ageLabel: '6 Months',
    socialEmotional: [
      { milestone: 'Knows familiar people', key: true },
      { milestone: 'Likes to look at self in a mirror', key: true },
      { milestone: 'Laughs', key: true },
    ],
    language: [
      { milestone: 'Takes turns making sounds with you', key: true },
      { milestone: 'Blows "raspberries" (sticks tongue out and blows)', key: true },
      { milestone: 'Makes squealing noises', key: true },
    ],
    cognitive: [
      { milestone: 'Puts things in her mouth to explore them', key: true },
      { milestone: 'Reaches to grab a toy she wants', key: true },
      { milestone: "Closes lips to show she doesn't want more food", key: true },
    ],
    movement: [
      { milestone: 'Rolls from tummy to back', key: true },
      { milestone: 'Pushes up with straight arms when on tummy', key: true },
      { milestone: 'Leans on hands to support herself when sitting', key: true },
    ],
  },

  // ── 9 Months ────────────────────────────────────────────────────────────────
  9: {
    ageLabel: '9 Months',
    socialEmotional: [
      { milestone: 'Is shy, clingy, or fearful around strangers', key: true },
      { milestone: 'Shows several facial expressions, like happy, sad, angry, and surprised', key: true },
      { milestone: 'Looks when you call her name', key: true },
      { milestone: 'Reacts when you leave (looks, reaches for you, or cries)', key: true },
      { milestone: 'Smiles or laughs when you play peek-a-boo', key: true },
    ],
    language: [
      { milestone: 'Makes a lot of different sounds like "mamamama" and "bababababa"', key: true },
      { milestone: 'Lifts arms up to be picked up', key: true },
    ],
    cognitive: [
      { milestone: 'Looks for objects when dropped out of sight (like his spoon or toy)', key: true },
      { milestone: 'Bangs two things together', key: true },
    ],
    movement: [
      { milestone: 'Gets to a sitting position by herself', key: true },
      { milestone: 'Moves things from one hand to her other hand', key: true },
      { milestone: 'Uses fingers to "rake" food towards himself', key: true },
      { milestone: 'Sits without support', key: true },
    ],
  },

  // ── 12 Months ───────────────────────────────────────────────────────────────
  12: {
    ageLabel: '12 Months (1 Year)',
    socialEmotional: [
      { milestone: 'Plays games with you, like pat-a-cake', key: true },
    ],
    language: [
      { milestone: 'Waves "bye-bye"', key: true },
      { milestone: 'Calls a parent "mama" or "dada" or another special name', key: true },
      { milestone: 'Understands "no" (pauses briefly or stops when you say it)', key: true },
    ],
    cognitive: [
      { milestone: 'Puts something in a container, like a block in a cup', key: true },
      { milestone: 'Looks for things he sees you hide, like a toy under a blanket', key: true },
    ],
    movement: [
      { milestone: 'Pulls up to stand', key: true },
      { milestone: 'Walks, holding on to furniture', key: true },
      { milestone: 'Drinks from a cup without a lid, as you hold it', key: true },
      { milestone: 'Picks things up between thumb and pointer finger, like small bits of food', key: true },
    ],
  },

  // ── 15 Months ───────────────────────────────────────────────────────────────
  15: {
    ageLabel: '15 Months',
    socialEmotional: [
      { milestone: 'Copies other children while playing, like taking toys out of a container when another child does', key: true },
      { milestone: 'Shows you an object she likes', key: true },
      { milestone: 'Claps when excited', key: true },
      { milestone: 'Hugs stuffed doll or other toy', key: true },
      { milestone: 'Shows you affection (hugs, cuddles, or kisses you)', key: true },
    ],
    language: [
      { milestone: 'Tries to say one or two words besides "mama" or "dada," like "ba" for ball or "da" for dog', key: true },
      { milestone: 'Looks at a familiar object when you name it', key: true },
      { milestone: 'Follows directions given with both a gesture and words, like giving you a toy when you hold out your hand and say "Give me the toy."', key: true },
      { milestone: 'Points to ask for something or to get help', key: true },
    ],
    cognitive: [
      { milestone: 'Tries to use things the right way, like a phone, cup, or book', key: true },
      { milestone: 'Stacks at least two small objects, like blocks', key: true },
    ],
    movement: [
      { milestone: 'Takes a few steps on his own', key: true },
      { milestone: 'Uses fingers to feed herself some food', key: true },
    ],
  },

  // ── 18 Months ───────────────────────────────────────────────────────────────
  18: {
    ageLabel: '18 Months',
    socialEmotional: [
      { milestone: 'Moves away from you, but looks to make sure you are close by', key: true },
      { milestone: 'Points to show you something interesting', key: true },
      { milestone: 'Puts hands out for you to wash them', key: true },
      { milestone: 'Looks at a few pages in a book with you', key: true },
      { milestone: 'Helps you dress him by pushing arm through sleeve or lifting up foot', key: true },
    ],
    language: [
      { milestone: 'Tries to say three or more words besides "mama" or "dada"', key: true },
      { milestone: 'Follows one-step directions without any gestures, like giving you the toy when you say, "Give it to me."', key: true },
    ],
    cognitive: [
      { milestone: 'Copies you doing chores, like sweeping with a broom', key: true },
      { milestone: 'Plays with toys in a simple way, like pushing a toy car', key: true },
    ],
    movement: [
      { milestone: 'Walks without holding on to anyone or anything', key: true },
      { milestone: 'Scribbles', key: true },
      { milestone: 'Drinks from a cup without a lid and may spill sometimes', key: true },
      { milestone: 'Feeds himself with his fingers', key: true },
      { milestone: 'Tries to use a spoon', key: true },
      { milestone: 'Climbs on and off a couch or chair without help', key: true },
    ],
  },

  // ── 24 Months (2 Years) ─────────────────────────────────────────────────────
  24: {
    ageLabel: '2 Years',
    socialEmotional: [
      { milestone: 'Notices when others are hurt or upset, like pausing or looking sad when someone is crying', key: true },
      { milestone: 'Looks at your face to see how to react in a new situation', key: true },
    ],
    language: [
      { milestone: 'Points to things in a book when you ask, like "Where is the bear?"', key: true },
      { milestone: 'Says at least two words together, like "More milk."', key: true },
      { milestone: 'Points to at least two body parts when you ask him to show you', key: true },
      { milestone: 'Uses more gestures than just waving and pointing, like blowing a kiss or nodding yes', key: true },
    ],
    cognitive: [
      { milestone: 'Holds something in one hand while using the other hand, like holding a container and taking the lid off', key: true },
      { milestone: 'Tries to use switches, knobs, or buttons on a toy', key: true },
      { milestone: 'Plays with more than one toy at the same time, like putting toy food on a toy plate', key: true },
    ],
    movement: [
      { milestone: 'Kicks a ball', key: true },
      { milestone: 'Runs', key: true },
      { milestone: 'Walks (not climbs) up a few stairs with or without help', key: true },
      { milestone: 'Eats with a spoon', key: true },
    ],
  },

  // ── 30 Months ───────────────────────────────────────────────────────────────
  30: {
    ageLabel: '30 Months',
    socialEmotional: [
      { milestone: 'Plays next to other children and sometimes plays with them', key: true },
      { milestone: 'Shows you what she can do by saying, "Look at me!"', key: true },
      { milestone: 'Follows simple routines when told, like helping to pick up toys when you say, "It\'s clean-up time."', key: true },
    ],
    language: [
      { milestone: 'Says about 50 words', key: true },
      { milestone: 'Says two or more words together, with one action word, like "Doggie run"', key: true },
      { milestone: 'Names things in a book when you point and ask, "What is this?"', key: true },
      { milestone: 'Says words like "I," "me," or "we"', key: true },
    ],
    cognitive: [
      { milestone: 'Uses things to pretend, like feeding a block to a doll as if it were food', key: true },
      { milestone: 'Shows simple problem-solving skills, like standing on a small stool to reach something', key: true },
      { milestone: 'Follows two-step instructions like "Put the toy down and close the door."', key: true },
      { milestone: 'Shows he knows at least one color, like pointing to a red crayon when you ask, "Which one is red?"', key: true },
    ],
    movement: [
      { milestone: 'Uses hands to twist things, like turning doorknobs or unscrewing lids', key: true },
      { milestone: 'Takes some clothes off by himself, like loose pants or an open jacket', key: true },
      { milestone: 'Jumps off the ground with both feet', key: true },
      { milestone: 'Turns book pages, one at a time, when you read to her', key: true },
    ],
  },

  // ── 36 Months (3 Years) ─────────────────────────────────────────────────────
  36: {
    ageLabel: '3 Years',
    socialEmotional: [
      { milestone: 'Calms down within 10 minutes after you leave her, like at a childcare drop off', key: true },
      { milestone: 'Notices other children and joins them to play', key: true },
    ],
    language: [
      { milestone: 'Talks with you in conversation using at least two back-and-forth exchanges', key: true },
      { milestone: 'Asks "who," "what," "where," or "why" questions, like "Where is mommy/daddy?"', key: true },
      { milestone: 'Says what action is happening in a picture or book when asked, like "running," "eating," or "playing"', key: true },
      { milestone: 'Says first name, when asked', key: true },
      { milestone: 'Talks well enough for others to understand, most of the time', key: true },
    ],
    cognitive: [
      { milestone: 'Draws a circle, when you show him how', key: true },
      { milestone: 'Avoids touching hot objects, like a stove, when you warn her', key: true },
    ],
    movement: [
      { milestone: 'Strings items together, like large beads or macaroni', key: true },
      { milestone: 'Puts on some clothes by himself, like loose pants or a jacket', key: true },
      { milestone: 'Uses a fork', key: true },
    ],
  },

  // ── 48 Months (4 Years) ─────────────────────────────────────────────────────
  48: {
    ageLabel: '4 Years',
    socialEmotional: [
      { milestone: 'Pretends to be something else during play (teacher, superhero, dog)', key: true },
      { milestone: 'Asks to go play with children if none are around, like "Can I play with Alex?"', key: true },
      { milestone: 'Comforts others who are hurt or sad, like hugging a crying friend', key: true },
      { milestone: 'Avoids danger, like not jumping from tall heights at the playground', key: true },
      { milestone: 'Likes to be a "helper"', key: true },
      { milestone: 'Changes behavior based on where she is (place of worship, library, playground)', key: true },
    ],
    language: [
      { milestone: 'Says sentences with four or more words', key: true },
      { milestone: 'Says some words from a song, story, or nursery rhyme', key: true },
      { milestone: 'Talks about at least one thing that happened during her day, like "I played soccer."', key: true },
      { milestone: 'Answers simple questions like "What is a coat for?" or "What is a crayon for?"', key: true },
    ],
    cognitive: [
      { milestone: 'Names a few colors of items', key: true },
      { milestone: 'Tells what comes next in a well-known story', key: true },
      { milestone: 'Draws a person with three or more body parts', key: true },
    ],
    movement: [
      { milestone: 'Catches a large ball most of the time', key: true },
      { milestone: 'Serves herself food or pours water, with adult supervision', key: true },
      { milestone: 'Unbuttons some buttons', key: true },
      { milestone: 'Holds crayon or pencil between fingers and thumb (not a fist)', key: true },
    ],
  },

  // ── 60 Months (5 Years) ─────────────────────────────────────────────────────
  60: {
    ageLabel: '5 Years',
    socialEmotional: [
      { milestone: 'Follows rules or takes turns when playing games with other children', key: true },
      { milestone: 'Sings, dances, or acts for you', key: true },
      { milestone: 'Does simple chores at home, like matching socks or clearing the table after eating', key: true },
    ],
    language: [
      { milestone: 'Tells a story she heard or made up with at least two events', key: true },
      { milestone: 'Answers simple questions about a book or story after you read or tell it to him', key: true },
      { milestone: 'Keeps a conversation going with more than three back-and-forth exchanges', key: true },
      { milestone: 'Uses or recognizes simple rhymes (bat-cat, ball-tall)', key: true },
    ],
    cognitive: [
      { milestone: 'Counts to 10', key: true },
      { milestone: 'Names some numbers between 1 and 5 when you point to them', key: true },
      { milestone: 'Uses words about time, like "yesterday," "tomorrow," "morning," or "night"', key: true },
      { milestone: 'Pays attention for 5 to 10 minutes during activities (screen time does not count)', key: true },
      { milestone: 'Writes some letters in her name', key: true },
      { milestone: 'Names some letters when you point to them', key: true },
    ],
    movement: [
      { milestone: 'Buttons some buttons', key: true },
      { milestone: 'Hops on one foot', key: true },
    ],
  },
};

// ── Keep WHO_MILESTONES as alias for backward compat ─────────────────────────
export const WHO_MILESTONES = CDC_MILESTONES;

/**
 * Get milestones for a specific age (in months).
 * Returns the closest age group that does not exceed the child's age.
 */
export const getMilestonesForAge = (ageInMonths) => {
  const ages = Object.keys(CDC_MILESTONES).map(Number).sort((a, b) => a - b);
  let closestAge = ages[0];
  for (const age of ages) {
    if (ageInMonths >= age) closestAge = age;
    else break;
  }
  return CDC_MILESTONES[closestAge];
};

/**
 * Calculate age in months from date of birth
 */
export const calculateAgeInMonths = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let months = (today.getFullYear() - dob.getFullYear()) * 12;
  months += today.getMonth() - dob.getMonth();
  if (today.getDate() < dob.getDate()) months--;
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

// Legacy compatibility export
export const getKeyMilestones = (ageInMonths) => {
  const milestones = getMilestonesForAge(ageInMonths);
  const key = {};
  for (const cat of Object.keys(milestones)) {
    if (cat === 'ageLabel') continue;
    key[cat] = milestones[cat].filter(m => m.key);
  }
  return key;
};

export const MILESTONE_DATA = Object.entries(CDC_MILESTONES).reduce((acc, [age, data]) => {
  acc[age] = {
    physical: (data.movement || []).map(m => m.milestone),
    cognitive: (data.cognitive || []).map(m => m.milestone),
    social: (data.socialEmotional || []).map(m => m.milestone),
    language: (data.language || []).map(m => m.milestone),
    selfhelp: [],
  };
  return acc;
}, {});
