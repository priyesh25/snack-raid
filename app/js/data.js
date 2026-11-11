// Snack Raid: game data. Numbers follow docs/game-design.md.
export const T = 64; // tile size in logical pixels
export const VERSION = '0.1.0';

// ---------------------------------------------------------------- snacks
export const SNACKS = {
  juice: { name: 'Juice box', pts: 100, slots: 1 },
  cookie: { name: 'Cookie', pts: 100, slots: 1, trait: 'crumbs' },
  chips: { name: 'Chips', pts: 150, slots: 1, trait: 'crinkle' },
  soda: { name: 'Soda', pts: 200, slots: 1, trait: 'fizz' },
  chocolate: { name: 'Chocolate', pts: 250, slots: 1 },
  pizza: { name: 'Cold pizza', pts: 300, slots: 1, trait: 'smelly' },
  jelly: { name: 'Jelly cup', pts: 300, slots: 1, trait: 'wobbly' },
  popcorn: { name: 'Popcorn', pts: 350, slots: 2 },
  cereal: { name: 'Cereal', pts: 350, slots: 2, trait: 'wobbly' },
  icecream: { name: 'Ice cream', pts: 400, slots: 1, trait: 'melts' },
  cake: { name: 'Cake slice', pts: 500, slots: 2, trait: 'twohands' },
  donut: { name: 'Golden Donut', pts: 2000, slots: 1, trait: 'glows' },
  popbag: { name: 'Popcorn bag', pts: 0, slots: 1, raw: true },
};

// ---------------------------------------------------------------- gadgets
// uses: charges per night at level 1 (0 = always on). ready: playable in this build.
export const GADGETS = {
  socks: { name: 'Fuzzy Socks', type: 'Sneak', uses: 0, price: 0, gift: 2, ready: true,
    desc: 'Quieter steps on wood and tile. Tap its button to sock slide.' },
  slippers: { name: 'Bunny Slippers', type: 'Sneak', uses: 0, price: 300, ready: true,
    desc: 'Toy bricks cannot hurt you. No sliding.' },
  oil: { name: 'Oil Can', type: 'Sneak', uses: 3, price: 250, ready: true,
    desc: 'Silences a door or a creaky board for the night.' },
  muffler: { name: 'Pillow Muffler', type: 'Sneak', uses: 2, price: 400, gift: 7, ready: true,
    desc: 'Arm it. The next beep, alarm or spill makes no noise.' },
  biscuits: { name: 'Good Boy Biscuits', type: 'Distract', uses: 3, price: 150, gift: 3, ready: true,
    desc: 'Biscuit eats for 20 seconds, then sleeps with full Zs.' },
  decoy: { name: 'Squeaky Decoy', type: 'Distract', uses: 2, price: 300, ready: true,
    desc: 'Throw it. It squeaks for 5 seconds and pulls attention.' },
  goggles: { name: 'Night Goggles', type: 'Sense', uses: 2, price: 500, ready: true,
    desc: 'Shows creaky boards, the Secret Stash and every vision cone.' },
  dummy: { name: 'Pillow Dummy', type: 'Rescue', uses: 1, price: 0, gift: 6, ready: true,
    desc: 'Tuck it in your bed. Mom\'s bed check passes.' },
  cape: { name: 'Blanket Cape', type: 'Sneak', uses: 2, price: 500, desc: 'Hide anywhere for 5 seconds.' },
  box: { name: 'Cardboard Box', type: 'Sneak', uses: 1, price: 900, desc: 'A hiding spot you carry.' },
  laser: { name: 'Laser Pointer', type: 'Distract', uses: 1, price: 450, desc: 'Lead the cat or the dog anywhere.' },
  clicker: { name: 'Clicker', type: 'Distract', uses: 3, price: 600, desc: 'Flip lights and TVs from far away.' },
  toot: { name: 'Toot Box', type: 'Distract', uses: 2, price: 700, desc: 'Remote whoopee cushion.' },
  rccar: { name: 'RC Car', type: 'Distract', uses: 1, price: 1200, desc: 'Carries a snack home or honks far away.' },
  radar: { name: 'Mom Radar', type: 'Sense', uses: 0, price: 800, desc: 'Always points to Mom.' },
  pacifier: { name: 'Pacifier', type: 'Rescue', uses: 2, price: 200, desc: 'Baby Boo stops crying at once.' },
  musicbox: { name: 'Music Box', type: 'Rescue', uses: 1, price: 650, desc: 'A lullaby that gives Zs back.' },
  claw: { name: 'Grabby Claw', type: 'Reach', uses: 3, price: 550, desc: 'Grab a snack from 3 tiles away.' },
  drone: { name: 'Snack Drone', type: 'Reach', uses: 1, price: 2000, desc: 'Flies one snack to your stash.' },
};
export const UPGRADE_COST = [0, 100, 250, 500, 1000]; // cost to reach level 2..5
export const TYPE_COLOR = { Sneak: '#7FB4FF', Distract: '#FFA630', Sense: '#4CCB7A', Rescue: '#FF7EB6', Reach: '#FFE08A' };

