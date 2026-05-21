// SummerGrid — seed data
// Children, camps, connections, weeks. All in-memory.

const SG_WEEKS = [
  { idx: 1, label: 'WK 23', start: 'Jun 8', end: 'Jun 12', regOpen: true },
  { idx: 2, label: 'WK 24', start: 'Jun 15', end: 'Jun 19', regOpen: true },
  { idx: 3, label: 'WK 25', start: 'Jun 22', end: 'Jun 26', regOpen: true },
  { idx: 4, label: 'WK 26', start: 'Jun 29', end: 'Jul 3', regOpen: true },
  { idx: 5, label: 'WK 27', start: 'Jul 6', end: 'Jul 10', regOpen: true },
  { idx: 6, label: 'WK 28', start: 'Jul 13', end: 'Jul 17', regOpen: true },
  { idx: 7, label: 'WK 29', start: 'Jul 20', end: 'Jul 24', regOpen: true },
  { idx: 8, label: 'WK 30', start: 'Jul 27', end: 'Jul 31', regOpen: true },
  { idx: 9, label: 'WK 31', start: 'Aug 3', end: 'Aug 7', regOpen: true },
  { idx: 10, label: 'WK 32', start: 'Aug 10', end: 'Aug 14', regOpen: true },
];

// Camp catalog — used by Discover and the cell drawer
const SG_CAMPS = [
  { id: 'c01', name: 'Riverside Sailing Academy', cat: 'water', desc: 'Daily on-water sessions for beginners and intermediate sailors.', age: '8–14', schedule: 'full-day', price: 485, weeks: [3,4,5,6,7,8], distance: 6.2, location: 'Riverside Marina' },
  { id: 'c02', name: 'Cascadia Tech Lab', cat: 'stem', desc: 'Robotics, circuits, and Python — taught by working engineers.', age: '10–14', schedule: 'full-day', price: 525, weeks: [2,3,4,5,7,8,9], distance: 4.1, location: 'Downtown Maker Hub' },
  { id: 'c03', name: 'Northshore Soccer Camp', cat: 'sports', desc: 'Skills, scrimmages, and tournament play. Coached by NCAA alums.', age: '6–13', schedule: 'half-day', price: 245, weeks: [1,2,3,4,5,6,7,8,9,10], distance: 2.8, location: 'Northshore Fields' },
  { id: 'c04', name: 'Pacific Theater Co.', cat: 'arts', desc: 'Two-week production camps culminating in a Friday performance.', age: '7–12', schedule: 'full-day', price: 620, weeks: [2,3,6,7], distance: 5.4, location: 'Old Town Playhouse' },
  { id: 'c05', name: 'Wilderness Trail Camp', cat: 'outdoor', desc: 'Day hikes, knot-tying, navigation, and overnight prep skills.', age: '9–14', schedule: 'full-day', price: 410, weeks: [4,5,6,7,8], distance: 12.7, location: 'Cedar Creek Park' },
  { id: 'c06', name: 'Studio 14 Painting', cat: 'arts', desc: 'Watercolor, acrylic, mixed media in a working artist studio.', age: '7–13', schedule: 'half-day', price: 295, weeks: [1,2,3,8,9,10], distance: 3.6, location: 'Eastside Arts District' },
  { id: 'c07', name: 'Junior Coders Bootcamp', cat: 'stem', desc: 'Build a game, a chatbot, and a portfolio site in five days.', age: '9–13', schedule: 'half-day', price: 340, weeks: [3,4,5,6,9,10], distance: 4.8, location: 'Library Innovation Wing' },
  { id: 'c08', name: 'Lakeshore Day Camp', cat: 'outdoor', desc: 'Classic mixed-activity day camp — swim, canoe, archery, art.', age: '5–12', schedule: 'full-day', price: 395, weeks: [1,2,3,4,5,6,7,8,9,10], distance: 8.9, location: 'Lake Crescent' },
  { id: 'c09', name: 'Climbing Gym Kids', cat: 'sports', desc: 'Top-rope, bouldering, and lead intro for confident climbers.', age: '8–14', schedule: 'half-day', price: 285, weeks: [2,4,6,8,10], distance: 5.1, location: 'Vertical World' },
  { id: 'c10', name: 'Symphony Strings Intensive', cat: 'arts', desc: 'Daily ensemble play and private lessons. Audition required.', age: '10–16', schedule: 'full-day', price: 695, weeks: [5,6,7], distance: 7.2, location: 'Conservatory Hall' },
  { id: 'c11', name: 'Surf School', cat: 'water', desc: 'Beach-based instruction. Boards and wetsuits provided.', age: '9–14', schedule: 'full-day', price: 540, weeks: [6,7,8,9], distance: 18.4, location: 'Pacific Beach' },
  { id: 'c12', name: 'Junior Chef Studio', cat: 'other', desc: 'Knife skills, baking, and three-course family dinners.', age: '8–13', schedule: 'half-day', price: 325, weeks: [3,5,7,9], distance: 2.2, location: 'Culinary Center' },
];

