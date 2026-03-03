/**
 * Age-Appropriate Activity Suggestions
 * Organized by age range and developmental area
 */

export const ACTIVITY_AGE_RANGES = [
    { id: '0-3', label: '0-3 months', maxMonths: 3 },
    { id: '3-6', label: '3-6 months', maxMonths: 6 },
    { id: '6-9', label: '6-9 months', maxMonths: 9 },
    { id: '9-12', label: '9-12 months', maxMonths: 12 },
    { id: '12-18', label: '12-18 months', maxMonths: 18 },
    { id: '18-24', label: '18-24 months', maxMonths: 24 },
    { id: '24-36', label: '2-3 years', maxMonths: 36 },
    { id: '36-60', label: '3-5 years', maxMonths: 60 },
];

export const DEVELOPMENTAL_AREAS = [
    { id: 'motor', label: 'Motor', icon: 'directions-run', color: '#4CAF50' },
    { id: 'language', label: 'Language', icon: 'record-voice-over', color: '#FF9800' },
    { id: 'cognitive', label: 'Cognitive', icon: 'psychology', color: '#9C27B0' },
    { id: 'social', label: 'Social', icon: 'people', color: '#E91E63' },
    { id: 'sensory', label: 'Sensory', icon: 'touch-app', color: '#00BCD4' },
];