export function gadgetCharges(id, lvl) {
  const g = GADGETS[id];
  if (!g.uses) return 0;
  return g.uses + Math.floor(lvl / 2); // +1 charge at levels 2 and 4
}

// ---------------------------------------------------------------- ranks
export const RANKS = [
  { title: 'Crumb Rookie', need: 0, reward: 'The start' },
  { title: 'Cookie Cadet', need: 500, reward: 'Second gadget slot' },
  { title: 'Tiptoe Trainee', need: 1500, reward: 'Hoodie Pouch: carry 3 snacks' },
  { title: 'Pantry Prowler', need: 3000, reward: 'Lunchbox' },
  { title: 'Fridge Phantom', need: 5000, reward: 'Third gadget slot' },
  { title: 'Sofa Shadow', need: 8000, reward: 'Backpack: carry 4 snacks' },
  { title: 'Midnight Ninja', need: 12000, reward: 'Lunchbox' },
  { title: 'Snack Master', need: 17000, reward: 'Cooler' },
  { title: 'Kitchen Ghost', need: 23000, reward: 'Pillowcase Sack: carry 5 snacks' },
  { title: 'Legend of the Fridge', need: 30000, reward: 'Golden Picnic Basket' },
];

// ---------------------------------------------------------------- pajamas
export const PAJAMAS = [
  { id: 'dino', name: 'Dino Onesie', sprite: 'kid_dino', price: 0 },
  { id: 'star', name: 'Star Pajamas', sprite: 'kid_star', price: 0 },
  { id: 'dino_ice', name: 'Ice Dino', sprite: 'kid_dino_ice', price: 300 },
  { id: 'star_sunset', name: 'Sunset Stars', sprite: 'kid_star_sunset', price: 800 },
  { id: 'dino_lava', name: 'Lava Dino', sprite: 'kid_dino_lava', promo: true },
  { id: 'star_midnight', name: 'Midnight Stars', sprite: 'kid_star_midnight', promo: true },
  { id: 'dino_gold', name: 'Golden Dino', sprite: 'kid_dino_gold', promo: true },
];

export const EXCUSES = [
  'I was sleepwalking!', 'I heard a burglar. In the fridge.', 'The dog asked me to.', 'Science project.',
  'I was checking the fridge light still works.', 'My tummy made me do it.', 'I was getting YOU a snack.',
  'I thought it was morning.', 'Biscuit looked hungry.', 'I am just a very realistic dream.',
];

// ---------------------------------------------------------------- the house (World 1)
// Upstairs: kid | nursery | parents | Mika | bath, then a hallway. Stairs on the right lead down
// to the hall, the living room and the kitchen.
export const DOORS = [
  { id: 'kid', x: 3, y: 5 }, { id: 'nursery', x: 9, y: 5 }, { id: 'parents', x: 16, y: 5 },
  { id: 'mika', x: 23, y: 5 }, { id: 'bath', x: 27, y: 5 },
];

// Bedrooms, in tiles. Sound passes a bedroom wall only through its door (see World.soundDoors).
export const ROOMS = [
  { door: 'kid', x: 1, y: 1, w: 5, h: 4 }, { door: 'nursery', x: 7, y: 1, w: 5, h: 4 }, { door: 'parents', x: 13, y: 1, w: 7, h: 4 },
  { door: 'mika', x: 21, y: 1, w: 5, h: 4 }, { door: 'bath', x: 27, y: 1, w: 2, h: 4 },
];

