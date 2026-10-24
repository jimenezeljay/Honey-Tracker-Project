// Mock data for the frontend, shaped like the data model in the Frontend Handoff doc.
// Chain: keeper -> farm -> hive -> harvest batch -> listing.
//
// Pages never read MOCK directly. They call the async helpers at the bottom
// (getListings, getListing, getFarm). When the backend is ready, only those
// helpers change to fetch() calls, e.g.
//   async function getListings() { return (await fetch(API + '/listings')).json(); }
// and every page keeps working unchanged.
//
// Every name, farm and number here is invented sample data.
// Units match the wireframes: prices in USD, harvests in lb, jars in oz.

const MOCK = {
  keepers: [
    { id: 1, displayName: 'Ruth Hollis',    photo: null, bio: 'Third-generation keeper on the Ohio River hills.',      applicationStatus: 'approved', certification: 'certified' },
    { id: 2, displayName: 'Daniel Ostrow',  photo: null, bio: 'Hobbyist turned keeper; hives on old orchard ground.',   applicationStatus: 'approved', certification: 'certified' },
    { id: 3, displayName: 'Mara Lindqvist', photo: null, bio: 'Small apiary beside a wildflower meadow restoration.',   applicationStatus: 'approved', certification: 'certified' },
    { id: 4, displayName: 'Joe Pacheco',    photo: null, bio: 'Keeps bees near buckwheat and clover fields.',          applicationStatus: 'approved', certification: 'pending' },
    { id: 5, displayName: 'Anne Whitfield', photo: null, bio: 'Basswood and goldenrod country, high in the hills.',     applicationStatus: 'approved', certification: 'certified' },
    { id: 6, displayName: 'Sam Okafor',     photo: null, bio: 'Moves hives with the citrus bloom each spring.',         applicationStatus: 'approved', certification: 'certified' }
  ],

  // precision: 'exact' shows the hive pin; 'approximate' only shows an area
  // (the API should send rounded coordinates for those, never the real spot).
  // verification: 'volunteer' (checked in person) or 'self-reported'.
  farms: [
    { id: 1, keeperId: 1, name: 'Sunrise Farm',       description: 'Hillside hives above the Ohio River.',  photo: null, county: 'Jefferson',  state: 'OH', lat: 40.36,  lng: -80.65,  precision: 'exact',       verification: 'volunteer',     certified: true },
    { id: 2, keeperId: 2, name: 'Maple Ridge Apiary', description: 'Hives among old apple and maple trees.', photo: null, county: 'Washington', state: 'PA', lat: 40.2,   lng: -80.2,   precision: 'approximate', verification: 'self-reported', certified: true },
    { id: 3, keeperId: 3, name: 'Clover Hill',        description: 'Beside a restored wildflower meadow.',   photo: null, county: 'Ohio',       state: 'WV', lat: 40.06,  lng: -80.69,  precision: 'exact',       verification: 'volunteer',     certified: true },
    { id: 4, keeperId: 4, name: 'Buckeye Bee Co.',    description: 'Buckwheat and clover fields all summer.', photo: null, county: 'Holmes',     state: 'OH', lat: 40.6,   lng: -81.9,   precision: 'approximate', verification: 'self-reported', certified: false },
    { id: 5, keeperId: 5, name: 'Green Mountain Hives', description: 'Basswood forest and late goldenrod.',  photo: null, county: 'Addison',    state: 'VT', lat: 44.01,  lng: -73.17,  precision: 'exact',       verification: 'volunteer',     certified: true },
    { id: 6, keeperId: 6, name: 'Citrus Grove Apiary', description: 'Orange blossom honey from grove hives.', photo: null, county: 'Lake',       state: 'FL', lat: 28.8,   lng: -81.7,   precision: 'approximate', verification: 'self-reported', certified: true }
  ],

  hives: [
    { id: 1,  farmId: 1, label: 'H1', lat: 40.362, lng: -80.652, forageRadiusMi: 2, beeType: 'Italian' },
    { id: 2,  farmId: 1, label: 'H2', lat: 40.358, lng: -80.647, forageRadiusMi: 2, beeType: 'Italian' },
    { id: 3,  farmId: 1, label: 'H3', lat: 40.365, lng: -80.641, forageRadiusMi: 2, beeType: 'Carniolan' },
    { id: 4,  farmId: 2, label: 'H1', lat: 40.2,   lng: -80.2,   forageRadiusMi: 3, beeType: 'Carniolan' },
    { id: 5,  farmId: 2, label: 'H2', lat: 40.2,   lng: -80.2,   forageRadiusMi: 3, beeType: 'Carniolan' },
    { id: 6,  farmId: 3, label: 'H1', lat: 40.061, lng: -80.688, forageRadiusMi: 2, beeType: 'Russian' },
    { id: 7,  farmId: 4, label: 'H1', lat: 40.6,   lng: -81.9,   forageRadiusMi: 3, beeType: 'Italian' },
    { id: 8,  farmId: 4, label: 'H2', lat: 40.6,   lng: -81.9,   forageRadiusMi: 3, beeType: 'Italian' },
    { id: 9,  farmId: 5, label: 'H1', lat: 44.012, lng: -73.171, forageRadiusMi: 2, beeType: 'Carniolan' },
    { id: 10, farmId: 5, label: 'H2', lat: 44.009, lng: -73.165, forageRadiusMi: 2, beeType: 'Carniolan' },
    { id: 11, farmId: 6, label: 'H1', lat: 28.8,   lng: -81.7,   forageRadiusMi: 3, beeType: 'Italian' }
  ],

  practices: [
    { farmId: 1, feedingNotes: 'No sugar feeding during honey flow.', pestNotes: 'Oxalic acid for mites, outside of flow only.' },
    { farmId: 2, feedingNotes: 'Fall sugar syrup only, after harvest.', pestNotes: 'Screened bottom boards; no synthetic miticides.' },
    { farmId: 3, feedingNotes: 'No feeding.', pestNotes: 'Drone-brood removal for mites.' },
    { farmId: 4, feedingNotes: 'Spring pollen patties.', pestNotes: 'Formic acid pads in late summer.' },
    { farmId: 5, feedingNotes: 'No feeding.', pestNotes: 'Oxalic acid in winter broodless period.' },
    { farmId: 6, feedingNotes: 'Sugar syrup between blooms.', pestNotes: 'Thymol treatment in fall.' }
  ],

  nearbyFlowers: [
    { farmId: 1, flowers: ['Clover', 'Goldenrod', 'Aster'],       pesticideNotes: 'No spraying within the forage radius.' },
    { farmId: 2, flowers: ['Apple', 'Maple', 'Dandelion'],         pesticideNotes: 'Orchard neighbor sprays after bloom only.' },
    { farmId: 3, flowers: ['Wildflowers', 'Clover', 'Black locust'], pesticideNotes: 'None reported.' },
    { farmId: 4, flowers: ['Buckwheat', 'Clover', 'Alfalfa'],      pesticideNotes: 'Field crops nearby; keeper tracks spray dates.' },
    { farmId: 5, flowers: ['Basswood', 'Goldenrod', 'Fireweed'],   pesticideNotes: 'None reported.' },
    { farmId: 6, flowers: ['Orange blossom', 'Saw palmetto'],      pesticideNotes: 'Grove spray schedule shared with keeper.' }
  ],

  // flags: 'creamed', 'single-hive'
  batches: [
    { id: 1,  batchNumber: '0001', hiveIds: [1, 2, 3], harvestDate: '2026-06-14', season: 'Spring 2026', quantityLb: 40,  honeyType: 'Wildflower',     flowerTypes: ['Clover', 'Aster'],          flags: [],                       notes: '', traceUrl: 'product.html?id=1' },
    { id: 2,  batchNumber: '0002', hiveIds: [1, 2],    harvestDate: '2026-09-02', season: 'Fall 2026',   quantityLb: 32,  honeyType: 'Goldenrod',      flowerTypes: ['Goldenrod', 'Aster'],       flags: ['creamed'],              notes: '', traceUrl: 'product.html?id=2' },
    { id: 3,  batchNumber: '0003', hiveIds: [4, 5],    harvestDate: '2026-05-28', season: 'Spring 2026', quantityLb: 55,  honeyType: 'Wildflower',     flowerTypes: ['Apple', 'Dandelion'],       flags: [],                       notes: '', traceUrl: 'product.html?id=3' },
    { id: 4,  batchNumber: '0004', hiveIds: [4, 5],    harvestDate: '2026-07-20', season: 'Summer 2026', quantityLb: 48,  honeyType: 'Clover',         flowerTypes: ['Clover'],                   flags: ['creamed'],              notes: '', traceUrl: 'product.html?id=4' },
    { id: 5,  batchNumber: '0005', hiveIds: [6],       harvestDate: '2026-06-30', season: 'Summer 2026', quantityLb: 22,  honeyType: 'Wildflower',     flowerTypes: ['Wildflowers', 'Black locust'], flags: ['single-hive'],       notes: '', traceUrl: 'product.html?id=5' },
    { id: 6,  batchNumber: '0006', hiveIds: [7, 8],    harvestDate: '2026-08-25', season: 'Summer 2026', quantityLb: 60,  honeyType: 'Buckwheat',      flowerTypes: ['Buckwheat'],                flags: [],                       notes: '', traceUrl: 'product.html?id=6' },
    { id: 7,  batchNumber: '0007', hiveIds: [9, 10],   harvestDate: '2026-07-12', season: 'Summer 2026', quantityLb: 70,  honeyType: 'Basswood',       flowerTypes: ['Basswood'],                 flags: [],                       notes: '', traceUrl: 'product.html?id=7' },
    { id: 8,  batchNumber: '0008', hiveIds: [9],       harvestDate: '2026-09-15', season: 'Fall 2026',   quantityLb: 18,  honeyType: 'Goldenrod',      flowerTypes: ['Goldenrod', 'Fireweed'],    flags: ['single-hive', 'creamed'], notes: '', traceUrl: 'product.html?id=8' },
    { id: 9,  batchNumber: '0009', hiveIds: [11],      harvestDate: '2026-04-10', season: 'Spring 2026', quantityLb: 90,  honeyType: 'Orange blossom', flowerTypes: ['Orange blossom'],           flags: ['single-hive'],          notes: '', traceUrl: 'product.html?id=9' },
    { id: 10, batchNumber: '0010', hiveIds: [7],       harvestDate: '2026-06-05', season: 'Spring 2026', quantityLb: 25,  honeyType: 'Clover',         flowerTypes: ['Clover', 'Alfalfa'],        flags: ['single-hive'],          notes: '', traceUrl: 'product.html?id=10' }
  ],

  // Pollen profile per batch (percent adds up to 100). Product page pie chart.
  pollen: [
    { batchId: 1,  flower: 'Clover', percent: 45 }, { batchId: 1,  flower: 'Aster', percent: 30 },     { batchId: 1,  flower: 'Goldenrod', percent: 25 },
    { batchId: 2,  flower: 'Goldenrod', percent: 70 }, { batchId: 2,  flower: 'Aster', percent: 30 },
    { batchId: 3,  flower: 'Apple', percent: 50 },  { batchId: 3,  flower: 'Dandelion', percent: 35 }, { batchId: 3,  flower: 'Maple', percent: 15 },
    { batchId: 4,  flower: 'Clover', percent: 85 }, { batchId: 4,  flower: 'Dandelion', percent: 15 },
    { batchId: 5,  flower: 'Black locust', percent: 40 }, { batchId: 5, flower: 'Wildflowers', percent: 40 }, { batchId: 5, flower: 'Clover', percent: 20 },
    { batchId: 6,  flower: 'Buckwheat', percent: 90 }, { batchId: 6,  flower: 'Clover', percent: 10 },
    { batchId: 7,  flower: 'Basswood', percent: 80 }, { batchId: 7,  flower: 'Clover', percent: 20 },
    { batchId: 8,  flower: 'Goldenrod', percent: 65 }, { batchId: 8,  flower: 'Fireweed', percent: 35 },
    { batchId: 9,  flower: 'Orange blossom', percent: 95 }, { batchId: 9, flower: 'Saw palmetto', percent: 5 },
    { batchId: 10, flower: 'Clover', percent: 60 }, { batchId: 10, flower: 'Alfalfa', percent: 40 }
  ],

  // Chain of custody. stage: 'bloom', 'harvest', 'jarred'
  timeline: [
    { batchId: 1, date: '2026-04-20', stage: 'bloom',   location: 'Jefferson County, OH' },
    { batchId: 1, date: '2026-06-14', stage: 'harvest', location: 'Jefferson County, OH' },
    { batchId: 1, date: '2026-06-21', stage: 'jarred',  location: 'Jefferson County, OH' }
  ],

  // badges: 'certified', 'raw', 'pure', 'creamed', 'single-hive', 'volunteer-verified'
  listings: [
    { id: 1,  batchId: 1,  title: 'Wildflower Honey',     photo: null, price: 14,   jarOz: 12, stock: 24, badges: ['certified', 'raw', 'volunteer-verified'] },
    { id: 2,  batchId: 2,  title: 'Creamed Goldenrod',    photo: null, price: 16,   jarOz: 12, stock: 10, badges: ['certified', 'creamed', 'volunteer-verified'] },
    { id: 3,  batchId: 3,  title: 'Orchard Wildflower',   photo: null, price: 13,   jarOz: 16, stock: 30, badges: ['certified', 'raw'] },
    { id: 4,  batchId: 4,  title: 'Creamed Clover',       photo: null, price: 12.5, jarOz: 12, stock: 18, badges: ['certified', 'creamed', 'pure'] },
    { id: 5,  batchId: 5,  title: 'Meadow Wildflower',    photo: null, price: 18,   jarOz: 8,  stock: 6,  badges: ['certified', 'single-hive', 'volunteer-verified'] },
    { id: 6,  batchId: 6,  title: 'Dark Buckwheat Honey', photo: null, price: 11,   jarOz: 16, stock: 40, badges: ['raw'] },
    { id: 7,  batchId: 7,  title: 'Basswood Honey',       photo: null, price: 15,   jarOz: 12, stock: 22, badges: ['certified', 'raw', 'pure', 'volunteer-verified'] },
    { id: 8,  batchId: 8,  title: 'Single-Hive Goldenrod', photo: null, price: 20,  jarOz: 8,  stock: 4,  badges: ['certified', 'single-hive', 'creamed', 'volunteer-verified'] },
    { id: 9,  batchId: 9,  title: 'Orange Blossom Honey', photo: null, price: 17,   jarOz: 16, stock: 35, badges: ['certified', 'pure', 'single-hive'] },
    { id: 10, batchId: 10, title: 'Clover Honey',         photo: null, price: 9.5,  jarOz: 12, stock: 0,  badges: ['raw', 'single-hive'] }
  ]
};

