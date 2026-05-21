// SummerGrid v2 — data model
// A parent group, their kids, and camp blocks on a shared calendar.

const WEEKS = [
  { idx: 1, label: 'WK 23', start: 'Jun 8', end: 'Jun 12' },
  { idx: 2, label: 'WK 24', start: 'Jun 15', end: 'Jun 19' },
  { idx: 3, label: 'WK 25', start: 'Jun 22', end: 'Jun 26' },
  { idx: 4, label: 'WK 26', start: 'Jun 29', end: 'Jul 3' },
  { idx: 5, label: 'WK 27', start: 'Jul 6', end: 'Jul 10' },
  { idx: 6, label: 'WK 28', start: 'Jul 13', end: 'Jul 17' },
  { idx: 7, label: 'WK 29', start: 'Jul 20', end: 'Jul 24' },
  { idx: 8, label: 'WK 30', start: 'Jul 27', end: 'Jul 31' },
  { idx: 9, label: 'WK 31', start: 'Aug 3', end: 'Aug 7' },
  { idx: 10, label: 'WK 32', start: 'Aug 10', end: 'Aug 14' },
];

// Days of the week we plan against
const DAYS = [
  { key: 'M',  full: 'Mon' },
  { key: 'T',  full: 'Tue' },
  { key: 'W',  full: 'Wed' },
  { key: 'Th', full: 'Thu' },
  { key: 'F',  full: 'Fri' },
];

const GROUP = {
  id: 'g1',
  name: 'Forest Hill Summer Crew',
  inviteLink: 'summergrid.app/g/forest-hill-2k26',
  parents: [
    { id: 'p1', name: 'Jordan Sato',    short: 'Jordan',  initials: 'JS', color: '#FF5A1F', isMe: true },
    { id: 'p2', name: 'Richard Sato',   short: 'Richard', initials: 'RS', color: '#D81B60', isPartner: true },
    { id: 'p3', name: 'Hannah Liu',     short: 'Hannah',  initials: 'HL', color: '#2F6BD8' },
    { id: 'p4', name: 'David Okonkwo',  short: 'David',   initials: 'DO', color: '#1F7A3A' },
    { id: 'p5', name: 'Sarah Mendez',   short: 'Sarah',   initials: 'SM', color: '#7A4ECC' },
  ],
};

const CHILDREN = [
  { id: 'c1', name: 'Mira',   age: 11, parentId: 'p1' },
  { id: 'c2', name: 'Theo',   age: 8,  parentId: 'p1' },
  { id: 'c3', name: 'Wren',   age: 11, parentId: 'p3' },
  { id: 'c4', name: 'August', age: 9,  parentId: 'p3' },
  { id: 'c5', name: 'Femi',   age: 8,  parentId: 'p4' },
  { id: 'c6', name: 'Iris',   age: 10, parentId: 'p5' },
];

// ----- pickup/dropoff helpers -----
// Each block has a *default* pickup/dropoff parent (used when planning), plus
// optional per-day overrides {M, T, W, Th, F}. When the granular weekly view
// fills in days, this object grows.
const pdFull = (parentId) => ({ M: parentId, T: parentId, W: parentId, Th: parentId, F: parentId });
const pdMix = (m, t, w, th, f) => ({ M: m, T: t, W: w, Th: th, F: f });

// Build per-day maps, falling back to defaults
function blockPickupByDay(b) {
  const def = b.pickup;
  return { M: def, T: def, W: def, Th: def, F: def, ...(b.pickupByDay || {}) };
}
function blockDropoffByDay(b) {
  const def = b.dropoff;
  return { M: def, T: def, W: def, Th: def, F: def, ...(b.dropoffByDay || {}) };
}
// Unique parents covering a block across the week (for grand-view summary)
function blockPickupParents(b) {
  const m = blockPickupByDay(b);
  return [...new Set(DAYS.map(d => m[d.key]))].map(getParent).filter(Boolean);
}
function blockDropoffParents(b) {
  const m = blockDropoffByDay(b);
  return [...new Set(DAYS.map(d => m[d.key]))].map(getParent).filter(Boolean);
}