export const ACTIVITIES = {
    '0-3': [
        { id: 'a1', title: 'Tummy Time with Mirror', description: 'Place baby on tummy with a mirror in front. Talk to them and encourage lifting their head.', area: 'motor', materials: 'Soft mat, small mirror' },
        { id: 'a2', title: 'Black & White Cards', description: 'Show high-contrast cards 8-12 inches from face. Slowly move them side to side.', area: 'cognitive', materials: 'High-contrast cards' },
        { id: 'a3', title: 'Sing & Sway', description: 'Hold baby close, sing softly and gently sway. Make eye contact.', area: 'social', materials: 'None' },
        { id: 'a4', title: 'Gentle Touch Massage', description: 'Gently massage baby\'s legs, arms, and tummy with smooth strokes.', area: 'sensory', materials: 'Baby-safe oil (optional)' },
        { id: 'a5', title: 'Talk Through the Day', description: 'Narrate what you are doing: "Now I\'m picking you up!" Building language foundations.', area: 'language', materials: 'None' },
    ],
    '3-6': [
        { id: 'b1', title: 'Rattle Reach', description: 'Hold a rattle just out of reach to encourage reaching and grasping.', area: 'motor', materials: 'Rattle or soft toy' },
        { id: 'b2', title: 'Peek-a-Boo', description: 'Cover your face with a cloth and reveal it with a big smile. Teaches object permanence.', area: 'cognitive', materials: 'Soft cloth' },
        { id: 'b3', title: 'Sound Exploration', description: 'Crinkle paper, shake keys, or tap surfaces. Watch baby respond to different sounds.', area: 'sensory', materials: 'Various household items' },
        { id: 'b4', title: 'Baby Babble Conversations', description: 'When baby makes sounds, respond back! Take turns "talking" to build communication.', area: 'language', materials: 'None' },
        { id: 'b5', title: 'Supported Sitting Play', description: 'Sit baby with cushion support and place toys within reach. Builds core strength.', area: 'motor', materials: 'Cushions, toys' },
    ],
    '6-9': [
        { id: 'c1', title: 'Container Play', description: 'Give baby a container and small (safe) objects. Practice putting in and taking out.', area: 'cognitive', materials: 'Container, large blocks' },
        { id: 'c2', title: 'Name That Object', description: 'Point to objects and name them clearly: "Ball!" "Cup!" "Dog!" Repeat often.', area: 'language', materials: 'Everyday objects' },
        { id: 'c3', title: 'Crawling Obstacle Course', description: 'Create a mini course with cushions to climb over and crawl around. Supervise closely.', area: 'motor', materials: 'Pillows, cushions' },
        { id: 'c4', title: 'Texture Board', description: 'Tape different textures (fabric, foil, bubble wrap) to cardboard. Let baby explore by touching.', area: 'sensory', materials: 'Cardboard, various textures, tape' },
        { id: 'c5', title: 'Clapping Songs', description: 'Sing clapping songs like "Pat-a-cake" and encourage baby to clap along.', area: 'social', materials: 'None' },
    ],
    '9-12': [
        { id: 'd1', title: 'Stacking Cups', description: 'Show baby how to stack and knock down cups. Teaches cause and effect.', area: 'cognitive', materials: 'Stacking cups or containers' },
        { id: 'd2', title: 'Point and Name', description: 'Point to body parts and name them: "Where\'s your nose?" Touch it gently.', area: 'language', materials: 'None' },
        { id: 'd3', title: 'Push and Pull Toys', description: 'Give baby a toy to push along while cruising or walking with support.', area: 'motor', materials: 'Push toy' },
        { id: 'd4', title: 'Water Play', description: 'Supervised play with cups, funnels, and water during bath time. Pour and splash!', area: 'sensory', materials: 'Bath toys, cups' },
        { id: 'd5', title: 'Wave Bye-Bye Practice', description: 'Wave and say "bye-bye!" when someone leaves. Encourage baby to copy.', area: 'social', materials: 'None' },
    ],
    '12-18': [
        { id: 'e1', title: 'Shape Sorter', description: 'Help baby match shapes to holes. Start with simple round shapes.', area: 'cognitive', materials: 'Shape sorter toy' },
        { id: 'e2', title: 'First Crayons', description: 'Let toddler scribble on large paper with chunky crayons. First art!', area: 'motor', materials: 'Large crayons, paper' },
        { id: 'e3', title: 'Simple Instructions', description: '"Give me the ball", "Put the block in the box". Practice following 1-step directions.', area: 'language', materials: 'Toys' },
        { id: 'e4', title: 'Sand/Rice Play', description: 'Fill a tub with rice or sand. Let toddler scoop, pour, and dig. (Supervise closely)', area: 'sensory', materials: 'Container, rice/sand, cups' },
        { id: 'e5', title: 'Dance Party', description: 'Play upbeat music and dance together! Clap, stomp, and spin.', area: 'social', materials: 'Music' },
    ],
    '18-24': [
        { id: 'f1', title: 'Simple Puzzles', description: 'Try 2-4 piece knob puzzles. Help toddler identify and place pieces.', area: 'cognitive', materials: 'Knob puzzle' },
        { id: 'f2', title: 'Ball Kicking', description: 'Roll a ball and encourage toddler to kick it. Practice taking turns.', area: 'motor', materials: 'Soft ball' },
        { id: 'f3', title: 'Picture Book Chat', description: 'Look at picture books together. Ask "What\'s that?" and name objects.', area: 'language', materials: 'Picture books' },
        { id: 'f4', title: 'Play Dough Fun', description: 'Squeeze, roll, and shape play dough. Great for fine motor development.', area: 'sensory', materials: 'Play dough' },
        { id: 'f5', title: 'Pretend Tea Party', description: 'Set up cups and a pretend teapot. Practice pouring and sharing.', area: 'social', materials: 'Toy cups, teapot' },
    ],
    '24-36': [
        { id: 'g1', title: 'Counting Steps', description: 'Count aloud while climbing stairs together. "One, two, three!"', area: 'cognitive', materials: 'Stairs' },
        { id: 'g2', title: 'Jumping Practice', description: 'Practice jumping with both feet off the ground. Try jumping over a rope on the floor.', area: 'motor', materials: 'Rope or line' },
        { id: 'g3', title: 'Story Retelling', description: 'After reading a familiar story, ask "What happened next?" Encourage sequencing.', area: 'language', materials: 'Favourite book' },
        { id: 'g4', title: 'Feelings Faces', description: 'Draw happy, sad, angry faces. Ask child "Can you show me a happy face?"', area: 'social', materials: 'Paper, crayons' },
        { id: 'g5', title: 'Threading Beads', description: 'Thread large beads onto a string. Develops fine motor coordination.', area: 'motor', materials: 'Large beads, string' },
    ],
    '36-60': [
        { id: 'h1', title: 'Treasure Hunt', description: 'Hide objects around the room and give simple clues to find them.', area: 'cognitive', materials: 'Small toys to hide' },
        { id: 'h2', title: 'Scissors Practice', description: 'Use child-safe scissors to cut along straight lines on paper.', area: 'motor', materials: 'Child scissors, paper' },
        { id: 'h3', title: 'Storytelling Chain', description: 'Start a story and take turns adding to it. "Once there was a cat who..."', area: 'language', materials: 'None' },
        { id: 'h4', title: 'Obstacle Course', description: 'Set up a course: jump over pillows, crawl under tables, balance on a line.', area: 'motor', materials: 'Household items' },
        { id: 'h5', title: 'Sharing Games', description: 'Play board games with turn-taking. Practice winning and losing gracefully.', area: 'social', materials: 'Simple board game' },
    ],
};

export const getActivitiesForAge = (ageInMonths) => {
    const ranges = ACTIVITY_AGE_RANGES;
    let rangeId = ranges[ranges.length - 1].id;
    for (const range of ranges) {
        if (ageInMonths <= range.maxMonths) {
            rangeId = range.id;
            break;
        }
    }
    return ACTIVITIES[rangeId] || [];
};

export const getDailyPick = (ageInMonths) => {
    const activities = getActivitiesForAge(ageInMonths);
    if (activities.length === 0) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return activities[dayOfYear % activities.length];
};
