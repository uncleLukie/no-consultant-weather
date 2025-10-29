import { RadarLocation } from '../types/radar';

/**
 * Australian Bureau of Meteorology Weather Radar Locations
 *
 * Product IDs are constructed as IDR + baseId + range code
 * Range codes:
 * - 1: 512 km range
 * - 2: 256 km range
 * - 3: 128 km range (default)
 * - 4: 64 km range
 *
 * Example: Brisbane baseId "66" becomes:
 * - IDR661 (512 km), IDR662 (256 km), IDR663 (128 km), IDR664 (64 km)
 */
export const radarLocations: RadarLocation[] = [
  // Queensland
  {
    id: '66',
    name: 'Brisbane',
    location: 'Mt Stapylton',
    state: 'QLD',
    baseId: '66',
    productId: 'IDR663',
  },
  {
    id: '50',
    name: 'Cairns',
    location: 'Saddle Mountain',
    state: 'QLD',
    baseId: '50',
    productId: 'IDR503',
  },
  {
    id: '76',
    name: 'Gold Coast',
    location: 'Mt Tamborine',
    state: 'QLD',
    baseId: '76',
    productId: 'IDR763',
  },

  // New South Wales
  {
    id: '71',
    name: 'Sydney',
    location: 'Terrey Hills',
    state: 'NSW',
    baseId: '71',
    productId: 'IDR713',
  },
  {
    id: '04',
    name: 'Newcastle',
    location: 'Lemon Tree Passage',
    state: 'NSW',
    baseId: '04',
    productId: 'IDR043',
  },
  {
    id: '03',
    name: 'Wollongong',
    location: 'Appin',
    state: 'NSW',
    baseId: '03',
    productId: 'IDR033',
  },
  {
    id: '40',
    name: 'Canberra',
    location: 'Captains Flat',
    state: 'ACT',
    baseId: '40',
    productId: 'IDR403',
  },

  // Victoria
  {
    id: '02',
    name: 'Melbourne',
    location: 'Laverton',
    state: 'VIC',
    baseId: '02',
    productId: 'IDR023',
  },

  // South Australia
  {
    id: '64',
    name: 'Adelaide',
    location: 'Buckland Park',
    state: 'SA',
    baseId: '64',
    productId: 'IDR643',
  },

  // Western Australia
  {
    id: '70',
    name: 'Perth',
    location: 'Serpentine',
    state: 'WA',
    baseId: '70',
    productId: 'IDR703',
  },

  // Tasmania
  {
    id: '42',
    name: 'Hobart',
    location: 'Mt Koonya',
    state: 'TAS',
    baseId: '42',
    productId: 'IDR423',
  },

  // Northern Territory
  {
    id: '63',
    name: 'Darwin',
    location: 'Berrimah',
    state: 'NT',
    baseId: '63',
    productId: 'IDR633',
  },
];