// ---- Lookups (internal) ----
const byId = (list, id) => list.find(item => item.id === Number(id));

// One flat object per listing with everything a card or filter needs.
// The backend's GET /listings should return roughly this shape.
function listingView(listing) {
  const batch = byId(MOCK.batches, listing.batchId);
  const hive = byId(MOCK.hives, batch.hiveIds[0]);
  const farm = byId(MOCK.farms, hive.farmId);
  return {
    ...listing,
    farmId: farm.id,
    farmName: farm.name,
    state: farm.state,
    lat: farm.lat,
    lng: farm.lng,
    honeyType: batch.honeyType,
    season: batch.season,
    harvestDate: batch.harvestDate,
    flags: batch.flags
  };
}

// ---- Public helpers: swap these bodies for fetch() calls later ----

// All listings, flattened. Filtering and sorting happen in the page for now;
// later the page can pass them to GET /listings?type=&badges=&state=&min=&max=&season=&sort=
async function getListings() {
  return MOCK.listings.map(listingView);
}

// One listing with its batch, farm, keeper, hives, pollen and timeline (product page).
async function getListing(id) {
  const listing = byId(MOCK.listings, id);
  if (!listing) return null;
  const batch = byId(MOCK.batches, listing.batchId);
  const hives = batch.hiveIds.map(hiveId => byId(MOCK.hives, hiveId));
  const farm = byId(MOCK.farms, hives[0].farmId);
  return {
    ...listingView(listing),
    batch,
    hives,
    farm,
    keeper: byId(MOCK.keepers, farm.keeperId),
    practices: MOCK.practices.find(p => p.farmId === farm.id) || null,
    nearbyFlowers: MOCK.nearbyFlowers.find(f => f.farmId === farm.id) || null,
    pollen: MOCK.pollen.filter(p => p.batchId === batch.id),
    timeline: MOCK.timeline.filter(t => t.batchId === batch.id)
  };
}

// One farm with its hives (map popup, product hover card).
async function getFarm(id) {
  const farm = byId(MOCK.farms, id);
  if (!farm) return null;
  return {
    ...farm,
    keeper: byId(MOCK.keepers, farm.keeperId),
    hives: MOCK.hives.filter(h => h.farmId === farm.id)
  };
}
