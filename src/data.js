// SummerGrid — static constants and pure helpers

export const WEEKS = [
  { idx: 1,  label: 'WK 23', start: 'Jun 8',  end: 'Jun 12' },
  { idx: 2,  label: 'WK 24', start: 'Jun 15', end: 'Jun 19' },
  { idx: 3,  label: 'WK 25', start: 'Jun 22', end: 'Jun 26' },
  { idx: 4,  label: 'WK 26', start: 'Jun 29', end: 'Jul 3'  },
  { idx: 5,  label: 'WK 27', start: 'Jul 6',  end: 'Jul 10' },
  { idx: 6,  label: 'WK 28', start: 'Jul 13', end: 'Jul 17' },
  { idx: 7,  label: 'WK 29', start: 'Jul 20', end: 'Jul 24' },
  { idx: 8,  label: 'WK 30', start: 'Jul 27', end: 'Jul 31' },
  { idx: 9,  label: 'WK 31', start: 'Aug 3',  end: 'Aug 7'  },
  { idx: 10, label: 'WK 32', start: 'Aug 10', end: 'Aug 14' },
];

export const DAYS = [
  { key: 'M',  full: 'Mon' },
  { key: 'T',  full: 'Tue' },
  { key: 'W',  full: 'Wed' },
  { key: 'Th', full: 'Thu' },
  { key: 'F',  full: 'Fri' },
];

export function blockPickupByDay(b) {
  const def = b.pickup;
  return { M: def, T: def, W: def, Th: def, F: def, ...(b.pickupByDay || {}) };
}

export function blockDropoffByDay(b) {
  const def = b.dropoff;
  return { M: def, T: def, W: def, Th: def, F: def, ...(b.dropoffByDay || {}) };
}

export function blockPickupParents(b, members) {
  const m = blockPickupByDay(b);
  return [...new Set(DAYS.map(d => m[d.key]))].map(id => members.find(p => p.id === id)).filter(Boolean);
}

export function blockDropoffParents(b, members) {
  const m = blockDropoffByDay(b);
  return [...new Set(DAYS.map(d => m[d.key]))].map(id => members.find(p => p.id === id)).filter(Boolean);
}

export function buildCarpoolIndex(blocks) {
  const idx = {};
  blocks.forEach(b => {
    const key = `${b.weekIdx}__${b.campName.toLowerCase()}`;
    if (!idx[key]) idx[key] = [];
    idx[key].push(b);
  });
  return idx;
}