// Initial children (with prefilled grid for the demo)
const SG_INITIAL_CHILDREN = [
  {
    id: 'k1', name: 'Mira', age: 11, color: '#FF5A1F', initials: 'MR',
    interests: ['STEM', 'OUTDOOR', 'WATER'],
    plan: {
      1: null,
      2: { campId: 'c02', status: 'REGISTERED' },
      3: { campId: 'c02', status: 'REGISTERED' },
      4: { campId: 'c01', status: 'WAITLIST' },
      5: { campId: 'c01', status: 'INTERESTED' },
      6: null,
      7: { campId: 'c05', status: 'REGISTERED' },
      8: { campId: 'c05', status: 'REGISTERED' },
      9: null,
      10: { campId: 'c08', status: 'INTERESTED' },
    },
  },
  {
    id: 'k2', name: 'Theo', age: 8, color: '#2F6BD8', initials: 'TH',
    interests: ['SPORTS', 'ARTS'],
    plan: {
      1: { campId: 'c03', status: 'REGISTERED' },
      2: { campId: 'c03', status: 'REGISTERED' },
      3: { campId: 'c06', status: 'REGISTERED' },
      4: null,
      5: { campId: 'c08', status: 'REGISTERED' },
      6: { campId: 'c08', status: 'REGISTERED' },
      7: null,
      8: { campId: 'c09', status: 'WAITLIST' },
      9: null,
      10: null,
    },
  },
];

// Connected families (Coordinate)
const SG_CONNECTIONS = [
  {
    id: 'f1', parent: 'Hannah Liu', kids: [{ name: 'Wren', age: 11 }, { name: 'August', age: 9 }],
    overlaps: [
      { childMine: 'Mira', childTheirs: 'Wren', week: 2, campId: 'c02' },
      { childMine: 'Mira', childTheirs: 'Wren', week: 3, campId: 'c02' },
      { childMine: 'Theo', childTheirs: 'August', week: 5, campId: 'c08' },
    ],
  },
  {
    id: 'f2', parent: 'David Okonkwo', kids: [{ name: 'Femi', age: 8 }],
    overlaps: [
      { childMine: 'Theo', childTheirs: 'Femi', week: 1, campId: 'c03' },
      { childMine: 'Theo', childTheirs: 'Femi', week: 2, campId: 'c03' },
    ],
  },
  {
    id: 'f3', parent: 'Sarah Mendez', kids: [{ name: 'Iris', age: 10 }],
    overlaps: [
      { childMine: 'Mira', childTheirs: 'Iris', week: 7, campId: 'c05' },
    ],
  },
];

const SG_STATUS = {
  REGISTERED: { label: 'REGISTERED', fg: '#0D4B22', bg: 'var(--sg-success-soft)', dot: 'var(--sg-success)' },
  WAITLIST:   { label: 'WAITLIST',   fg: '#6B5208', bg: 'var(--sg-warning-soft)', dot: 'var(--sg-warning)' },
  INTERESTED: { label: 'INTERESTED', fg: 'var(--sg-black)', bg: 'transparent', dot: 'var(--sg-accent)' },
  CONFLICT:   { label: 'CONFLICT',   fg: '#7A1D14', bg: 'var(--sg-danger-soft)', dot: 'var(--sg-danger)' },
};

const SG_CAT_LABEL = {
  sports: 'SPORTS', stem: 'STEM', arts: 'ARTS', outdoor: 'OUTDOOR', water: 'WATER', other: 'OTHER',
};

const SG_CAT_COLOR = {
  sports: 'var(--sg-cat-sports)', stem: 'var(--sg-cat-stem)', arts: 'var(--sg-cat-arts)',
  outdoor: 'var(--sg-cat-outdoor)', water: 'var(--sg-cat-water)', other: 'var(--sg-cat-other)',
};

function sgCampById(id) { return SG_CAMPS.find(c => c.id === id); }

Object.assign(window, {
  SG_WEEKS, SG_CAMPS, SG_INITIAL_CHILDREN, SG_CONNECTIONS, SG_STATUS,
  SG_CAT_LABEL, SG_CAT_COLOR, sgCampById,
});