export function buildHouse() {
  const W = 30, H = 19;
  const g = Array.from({ length: H }, () => Array(W).fill('#'));
  const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; };
  fill(1, 1, 5, 4, 'c');     // kid's room
  fill(7, 1, 11, 4, 'c');    // nursery
  fill(13, 1, 19, 4, 'c');   // parents
  fill(21, 1, 25, 4, 'c');   // Mika
  fill(27, 1, 28, 4, 't');   // bathroom
  fill(1, 6, 28, 7, 'w');    // upstairs hallway
  fill(24, 8, 27, 9, 's');   // stairs
  fill(1, 10, 12, 17, 't');  // kitchen
  fill(14, 10, 22, 17, 'c'); // living room
  fill(24, 10, 28, 17, 'w'); // downstairs hall
  g[12][13] = 'w'; g[13][13] = 'w'; // kitchen to living room arch
  g[14][23] = 'w'; g[15][23] = 'w'; // living room to hall arch
  for (const d of DOORS) g[d.y][d.x] = 'w';
  return g;
}

// Furniture. solid blocks movement, tall blocks sight, hide is a hiding spot.
export const OBJECTS = [
  // kid's room
  { id: 'kidbed', t: 'kidbed', x: 1, y: 1, w: 2, h: 2, solid: 1 },
  { id: 'toychest', t: 'toychest', x: 5, y: 1, w: 1, h: 1, solid: 1 },
  { id: 'kdesk', t: 'desk', x: 5, y: 4, w: 1, h: 1, solid: 1 },
  { id: 'krug', t: 'rug', x: 3, y: 2, w: 2, h: 2, col: '#4CCB7A' },
  // nursery
  { id: 'crib', t: 'crib', x: 10, y: 4, w: 2, h: 1, solid: 1 },
  { id: 'rocker', t: 'armchair', x: 7, y: 1, w: 1, h: 1, solid: 1, col: '#FFD166' },
  { id: 'nshelf', t: 'shelf', x: 11, y: 1, w: 1, h: 1, solid: 1, tall: 1 },
  { id: 'nrug', t: 'rug', x: 8, y: 2, w: 2, h: 2, col: '#FF7EB6' },
  // parents
  { id: 'bigbed', t: 'bigbed', x: 13, y: 3, w: 3, h: 2, solid: 1 },
  { id: 'nightstand', t: 'nightstand', x: 16, y: 3, w: 1, h: 1, solid: 1 },
  { id: 'wardrobe', t: 'wardrobe', x: 18, y: 1, w: 2, h: 1, solid: 1, tall: 1 },
  { id: 'dresser', t: 'dresser', x: 19, y: 3, w: 1, h: 2, solid: 1 },
  // Mika
  { id: 'mbed', t: 'bed', x: 24, y: 1, w: 2, h: 2, solid: 1, col: '#2EC4B6' },
  { id: 'mdesk', t: 'desk', x: 21, y: 1, w: 2, h: 1, solid: 1 },
  // bathroom
  { id: 'bsink', t: 'sink', x: 27, y: 1, w: 1, h: 1, solid: 1 },
  { id: 'toilet', t: 'toilet', x: 28, y: 1, w: 1, h: 1, solid: 1 },
  { id: 'tub', t: 'tub', x: 28, y: 3, w: 1, h: 2, solid: 1 },
  // upstairs hallway
  { id: 'chute', t: 'chute', x: 1, y: 6, w: 1, h: 1 },
  { id: 'basket', t: 'basket', x: 6, y: 6, w: 1, h: 1, solid: 1, hide: 1 },
  { id: 'hplant', t: 'plant', x: 12, y: 6, w: 1, h: 1, solid: 1 },
  { id: 'curtain', t: 'curtain', x: 20, y: 6, w: 1, h: 1, solid: 1, hide: 1 },
  // downstairs hall
  { id: 'coat', t: 'wardrobe', x: 28, y: 10, w: 1, h: 1, solid: 1, tall: 1 },
  { id: 'bench', t: 'dresser', x: 28, y: 15, w: 1, h: 2, solid: 1 },
  { id: 'dock', t: 'dock', x: 24, y: 17, w: 1, h: 1 },
  // living room
  { id: 'sofa', t: 'sofa', x: 15, y: 10, w: 4, h: 1, solid: 1 },
  { id: 'coffee', t: 'coffee', x: 16, y: 12, w: 2, h: 1, solid: 1 },
  { id: 'tv', t: 'tv', x: 15, y: 17, w: 4, h: 1, solid: 1 },
  { id: 'bookshelf', t: 'bookshelf', x: 20, y: 10, w: 2, h: 1, solid: 1, tall: 1 },
  { id: 'armchair', t: 'armchair', x: 22, y: 10, w: 1, h: 1, solid: 1, col: '#7B61FF' },
  { id: 'dtable', t: 'table', x: 20, y: 16, w: 2, h: 2, solid: 1, hide: 1 },
  { id: 'lplant', t: 'plant', x: 14, y: 17, w: 1, h: 1, solid: 1 },
  // kitchen
  { id: 'pantry', t: 'pantry', x: 1, y: 10, w: 1, h: 2, solid: 1, tall: 1 },
  { id: 'counter', t: 'counter', x: 2, y: 10, w: 8, h: 1, solid: 1 },
  { id: 'fridge', t: 'fridge', x: 11, y: 10, w: 2, h: 1, solid: 1, tall: 1 },
  { id: 'ktable', t: 'table', x: 5, y: 14, w: 3, h: 2, solid: 1, hide: 1 },
  { id: 'trash', t: 'trash', x: 12, y: 17, w: 1, h: 1, solid: 1 },
  { id: 'washer', t: 'washer', x: 1, y: 17, w: 1, h: 1, solid: 1 },
];
// Things that sit on the counter (tile x on row 10)
export const COUNTER = { sink: 3, jar: 6, microwave: 9 };

