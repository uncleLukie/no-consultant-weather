import { RadarLocation } from '../types/radar';

/**
 * Australian Bureau of Meteorology Weather Radar Locations
 *
 * Product IDs are constructed as IDR + radar number + product code
 * Common product codes:
 * - XX3: 128 km loop (most common for general viewing)
 * - XX1: 512 km loop
 * - XX4: Doppler wind
 *
 * To find the correct product ID for a location:
 * 1. Visit https://reg.bom.gov.au/australia/radar/
 * 2. Click on the radar location
 * 3. Look at the URL of the loop page (e.g., IDR663.loop.shtml)
 */
export const radarLocations: RadarLocation[] = [
  // Queensland
  {
    id: '66',
    name: 'Brisbane',
    location: 'Mt Stapylton',
    state: 'QLD',
    productId: 'IDR663',
  },
  {
    id: '50',
    name: 'Cairns',
    location: 'Saddle Mountain',
    state: 'QLD',
    productId: 'IDR503',
  },
  {
    id: '76',
    name: 'Gold Coast',
    location: 'Mt Tamborine',
    state: 'QLD',
    productId: 'IDR763',
  },

  // New South Wales
  {
    id: '71',
    name: 'Sydney',
    location: 'Terrey Hills',
    state: 'NSW',
    productId: 'IDR713',
  },
  {
    id: '04',
    name: 'Newcastle',
    location: 'Lemon Tree Passage',
    state: 'NSW',
    productId: 'IDR043',
  },
  {
    id: '03',
    name: 'Wollongong',
    location: 'Appin',
    state: 'NSW',
    productId: 'IDR033',
  },
  {
    id: '40',
    name: 'Canberra',
    location: 'Captains Flat',
    state: 'ACT',
    productId: 'IDR403',
  },

  // Victoria
  {
    id: '02',
    name: 'Melbourne',
    location: 'Laverton',
    state: 'VIC',
    productId: 'IDR023',
  },

  // South Australia
  {
    id: '64',
    name: 'Adelaide',
    location: 'Buckland Park',
    state: 'SA',
    productId: 'IDR643',
  },

  // Western Australia
  {
    id: '70',
    name: 'Perth',
    location: 'Serpentine',
    state: 'WA',
    productId: 'IDR703',
  },

  // Tasmania
  {
    id: '42',
    name: 'Hobart',
    location: 'Mt Koonya',
    state: 'TAS',
    productId: 'IDR423',
  },

  // Northern Territory
  {
    id: '63',
    name: 'Darwin',
    location: 'Berrimah',
    state: 'NT',
    productId: 'IDR633',
  },
];
