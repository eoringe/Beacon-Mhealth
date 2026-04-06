/**
 * Home Activities for children at risk (Post-ASD Screening)
 */

export const SUPPORT_HEADER = {
    title: "Caregiver Support",
    subtitle: "Turn everyday moments into learning opportunities through play, routine, and interaction.",
    reminders: [
        "Keep activities short",
        "Repeat daily",
        "Praise your child",
        "Be patient"
    ],
    footer: "📞 Contact us on +254115188415",
    closing: "Remember: Every child is different. Celebrate small steps and keep trying!"
};

export const SUPPORT_ACTIVITIES = [
    {
        id: 'communication',
        title: 'Communication Skills',
        icon: 'record-voice-over',
        color: '#6366F1',
        tips: [
            { text: 'Offer choices (banana 🍌 or biscuit 🍪)', icon: 'choice' },
            { text: 'Call your child’s name 👂', icon: 'hearing' },
            { text: 'Pause during songs 🎵 to encourage response', icon: 'music-note' },
            { text: 'Copy your child’s sounds and actions 👶', icon: 'child-care' },
        ]
    },
    {
        id: 'social',
        title: 'Social Skills',
        icon: 'people',
        color: '#F43F5E',
        tips: [
            { text: 'Play face-to-face, follow your child’s interests', icon: 'face' },
            { text: 'Play peek-a-boo 🙈', icon: 'visibility-off' },
            { text: 'Point and name objects 👉', icon: 'ads-click' },
        ]
    },
    {
        id: 'learning',
        title: 'Learning Activities',
        icon: 'psychology',
        color: '#10B981',
        tips: [
            { text: 'Sorting and matching items (bottle tops, beans, containers)', icon: 'category' },
            { text: 'Simple puzzles 🧩', icon: 'extension' },
            { text: 'Cause-and-effect toys 🔘', icon: 'smart-button' },
        ]
    },
    {
        id: 'fine_motor',
        title: 'Fine Motor Skills',
        icon: 'gesture',
        color: '#F59E0B',
        tips: [
            { text: 'Pick small items (beans, maize)', icon: 'pin' },
            { text: 'Scribble with crayons 🖍️', icon: 'edit' },
            { text: 'Open/close containers 🫙', icon: 'door-front' },
            { text: 'String beads or pasta', icon: 'texture' },
        ]
    },
    {
        id: 'gross_motor',
        title: 'Gross Motor Skills',
        icon: 'directions-run',
        color: '#8B5CF6',
        tips: [
            { text: 'Running, jumping, climbing, ball games, dancing 💃', icon: 'fitness-center' },
            { text: 'Obstacle courses 🪑', icon: 'grid-view' },
        ]
    },
    {
        id: 'sensory',
        title: 'Sensory Play',
        icon: 'waves',
        color: '#06B6D4',
        tips: [
            { text: 'Calming: hugs 🤗, blanket wrapping', icon: 'accessibility' },
            { text: 'Active: jumping, water play 💦', icon: 'water-drop' },
            { text: '⚠️ Watch what your child likes or dislikes', icon: 'warning' },
        ]
    },
    {
        id: 'daily_living',
        title: 'Daily Living Skills',
        icon: 'home',
        color: '#EC4899',
        tips: [
            { text: 'Support independence in feeding, handwashing, dressing, toilet training 🚽', icon: 'clean-hands' },
        ]
    },
    {
        id: 'routine',
        title: 'Daily Routine',
        icon: 'event-note',
        color: '#3B82F6',
        tips: [
            { text: 'Keep a regular schedule, use pictures or drawings as reminders 🖼️', icon: 'image' },
            { text: 'Give warnings before changing activities', icon: 'timer' },
        ]
    }
];