// Initial calendar — realistic overlaps to demonstrate coordination
// Some blocks have registration deadlines (regDeadline) — these surface as
// urgent indicators on the grid so the whole group sees them.
const INITIAL_BLOCKS = [
  // Week 24 — Cascadia Tech Lab (Mira + Wren) — Jordan & Hannah split days
  { id: 'b1', childId: 'c1', weekIdx: 2, campName: 'Cascadia Tech Lab', start: '09:00', end: '16:00',
    pickup: 'p1', dropoff: 'p1',
    pickupByDay:  pdMix('p1','p3','p1','p3','p2'),
    dropoffByDay: pdMix('p1','p1','p3','p3','p1') },
  { id: 'b2', childId: 'c3', weekIdx: 2, campName: 'Cascadia Tech Lab', start: '09:00', end: '16:00',
    pickup: 'p3', dropoff: 'p1', notes: 'Carpool w/ Mira',
    pickupByDay:  pdMix('p1','p3','p1','p3','p2'),
    dropoffByDay: pdMix('p1','p1','p3','p3','p1') },

  // Week 25 — Tech Lab continues
  { id: 'b3', childId: 'c1', weekIdx: 3, campName: 'Cascadia Tech Lab', start: '09:00', end: '16:00',
    pickup: 'p3', dropoff: 'p1' },
  { id: 'b4', childId: 'c3', weekIdx: 3, campName: 'Cascadia Tech Lab', start: '09:00', end: '16:00',
    pickup: 'p3', dropoff: 'p3' },

  // Week 23 — Northshore Soccer (Theo + Femi) — registration closes soon!
  { id: 'b5', childId: 'c2', weekIdx: 1, campName: 'Northshore Soccer', start: '09:00', end: '12:00',
    pickup: 'p1', dropoff: 'p4', regDeadline: 'May 28', regStatus: 'closing-soon' },
  { id: 'b6', childId: 'c5', weekIdx: 1, campName: 'Northshore Soccer', start: '09:00', end: '12:00',
    pickup: 'p1', dropoff: 'p4', regDeadline: 'May 28', regStatus: 'closing-soon' },

  // Week 24 — Soccer
  { id: 'b7', childId: 'c2', weekIdx: 2, campName: 'Northshore Soccer', start: '09:00', end: '12:00',
    pickup: 'p4', dropoff: 'p1' },
  { id: 'b8', childId: 'c5', weekIdx: 2, campName: 'Northshore Soccer', start: '09:00', end: '12:00',
    pickup: 'p4', dropoff: 'p4' },

  // Week 25 — Studio 14 Painting (Theo solo) — registered already
  { id: 'b9', childId: 'c2', weekIdx: 3, campName: 'Studio 14 Painting', start: '09:00', end: '12:00',
    pickup: 'p1', dropoff: 'p2', regStatus: 'registered' },

  // Week 27 — Trail Camp (Mira + August) — DEADLINE
  { id: 'b10', childId: 'c1', weekIdx: 5, campName: 'Wilderness Trail Camp', start: '08:30', end: '16:30',
    pickup: 'p1', dropoff: 'p3', regDeadline: 'Jun 1', regStatus: 'open' },
  { id: 'b11', childId: 'c4', weekIdx: 5, campName: 'Wilderness Trail Camp', start: '08:30', end: '16:30',
    pickup: 'p1', dropoff: 'p3', regDeadline: 'Jun 1', regStatus: 'open' },

  // Week 27 — Lakeshore Day (Theo + Femi + Iris)
  { id: 'b12', childId: 'c2', weekIdx: 5, campName: 'Lakeshore Day Camp', start: '09:00', end: '16:00',
    pickup: 'p5', dropoff: 'p4' },
  { id: 'b13', childId: 'c5', weekIdx: 5, campName: 'Lakeshore Day Camp', start: '09:00', end: '16:00',
    pickup: 'p5', dropoff: 'p4' },
  { id: 'b14', childId: 'c6', weekIdx: 5, campName: 'Lakeshore Day Camp', start: '09:00', end: '16:00',
    pickup: 'p5', dropoff: 'p4' },

  // Week 28 — Trail Camp continues
  { id: 'b15', childId: 'c1', weekIdx: 6, campName: 'Wilderness Trail Camp', start: '08:30', end: '16:30',
    pickup: 'p3', dropoff: 'p1' },
  { id: 'b16', childId: 'c4', weekIdx: 6, campName: 'Wilderness Trail Camp', start: '08:30', end: '16:30',
    pickup: 'p3', dropoff: 'p1' },

  // Week 29 — Riverside Sailing (Mira + Wren) — DEADLINE
  { id: 'b17', childId: 'c1', weekIdx: 7, campName: 'Riverside Sailing', start: '09:00', end: '15:00',
    pickup: 'p3', dropoff: 'p1', regDeadline: 'Jun 15', regStatus: 'open' },
  { id: 'b18', childId: 'c3', weekIdx: 7, campName: 'Riverside Sailing', start: '09:00', end: '15:00',
    pickup: 'p3', dropoff: 'p1', regDeadline: 'Jun 15', regStatus: 'open' },

  // Week 29 — Lakeshore
  { id: 'b19', childId: 'c6', weekIdx: 7, campName: 'Lakeshore Day Camp', start: '09:00', end: '16:00',
    pickup: 'p5', dropoff: 'p5' },
  { id: 'b20', childId: 'c2', weekIdx: 7, campName: 'Lakeshore Day Camp', start: '09:00', end: '16:00',
    pickup: 'p5', dropoff: 'p1' },

  // Week 31 — Junior Coders (Mira + August)
  { id: 'b21', childId: 'c1', weekIdx: 9, campName: 'Junior Coders', start: '09:00', end: '12:00',
    pickup: 'p1', dropoff: 'p2' },
  { id: 'b22', childId: 'c4', weekIdx: 9, campName: 'Junior Coders', start: '09:00', end: '12:00',
    pickup: 'p1', dropoff: 'p3' },
];

// Quick lookups
function getParent(id) { return GROUP.parents.find(p => p.id === id); }
function getChild(id) { return CHILDREN.find(c => c.id === id); }
function getChildrenOf(parentId) { return CHILDREN.filter(c => c.parentId === parentId); }

Object.assign(window, {
  WEEKS, DAYS, GROUP, CHILDREN, INITIAL_BLOCKS,
  getParent, getChild, getChildrenOf,
  blockPickupByDay, blockDropoffByDay, blockPickupParents, blockDropoffParents,
  pdFull, pdMix,
});