export const SPOTS = {
  kidBed: [2.0, 1.75],      // where the raider lies in bed
  kidExit: [3, 2],          // tile you stand on after getting up
  bedCheck: [3, 3],         // tile Mom checks the bed from
  mom: { bed: [13.8, 3.75], exit: [13, 2] },
  dad: { bed: [15.2, 3.75], exit: [15, 2] },
  sofa: { bed: [16.6, 10.8], exit: [16, 11] },   // where Dad dozes off in front of the TV
  baby: [11.0, 4.45],
  mika: [23, 3],
  chuteOut: [2, 16],
  sinkStand: [3, 11], bathStand: [27, 2], fridgeStand: [11, 11], counterStand: [8, 11],
};

// Light zones (in tiles). Standing in one makes you visible from 5 tiles instead of 2.
export const LIGHTS = [
  { kind: 'circle', x: 9.5, y: 6.7, r: 1.7, col: '#FFA630' },   // night light by the nursery
  { kind: 'rect', x: 2, y: 11, w: 3, h: 2, col: '#7FB4FF' },     // moonlight in the kitchen
  { kind: 'rect', x: 19, y: 11, w: 3, h: 2, col: '#7FB4FF' },    // moonlight in the living room
];

// ---------------------------------------------------------------- nights
const B = (x, y, c) => [x, y, c];
export const LEVELS = [
  { n: 1, name: 'Cookie Run', craving: 'cookie', extras: ['juice', 'chips'],
    blurb: 'Tiptoe, grab, back to bed. Only Dad is home, snoring.',
    snacks: [{ id: 'cookie', src: 'jar' }, { id: 'juice', src: 'loose', at: [6.5, 14.6] }, { id: 'chips', src: 'loose', at: [17, 12.4] }],
    home: { dad: {} }, allCarpet: true, doorsOpen: ['kid'],
    stash: 'bookshelf',
    tips: ['Push the stick a little to TIPTOE. Push it all the way to run.', 'The stairs are on the right. The kitchen is downstairs, on the left.',
      'Grab the cookie from the jar, then take it back to your bed.'] },
  { n: 2, name: 'The Third Stair', craving: 'juice', extras: ['cookie', 'chocolate'], gift: 'socks',
    blurb: 'Wood floors creak. Move when Dad snores.',
    snacks: [{ id: 'juice', src: 'loose', at: [4.5, 10.5] }, { id: 'cookie', src: 'jar' }, { id: 'chocolate', src: 'loose', at: [16.5, 3.5] }],
    home: { dad: {} }, doorsOpen: ['kid', 'parents'],
    creaks: [[11, 6], [14, 6], [15, 6], [17, 6], [21, 7], [25, 8], [26, 9], [25, 11]],
    stash: 'sofa',
    tips: ['Some boards CREAK. Once you find one, it stays marked.', 'The blue wave is Dad\'s snore. Noise you make inside it is covered.',
      'There is chocolate on Dad\'s nightstand. Dare you?'] },
  { n: 3, name: 'Good Boy, Biscuit', craving: 'chips', extras: ['cookie', 'juice'], gift: 'biscuits',
    blurb: 'The dog sleeps by the kitchen. Chips crinkle. Cookies leave crumbs.',
    snacks: [{ id: 'chips', src: 'loose', at: [7.5, 10.5] }, { id: 'cookie', src: 'jar' }, { id: 'juice', src: 'loose', at: [6.5, 14.6] }],
    home: { dad: {}, biscuit: { at: [11.5, 13.2] } }, doorsOpen: ['kid', 'parents'],
    creaks: [[13, 7], [21, 6], [26, 8], [25, 12], [18, 13]],
    stash: 'pantry',
    tips: ['Biscuit wakes easily. If he finds you, PET him before he barks.', 'Chips crinkle unless you tiptoe. Running with a cookie drops crumbs.'] },
  { n: 4, name: 'Fridge Light', craving: 'pizza', extras: ['juice', 'chocolate'],
    blurb: 'The fridge lights up the kitchen and beeps if left open. Biscuit can smell pizza.',
    snacks: [{ id: 'pizza', src: 'fridge' }, { id: 'juice', src: 'fridge' }, { id: 'chocolate', src: 'loose', at: [17, 12.4] }],
    home: { dad: {}, mom: {}, biscuit: { at: [8.5, 12.6] } }, doorsOpen: ['kid', 'parents'],
    creaks: [[8, 7], [14, 6], [20, 7], [25, 9], [26, 11], [15, 14]],
    stash: 'tv',
    tips: ['Hold the button to ease the fridge open. Let go in the green.', 'Shut the fridge when you are done. After 5 seconds it beeps.'] },
  { n: 5, name: 'Brick Minefield', craving: 'soda', extras: ['chips', 'cookie'],
    blurb: 'Toy bricks everywhere, Dad asleep on the sofa, and a soda you must not shake.',
    snacks: [{ id: 'soda', src: 'fridge' }, { id: 'chips', src: 'loose', at: [17, 17.3] }, { id: 'cookie', src: 'jar' }],
    home: { dad: { sofa: true }, mom: {}, biscuit: { at: [26.5, 13.5] } }, doorsOpen: ['kid'],
    bricks: [B(15, 13, 'red'), B(16, 14, 'blue'), B(17, 13, 'yellow'), B(18, 15, 'green'), B(19, 13, 'red'), B(20, 14, 'yellow'),
      B(15, 15, 'yellow'), B(17, 15, 'red'), B(19, 15, 'blue'), B(21, 13, 'green'), B(16, 16, 'green'), B(18, 12, 'blue'),
      B(14, 14, 'blue'), B(21, 15, 'red'), B(22, 13, 'yellow')],
    creaks: [[10, 6], [17, 7], [24, 8], [27, 9], [25, 14]],
    stash: 'armchair',
    tips: ['Stepping on a brick HURTS and it is loud. Find a path through.', 'Dad dozed off on the sofa. Cross on his snore. Do not run with the soda.'] },
  { n: 6, name: 'Mom\'s Water Run', craving: 'icecream', extras: ['jelly', 'cookie'], gift: 'dummy',
    blurb: 'Mom walks at 2:00. Hide from her eyes. Ice cream melts in 45 seconds.',
    snacks: [{ id: 'icecream', src: 'fridge' }, { id: 'jelly', src: 'fridge' }, { id: 'cookie', src: 'jar' }],
    home: { dad: {}, mom: { errand: 2, bedCheck: true }, biscuit: { at: [26.5, 16.2] } }, doorsOpen: ['kid', 'parents'],
    creaks: [[6, 7], [11, 6], [18, 7], [22, 6], [26, 8], [24, 12], [13, 12]],
    stash: 'bsink',
    tips: ['Leave the Pillow Dummy in your bed before you go.', 'At 2:00 Mom gets a glass of water. Stay out of her yellow cone. Tables make good hiding spots.'] },
  { n: 7, name: 'Popcorn Problem', craving: 'popcorn', extras: ['soda', 'chocolate'], gift: 'muffler',
    blurb: 'The microwave sits right under Baby Boo\'s room. Stop it at 0:01.',
    snacks: [{ id: 'popcorn', src: 'microwave' }, { id: 'soda', src: 'fridge' }, { id: 'chocolate', src: 'loose', at: [21, 10.5] }],
    home: { dad: {}, mom: { bedCheck: true }, baby: {}, biscuit: { at: [26.5, 16.2] } }, doorsOpen: ['kid', 'nursery', 'parents'],
    creaks: [[7, 6], [10, 7], [15, 6], [19, 7], [25, 9], [27, 12], [14, 13]],
    stash: 'nshelf',
    tips: ['Get the popcorn bag from the pantry, then use the microwave.', 'Hit STOP at exactly 0:01. If it beeps, Baby Boo wakes up. Rock the crib to calm him.'] },
  { n: 8, name: 'Dusty\'s Night Shift', craving: 'cake', extras: ['icecream', 'chips'],
    blurb: 'The robo-vac patrols downstairs. Mika is awake until 2:00 and charges Snack Tax.',
    snacks: [{ id: 'cake', src: 'fridge' }, { id: 'icecream', src: 'fridge' }, { id: 'chips', src: 'loose', at: [17, 12.4] }],
    home: { dad: {}, mom: { bedCheck: true }, baby: {}, mika: {}, biscuit: { at: [21.5, 12.5] },
      dusty: { from: 1, route: [[25, 12], [25, 16], [22, 15], [15, 15], [14, 12], [10, 12], [3, 13], [3, 16], [10, 16], [12, 13], [15, 13], [22, 14]] } },
    doorsOpen: ['kid', 'mika', 'nursery'],
    creaks: [[5, 7], [12, 7], [18, 6], [25, 8], [26, 10], [16, 14]],
    stash: 'mdesk',
    tips: ['Cake needs both hands. No gadgets while you carry it.', 'Mika cannot hear you, but she can see you. Hop on Dusty for a silent ride.'] },
  { n: 9, name: 'Sugar Dream', craving: null, extras: [], type: 'dream',
    blurb: 'A sugar-rush dream. Nobody can bust you. Grab every coin you can in 60 seconds.',
    snacks: [], home: {}, doorsOpen: ['kid', 'nursery', 'parents', 'mika', 'bath'], allCarpet: true,
    tips: ['It is only a dream. RUN!'] },
  { n: 10, name: 'Dad\'s Midnight Raid', craving: 'cake', extras: ['juice', 'cookie'], type: 'boss',
    blurb: 'Dad is sneaking down for the last slice of birthday cake. So are you.',
    snacks: [{ id: 'cake', src: 'plate' }, { id: 'juice', src: 'fridge' }, { id: 'cookie', src: 'jar' }],
    home: { dad: { boss: true }, mom: { bedCheck: true }, baby: {}, biscuit: { at: [26.5, 16.2] } }, doorsOpen: ['kid', 'parents'],
    creaks: [[9, 7], [14, 6], [20, 7], [25, 8], [26, 9], [24, 13], [14, 12]],
    stash: 'toilet',
    tips: ['Dad gets up soon. Take the laundry chute by your door to beat him to the kitchen.',
      'Hide while he looks around. Swipe the cake from his plate when his back is turned.'] },
];

export const STASH_HINT = {
  bookshelf: 'behind the cookbooks', sofa: 'under the sofa cushions', pantry: 'on the top pantry shelf',
  tv: 'behind the TV', armchair: 'down the side of the armchair', bsink: 'in the bathroom cabinet',
  nshelf: 'on the nursery toy shelf', mdesk: 'in Mika\'s desk drawer', toilet: 'taped behind the toilet',
};
